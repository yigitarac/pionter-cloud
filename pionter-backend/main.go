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
	fmt.Println("Sunucu 8080 portunda çalışmaya başladı!")
	http.ListenAndServe(":8080", nil)
}

type BaglantiBilgileri struct {
	KullaniciAdi string `json:"kullaniciAdi"`
	Sifre        string `json:"sifre"`
	Yol          string `json:"yol"`
}

type DosyaBilgileri struct {
	Ad       string `json:"ad"`
	KlasorMu bool   `json:"klasorMu"`
}
type GizliKimlik struct {
	IP              string
	SunucuKullanici string
	SunucuSifre     string
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
	kimlik, err := kimlikSorgula(bilgiler.KullaniciAdi, bilgiler.Sifre)
	if err != nil {
		fmt.Println("Kullanıcı bulunamadı veya şifre yanlış:", err)
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
		fmt.Println("SSH Bağlantı Hatası:", err)
		return
	}
	defer client.Close()
	sftpClient, err := sftp.NewClient(client)
	if err != nil {
		fmt.Println("SFTP Hatası:", err)
		return
	}
	defer sftpClient.Close()
	sftpClient.MkdirAll(gercekYol)
	dosyalar, err := sftpClient.ReadDir(gercekYol)
	if err != nil {
		fmt.Println("Klasör okunamadı (Belki de henüz oluşturulmadı?):", err)
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
	json.NewEncoder(w).Encode(dosyaListesi)
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
