package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path"
	"sort"
	"strconv"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
	"github.com/pkg/sftp"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/crypto/ssh"
)

var db *sql.DB

func main() {
	var err error
	godotenv.Load()

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		panic("DATABASE_URL bulunamadı. .env dosyasını kontrol et.")
	}

	db, err = sql.Open("pgx", databaseURL)
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
			pionter_email TEXT,
			pionter_sifre TEXT NOT NULL
		);
		CREATE TABLE IF NOT EXISTS sunucular (
			id SERIAL PRIMARY KEY,
			user_id INTEGER REFERENCES kullanicilar(id) ON DELETE CASCADE,
			sunucu_takma_ad VARCHAR(50) NOT NULL,
			sunucu_ip VARCHAR(50) NOT NULL,
			sunucu_port VARCHAR(10) DEFAULT '22',
			sunucu_kullanici VARCHAR(50) NOT NULL,
			baglanti_tipi VARCHAR(20) NOT NULL DEFAULT 'password',
			sabitli BOOLEAN NOT NULL DEFAULT FALSE,
			sunucu_sifre VARCHAR(500),
			ssh_private_key TEXT,
			izole_klasor VARCHAR(200) NOT NULL
		);
		ALTER TABLE kullanicilar
		ADD COLUMN IF NOT EXISTS pionter_email TEXT;

		ALTER TABLE kullanicilar
		ALTER COLUMN pionter_sifre TYPE TEXT;

		CREATE UNIQUE INDEX IF NOT EXISTS kullanicilar_pionter_email_lower_unique
		ON kullanicilar (LOWER(pionter_email))
		WHERE pionter_email IS NOT NULL;
		ALTER TABLE sunucular
		ADD COLUMN IF NOT EXISTS sabitli BOOLEAN NOT NULL DEFAULT FALSE;
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
	http.HandleFunc("/api/servers/delete", sunucuSil)
	http.HandleFunc("/api/servers/update", sunucuGuncelle)
	http.HandleFunc("/api/folders/create", klasorOlustur)
	http.HandleFunc("/api/delete", dosyaVeyaKlasorSil)
	http.HandleFunc("/api/rename", dosyaVeyaKlasorYenidenAdlandir)
	http.HandleFunc("/api/move", dosyaVeyaKlasorTasi)
	http.HandleFunc("/api/servers/pin", sunucuSabitle)
	http.HandleFunc("/api/servers/test", sunucuBaglantisiniTestEt)
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
	Ad           string `json:"ad"`
	KlasorMu     bool   `json:"klasorMu"`
	Boyut        int64  `json:"boyut"`
	Degistirilme string `json:"degistirilme"`
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
type KayitBilgileri struct {
	PionterKullanici string `json:"pionter_kullanici"`
	PionterEmail     string `json:"pionter_email"`
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
type SunucuGuncelleBilgileri struct {
	PionterKullanici string `json:"pionter_kullanici"`
	PionterSifre     string `json:"pionter_sifre"`

	ServerID        int    `json:"server_id"`
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
	Sabitli         bool   `json:"sabitli"`
}
type KlasorOlusturBilgileri struct {
	KullaniciAdi string `json:"kullaniciAdi"`
	Sifre        string `json:"sifre"`
	Yol          string `json:"yol"`
	ServerID     int    `json:"server_id"`
	KlasorAdi    string `json:"klasor_adi"`
}
type SilmeBilgileri struct {
	KullaniciAdi string `json:"kullaniciAdi"`
	Sifre        string `json:"sifre"`
	Yol          string `json:"yol"`
	ServerID     int    `json:"server_id"`
	DosyaAdi     string `json:"dosya_adi"`
	KlasorMu     bool   `json:"klasor_mu"`
}
type YenidenAdlandirBilgileri struct {
	KullaniciAdi string `json:"kullaniciAdi"`
	Sifre        string `json:"sifre"`
	Yol          string `json:"yol"`
	ServerID     int    `json:"server_id"`
	EskiAd       string `json:"eski_ad"`
	YeniAd       string `json:"yeni_ad"`
}
type TasiBilgileri struct {
	KullaniciAdi string `json:"kullaniciAdi"`
	Sifre        string `json:"sifre"`
	ServerID     int    `json:"server_id"`
	KaynakYol    string `json:"kaynak_yol"`
	HedefYol     string `json:"hedef_yol"`
	DosyaAdi     string `json:"dosya_adi"`
}
type SunucuSilBilgileri struct {
	PionterKullanici string `json:"pionter_kullanici"`
	PionterSifre     string `json:"pionter_sifre"`
	ServerID         int    `json:"server_id"`
}
type SunucuSabitleBilgileri struct {
	PionterKullanici string `json:"pionter_kullanici"`
	PionterSifre     string `json:"pionter_sifre"`
	ServerID         int    `json:"server_id"`
	Sabitli          bool   `json:"sabitli"`
}
type SunucuTestBilgileri struct {
	PionterKullanici string `json:"pionter_kullanici"`
	PionterSifre     string `json:"pionter_sifre"`

	SunucuIP        string `json:"sunucu_ip"`
	SunucuPort      string `json:"sunucu_port"`
	SunucuKullanici string `json:"sunucu_kullanici"`
	BaglantiTipi    string `json:"baglanti_tipi"`
	SunucuSifre     string `json:"sunucu_sifre"`
	SSHPrivateKey   string `json:"ssh_private_key"`
	IzoleKlasor     string `json:"izole_klasor"`
}

func kimlikSorgula(kullanici string, sifre string) (GizliKimlik, error) {
	var k GizliKimlik

	kullanici = strings.TrimSpace(kullanici)

	err := db.QueryRow(`
        SELECT s.sunucu_ip, s.sunucu_kullanici, s.sunucu_sifre, s.izole_klasor
        FROM kullanicilar k
        JOIN sunucular s ON k.id = s.user_id
        WHERE
        	(k.pionter_kullanici = $1 OR LOWER(k.pionter_email) = LOWER($1))
         	AND k.pionter_sifre = $2
        LIMIT 1
    `, kullanici, sifre).Scan(&k.IP, &k.SunucuKullanici, &k.SunucuSifre, &k.IzoleKlasor)
	return k, err
}
func dosyalariGetir(w http.ResponseWriter, r *http.Request) {
	corsAyarla(w, "POST, OPTIONS")

	if !postIstekKontrolu(w, r) {
		return
	}

	var bilgiler BaglantiBilgileri
	if !jsonOku(w, r, &bilgiler) {
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
	gercekYol, err := guvenliYolOlustur(kimlik.IzoleKlasor, bilgiler.Yol)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(DosyaListeCevabi{
			Basarili: false,
			Mesaj:    "Geçersiz yol",
			Dosyalar: []DosyaBilgileri{},
		})
		return
	}

	authMethods, err := sshAuthMethodOlustur(kimlik)
	if err != nil {
		fmt.Println("SSH auth hatası:", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadGateway)
		json.NewEncoder(w).Encode(DosyaListeCevabi{
			Basarili: false,
			Mesaj:    "SSH kimlik doğrulama hazırlanamadı",
			Dosyalar: []DosyaBilgileri{},
		})
		return
	}

	config := &ssh.ClientConfig{
		User:            kimlik.SunucuKullanici,
		Auth:            authMethods,
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
		yeniDosya.Boyut = dosya.Size()
		yeniDosya.Degistirilme = dosya.ModTime().Format("2006-01-02 15:04")

		dosyaListesi = append(dosyaListesi, yeniDosya)
	}
	sort.Slice(dosyaListesi, func(i, j int) bool {
		if dosyaListesi[i].KlasorMu != dosyaListesi[j].KlasorMu {
			return dosyaListesi[i].KlasorMu
		}
		return strings.ToLower(dosyaListesi[i].Ad) < strings.ToLower(dosyaListesi[j].Ad)
	})
	w.Header().Set("Content-Type", "application/json")
	mesaj := "Klasör okundu"
	if len(dosyaListesi) == 0 {
		mesaj = "Bu klasör boş"
	}
	cevap := DosyaListeCevabi{
		Basarili: true,
		Mesaj:    mesaj,
		Dosyalar: dosyaListesi,
	}
	json.NewEncoder(w).Encode(cevap)
}
func dosyaIndir(w http.ResponseWriter, r *http.Request) {
	corsAyarla(w, "POST, OPTIONS")

	if !postIstekKontrolu(w, r) {
		return
	}

	var bilgiler BaglantiBilgileri
	if !jsonOku(w, r, &bilgiler) {
		return
	}
	kimlik, err := sunucuKimlikSorgula(bilgiler.KullaniciAdi, bilgiler.Sifre, bilgiler.ServerID)
	if err != nil {
		http.Error(w, "Yetkisiz giriş", http.StatusUnauthorized)
		return
	}
	gercekYol, err := guvenliYolOlustur(kimlik.IzoleKlasor, bilgiler.Yol)
	if err != nil {
		http.Error(w, "Geçersiz yol", http.StatusBadRequest)
		return
	}

	authMethods, err := sshAuthMethodOlustur(kimlik)
	if err != nil {
		fmt.Println("SSH auth hatası:", err)
		http.Error(w, "SSH kimlik doğrulama hazırlanamadı", http.StatusBadGateway)
		return
	}

	config := &ssh.ClientConfig{
		User:            kimlik.SunucuKullanici,
		Auth:            authMethods,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}
	client, err := ssh.Dial("tcp", kimlik.IP+":"+kimlik.Port, config)
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
	corsAyarla(w, "POST, OPTIONS")

	if !postIstekKontrolu(w, r) {
		return
	}
	r.ParseMultipartForm(10 << 20)
	kullaniciAdi := r.FormValue("kullaniciAdi")
	sifre := r.FormValue("sifre")
	yol := r.FormValue("yol")
	serverIDStr := r.FormValue("server_id")
	serverID, err := strconv.Atoi(serverIDStr)
	if err != nil {
		http.Error(w, "Geçersiz server_id", http.StatusBadRequest)
		return
	}
	gelenDosya, baslik, err := r.FormFile("dosya")
	if err != nil {
		fmt.Println(err)
		return
	}
	defer gelenDosya.Close()

	if strings.Contains(baslik.Filename, "/") ||
		strings.Contains(baslik.Filename, "\\") ||
		strings.Contains(baslik.Filename, "..") ||
		strings.Contains(baslik.Filename, "⁄") {
		http.Error(w, "Geçersiz dosya adı", http.StatusBadRequest)
		return
	}
	kimlik, err := sunucuKimlikSorgula(kullaniciAdi, sifre, serverID)
	if err != nil {
		http.Error(w, "Yetkisiz giriş", http.StatusUnauthorized)
		return
	}
	gercekYol, err := guvenliYolOlustur(kimlik.IzoleKlasor, yol)
	if err != nil {
		http.Error(w, "Geçersiz yol", http.StatusBadRequest)
		return
	}

	tamYol := path.Join(gercekYol, baslik.Filename)

	authMethods, err := sshAuthMethodOlustur(kimlik)
	if err != nil {
		fmt.Println("SSH auth hatası:", err)
		http.Error(w, "SSH kimlik doğrulama hazırlanamadı", http.StatusBadGateway)
		return
	}

	config := &ssh.ClientConfig{
		User:            kimlik.SunucuKullanici,
		Auth:            authMethods,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}
	client, err := ssh.Dial("tcp", kimlik.IP+":"+kimlik.Port, config)
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
func klasorOlustur(w http.ResponseWriter, r *http.Request) {
	corsAyarla(w, "POST, OPTIONS")

	if !postIstekKontrolu(w, r) {
		return
	}

	var bilgiler KlasorOlusturBilgileri
	if !jsonOku(w, r, &bilgiler) {
		return
	}

	if bilgiler.KlasorAdi == "" {
		http.Error(w, "Klasör adı boş olamaz", http.StatusBadRequest)
		return
	}
	if strings.Contains(bilgiler.KlasorAdi, "/") ||
		strings.Contains(bilgiler.KlasorAdi, "\\") ||
		strings.Contains(bilgiler.KlasorAdi, "..") ||
		strings.Contains(bilgiler.KlasorAdi, "⁄") {
		http.Error(w, "Geçersiz klasör adı", http.StatusBadRequest)
		return
	}
	kimlik, err := sunucuKimlikSorgula(bilgiler.KullaniciAdi, bilgiler.Sifre, bilgiler.ServerID)
	if err != nil {
		http.Error(w, "Yetkisiz giriş veya sunucu bulunamadı", http.StatusUnauthorized)
		return
	}
	gercekYol, err := guvenliYolOlustur(kimlik.IzoleKlasor, bilgiler.Yol)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(DosyaListeCevabi{
			Basarili: false,
			Mesaj:    "Geçersiz yol",
			Dosyalar: []DosyaBilgileri{},
		})
		return
	}
	yeniKlasorYolu := path.Join(gercekYol, bilgiler.KlasorAdi)

	authMethods, err := sshAuthMethodOlustur(kimlik)
	if err != nil {
		fmt.Println("SSH auth hatası:", err)
		http.Error(w, "SSH kimlik doğrulama hazırlanamadı", http.StatusBadGateway)
		return
	}

	config := &ssh.ClientConfig{
		User:            kimlik.SunucuKullanici,
		Auth:            authMethods,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}
	client, err := ssh.Dial("tcp", kimlik.IP+":"+kimlik.Port, config)
	if err != nil {
		fmt.Println("SSH Bağlantı Hatası:", err)
		http.Error(w, "SSH bağlantısı kurulamadı", http.StatusBadGateway)
		return
	}
	defer client.Close()
	sftpClient, err := sftp.NewClient(client)
	if err != nil {
		fmt.Println("SFTP Hatası:", err)
		http.Error(w, "SFTP bağlantısı kurulamadı", http.StatusBadGateway)
		return
	}
	defer sftpClient.Close()

	err = sftpClient.MkdirAll(yeniKlasorYolu)
	if err != nil {
		fmt.Println("Klasör oluşturulamadı:", err)
		http.Error(w, "Klasör oluşturulamadı", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"mesaj": "Klasör oluşturuldu"}`))
}
func dosyaVeyaKlasorSil(w http.ResponseWriter, r *http.Request) {
	corsAyarla(w, "POST, OPTIONS")

	if !postIstekKontrolu(w, r) {
		return
	}

	var bilgiler SilmeBilgileri
	if !jsonOku(w, r, &bilgiler) {
		return
	}

	if !guvenliAdMi(bilgiler.DosyaAdi) {
		http.Error(w, "Geçersiz dosya veya klasör adı", http.StatusBadRequest)
		return
	}

	kimlik, err := sunucuKimlikSorgula(bilgiler.KullaniciAdi, bilgiler.Sifre, bilgiler.ServerID)

	if err != nil {
		http.Error(w, "Yetkisiz giriş veya sunucu bulunamadı", http.StatusUnauthorized)
		return
	}

	gercekYol, err := guvenliYolOlustur(kimlik.IzoleKlasor, bilgiler.Yol)
	if err != nil {
		http.Error(w, "Geçersiz yol", http.StatusBadRequest)
		return
	}

	silinecekYol := path.Join(gercekYol, bilgiler.DosyaAdi)

	authMethods, err := sshAuthMethodOlustur(kimlik)
	if err != nil {
		fmt.Println("SSH auth hatası:", err)
		http.Error(w, "SSH kimlik doğrulama hazırlanamadı", http.StatusBadGateway)
		return
	}

	config := &ssh.ClientConfig{
		User:            kimlik.SunucuKullanici,
		Auth:            authMethods,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}

	client, err := ssh.Dial("tcp", kimlik.IP+":"+kimlik.Port, config)
	if err != nil {
		fmt.Println("SSH Bağlantı Hatası:", err)
		http.Error(w, "SSH bağlantısı kurulamadı", http.StatusBadGateway)
		return
	}
	defer client.Close()

	sftpClient, err := sftp.NewClient(client)
	if err != nil {
		fmt.Println("SFTP Hatası:", err)
		http.Error(w, "SFTP bağlantısı kurulamadı", http.StatusBadGateway)
		return
	}
	defer sftpClient.Close()

	if bilgiler.KlasorMu {
		err = sftpClient.RemoveDirectory(silinecekYol)
	} else {
		err = sftpClient.Remove(silinecekYol)
	}

	if err != nil {
		fmt.Println("Silme Hatası:", err)
		http.Error(w, "Dosya veya klasör silinemedi", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"mesaj": "Silme başarılı"}`))
}
func dosyaVeyaKlasorYenidenAdlandir(w http.ResponseWriter, r *http.Request) {
	corsAyarla(w, "POST, OPTIONS")

	if !postIstekKontrolu(w, r) {
		return
	}

	var bilgiler YenidenAdlandirBilgileri
	if !jsonOku(w, r, &bilgiler) {
		return
	}

	if !guvenliAdMi(bilgiler.EskiAd) || !guvenliAdMi(bilgiler.YeniAd) {
		http.Error(w, "Geçersiz dosya ya da klasör adı", http.StatusBadRequest)
		return
	}

	if bilgiler.EskiAd == bilgiler.YeniAd {
		http.Error(w, "Yeni ad ile eski ad aynı olamaz", http.StatusBadRequest)
		return
	}

	kimlik, err := sunucuKimlikSorgula(bilgiler.KullaniciAdi, bilgiler.Sifre, bilgiler.ServerID)
	if err != nil {
		http.Error(w, "Yetkisiz giriş veya sunucu bulunamadı", http.StatusUnauthorized)
		return
	}

	gercekYol, err := guvenliYolOlustur(kimlik.IzoleKlasor, bilgiler.Yol)
	if err != nil {
		http.Error(w, "Geçersiz yol", http.StatusBadRequest)
		return
	}

	eskiYol := path.Join(gercekYol, bilgiler.EskiAd)
	yeniYol := path.Join(gercekYol, bilgiler.YeniAd)

	authMethods, err := sshAuthMethodOlustur(kimlik)
	if err != nil {
		fmt.Println("SSH auth hatası:", err)
		http.Error(w, "SSH kimlik doğrulama hazırlanamadı", http.StatusBadGateway)
		return
	}

	config := &ssh.ClientConfig{
		User:            kimlik.SunucuKullanici,
		Auth:            authMethods,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}

	client, err := ssh.Dial("tcp", kimlik.IP+":"+kimlik.Port, config)
	if err != nil {
		fmt.Println("SSH Bağlantı Hatası:", err)
		http.Error(w, "SSH bağlantısı kurulamadı", http.StatusBadGateway)
		return
	}
	defer client.Close()

	sftpClient, err := sftp.NewClient(client)
	if err != nil {
		fmt.Println("SFTP Hatası:", err)
		http.Error(w, "SFTP bağlantısı kurulamadı", http.StatusBadGateway)
		return
	}
	defer sftpClient.Close()

	_, err = sftpClient.Stat(yeniYol)
	if err == nil {
		http.Error(w, "Bu isimde zaten bir dosya veya klasör var", http.StatusConflict)
		return
	}

	err = sftpClient.Rename(eskiYol, yeniYol)
	if err != nil {
		fmt.Println("Yeniden adlandırma hatası:", err)
		http.Error(w, "Dosya veya klasör yeniden adlandırılamadı", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"mesaj": "Yeniden adlandırma başarılı"}`))
}
func dosyaVeyaKlasorTasi(w http.ResponseWriter, r *http.Request) {
	corsAyarla(w, "POST, OPTIONS")

	if !postIstekKontrolu(w, r) {
		return
	}

	var bilgiler TasiBilgileri
	if !jsonOku(w, r, &bilgiler) {
		return
	}

	if !guvenliAdMi(bilgiler.DosyaAdi) {
		http.Error(w, "Geçersiz dosya veya klasör adı", http.StatusBadRequest)
		return
	}

	if bilgiler.KaynakYol == bilgiler.HedefYol {
		http.Error(w, "Kaynak ve hedef klasör aynı olamaz", http.StatusBadRequest)
		return
	}

	kimlik, err := sunucuKimlikSorgula(bilgiler.KullaniciAdi, bilgiler.Sifre, bilgiler.ServerID)
	if err != nil {
		http.Error(w, "Yetkisiz giriş veya sunucu bulunamadı", http.StatusBadRequest)
		return
	}

	kaynakGercekYol, err := guvenliYolOlustur(kimlik.IzoleKlasor, bilgiler.KaynakYol)
	if err != nil {
		http.Error(w, "Geçersiz kaynak yol", http.StatusBadRequest)
		return
	}

	hedefGercekYol, err := guvenliYolOlustur(kimlik.IzoleKlasor, bilgiler.HedefYol)
	if err != nil {
		http.Error(w, "Geçersiz hedef yol", http.StatusBadRequest)
		return
	}

	eskiYol := path.Join(kaynakGercekYol, bilgiler.DosyaAdi)
	yeniYol := path.Join(hedefGercekYol, bilgiler.DosyaAdi)

	if hedefGercekYol == eskiYol || strings.HasPrefix(hedefGercekYol, eskiYol+"/") {
		http.Error(w, "Bir klasör kendi içine taşınamaz", http.StatusBadRequest)
		return
	}

	authMethods, err := sshAuthMethodOlustur(kimlik)
	if err != nil {
		fmt.Println("SSH auth hatası:", err)
		http.Error(w, "SSH kimlik doğrulama hazırlanamadı", http.StatusBadGateway)
		return
	}

	config := &ssh.ClientConfig{
		User:            kimlik.SunucuKullanici,
		Auth:            authMethods,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}
	client, err := ssh.Dial("tcp", kimlik.IP+":"+kimlik.Port, config)
	if err != nil {
		fmt.Println("SSH Bağlantı Hatası:", err)
		http.Error(w, "SSH bağlantısı kurulamadı", http.StatusBadGateway)
		return
	}
	defer client.Close()

	sftpClient, err := sftp.NewClient(client)
	if err != nil {
		fmt.Println("SFTP Hatası:", err)
		http.Error(w, "SFTP bağlantısı kurulamadı", http.StatusBadGateway)
		return
	}
	defer sftpClient.Close()

	hedefBilgi, err := sftpClient.Stat(hedefGercekYol)
	if err != nil {
		http.Error(w, "Hedef klasör bulunamadı", http.StatusBadRequest)
		return
	}

	if !hedefBilgi.IsDir() {
		http.Error(w, "Hedef yol bir klasör değil", http.StatusBadRequest)
		return
	}
	_, err = sftpClient.Stat(yeniYol)
	if err == nil {
		http.Error(w, "Hedefte aynı isimde dosya veya klasör var", http.StatusConflict)
		return
	}
	err = sftpClient.Rename(eskiYol, yeniYol)
	if err != nil {
		fmt.Println("Taşıma hatası:", err)
		http.Error(w, "Dosya veya klasör taşınamadı", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"mesaj": "Taşıma başarılı"}`))
}
func kullaniciKaydet(w http.ResponseWriter, r *http.Request) {
	corsAyarla(w, "POST, OPTIONS")

	if !postIstekKontrolu(w, r) {
		return
	}

	var veri KayitBilgileri
	if !jsonOku(w, r, &veri) {
		return
	}

	veri.PionterKullanici = strings.TrimSpace(veri.PionterKullanici)
	veri.PionterEmail = strings.ToLower(strings.TrimSpace(veri.PionterEmail))

	if veri.PionterKullanici == "" || veri.PionterEmail == "" || veri.PionterSifre == "" {
		http.Error(w, "Kullanıcı adı, email ve şifre zorunlu", http.StatusBadRequest)
		return
	}

	if !strings.Contains(veri.PionterEmail, "@") || !strings.Contains(veri.PionterEmail, ".") {
		http.Error(w, "Geçersiz e-posta adresi", http.StatusBadRequest)
		return
	}

	hashlenmisSifre, err := sifreHashle(veri.PionterSifre)
	if err != nil {
		fmt.Println("Şifre hashleme hatası:", err)
		http.Error(w, "Şifre güvenli şekilde kaydedilemedi", http.StatusInternalServerError)
		return
	}

	_, err = db.Exec(`
		INSERT INTO kullanicilar (pionter_kullanici, pionter_email, pionter_sifre)
		VALUES ($1, $2, $3)`,
		veri.PionterKullanici,
		veri.PionterEmail,
		hashlenmisSifre,
	)
	if err != nil {
		fmt.Println("Kayıt hatası:", err)
		http.Error(w, "Bu kullanıcı adı veya eposta zaten alınmış", http.StatusConflict)
		return
	}
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"mesaj": "Kayıt başarılı!"}`))
}
func sunucuKaydet(w http.ResponseWriter, r *http.Request) {
	corsAyarla(w, "POST, OPTIONS")

	if !postIstekKontrolu(w, r) {
		return
	}

	var veri SunucuKayitBilgileri
	if !jsonOku(w, r, &veri) {
		return
	}

	veri.PionterKullanici = strings.TrimSpace(veri.PionterKullanici)
	veri.SunucuTakmaAd = strings.TrimSpace(veri.SunucuTakmaAd)
	veri.SunucuIP = strings.TrimSpace(veri.SunucuIP)
	veri.SunucuPort = strings.TrimSpace(veri.SunucuPort)
	veri.SunucuKullanici = strings.TrimSpace(veri.SunucuKullanici)
	veri.BaglantiTipi = strings.TrimSpace(veri.BaglantiTipi)
	veri.SunucuSifre = strings.TrimSpace(veri.SunucuSifre)
	veri.SSHPrivateKey = strings.TrimSpace(veri.SSHPrivateKey)
	veri.IzoleKlasor = strings.TrimSpace(veri.IzoleKlasor)

	if veri.SunucuPort == "" {
		veri.SunucuPort = "22"
	}

	if veri.PionterKullanici == "" ||
		veri.PionterSifre == "" ||
		veri.SunucuTakmaAd == "" ||
		veri.SunucuIP == "" ||
		veri.SunucuKullanici == "" ||
		veri.SunucuPort == "" ||
		veri.BaglantiTipi == "" ||
		veri.IzoleKlasor == "" {
		http.Error(w, "Eksik veya geçersiz veri", http.StatusBadRequest)
		return
	}

	portSayisi, err := strconv.Atoi(veri.SunucuPort)
	if err != nil || portSayisi < 1 || portSayisi > 65535 {
		http.Error(w, "Geçersiz SSH portu", http.StatusBadRequest)
		return
	}

	if veri.BaglantiTipi != "password" && veri.BaglantiTipi != "ssh_key" {
		http.Error(w, "Geçersiz bağlantı tipi", http.StatusBadRequest)
		return
	}

	if !strings.HasPrefix(veri.IzoleKlasor, "/") {
		http.Error(w, "İzole klasör / ile başlamalı", http.StatusBadRequest)
		return
	}

	if strings.Contains(veri.IzoleKlasor, "..") ||
		strings.Contains(veri.IzoleKlasor, "\\") ||
		strings.Contains(veri.IzoleKlasor, "⁄") {
		http.Error(w, "Geçersiz izole klasör yolu", http.StatusBadRequest)
		return
	}

	if veri.BaglantiTipi == "password" && veri.SunucuSifre == "" {
		http.Error(w, "Sunucu şifresi zorunlu", http.StatusBadRequest)
		return
	}

	if veri.BaglantiTipi == "ssh_key" && veri.SSHPrivateKey == "" {
		http.Error(w, "SSH private key zorunlu", http.StatusBadRequest)
		return
	}

	userID, err := kullaniciDogrula(veri.PionterKullanici, veri.PionterSifre)
	if err != nil {
		http.Error(w, "Kullanıcı bulunamadı veya şifre yanlış", http.StatusUnauthorized)
		return
	}

	if veri.BaglantiTipi == "password" {
		veri.SSHPrivateKey = ""
	}

	if veri.BaglantiTipi == "ssh_key" {
		veri.SunucuSifre = ""
	}

	testKimlik := GizliKimlik{
		IP:              veri.SunucuIP,
		Port:            veri.SunucuPort,
		SunucuKullanici: veri.SunucuKullanici,
		BaglantiTipi:    veri.BaglantiTipi,
		SunucuSifre:     veri.SunucuSifre,
		SSHPrivateKey:   veri.SSHPrivateKey,
		IzoleKlasor:     veri.IzoleKlasor,
	}

	err = sunucuBaglantisiCalisiyorMu(testKimlik)
	if err != nil {
		fmt.Println("Sunucu kayıt öncesi bağlantı testi hatası:", err)
		http.Error(w, "Sunucu bağlantı testi başarısız", http.StatusBadGateway)
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
func sunucuSil(w http.ResponseWriter, r *http.Request) {
	corsAyarla(w, "POST, OPTIONS")

	if !postIstekKontrolu(w, r) {
		return
	}

	var veri SunucuSilBilgileri
	if !jsonOku(w, r, &veri) {
		return
	}

	veri.PionterKullanici = strings.TrimSpace(veri.PionterKullanici)

	if veri.PionterKullanici == "" || veri.PionterSifre == "" || veri.ServerID < 0 {
		http.Error(w, "Eksik veya geçersiz veri", http.StatusBadRequest)
		return
	}

	userID, err := kullaniciDogrula(veri.PionterKullanici, veri.PionterSifre)
	if err != nil {
		http.Error(w, "Kullanıcı bulunamadı veya şifre yanlış", http.StatusUnauthorized)
		return
	}

	result, err := db.Exec(`
		DELETE FROM sunucular
		WHERE id = $1 AND user_id = $2
		`, veri.ServerID, userID)

	if err != nil {
		fmt.Println("Sunucu silme hatası:", err)
		http.Error(w, "Sunucu silinemedi", http.StatusInternalServerError)
		return
	}

	etkilenenSatir, err := result.RowsAffected()
	if err != nil {
		fmt.Println("Silinen satır sayısı okunamadı:", err)
		http.Error(w, "Sunucu silme sonucu okunamadı", http.StatusInternalServerError)
		return
	}

	if etkilenenSatir == 0 {
		http.Error(w, "Sunucu bulunamadı veya bu kullanıcıya ait değil", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"mesaj": "Sunucu silindi"}`))

}
func sunucuGuncelle(w http.ResponseWriter, r *http.Request) {
	corsAyarla(w, "POST, OPTIONS")

	if !postIstekKontrolu(w, r) {
		return
	}

	var veri SunucuGuncelleBilgileri
	if !jsonOku(w, r, &veri) {
		return
	}

	veri.PionterKullanici = strings.TrimSpace(veri.PionterKullanici)
	veri.SunucuTakmaAd = strings.TrimSpace(veri.SunucuTakmaAd)
	veri.SunucuIP = strings.TrimSpace(veri.SunucuIP)
	veri.SunucuPort = strings.TrimSpace(veri.SunucuPort)
	veri.SunucuKullanici = strings.TrimSpace(veri.SunucuKullanici)
	veri.BaglantiTipi = strings.TrimSpace(veri.BaglantiTipi)
	veri.IzoleKlasor = strings.TrimSpace(veri.IzoleKlasor)
	veri.SunucuSifre = strings.TrimSpace(veri.SunucuSifre)
	veri.SSHPrivateKey = strings.TrimSpace(veri.SSHPrivateKey)

	if veri.SunucuPort == "" {
		veri.SunucuPort = "22"
	}

	if veri.PionterKullanici == "" ||
		veri.PionterSifre == "" ||
		veri.ServerID <= 0 ||
		veri.SunucuTakmaAd == "" ||
		veri.SunucuIP == "" ||
		veri.SunucuKullanici == "" ||
		veri.SunucuPort == "" ||
		veri.BaglantiTipi == "" ||
		veri.IzoleKlasor == "" {
		http.Error(w, "Eksik veya geçersiz veri", http.StatusBadRequest)
		return
	}

	portSayisi, err := strconv.Atoi(veri.SunucuPort)
	if err != nil || portSayisi < 1 || portSayisi > 65535 {
		http.Error(w, "Geçersiz SSH portu", http.StatusBadRequest)
		return
	}

	if veri.BaglantiTipi != "password" && veri.BaglantiTipi != "ssh_key" {
		http.Error(w, "Geçersiz bağlantı tipi", http.StatusBadRequest)
		return
	}

	if !strings.HasPrefix(veri.IzoleKlasor, "/") {
		http.Error(w, "İzole klasör / ile başlamalı", http.StatusBadRequest)
		return
	}

	if strings.Contains(veri.IzoleKlasor, "..") ||
		strings.Contains(veri.IzoleKlasor, "\\") ||
		strings.Contains(veri.IzoleKlasor, "⁄") {
		http.Error(w, "Geçersiz izole klasör yolu", http.StatusBadRequest)
		return
	}

	userID, err := kullaniciDogrula(veri.PionterKullanici, veri.PionterSifre)
	if err != nil {
		http.Error(w, "Kullanıcı bulunamadı veya şifre yanlış", http.StatusUnauthorized)
		return
	}

	var mevcutBaglantiTipi string
	var mevcutSunucuSifre string
	var mevcutSSHPrivateKey string

	err = db.QueryRow(`
		SELECT
			baglanti_tipi,
			COALESCE(sunucu_sifre, ''),
			COALESCE(ssh_private_key, '')
		FROM sunucular
		WHERE id = $1 AND user_id = $2
		`, veri.ServerID, userID).Scan(
		&mevcutBaglantiTipi,
		&mevcutSunucuSifre,
		&mevcutSSHPrivateKey,
	)

	if err != nil {
		http.Error(w, "Sunucu bulunamadı veya bu kullanıcıya ait değil", http.StatusNotFound)
		return
	}

	if veri.BaglantiTipi == "password" {
		if veri.SunucuSifre == "" {
			if mevcutBaglantiTipi == "password" && mevcutSunucuSifre != "" {
				veri.SunucuSifre = mevcutSunucuSifre
			} else {
				http.Error(w, "Sunucu şifresi zorunlu", http.StatusBadRequest)
				return
			}
		}

		veri.SSHPrivateKey = ""
	}

	if veri.BaglantiTipi == "ssh_key" {
		if veri.SSHPrivateKey == "" {
			if mevcutBaglantiTipi == "ssh_key" && mevcutSSHPrivateKey != "" {
				veri.SSHPrivateKey = mevcutSSHPrivateKey
			} else {
				http.Error(w, "SSH private key zorunlu", http.StatusBadRequest)
				return
			}
		}

		veri.SunucuSifre = ""

		testKimlik := GizliKimlik{
			IP:              veri.SunucuIP,
			Port:            veri.SunucuPort,
			SunucuKullanici: veri.SunucuKullanici,
			BaglantiTipi:    veri.BaglantiTipi,
			SunucuSifre:     veri.SunucuSifre,
			SSHPrivateKey:   veri.SSHPrivateKey,
			IzoleKlasor:     veri.IzoleKlasor,
		}

		err = sunucuBaglantisiCalisiyorMu(testKimlik)
		if err != nil {
			fmt.Println("Sunucu güncelleme öncesi bağlantı testi hatası:", err)
			http.Error(w, "Sunucu bağlantı testi başarısız", http.StatusBadGateway)
			return
		}
	}

	result, err := db.Exec(`
			UPDATE sunucular
			SET
				sunucu_takma_ad = $1,
				sunucu_ip = $2,
				sunucu_port = $3,
				sunucu_kullanici = $4,
				baglanti_tipi = $5,
				sunucu_sifre = $6,
				ssh_private_key = $7,
				izole_klasor = $8
			WHERE id = $9 AND user_id = $10
		`,
		veri.SunucuTakmaAd,
		veri.SunucuIP,
		veri.SunucuPort,
		veri.SunucuKullanici,
		veri.BaglantiTipi,
		veri.SunucuSifre,
		veri.SSHPrivateKey,
		veri.IzoleKlasor,
		veri.ServerID,
		userID,
	)

	if err != nil {
		fmt.Println("Sunucu güncelleme hatası:", err)
		http.Error(w, "Sunucu güncellenemedi", http.StatusInternalServerError)
		return
	}

	etkilenenSatir, err := result.RowsAffected()
	if err != nil {
		fmt.Println("Güncellenen satır sayısı okunamadı:", err)
		http.Error(w, "Sunucu güncelleme sonucu okunamadı", http.StatusInternalServerError)
		return
	}

	if etkilenenSatir == 0 {
		http.Error(w, "Sunucu bulunamadı veya bu kullanıcıya ait değil", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"mesaj": "Sunucu güncellendi"}`))
}
func sunucuSabitle(w http.ResponseWriter, r *http.Request) {
	corsAyarla(w, "POST, OPTIONS")

	if !postIstekKontrolu(w, r) {
		return
	}

	var veri SunucuSabitleBilgileri
	if !jsonOku(w, r, &veri) {
		return
	}

	veri.PionterKullanici = strings.TrimSpace(veri.PionterKullanici)

	if veri.PionterKullanici == "" || veri.PionterSifre == "" || veri.ServerID <= 0 {
		http.Error(w, "Eksik veya geçersiz veri", http.StatusBadRequest)
		return
	}

	userID, err := kullaniciDogrula(veri.PionterKullanici, veri.PionterSifre)
	if err != nil {
		http.Error(w, "Kullanıcı bulunamadı veya şifre yanlış", http.StatusUnauthorized)
		return
	}

	result, err := db.Exec(`
		UPDATE sunucular
		SET sabitli = $1
		WHERE id = $2 AND user_id = $3
	`, veri.Sabitli, veri.ServerID, userID)

	if err != nil {
		fmt.Println("Sunucu sabitleme hatası:", err)
		http.Error(w, "Sunucu sabitleme durumu güncellenemedi", http.StatusInternalServerError)
		return
	}

	etkilenenSatir, err := result.RowsAffected()
	if err != nil {
		fmt.Println("Güncellenen satır sayısı okunamadı:", err)
		http.Error(w, "Sunucu sabitleme sonucu okunamadı", http.StatusInternalServerError)
		return
	}

	if etkilenenSatir == 0 {
		http.Error(w, "Sunucu bulunamadı veya bu kullanıcıya ait değil", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"mesaj": "Sunucu sabitleme durumu güncellendi"}`))
}
func sunuculariListele(w http.ResponseWriter, r *http.Request) {
	corsAyarla(w, "POST, OPTIONS")

	if !postIstekKontrolu(w, r) {
		return
	}

	var veri KayitBilgileri
	if !jsonOku(w, r, &veri) {
		return
	}

	veri.PionterKullanici = strings.TrimSpace(veri.PionterKullanici)

	userID, err := kullaniciDogrula(veri.PionterKullanici, veri.PionterSifre)
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
			izole_klasor,
			sabitli
		FROM sunucular
		WHERE user_id = $1
		ORDER BY sabitli DESC, id DESC
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
			&s.Sabitli,
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

	userID, err := kullaniciDogrula(kullanici, sifre)
	if err != nil {
		return k, err
	}

	err = db.QueryRow(`
		SELECT
			sunucu_ip,
			sunucu_port,
			sunucu_kullanici,
			baglanti_tipi,
			COALESCE(sunucu_sifre, ''),
			COALESCE(ssh_private_key, ''),
			izole_klasor
		FROM sunucular
		WHERE id = $1 AND user_id = $2
		LIMIT 1
	`, serverID, userID).Scan(
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
func guvenliYolOlustur(izoleKlasor string, kullaniciYolu string) (string, error) {
	if kullaniciYolu == "" {
		kullaniciYolu = "/"
	}

	if strings.Contains(kullaniciYolu, "..") || strings.Contains(kullaniciYolu, "\\") || strings.Contains(kullaniciYolu, "⁄") {
		return "", fmt.Errorf("geçersiz yol")
	}

	temizIzoleKlasor := path.Clean(izoleKlasor)

	if !strings.HasPrefix(temizIzoleKlasor, "/") {
		return "", fmt.Errorf("izole klasör yolu mutlak olmalı")
	}
	temizKullaniciYolu := path.Clean("/" + kullaniciYolu)

	if temizKullaniciYolu == "/" {
		return temizIzoleKlasor, nil
	}

	return path.Join(temizIzoleKlasor, temizKullaniciYolu), nil
}
func corsAyarla(w http.ResponseWriter, methods string) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", methods)
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}
func postIstekKontrolu(w http.ResponseWriter, r *http.Request) bool {
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return false
	}

	if r.Method != "POST" {
		http.Error(w, "Sadece POST isteği kabul edilir", http.StatusMethodNotAllowed)
		return false
	}

	return true
}
func jsonOku(w http.ResponseWriter, r *http.Request, hedef interface{}) bool {
	err := json.NewDecoder(r.Body).Decode(hedef)
	if err != nil {
		http.Error(w, "Geçersiz veri", http.StatusBadRequest)
		return false
	}

	return true
}
func guvenliAdMi(ad string) bool {
	if ad == "" {
		return false
	}
	if strings.Contains(ad, "/") || strings.Contains(ad, "\\") || strings.Contains(ad, "..") || strings.Contains(ad, "⁄") {
		return false
	}
	return true
}
func sshAuthMethodOlustur(kimlik GizliKimlik) ([]ssh.AuthMethod, error) {
	if kimlik.BaglantiTipi == "ssh_key" {
		signer, err := ssh.ParsePrivateKey([]byte(kimlik.SSHPrivateKey))
		if err != nil {
			return nil, fmt.Errorf("SSH Private Key okunamadı: %w", err)
		}
		return []ssh.AuthMethod{ssh.PublicKeys(signer)}, nil
	}
	if kimlik.SunucuSifre == "" {
		return nil, fmt.Errorf("sunucu şifresi boş")
	}

	return []ssh.AuthMethod{ssh.Password(kimlik.SunucuSifre)}, nil
}
func sunucuBaglantisiCalisiyorMu(kimlik GizliKimlik) error {
	authMethods, err := sshAuthMethodOlustur(kimlik)
	if err != nil {
		return fmt.Errorf("SSH kimlik doğrulama hazırlanamadı: %w", err)
	}

	config := &ssh.ClientConfig{
		User:            kimlik.SunucuKullanici,
		Auth:            authMethods,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         5 * time.Second,
	}

	client, err := ssh.Dial("tcp", kimlik.IP+":"+kimlik.Port, config)
	if err != nil {
		return fmt.Errorf("SSH bağlantısı kurulamadı: %w", err)
	}
	defer client.Close()

	sftpClient, err := sftp.NewClient(client)
	if err != nil {
		return fmt.Errorf("SFTP bağlantısı kurulamadı: %w", err)
	}
	defer sftpClient.Close()

	_, err = sftpClient.Stat(kimlik.IzoleKlasor)
	if err != nil {
		return fmt.Errorf("İzole klasör bulunamadı veya erişilemedi: %w", err)
	}

	return nil
}
func sunucuBaglantisiniTestEt(w http.ResponseWriter, r *http.Request) {
	corsAyarla(w, "POST, OPTIONS")

	if !postIstekKontrolu(w, r) {
		return
	}

	var veri SunucuTestBilgileri
	if !jsonOku(w, r, &veri) {
		return
	}

	veri.PionterKullanici = strings.TrimSpace(veri.PionterKullanici)
	veri.SunucuIP = strings.TrimSpace(veri.SunucuIP)
	veri.SunucuPort = strings.TrimSpace(veri.SunucuPort)
	veri.SunucuKullanici = strings.TrimSpace(veri.SunucuKullanici)
	veri.BaglantiTipi = strings.TrimSpace(veri.BaglantiTipi)
	veri.SunucuSifre = strings.TrimSpace(veri.SunucuSifre)
	veri.SSHPrivateKey = strings.TrimSpace(veri.SSHPrivateKey)
	veri.IzoleKlasor = strings.TrimSpace(veri.IzoleKlasor)

	if veri.SunucuPort == "" {
		veri.SunucuPort = "22"
	}

	if veri.PionterKullanici == "" ||
		veri.PionterSifre == "" ||
		veri.SunucuIP == "" ||
		veri.SunucuKullanici == "" ||
		veri.SunucuPort == "" ||
		veri.BaglantiTipi == "" ||
		veri.IzoleKlasor == "" {
		http.Error(w, "Eksik veya geçersiz veri", http.StatusBadRequest)
		return
	}

	portSayisi, err := strconv.Atoi(veri.SunucuPort)
	if err != nil || portSayisi < 1 || portSayisi > 65535 {
		http.Error(w, "Geçersiz SSH portu", http.StatusBadRequest)
		return
	}

	if veri.BaglantiTipi != "password" && veri.BaglantiTipi != "ssh_key" {
		http.Error(w, "Geçersiz bağlantı tipi", http.StatusBadRequest)
		return
	}

	if !strings.HasPrefix(veri.IzoleKlasor, "/") {
		http.Error(w, "İzole klasör / ile başlamalı", http.StatusBadRequest)
		return
	}

	if strings.Contains(veri.IzoleKlasor, "..") ||
		strings.Contains(veri.IzoleKlasor, "\\") ||
		strings.Contains(veri.IzoleKlasor, "⁄") {
		http.Error(w, "Geçersiz izole klasör yolu", http.StatusBadRequest)
		return
	}

	if veri.BaglantiTipi == "password" && veri.SunucuSifre == "" {
		http.Error(w, "Sunucu şifresi zorunlu", http.StatusBadRequest)
		return
	}

	if veri.BaglantiTipi == "ssh_key" && veri.SSHPrivateKey == "" {
		http.Error(w, "SSH private key zorunlu", http.StatusBadRequest)
		return
	}

	_, err = kullaniciDogrula(veri.PionterKullanici, veri.PionterSifre)
	if err != nil {
		http.Error(w, "Kullanıcı bulunamadı veya şifre yanlış", http.StatusUnauthorized)
		return
	}

	kimlik := GizliKimlik{
		IP:              veri.SunucuIP,
		Port:            veri.SunucuPort,
		SunucuKullanici: veri.SunucuKullanici,
		BaglantiTipi:    veri.BaglantiTipi,
		SunucuSifre:     veri.SunucuSifre,
		SSHPrivateKey:   veri.SSHPrivateKey,
		IzoleKlasor:     veri.IzoleKlasor,
	}

	err = sunucuBaglantisiCalisiyorMu(kimlik)
	if err != nil {
		fmt.Println("Sunucu bağlantı testi hatası:", err)
		http.Error(w, "Sunucu bağlantı testi başarısız", http.StatusBadGateway)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"mesaj": "Sunucu bağlantısı başarılı"}`))
}

func sifreHashle(sifre string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(sifre), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}

	return string(hash), nil
}

func bcryptHashMi(sifre string) bool {
	return strings.HasPrefix(sifre, "$2a$") ||
		strings.HasPrefix(sifre, "$2b$") ||
		strings.HasPrefix(sifre, "$2y$")
}

func sifreDogruMu(kayitliSifre string, girilenSifre string) bool {
	if bcryptHashMi(kayitliSifre) {
		err := bcrypt.CompareHashAndPassword([]byte(kayitliSifre), []byte(girilenSifre))
		return err == nil
	}

	return kayitliSifre == girilenSifre
}
func kullaniciDogrula(kullanici string, sifre string) (int, error) {
	kullanici = strings.TrimSpace(kullanici)

	var userID int
	var kayitliSifre string

	err := db.QueryRow(`
		SELECT id, pionter_sifre
		FROM kullanicilar
		WHERE pionter_kullanici = $1 OR LOWER(pionter_email) = LOWER($1)
	`, kullanici).Scan(&userID, &kayitliSifre)

	if err != nil {
		return 0, err
	}

	if !sifreDogruMu(kayitliSifre, sifre) {
		return 0, fmt.Errorf("şifre yanlış")
	}

	return userID, nil
}
