package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/pkg/sftp"
	"golang.org/x/crypto/ssh"
)

var db *sql.DB

func main() {
	var err error
	db, err = sql.Open("pgx", "postgres://admin:supergizli@localhost:5432/piontercloud")
	if err != nil {
		panic(err)
	}
	err = db.Ping()
	if err != nil {
		panic(err)
	}
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS kullanicilar (
			id SERIAL PRIMARY KEY,
			pionter_kullanici VARCHAR(50) UNIQUE NOT NULL,
			pionter_sifre VARCHAR(50) NOT NULL
		);
		CREATE TABLE IF NOT EXISTS sunucular (
			id SERIAL PRIMARY KEY,
			user_id INTEGER REFERENCES kullanicilar(id) ON DELETE CASCADE,
			sunucu_takma_ad VARCHAR(50) NOT NULL,
			sunucu_ip VARCHAR(50) NOT NULL,
			sunucu_port VARCHAR(10) DEFAULT '22',
			sunucu_kullanici VARCHAR(50) NOT NULL,
			baglanti_tipi VARCHAR(20) NOT NULL DEFAULT 'password',
			sunucu_sifre VARCHAR(500),
			ssh_private_key TEXT,
			izole_klasor VARCHAR(200) NOT NULL
		);
`)
	if err != nil {
		panic("Tablo oluşturulamadı: " + err.Error())
	}
	fmt.Println("Veritabanına başarıyla bağlandım!")
	http.HandleFunc("/api/files", dosyalariGetir)
	http.HandleFunc("/api/download", dosyaIndir)
	http.HandleFunc("/api/upload", dosyaYukle)
	http.HandleFunc("/api/register", kullaniciKaydet)
	http.HandleFunc("/api/servers", sunucuKaydet)
	http.HandleFunc("/api/servers/list", sunuculariListele)
	fmt.Println("Sunucu 8080 portunda çalışmaya başladı!")
	http.ListenAndServe(":8080", nil)
}

type BaglantiBilgileri struct {
	KullaniciAdi string `json:"kullaniciAdi"`
	Sifre        string `json:"sifre"`
	Yol          string `json:"yol"`
	ServerID     int    `json:"server_id"`
}
type DosyaBilgileri struct {
	Ad       string `json:"ad"`
	KlasorMu bool   `json:"klasorMu"`
}
type DosyaListeCevabi struct {
	Basarili bool             `json:"basarili"`
	Mesaj    string           `json:"mesaj"`
	Dosyalar []DosyaBilgileri `json:"dosyalar"`
}
type GizliKimlik struct {
	IP              string
	Port            string
	SunucuKullanici string
	BaglantiTipi    string
	SunucuSifre     string
	SSHPrivateKey   string
	IzoleKlasor     string
}

func kimlikSorgula(kullanici string, sifre string) (GizliKimlik, error) {
	var k GizliKimlik
	err := db.QueryRow(`
        SELECT s.sunucu_ip, s.sunucu_kullanici, s.sunucu_sifre, s.izole_klasor
        FROM kullanicilar k
        JOIN sunucular s ON k.id = s.user_id
        WHERE k.pionter_kullanici = $1 AND k.pionter_sifre = $2
        LIMIT 1
    `, kullanici, sifre).Scan(&k.IP, &k.SunucuKullanici, &k.SunucuSifre, &k.IzoleKlasor)
	return k, err
}
func dosyalariGetir(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	var bilgiler BaglantiBilgileri
	err := json.NewDecoder(r.Body).Decode(&bilgiler)
	if err != nil {
		fmt.Println("Gelen paketi okuyamadım:", err)
		return
	}
	kimlik, err := sunucuKimlikSorgula(bilgiler.KullaniciAdi, bilgiler.Sifre, bilgiler.ServerID)
	if err != nil {
		fmt.Println("Kullanıcı bulunamadı veya şifre yanlış:", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(DosyaListeCevabi{
			Basarili: false,
			Mesaj:    "Yetkisiz giriş veya sunucu bulunamadı",
			Dosyalar: []DosyaBilgileri{},
		})
		return
	}
	gercekYol := kimlik.IzoleKlasor
	if bilgiler.Yol != "/" {
		gercekYol = kimlik.IzoleKlasor + bilgiler.Yol
	}
	config := &ssh.ClientConfig{
		User:            kimlik.SunucuKullanici,
		Auth:            []ssh.AuthMethod{ssh.Password(kimlik.SunucuSifre)},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}
	client, err := ssh.Dial("tcp", kimlik.IP+":"+kimlik.Port, config)
	if err != nil {
		fmt.Println("SSH Bağlantı Hatası:", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadGateway)
		json.NewEncoder(w).Encode(DosyaListeCevabi{
			Basarili: false,
			Mesaj:    "SSH bağlantısı kurulamadı",
			Dosyalar: []DosyaBilgileri{},
		})
		return
	}
	defer client.Close()
	sftpClient, err := sftp.NewClient(client)
	if err != nil {
		fmt.Println("SFTP Hatası:", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadGateway)
		json.NewEncoder(w).Encode(DosyaListeCevabi{
			Basarili: false,
			Mesaj:    "SFTP bağlantısı kurulamadı",
			Dosyalar: []DosyaBilgileri{},
		})
		return
	}
	defer sftpClient.Close()
	sftpClient.MkdirAll(gercekYol)
	dosyalar, err := sftpClient.ReadDir(gercekYol)
	if err != nil {
		fmt.Println("Klasör okunamadı", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(DosyaListeCevabi{
			Basarili: false,
			Mesaj:    "Klasör okunamadı",
			Dosyalar: []DosyaBilgileri{},
		})
		return
	}
	dosyaListesi := []DosyaBilgileri{}
	for _, dosya := range dosyalar {
		yeniDosya := DosyaBilgileri{}
		yeniDosya.Ad = dosya.Name()
		yeniDosya.KlasorMu = dosya.IsDir()
		dosyaListesi = append(dosyaListesi, yeniDosya)
	}
	w.Header().Set("Content-Type", "application/json")
	cevap := DosyaListeCevabi{
		Basarili: true,
		Mesaj:    "Klasör Okundu",
		Dosyalar: dosyaListesi,
	}
	json.NewEncoder(w).Encode(cevap)
}
func dosyaIndir(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	var bilgiler BaglantiBilgileri
	err := json.NewDecoder(r.Body).Decode(&bilgiler)
	if err != nil {
		fmt.Println("Gelen paketi okuyamadım:", err)
		return
	}
	kimlik, err := kimlikSorgula(bilgiler.KullaniciAdi, bilgiler.Sifre)
	if err != nil {
		http.Error(w, "Yetkisiz giriş", http.StatusUnauthorized)
		return
	}
	gercekYol := kimlik.IzoleKlasor
	if bilgiler.Yol != "/" {
		gercekYol = kimlik.IzoleKlasor + bilgiler.Yol
	}
	config := &ssh.ClientConfig{
		User:            kimlik.SunucuKullanici,
		Auth:            []ssh.AuthMethod{ssh.Password(kimlik.SunucuSifre)},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}
	client, err := ssh.Dial("tcp", kimlik.IP+":22", config)
	if err != nil {
		fmt.Println(err)
		return
	}
	defer client.Close()
	sftpClient, err := sftp.NewClient(client)
	if err != nil {
		fmt.Println(err)
		return
	}
	defer sftpClient.Close()
	acilanDosya, err := sftpClient.Open(gercekYol)
	if err != nil {
		fmt.Println("Dosya açılamadı!", err)
		return
	}
	defer acilanDosya.Close()
	io.Copy(w, acilanDosya)
}
func dosyaYukle(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	r.ParseMultipartForm(10 << 20)
	kullaniciAdi := r.FormValue("kullaniciAdi")
	sifre := r.FormValue("sifre")
	yol := r.FormValue("yol")
	gelenDosya, baslik, err := r.FormFile("dosya")
	if err != nil {
		fmt.Println(err)
		return
	}
	defer gelenDosya.Close()
	kimlik, err := kimlikSorgula(kullaniciAdi, sifre)
	if err != nil {
		http.Error(w, "Yetkisiz giriş", http.StatusUnauthorized)
		return
	}
	gercekYol := kimlik.IzoleKlasor
	if yol != "/" {
		gercekYol = kimlik.IzoleKlasor + yol
	}
	tamYol := gercekYol + "/" + baslik.Filename
	config := &ssh.ClientConfig{
		User:            kimlik.SunucuKullanici,
		Auth:            []ssh.AuthMethod{ssh.Password(kimlik.SunucuSifre)},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}
	client, err := ssh.Dial("tcp", kimlik.IP+":22", config)
	if err != nil {
		fmt.Println(err)
		return
	}
	defer client.Close()
	sftpClient, err := sftp.NewClient(client)
	if err != nil {
		fmt.Println(err)
		return
	}
	defer sftpClient.Close()
	sftpClient.MkdirAll(gercekYol)
	hedefDosya, err := sftpClient.Create(tamYol)
	if err != nil {
		fmt.Println(err)
		return
	}
	defer hedefDosya.Close()
	io.Copy(hedefDosya, gelenDosya)
}

type KayitBilgileri struct {
	PionterKullanici string `json:"pionter_kullanici"`
	PionterSifre     string `json:"pionter_sifre"`
}
type SunucuKayitBilgileri struct {
	PionterKullanici string `json:"pionter_kullanici"`
	PionterSifre     string `json:"pionter_sifre"`

	SunucuTakmaAd   string `json:"sunucu_takma_ad"`
	SunucuIP        string `json:"sunucu_ip"`
	SunucuPort      string `json:"sunucu_port"`
	SunucuKullanici string `json:"sunucu_kullanici"`
	BaglantiTipi    string `json:"baglanti_tipi"`
	SunucuSifre     string `json:"sunucu_sifre"`
	SSHPrivateKey   string `json:"ssh_private_key"`
	IzoleKlasor     string `json:"izole_klasor"`
}
type SunucuListeBilgileri struct {
	ID              int    `json:"id"`
	SunucuTakmaAd   string `json:"sunucu_takma_ad"`
	SunucuIP        string `json:"sunucu_ip"`
	SunucuPort      string `json:"sunucu_port"`
	SunucuKullanici string `json:"sunucu_kullanici"`
	BaglantiTipi    string `json:"baglanti_tipi"`
	IzoleKlasor     string `json:"izole_klasor"`
}

func kullaniciKaydet(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	var veri KayitBilgileri
	err := json.NewDecoder(r.Body).Decode(&veri)
	if err != nil {
		http.Error(w, "Geçersiz veri", http.StatusBadRequest)
		return
	}
	_, err = db.Exec(`
		INSERT INTO kullanicilar (pionter_kullanici, pionter_sifre)
		VALUES ($1, $2)`,
		veri.PionterKullanici, veri.PionterSifre)
	if err != nil {
		fmt.Println("Kayıt hatası:", err)
		http.Error(w, "Bu kullanıcı adı zaten alınmış", http.StatusConflict)
		return
	}
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"mesaj": "Kayıt başarılı!"}`))
}
func sunucuKaydet(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Sadece POST isteği kabul edilir", http.StatusMethodNotAllowed)
		return
	}

	var veri SunucuKayitBilgileri
	err := json.NewDecoder(r.Body).Decode(&veri)
	if err != nil {
		http.Error(w, "Geçersiz veri", http.StatusBadRequest)
		return
	}

	if veri.SunucuPort == "" {
		veri.SunucuPort = "22"
	}

	var userID int
	err = db.QueryRow(`
		SELECT id
		FROM kullanicilar
		WHERE pionter_kullanici = $1 AND pionter_sifre = $2
	`, veri.PionterKullanici, veri.PionterSifre).Scan(&userID)

	if err != nil {
		http.Error(w, "Kullanıcı bulunamadı veya şifre yanlış", http.StatusUnauthorized)
		return
	}

	_, err = db.Exec(`
		INSERT INTO sunucular (
			user_id,
			sunucu_takma_ad,
			sunucu_ip,
			sunucu_port,
			sunucu_kullanici,
			baglanti_tipi,
			sunucu_sifre,
			ssh_private_key,
			izole_klasor
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`,
		userID,
		veri.SunucuTakmaAd,
		veri.SunucuIP,
		veri.SunucuPort,
		veri.SunucuKullanici,
		veri.BaglantiTipi,
		veri.SunucuSifre,
		veri.SSHPrivateKey,
		veri.IzoleKlasor,
	)

	if err != nil {
		fmt.Println("Sunucu kayıt hatası:", err)
		http.Error(w, "Sunucu kaydedilemedi", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"mesaj": "Sunucu kaydedildi!"}`))
}
func sunuculariListele(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Sadece POST isteği kabul edilir", http.StatusMethodNotAllowed)
		return
	}

	var veri KayitBilgileri
	err := json.NewDecoder(r.Body).Decode(&veri)
	if err != nil {
		http.Error(w, "Geçersiz veri", http.StatusBadRequest)
		return
	}

	var userID int
	err = db.QueryRow(`
		SELECT id
		FROM kullanicilar
		WHERE pionter_kullanici = $1 AND pionter_sifre = $2
	`, veri.PionterKullanici, veri.PionterSifre).Scan(&userID)

	if err != nil {
		http.Error(w, "Kullanıcı bulunamadı veya şifre yanlış", http.StatusUnauthorized)
		return
	}

	rows, err := db.Query(`
		SELECT
			id,
			sunucu_takma_ad,
			sunucu_ip,
			sunucu_port,
			sunucu_kullanici,
			baglanti_tipi,
			izole_klasor
		FROM sunucular
		WHERE user_id = $1
		ORDER BY id DESC
	`, userID)

	if err != nil {
		fmt.Println("Sunucular listelenemedi:", err)
		http.Error(w, "Sunucular listelenemedi", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	sunucular := []SunucuListeBilgileri{}

	for rows.Next() {
		var s SunucuListeBilgileri

		err := rows.Scan(
			&s.ID,
			&s.SunucuTakmaAd,
			&s.SunucuIP,
			&s.SunucuPort,
			&s.SunucuKullanici,
			&s.BaglantiTipi,
			&s.IzoleKlasor,
		)

		if err != nil {
			fmt.Println("Sunucu satırı okunamadı:", err)
			http.Error(w, "Sunucu satırı okunamadı", http.StatusInternalServerError)
			return
		}

		sunucular = append(sunucular, s)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sunucular)
}
func sunucuKimlikSorgula(kullanici string, sifre string, serverID int) (GizliKimlik, error) {
	var k GizliKimlik

	err := db.QueryRow(`
		SELECT
			s.sunucu_ip,
			s.sunucu_port,
			s.sunucu_kullanici,
			s.baglanti_tipi,
			COALESCE(s.sunucu_sifre, ''),
			COALESCE(s.ssh_private_key, ''),
			s.izole_klasor
		FROM kullanicilar k
		JOIN sunucular s ON k.id = s.user_id
		WHERE
			k.pionter_kullanici = $1
			AND k.pionter_sifre = $2
			AND s.id = $3
		LIMIT 1
	`, kullanici, sifre, serverID).Scan(
		&k.IP,
		&k.Port,
		&k.SunucuKullanici,
		&k.BaglantiTipi,
		&k.SunucuSifre,
		&k.SSHPrivateKey,
		&k.IzoleKlasor,
	)

	return k, err
}
