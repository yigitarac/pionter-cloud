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
	"sync"
	"time"

	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"

	"crypto/aes"
	"crypto/cipher"
	"encoding/base64"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
	"github.com/pkg/sftp"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/crypto/ssh"
)

// GLOBAL DEĞİŞKENLER

var db *sql.DB
var sunucuStatsCache = map[string]SunucuStatsCacheKaydi{}
var sunucuStatsCacheMutex sync.Mutex
var sunucuStatsCacheSuresi = 20 * time.Second

const textPreviewLimit = 5 * 1024 * 1024
const imagePreviewLimit = 5 * 1024 * 1024
const textSaveLimit = 5 * 1024 * 1024

const (
	aktiviteDurumBasarili = "success"
	aktiviteDurumHata     = "error"

	aktiviteLogin        = "login"
	aktiviteLogout       = "logout"
	aktiviteUpload       = "upload"
	aktiviteDownload     = "download"
	aktivitePreview      = "preview"
	aktiviteEditorSave   = "editor_save"
	aktiviteCreateFile   = "create_file"
	aktiviteCreateFolder = "create_folder"
	aktiviteRename       = "rename"
	aktiviteMove         = "move"
	aktiviteDelete       = "delete"
	aktiviteShareCreate  = "share_create"
	aktiviteShareRevoke  = "share_revoke"
	aktiviteServerCreate = "server_create"
	aktiviteServerUpdate = "server_update"
	aktiviteServerDelete = "server_delete"
)

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
			sunucu_sifre TEXT,
			ssh_private_key TEXT,
			izole_klasor VARCHAR(200) NOT NULL
		);
		CREATE TABLE IF NOT EXISTS oturumlar (
			id SERIAL PRIMARY KEY,
			user_id INTEGER REFERENCES kullanicilar(id) ON DELETE CASCADE,
			token TEXT UNIQUE NOT NULL,
			olusturma_tarihi TIMESTAMP NOT NULL DEFAULT NOW(),
			son_gecerlilik_tarihi TIMESTAMP NOT NULL DEFAULT NOW() + INTERVAL '7 days'
		);
		CREATE TABLE IF NOT EXISTS share_links (
			id SERIAL PRIMARY KEY,
			user_id INTEGER REFERENCES kullanicilar(id) ON DELETE CASCADE,
			server_id INTEGER REFERENCES sunucular(id) ON DELETE CASCADE,
			dosya_yolu TEXT NOT NULL,
			dosya_adi TEXT NOT NULL,
			token_hash TEXT UNIQUE NOT NULL,
			son_gecerlilik_tarihi TIMESTAMP,
			iptal_edildi BOOLEAN NOT NULL DEFAULT FALSE,
			olusturma_tarihi TIMESTAMP NOT NULL DEFAULT NOW()
		);

		CREATE INDEX IF NOT EXISTS share_links_user_id_index
		ON share_links (user_id);

		CREATE INDEX IF NOT EXISTS share_links_server_id_index
		ON share_links (server_id);

		CREATE INDEX IF NOT EXISTS share_links_token_hash_index
		ON share_links (token_hash);

		CREATE TABLE IF NOT EXISTS activity_logs (
			id SERIAL PRIMARY KEY,
			user_id INTEGER REFERENCES kullanicilar(id) ON DELETE CASCADE,
			server_id INTEGER REFERENCES sunucular(id) ON DELETE SET NULL,
			action_type VARCHAR(80) NOT NULL,
			target_path TEXT,
			target_name TEXT,
			status VARCHAR(30) NOT NULL,
			error_code VARCHAR(80),
			metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
			created_at TIMESTAMP NOT NULL DEFAULT NOW()
		);

		CREATE INDEX IF NOT EXISTS activity_logs_user_id_created_at_index
		ON activity_logs (user_id, created_at DESC);

		CREATE INDEX IF NOT EXISTS activity_logs_server_id_created_at_index
		ON activity_logs (server_id, created_at DESC);

		CREATE INDEX IF NOT EXISTS activity_logs_action_type_index
		ON activity_logs (action_type);

		CREATE INDEX IF NOT EXISTS activity_logs_status_index
		ON activity_logs (status);

		ALTER TABLE sunucular
		ALTER COLUMN sunucu_sifre TYPE TEXT;

		ALTER TABLE oturumlar
		ADD COLUMN IF NOT EXISTS son_gecerlilik_tarihi TIMESTAMP NOT NULL DEFAULT NOW() + INTERVAL '7 days';

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
	http.HandleFunc("/api/file/preview", dosyaPreviewGetir)
	http.HandleFunc("/api/file/save", dosyaKaydet)
	http.HandleFunc("/api/upload", dosyaYukle)
	http.HandleFunc("/api/register", kullaniciKaydet)
	http.HandleFunc("/api/login", kullaniciGirisYap)
	http.HandleFunc("/api/logout", kullaniciCikisYap)
	http.HandleFunc("/api/servers", sunucuKaydet)
	http.HandleFunc("/api/servers/list", sunuculariListele)
	http.HandleFunc("/api/servers/delete", sunucuSil)
	http.HandleFunc("/api/servers/update", sunucuGuncelle)
	http.HandleFunc("/api/folders/create", klasorOlustur)
	http.HandleFunc("/api/files/create", dosyaOlustur)
	http.HandleFunc("/api/delete", dosyaVeyaKlasorSil)
	http.HandleFunc("/api/rename", dosyaVeyaKlasorYenidenAdlandir)
	http.HandleFunc("/api/move", dosyaVeyaKlasorTasi)
	http.HandleFunc("/api/servers/pin", sunucuSabitle)
	http.HandleFunc("/api/servers/test", sunucuBaglantisiniTestEt)
	http.HandleFunc("/api/server/stats", sunucuStatsGetir)
	http.HandleFunc("/api/activity/list", aktiviteLoglariniListele)
	http.HandleFunc("/api/activity/latest-for-folder", aktiviteSonKlasorLoglariniGetir)
	http.HandleFunc("/api/share/create", paylasimLinkiOlustur)
	http.HandleFunc("/api/share/list", paylasimLinkleriniListele)
	http.HandleFunc("/api/share/revoke", paylasimLinkiniIptalEt)
	http.HandleFunc("/api/share/info/", paylasimBilgisiGetir)
	http.HandleFunc("/api/share/preview/", paylasimPreviewGetir)
	http.HandleFunc("/api/share/download/", paylasimDosyasiIndir)
	fmt.Println("Sunucu 8080 portunda çalışmaya başladı!")
	http.ListenAndServe(":8080", nil)
}

type BaglantiBilgileri struct {
	Token    string `json:"token"`
	Yol      string `json:"yol"`
	ServerID int    `json:"server_id"`
}

type DosyaPreviewBilgileri struct {
	Token    string `json:"token"`
	ServerID int    `json:"server_id"`
	Yol      string `json:"yol"`
	DosyaAdi string `json:"dosya_adi"`
}

type DosyaPreviewCevabi struct {
	Basarili bool   `json:"basarili"`
	Mesaj    string `json:"mesaj"`
	Kod      string `json:"kod,omitempty"`

	Tip      string `json:"tip"`
	DosyaAdi string `json:"dosya_adi"`
	Uzanti   string `json:"uzanti"`
	Mime     string `json:"mime,omitempty"`

	Icerik string `json:"icerik,omitempty"`
	Base64 string `json:"base64,omitempty"`
	Boyut  int64  `json:"boyut,omitempty"`
}

type DosyaKaydetBilgileri struct {
	Token    string `json:"token"`
	ServerID int    `json:"server_id"`
	Yol      string `json:"yol"`
	DosyaAdi string `json:"dosya_adi"`
	Icerik   string `json:"icerik"`
}

type DosyaKaydetCevabi struct {
	Basarili    bool   `json:"basarili"`
	Mesaj       string `json:"mesaj"`
	Kod         string `json:"kod,omitempty"`
	DosyaAdi    string `json:"dosya_adi,omitempty"`
	Boyut       int64  `json:"boyut,omitempty"`
	KayitZamani string `json:"kayit_zamani,omitempty"`
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
	Kod      string           `json:"kod,omitempty"`
	Dosyalar []DosyaBilgileri `json:"dosyalar"`
}

type ApiHataCevabi struct {
	Basarili bool   `json:"basarili"`
	Mesaj    string `json:"mesaj"`
	Kod      string `json:"kod,omitempty"`
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
	Token string `json:"token"`

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
	Token string `json:"token"`

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
	Token     string `json:"token"`
	Yol       string `json:"yol"`
	ServerID  int    `json:"server_id"`
	KlasorAdi string `json:"klasor_adi"`
}

type DosyaOlusturBilgileri struct {
	Token    string `json:"token"`
	Yol      string `json:"yol"`
	ServerID int    `json:"server_id"`
	DosyaAdi string `json:"dosya_adi"`
}

type SilmeBilgileri struct {
	Token    string `json:"token"`
	Yol      string `json:"yol"`
	ServerID int    `json:"server_id"`
	DosyaAdi string `json:"dosya_adi"`
	KlasorMu bool   `json:"klasor_mu"`
}

type YenidenAdlandirBilgileri struct {
	Token    string `json:"token"`
	Yol      string `json:"yol"`
	ServerID int    `json:"server_id"`
	EskiAd   string `json:"eski_ad"`
	YeniAd   string `json:"yeni_ad"`
}

type TasiBilgileri struct {
	Token     string `json:"token"`
	ServerID  int    `json:"server_id"`
	KaynakYol string `json:"kaynak_yol"`
	HedefYol  string `json:"hedef_yol"`
	DosyaAdi  string `json:"dosya_adi"`
}

type SunucuSilBilgileri struct {
	Token    string `json:"token"`
	ServerID int    `json:"server_id"`
}

type SunucuSabitleBilgileri struct {
	Token    string `json:"token"`
	ServerID int    `json:"server_id"`
	Sabitli  bool   `json:"sabitli"`
}

type SunucuTestBilgileri struct {
	Token string `json:"token"`

	SunucuIP        string `json:"sunucu_ip"`
	SunucuPort      string `json:"sunucu_port"`
	SunucuKullanici string `json:"sunucu_kullanici"`
	BaglantiTipi    string `json:"baglanti_tipi"`
	SunucuSifre     string `json:"sunucu_sifre"`
	SSHPrivateKey   string `json:"ssh_private_key"`
	IzoleKlasor     string `json:"izole_klasor"`
}

type GirisBilgileri struct {
	PionterKullanici string `json:"pionter_kullanici"`
	PionterSifre     string `json:"pionter_sifre"`
}

type GirisCevabi struct {
	Token string `json:"token"`
	Mesaj string `json:"mesaj"`
}

type TokenIstekBilgileri struct {
	Token string `json:"token"`
}

type PaylasimLinkiOlusturBilgileri struct {
	Token    string `json:"token"`
	ServerID int    `json:"server_id"`
	Yol      string `json:"yol"`
	DosyaAdi string `json:"dosya_adi"`
	Sure     string `json:"sure"`
}

type PaylasimLinkiOlusturCevabi struct {
	Basarili            bool   `json:"basarili"`
	Mesaj               string `json:"mesaj"`
	Kod                 string `json:"kod,omitempty"`
	PaylasimLinki       string `json:"paylasim_linki,omitempty"`
	Token               string `json:"token,omitempty"`
	DosyaAdi            string `json:"dosya_adi,omitempty"`
	DosyaYolu           string `json:"dosya_yolu,omitempty"`
	SonGecerlilikTarihi string `json:"son_gecerlilik_tarihi,omitempty"`
}

type PaylasimLinkiKaydi struct {
	UserID              int
	ServerID            int
	DosyaYolu           string
	DosyaAdi            string
	SonGecerlilikTarihi sql.NullTime
	IptalEdildi         bool
}

type PaylasimBilgisiCevabi struct {
	Basarili            bool   `json:"basarili"`
	Mesaj               string `json:"mesaj"`
	Kod                 string `json:"kod,omitempty"`
	DosyaAdi            string `json:"dosya_adi,omitempty"`
	PaylasanKullanici   string `json:"paylasan_kullanici,omitempty"`
	SonGecerlilikTarihi string `json:"son_gecerlilik_tarihi,omitempty"`
	Suresiz             bool   `json:"suresiz"`
}

type PaylasimLinkiListeleBilgileri struct {
	Token string `json:"token"`
}

type PaylasimLinkiListeOgesi struct {
	ID                  int    `json:"id"`
	ServerID            int    `json:"server_id"`
	SunucuTakmaAd       string `json:"sunucu_takma_ad"`
	DosyaAdi            string `json:"dosya_adi"`
	DosyaYolu           string `json:"dosya_yolu"`
	OlusturmaTarihi     string `json:"olusturma_tarihi"`
	SonGecerlilikTarihi string `json:"son_gecerlilik_tarihi,omitempty"`
	Suresiz             bool   `json:"suresiz"`
	IptalEdildi         bool   `json:"iptal_edildi"`
	SuresiDoldu         bool   `json:"suresi_doldu"`
	Durum               string `json:"durum"`
}

type PaylasimLinkiListeCevabi struct {
	Basarili bool                      `json:"basarili"`
	Mesaj    string                    `json:"mesaj"`
	Kod      string                    `json:"kod,omitempty"`
	Linkler  []PaylasimLinkiListeOgesi `json:"linkler"`
}

type PaylasimLinkiIptalBilgileri struct {
	Token   string `json:"token"`
	ShareID int    `json:"share_id"`
}

type PaylasimLinkiIptalCevabi struct {
	Basarili bool   `json:"basarili"`
	Mesaj    string `json:"mesaj"`
	Kod      string `json:"kod,omitempty"`
	ShareID  int    `json:"share_id,omitempty"`
}

type SunucuStatsBilgileri struct {
	Token    string `json:"token"`
	ServerID int    `json:"server_id"`
	Force    bool   `json:"force"`
}

type SunucuStatsCevabi struct {
	Basarili bool   `json:"basarili"`
	Mesaj    string `json:"mesaj"`

	GuncellemeZamani string `json:"guncelleme_zamani"`

	Uptime      string  `json:"uptime"`
	LoadAverage string  `json:"load_average"`
	CpuYuzde    float64 `json:"cpu_yuzde"`

	RamToplam     int     `json:"ram_toplam"`
	RamKullanilan int     `json:"ram_kullanilan"`
	RamYuzde      float64 `json:"ram_yuzde"`

	DiskToplam     int     `json:"disk_toplam"`
	DiskKullanilan int     `json:"disk_kullanilan"`
	DiskYuzde      float64 `json:"disk_yuzde"`
}

type SunucuStatsCacheKaydi struct {
	Cevap         SunucuStatsCevabi
	SonGuncelleme time.Time
}

type AktiviteLogListeleBilgileri struct {
	Token      string `json:"token"`
	ServerID   int    `json:"server_id"`
	ActionType string `json:"action_type"`
	Status     string `json:"status"`
	Limit      int    `json:"limit"`
}

type AktiviteLogOgesi struct {
	ID              int                    `json:"id"`
	ServerID        int                    `json:"server_id,omitempty"`
	SunucuTakmaAd   string                 `json:"sunucu_takma_ad,omitempty"`
	ActionType      string                 `json:"action_type"`
	TargetPath      string                 `json:"target_path,omitempty"`
	TargetName      string                 `json:"target_name,omitempty"`
	Status          string                 `json:"status"`
	ErrorCode       string                 `json:"error_code,omitempty"`
	Metadata        map[string]interface{} `json:"metadata"`
	OlusturmaTarihi string                 `json:"olusturma_tarihi"`
}

type AktiviteLogListeCevabi struct {
	Basarili bool               `json:"basarili"`
	Mesaj    string             `json:"mesaj"`
	Kod      string             `json:"kod,omitempty"`
	Loglar   []AktiviteLogOgesi `json:"loglar"`
}

type AktiviteSonKlasorBilgileri struct {
	Token       string   `json:"token"`
	ServerID    int      `json:"server_id"`
	Yol         string   `json:"yol"`
	DosyaAdlari []string `json:"dosya_adlari"`
}

type AktiviteSonOgesi struct {
	ActionType      string `json:"action_type"`
	TargetPath      string `json:"target_path"`
	TargetName      string `json:"target_name"`
	OlusturmaTarihi string `json:"olusturma_tarihi"`
}

type AktiviteSonKlasorCevabi struct {
	Basarili    bool                        `json:"basarili"`
	Mesaj       string                      `json:"mesaj"`
	Kod         string                      `json:"kod,omitempty"`
	Aktiviteler map[string]AktiviteSonOgesi `json:"aktiviteler"`
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
	kimlik, err := sunucuKimlikSorgulaTokenIle(bilgiler.Token, bilgiler.ServerID)
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

	err = sftpClient.MkdirAll(gercekYol)
	if err != nil {
		fmt.Println("Klasör hazırlanamadı:", err)

		if izinHatasiMi(err) {
			dosyaListeHatasiYaz(w, http.StatusForbidden, "PERMISSION_DENIED", izinHatasiMesaji())
			return
		}

		dosyaListeHatasiYaz(w, http.StatusInternalServerError, "FOLDER_PREPARE_FAILED", "Klasör hazırlanamadı")
		return
	}

	dosyalar, err := sftpClient.ReadDir(gercekYol)

	if err != nil {
		fmt.Println("Klasör okunamadı:", err)

		if izinHatasiMi(err) {
			dosyaListeHatasiYaz(w, http.StatusForbidden, "PERMISSION_DENIED", izinHatasiMesaji())
			return
		}

		dosyaListeHatasiYaz(w, http.StatusInternalServerError, "FOLDER_READ_FAILED", "Klasör okunamadı")
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

	userID, err := tokenIleKullaniciDogrula(bilgiler.Token)
	if err != nil {
		apiHatasiYaz(w, http.StatusUnauthorized, "UNAUTHORIZED", "Yetkisiz giriş")
		return
	}

	kimlik, err := sunucuKimlikSorgulaTokenIle(bilgiler.Token, bilgiler.ServerID)
	if err != nil {
		apiHatasiYaz(w, http.StatusUnauthorized, "UNAUTHORIZED", "Yetkisiz giriş")
		return
	}
	gercekYol, err := guvenliYolOlustur(kimlik.IzoleKlasor, bilgiler.Yol)
	if err != nil {
		apiHatasiYaz(w, http.StatusBadRequest, "INVALID_PATH", "Geçersiz yol")
		return
	}

	authMethods, err := sshAuthMethodOlustur(kimlik)
	if err != nil {
		fmt.Println("Download SSH auth hatası:", err)
		apiHatasiYaz(w, http.StatusBadGateway, "SSH_AUTH_FAILED", "SSH kimlik doğrulama hazırlanamadı")
		return
	}

	config := &ssh.ClientConfig{
		User:            kimlik.SunucuKullanici,
		Auth:            authMethods,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}
	client, err := ssh.Dial("tcp", kimlik.IP+":"+kimlik.Port, config)
	if err != nil {
		fmt.Println("Download SSH bağlantı hatası:", err)
		apiHatasiYaz(w, http.StatusBadGateway, "SSH_CONNECTION_FAILED", "SSH bağlantısı kurulamadı")
		return
	}
	defer client.Close()
	sftpClient, err := sftp.NewClient(client)
	if err != nil {
		fmt.Println("Download SFTP hatası:", err)
		apiHatasiYaz(w, http.StatusBadGateway, "SFTP_CONNECTION_FAILED", "SFTP bağlantısı kurulamadı")
		return
	}
	defer sftpClient.Close()
	acilanDosya, err := sftpClient.Open(gercekYol)
	if err != nil {
		fmt.Println("Download dosya açma hatası:", err)

		if izinHatasiMi(err) {
			apiHatasiYaz(w, http.StatusForbidden, "PERMISSION_DENIED", izinHatasiMesaji())
			return
		}

		apiHatasiYaz(w, http.StatusInternalServerError, "DOWNLOAD_OPEN_FAILED", "Dosya açılamadı")
		return
	}
	defer acilanDosya.Close()
	kopyalananByte, err := io.Copy(w, acilanDosya)
	if err != nil {
		fmt.Println("Download stream hatası:", err)
		return
	}

	dosyaAdi := path.Base(strings.TrimRight(bilgiler.Yol, "/"))
	if dosyaAdi == "." || dosyaAdi == "/" {
		dosyaAdi = ""
	}

	aktiviteLogla(
		userID,
		bilgiler.ServerID,
		aktiviteDownload,
		aktiviteYoluOlustur(bilgiler.Yol, ""),
		dosyaAdi,
		aktiviteDurumBasarili,
		"",
		map[string]interface{}{
			"bytes": kopyalananByte,
		},
	)
}

func apiHatasiYaz(w http.ResponseWriter, status int, kod string, mesaj string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(ApiHataCevabi{
		Basarili: false,
		Mesaj:    mesaj,
		Kod:      kod,
	})
}

func aktiviteLogla(
	userID int,
	serverID int,
	actionType string,
	targetPath string,
	targetName string,
	status string,
	errorCode string,
	metadata map[string]interface{},
) {
	if userID <= 0 {
		return
	}

	actionType = strings.TrimSpace(actionType)
	status = strings.TrimSpace(status)
	targetPath = strings.TrimSpace(targetPath)
	targetName = strings.TrimSpace(targetName)
	errorCode = strings.TrimSpace(errorCode)

	if actionType == "" || status == "" {
		return
	}

	if metadata == nil {
		metadata = map[string]interface{}{}
	}

	metadataBytes, err := json.Marshal(metadata)
	if err != nil {
		fmt.Println("Aktivite log metadata marshal hatası:", err)
		metadataBytes = []byte(`{"metadata_error":true}`)
	}

	var serverIDDegeri interface{} = nil
	if serverID > 0 {
		serverIDDegeri = serverID
	}

	var errorCodeDegeri interface{} = nil
	if errorCode != "" {
		errorCodeDegeri = errorCode
	}

	_, err = db.Exec(`
		INSERT INTO activity_logs (
			user_id,
			server_id,
			action_type,
			target_path,
			target_name,
			status,
			error_code,
			metadata_json
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
	`,
		userID,
		serverIDDegeri,
		actionType,
		targetPath,
		targetName,
		status,
		errorCodeDegeri,
		string(metadataBytes),
	)

	if err != nil {
		fmt.Println("Aktivite log kayıt hatası:", err)
	}
}

func aktiviteYoluOlustur(klasorYolu string, ad string) string {
	klasorYolu = strings.TrimSpace(klasorYolu)
	ad = strings.TrimSpace(ad)

	if ad == "" {
		if klasorYolu == "" {
			return "/"
		}

		return path.Clean("/" + strings.TrimPrefix(klasorYolu, "/"))
	}

	if klasorYolu == "" || klasorYolu == "/" {
		return "/" + ad
	}

	return path.Clean("/" + strings.TrimPrefix(path.Join(klasorYolu, ad), "/"))
}

func paylasimLinkiCevabiYaz(w http.ResponseWriter, status int, cevap PaylasimLinkiOlusturCevabi) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(cevap)
}

func publicPaylasimHatasiYaz(w http.ResponseWriter, status int, mesaj string) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.WriteHeader(status)
	w.Write([]byte(mesaj))
}

func paylasimBilgisiCevabiYaz(w http.ResponseWriter, status int, cevap PaylasimBilgisiCevabi) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(cevap)
}

func paylasimLinkiListeCevabiYaz(w http.ResponseWriter, status int, cevap PaylasimLinkiListeCevabi) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(cevap)
}

func paylasimLinkiIptalCevabiYaz(w http.ResponseWriter, status int, cevap PaylasimLinkiIptalCevabi) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(cevap)
}

func aktiviteLogListeCevabiYaz(w http.ResponseWriter, status int, cevap AktiviteLogListeCevabi) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(cevap)
}

func aktiviteSonKlasorCevabiYaz(w http.ResponseWriter, status int, cevap AktiviteSonKlasorCevabi) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(cevap)
}

func dosyaListeHatasiYaz(w http.ResponseWriter, status int, kod string, mesaj string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(DosyaListeCevabi{
		Basarili: false,
		Mesaj:    mesaj,
		Kod:      kod,
		Dosyalar: []DosyaBilgileri{},
	})
}

func izinHatasiMi(err error) bool {
	if err == nil {
		return false
	}

	hataMetni := strings.ToLower(err.Error())

	return strings.Contains(hataMetni, "permission denied") ||
		strings.Contains(hataMetni, "operation not permitted") ||
		strings.Contains(hataMetni, "access denied")
}

func izinHatasiMesaji() string {
	return "Bu işlem için SSH kullanıcısının yetkisi yok"
}

func guvenliPaylasimTokeniOlustur() (string, error) {
	byteDizisi := make([]byte, 32)

	_, err := rand.Read(byteDizisi)
	if err != nil {
		return "", err
	}

	return hex.EncodeToString(byteDizisi), nil
}

func paylasimTokenHashle(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}

func urlPaylasimTokeniAl(r *http.Request, prefix string) string {
	token := strings.TrimPrefix(r.URL.Path, prefix)
	token = strings.TrimSpace(token)

	return token
}

func paylasimTokeniGecerliFormattaMi(token string) bool {
	if token == "" {
		return false
	}

	return !strings.Contains(token, "/") &&
		!strings.Contains(token, "\\") &&
		!strings.Contains(token, "..") &&
		!strings.Contains(token, "⁄")
}

func paylasimLinkDurumuHesapla(iptalEdildi bool, sonGecerlilik sql.NullTime) (string, bool) {
	if iptalEdildi {
		return "revoked", false
	}

	if sonGecerlilik.Valid && time.Now().After(sonGecerlilik.Time) {
		return "expired", true
	}

	return "active", false
}

func paylasimSuresiHesapla(sure string) (*time.Time, error) {
	sure = strings.TrimSpace(strings.ToLower(sure))

	if sure == "" {
		return nil, fmt.Errorf("paylaşım süresi boş")
	}

	if sure == "unlimited" || sure == "suresiz" {
		return nil, nil
	}

	simdi := time.Now()
	var sonGecerlilik time.Time

	switch sure {
	case "1h":
		sonGecerlilik = simdi.Add(1 * time.Hour)
	case "1d":
		sonGecerlilik = simdi.Add(24 * time.Hour)
	case "1w":
		sonGecerlilik = simdi.Add(7 * 24 * time.Hour)
	case "1m":
		sonGecerlilik = simdi.AddDate(0, 1, 0)
	case "1y":
		sonGecerlilik = simdi.AddDate(1, 0, 0)
	default:
		return nil, fmt.Errorf("geçersiz paylaşım süresi")
	}

	return &sonGecerlilik, nil
}

func paylasimDosyaYoluOlustur(klasorYolu string, dosyaAdi string) string {
	klasorYolu = strings.TrimSpace(klasorYolu)

	if klasorYolu == "" || klasorYolu == "/" {
		return "/" + dosyaAdi
	}

	return path.Clean("/" + strings.TrimPrefix(path.Join(klasorYolu, dosyaAdi), "/"))
}

func publicPaylasimURLAl(token string) string {
	publicURL := strings.TrimRight(strings.TrimSpace(os.Getenv("APP_PUBLIC_URL")), "/")

	if publicURL == "" {
		publicURL = "http://localhost:3000"
	}

	return publicURL + "/share/" + token
}

func dosyaKaydetCevabiYaz(w http.ResponseWriter, status int, cevap DosyaKaydetCevabi) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(cevap)
}

func dosyaPreviewGetir(w http.ResponseWriter, r *http.Request) {
	corsAyarla(w, "POST, OPTIONS")

	if !postIstekKontrolu(w, r) {
		return
	}

	var bilgiler DosyaPreviewBilgileri
	if !jsonOku(w, r, &bilgiler) {
		return
	}

	bilgiler.Token = strings.TrimSpace(bilgiler.Token)
	bilgiler.Yol = strings.TrimSpace(bilgiler.Yol)
	bilgiler.DosyaAdi = strings.TrimSpace(bilgiler.DosyaAdi)

	if bilgiler.Token == "" || bilgiler.ServerID <= 0 || bilgiler.DosyaAdi == "" {
		http.Error(w, "Eksik veya geçersiz veri", http.StatusBadRequest)
		return
	}

	if !guvenliAdMi(bilgiler.DosyaAdi) {
		http.Error(w, "Geçersiz dosya adı", http.StatusBadRequest)
		return
	}

	kimlik, err := sunucuKimlikSorgulaTokenIle(bilgiler.Token, bilgiler.ServerID)
	if err != nil {
		http.Error(w, "Yetkisiz giriş veya sunucu bulunamadı", http.StatusUnauthorized)
		return
	}

	gercekKlasorYolu, err := guvenliYolOlustur(kimlik.IzoleKlasor, bilgiler.Yol)
	if err != nil {
		http.Error(w, "Geçersiz yol", http.StatusBadRequest)
		return
	}

	gercekDosyaYolu := path.Join(gercekKlasorYolu, bilgiler.DosyaAdi)

	uzanti := dosyaUzantisiAl(bilgiler.DosyaAdi)
	tip := previewTipiBelirle(uzanti)

	cevap := DosyaPreviewCevabi{
		Basarili: true,
		Mesaj:    "Preview endpoint hazır",
		Tip:      tip,
		DosyaAdi: bilgiler.DosyaAdi,
		Uzanti:   uzanti,
		Mime:     imageMimeBelirle(uzanti),
	}

	if tip == "unsupported" {
		cevap.Basarili = false
		cevap.Kod = "UNSUPPORTED_FILE_TYPE"
		cevap.Mesaj = "Bu dosya türü henüz önizlenemiyor"

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(cevap)
		return
	}

	if tip != "text" && tip != "image" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(cevap)
		return
	}

	authMethods, err := sshAuthMethodOlustur(kimlik)
	if err != nil {
		fmt.Println("Preview SSH auth hatası:", err)
		http.Error(w, "SSH kimlik doğrulama hazırlanamadı", http.StatusBadGateway)
		return
	}

	config := &ssh.ClientConfig{
		User:            kimlik.SunucuKullanici,
		Auth:            authMethods,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         5 * time.Second,
	}

	client, err := ssh.Dial("tcp", kimlik.IP+":"+kimlik.Port, config)
	if err != nil {
		fmt.Println("Preview SSH bağlantı hatası:", err)
		http.Error(w, "SSH bağlantısı kurulamadı", http.StatusBadGateway)
		return
	}
	defer client.Close()

	sftpClient, err := sftp.NewClient(client)
	if err != nil {
		fmt.Println("Preview SFTP hatası:", err)
		http.Error(w, "SFTP bağlantısı kurulamadı", http.StatusBadGateway)
		return
	}
	defer sftpClient.Close()

	if tip == "text" {
		icerik, boyut, err := textDosyaPreviewOku(sftpClient, gercekDosyaYolu, textPreviewLimit)
		if err != nil {
			fmt.Println("Text preview hatası:", err)

			cevap.Basarili = false
			cevap.Icerik = ""
			cevap.Boyut = boyut

			if boyut > textPreviewLimit {
				cevap.Kod = "FILE_TOO_LARGE"
				cevap.Mesaj = "Dosya önizleme için çok büyük"
			} else if izinHatasiMi(err) {
				cevap.Kod = "PERMISSION_DENIED"
				cevap.Mesaj = izinHatasiMesaji()
			} else {
				cevap.Kod = "PREVIEW_FAILED"
				cevap.Mesaj = "Dosya önizlemesi alınamadı"
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(cevap)
			return
		}

		cevap.Mesaj = "Dosya önizlemesi alındı"
		cevap.Icerik = icerik
		cevap.Boyut = boyut
	}

	if tip == "image" {
		base64Icerik, boyut, err := imageDosyaPreviewOku(sftpClient, gercekDosyaYolu, imagePreviewLimit)
		if err != nil {
			fmt.Println("Image preview hatası:", err)

			cevap.Basarili = false
			cevap.Base64 = ""
			cevap.Boyut = boyut

			if boyut > imagePreviewLimit {
				cevap.Kod = "FILE_TOO_LARGE"
				cevap.Mesaj = "Görsel önizleme için çok büyük"
			} else if izinHatasiMi(err) {
				cevap.Kod = "PERMISSION_DENIED"
				cevap.Mesaj = izinHatasiMesaji()
			} else {
				cevap.Kod = "PREVIEW_FAILED"
				cevap.Mesaj = "Görsel önizlemesi alınamadı"
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(cevap)
			return
		}

		cevap.Mesaj = "Görsel önizlemesi alındı"
		cevap.Base64 = base64Icerik
		cevap.Boyut = boyut
		cevap.Mime = imageMimeBelirle(uzanti)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(cevap)
}

func dosyaKaydet(w http.ResponseWriter, r *http.Request) {
	corsAyarla(w, "POST, OPTIONS")

	if !postIstekKontrolu(w, r) {
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, textSaveLimit+(128*1024))

	var bilgiler DosyaKaydetBilgileri
	if !jsonOku(w, r, &bilgiler) {
		return
	}

	bilgiler.Token = strings.TrimSpace(bilgiler.Token)
	bilgiler.Yol = strings.TrimSpace(bilgiler.Yol)
	bilgiler.DosyaAdi = strings.TrimSpace(bilgiler.DosyaAdi)

	if bilgiler.Token == "" || bilgiler.ServerID <= 0 || bilgiler.DosyaAdi == "" {
		dosyaKaydetCevabiYaz(w, http.StatusBadRequest, DosyaKaydetCevabi{
			Basarili: false,
			Mesaj:    "Eksik veya geçersiz veri",
			Kod:      "INVALID_REQUEST",
		})
		return
	}

	if !guvenliAdMi(bilgiler.DosyaAdi) {
		dosyaKaydetCevabiYaz(w, http.StatusBadRequest, DosyaKaydetCevabi{
			Basarili: false,
			Mesaj:    "Geçersiz dosya adı",
			Kod:      "INVALID_FILE_NAME",
		})
		return
	}

	icerikBoyutu := int64(len([]byte(bilgiler.Icerik)))
	if icerikBoyutu > textSaveLimit {
		dosyaKaydetCevabiYaz(w, http.StatusRequestEntityTooLarge, DosyaKaydetCevabi{
			Basarili: false,
			Mesaj:    "Dosya kaydetmek için çok büyük",
			Kod:      "FILE_TOO_LARGE",
			DosyaAdi: bilgiler.DosyaAdi,
			Boyut:    icerikBoyutu,
		})
		return
	}

	uzanti := dosyaUzantisiAl(bilgiler.DosyaAdi)
	if !textPreviewDestekleniyorMu(uzanti) {
		dosyaKaydetCevabiYaz(w, http.StatusUnsupportedMediaType, DosyaKaydetCevabi{
			Basarili: false,
			Mesaj:    "Bu dosya türü düzenlenemez",
			Kod:      "UNSUPPORTED_FILE_TYPE",
			DosyaAdi: bilgiler.DosyaAdi,
		})
		return
	}

	userID, err := tokenIleKullaniciDogrula(bilgiler.Token)
	if err != nil {
		dosyaKaydetCevabiYaz(w, http.StatusUnauthorized, DosyaKaydetCevabi{
			Basarili: false,
			Mesaj:    "Yetkisiz giriş veya sunucu bulunamadı",
			Kod:      "UNAUTHORIZED",
		})
		return
	}

	kimlik, err := sunucuKimlikSorgulaTokenIle(bilgiler.Token, bilgiler.ServerID)
	if err != nil {
		dosyaKaydetCevabiYaz(w, http.StatusUnauthorized, DosyaKaydetCevabi{
			Basarili: false,
			Mesaj:    "Yetkisiz giriş veya sunucu bulunamadı",
			Kod:      "UNAUTHORIZED",
		})
		return
	}

	gercekKlasorYolu, err := guvenliYolOlustur(kimlik.IzoleKlasor, bilgiler.Yol)
	if err != nil {
		dosyaKaydetCevabiYaz(w, http.StatusBadRequest, DosyaKaydetCevabi{
			Basarili: false,
			Mesaj:    "Geçersiz yol",
			Kod:      "INVALID_PATH",
		})
		return
	}

	gercekDosyaYolu := path.Join(gercekKlasorYolu, bilgiler.DosyaAdi)

	authMethods, err := sshAuthMethodOlustur(kimlik)
	if err != nil {
		fmt.Println("Save SSH auth hatası:", err)
		dosyaKaydetCevabiYaz(w, http.StatusBadGateway, DosyaKaydetCevabi{
			Basarili: false,
			Mesaj:    "SSH kimlik doğrulama hazırlanamadı",
			Kod:      "SSH_AUTH_FAILED",
		})
		return
	}

	config := &ssh.ClientConfig{
		User:            kimlik.SunucuKullanici,
		Auth:            authMethods,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         5 * time.Second,
	}

	client, err := ssh.Dial("tcp", kimlik.IP+":"+kimlik.Port, config)
	if err != nil {
		fmt.Println("Save SSH bağlantı hatası:", err)
		dosyaKaydetCevabiYaz(w, http.StatusBadGateway, DosyaKaydetCevabi{
			Basarili: false,
			Mesaj:    "SSH bağlantısı kurulamadı",
			Kod:      "SSH_CONNECTION_FAILED",
		})
		return
	}
	defer client.Close()

	sftpClient, err := sftp.NewClient(client)
	if err != nil {
		fmt.Println("Save SFTP hatası:", err)
		dosyaKaydetCevabiYaz(w, http.StatusBadGateway, DosyaKaydetCevabi{
			Basarili: false,
			Mesaj:    "SFTP bağlantısı kurulamadı",
			Kod:      "SFTP_CONNECTION_FAILED",
		})
		return
	}
	defer sftpClient.Close()

	kaydedilenBoyut, err := textDosyaKaydet(sftpClient, gercekDosyaYolu, bilgiler.Icerik, textSaveLimit)
	if err != nil {
		fmt.Println("Dosya kaydetme hatası:", err)

		if strings.Contains(err.Error(), "klasör düzenlenemez") {
			dosyaKaydetCevabiYaz(w, http.StatusBadRequest, DosyaKaydetCevabi{
				Basarili: false,
				Mesaj:    "Klasör düzenlenemez",
				Kod:      "TARGET_IS_DIRECTORY",
				DosyaAdi: bilgiler.DosyaAdi,
			})
			return
		}

		if strings.Contains(err.Error(), "çok büyük") {
			dosyaKaydetCevabiYaz(w, http.StatusRequestEntityTooLarge, DosyaKaydetCevabi{
				Basarili: false,
				Mesaj:    "Dosya kaydetmek için çok büyük",
				Kod:      "FILE_TOO_LARGE",
				DosyaAdi: bilgiler.DosyaAdi,
			})
			return
		}

		if izinHatasiMi(err) {
			dosyaKaydetCevabiYaz(w, http.StatusForbidden, DosyaKaydetCevabi{
				Basarili: false,
				Mesaj:    izinHatasiMesaji(),
				Kod:      "PERMISSION_DENIED",
				DosyaAdi: bilgiler.DosyaAdi,
			})
			return
		}

		dosyaKaydetCevabiYaz(w, http.StatusInternalServerError, DosyaKaydetCevabi{
			Basarili: false,
			Mesaj:    "Dosya kaydedilemedi",
			Kod:      "SAVE_FAILED",
			DosyaAdi: bilgiler.DosyaAdi,
		})

		return
	}

	aktiviteLogla(
		userID,
		bilgiler.ServerID,
		aktiviteEditorSave,
		aktiviteYoluOlustur(bilgiler.Yol, bilgiler.DosyaAdi),
		bilgiler.DosyaAdi,
		aktiviteDurumBasarili,
		"",
		map[string]interface{}{
			"size":      kaydedilenBoyut,
			"extension": dosyaUzantisiAl(bilgiler.DosyaAdi),
		},
	)

	dosyaKaydetCevabiYaz(w, http.StatusOK, DosyaKaydetCevabi{
		Basarili:    true,
		Mesaj:       "Dosya kaydedildi",
		DosyaAdi:    bilgiler.DosyaAdi,
		Boyut:       kaydedilenBoyut,
		KayitZamani: time.Now().Format("2006-01-02 15:04"),
	})
}

func paylasimLinkiOlustur(w http.ResponseWriter, r *http.Request) {
	corsAyarla(w, "POST, OPTIONS")

	if !postIstekKontrolu(w, r) {
		return
	}

	var bilgiler PaylasimLinkiOlusturBilgileri
	if !jsonOku(w, r, &bilgiler) {
		return
	}

	bilgiler.Token = strings.TrimSpace(bilgiler.Token)
	bilgiler.Yol = strings.TrimSpace(bilgiler.Yol)
	bilgiler.DosyaAdi = strings.TrimSpace(bilgiler.DosyaAdi)
	bilgiler.Sure = strings.TrimSpace(strings.ToLower(bilgiler.Sure))

	if bilgiler.Token == "" || bilgiler.ServerID <= 0 || bilgiler.DosyaAdi == "" || bilgiler.Sure == "" {
		paylasimLinkiCevabiYaz(w, http.StatusBadRequest, PaylasimLinkiOlusturCevabi{
			Basarili: false,
			Mesaj:    "Eksik veya geçersiz veri",
			Kod:      "INVALID_REQUEST",
		})
		return
	}

	if !guvenliAdMi(bilgiler.DosyaAdi) {
		paylasimLinkiCevabiYaz(w, http.StatusBadRequest, PaylasimLinkiOlusturCevabi{
			Basarili: false,
			Mesaj:    "Geçersiz dosya adı",
			Kod:      "INVALID_FILE_NAME",
		})
		return
	}

	userID, err := tokenIleKullaniciDogrula(bilgiler.Token)
	if err != nil {
		paylasimLinkiCevabiYaz(w, http.StatusUnauthorized, PaylasimLinkiOlusturCevabi{
			Basarili: false,
			Mesaj:    "Yetkisiz giriş",
			Kod:      "UNAUTHORIZED",
		})
		return
	}

	sonGecerlilik, err := paylasimSuresiHesapla(bilgiler.Sure)
	if err != nil {
		paylasimLinkiCevabiYaz(w, http.StatusBadRequest, PaylasimLinkiOlusturCevabi{
			Basarili: false,
			Mesaj:    "Geçersiz paylaşım süresi",
			Kod:      "INVALID_SHARE_DURATION",
		})
		return
	}

	kimlik, err := sunucuKimlikSorgulaTokenIle(bilgiler.Token, bilgiler.ServerID)
	if err != nil {
		paylasimLinkiCevabiYaz(w, http.StatusUnauthorized, PaylasimLinkiOlusturCevabi{
			Basarili: false,
			Mesaj:    "Yetkisiz giriş veya sunucu bulunamadı",
			Kod:      "UNAUTHORIZED",
		})
		return
	}

	gercekKlasorYolu, err := guvenliYolOlustur(kimlik.IzoleKlasor, bilgiler.Yol)
	if err != nil {
		paylasimLinkiCevabiYaz(w, http.StatusBadRequest, PaylasimLinkiOlusturCevabi{
			Basarili: false,
			Mesaj:    "Geçersiz yol",
			Kod:      "INVALID_PATH",
		})
		return
	}

	gercekDosyaYolu := path.Join(gercekKlasorYolu, bilgiler.DosyaAdi)

	authMethods, err := sshAuthMethodOlustur(kimlik)
	if err != nil {
		fmt.Println("Share create SSH auth hatası:", err)
		paylasimLinkiCevabiYaz(w, http.StatusBadGateway, PaylasimLinkiOlusturCevabi{
			Basarili: false,
			Mesaj:    "SSH kimlik doğrulama hazırlanamadı",
			Kod:      "SSH_AUTH_FAILED",
		})
		return
	}

	config := &ssh.ClientConfig{
		User:            kimlik.SunucuKullanici,
		Auth:            authMethods,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         8 * time.Second,
	}

	client, err := ssh.Dial("tcp", kimlik.IP+":"+kimlik.Port, config)
	if err != nil {
		fmt.Println("Share create SSH bağlantı hatası:", err)
		paylasimLinkiCevabiYaz(w, http.StatusBadGateway, PaylasimLinkiOlusturCevabi{
			Basarili: false,
			Mesaj:    "SSH bağlantısı kurulamadı",
			Kod:      "SSH_CONNECTION_FAILED",
		})
		return
	}
	defer client.Close()

	sftpClient, err := sftp.NewClient(client)
	if err != nil {
		fmt.Println("Share create SFTP hatası:", err)
		paylasimLinkiCevabiYaz(w, http.StatusBadGateway, PaylasimLinkiOlusturCevabi{
			Basarili: false,
			Mesaj:    "SFTP bağlantısı kurulamadı",
			Kod:      "SFTP_CONNECTION_FAILED",
		})
		return
	}
	defer sftpClient.Close()

	dosyaBilgisi, err := sftpClient.Stat(gercekDosyaYolu)
	if err != nil {
		fmt.Println("Paylaşılacak dosya kontrol edilemedi:", err)

		if izinHatasiMi(err) {
			paylasimLinkiCevabiYaz(w, http.StatusForbidden, PaylasimLinkiOlusturCevabi{
				Basarili: false,
				Mesaj:    izinHatasiMesaji(),
				Kod:      "PERMISSION_DENIED",
			})
			return
		}

		paylasimLinkiCevabiYaz(w, http.StatusNotFound, PaylasimLinkiOlusturCevabi{
			Basarili: false,
			Mesaj:    "Paylaşılacak dosya bulunamadı",
			Kod:      "FILE_NOT_FOUND",
		})
		return
	}

	if dosyaBilgisi.IsDir() {
		paylasimLinkiCevabiYaz(w, http.StatusBadRequest, PaylasimLinkiOlusturCevabi{
			Basarili: false,
			Mesaj:    "Klasör paylaşımı şimdilik desteklenmiyor",
			Kod:      "FOLDER_SHARE_NOT_SUPPORTED",
		})
		return
	}

	paylasimTokeni, err := guvenliPaylasimTokeniOlustur()
	if err != nil {
		fmt.Println("Paylaşım token üretme hatası:", err)
		paylasimLinkiCevabiYaz(w, http.StatusInternalServerError, PaylasimLinkiOlusturCevabi{
			Basarili: false,
			Mesaj:    "Paylaşım linki oluşturulamadı",
			Kod:      "SHARE_TOKEN_CREATE_FAILED",
		})
		return
	}

	tokenHash := paylasimTokenHashle(paylasimTokeni)
	dosyaYolu := paylasimDosyaYoluOlustur(bilgiler.Yol, bilgiler.DosyaAdi)

	var sonGecerlilikDegeri interface{} = nil
	sonGecerlilikMetni := ""

	if sonGecerlilik != nil {
		sonGecerlilikDegeri = *sonGecerlilik
		sonGecerlilikMetni = sonGecerlilik.Format("2006-01-02 15:04")
	}

	_, err = db.Exec(`
		INSERT INTO share_links (
			user_id,
			server_id,
			dosya_yolu,
			dosya_adi,
			token_hash,
			son_gecerlilik_tarihi
		)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, userID, bilgiler.ServerID, dosyaYolu, bilgiler.DosyaAdi, tokenHash, sonGecerlilikDegeri)

	if err != nil {
		fmt.Println("Paylaşım linki kayıt hatası:", err)
		paylasimLinkiCevabiYaz(w, http.StatusInternalServerError, PaylasimLinkiOlusturCevabi{
			Basarili: false,
			Mesaj:    "Paylaşım linki kaydedilemedi",
			Kod:      "SHARE_LINK_SAVE_FAILED",
		})
		return
	}

	paylasimLinki := publicPaylasimURLAl(paylasimTokeni)

	aktiviteLogla(
		userID,
		bilgiler.ServerID,
		aktiviteShareCreate,
		dosyaYolu,
		bilgiler.DosyaAdi,
		aktiviteDurumBasarili,
		"",
		map[string]interface{}{
			"duration":               bilgiler.Sure,
			"unlimited":              sonGecerlilik == nil,
			"son_gecerlilik_tarihi":  sonGecerlilikMetni,
			"public_link_generated":  true,
			"raw_share_token_stored": false,
		},
	)

	paylasimLinkiCevabiYaz(w, http.StatusCreated, PaylasimLinkiOlusturCevabi{
		Basarili:            true,
		Mesaj:               "Paylaşım linki oluşturuldu",
		PaylasimLinki:       paylasimLinki,
		Token:               paylasimTokeni,
		DosyaAdi:            bilgiler.DosyaAdi,
		DosyaYolu:           dosyaYolu,
		SonGecerlilikTarihi: sonGecerlilikMetni,
	})
}

func paylasimLinkleriniListele(w http.ResponseWriter, r *http.Request) {
	corsAyarla(w, "POST, OPTIONS")

	if !postIstekKontrolu(w, r) {
		return
	}

	var bilgiler PaylasimLinkiListeleBilgileri
	if !jsonOku(w, r, &bilgiler) {
		return
	}

	bilgiler.Token = strings.TrimSpace(bilgiler.Token)

	if bilgiler.Token == "" {
		paylasimLinkiListeCevabiYaz(w, http.StatusBadRequest, PaylasimLinkiListeCevabi{
			Basarili: false,
			Mesaj:    "Eksik veya geçersiz veri",
			Kod:      "INVALID_REQUEST",
			Linkler:  []PaylasimLinkiListeOgesi{},
		})
		return
	}

	userID, err := tokenIleKullaniciDogrula(bilgiler.Token)
	if err != nil {
		paylasimLinkiListeCevabiYaz(w, http.StatusUnauthorized, PaylasimLinkiListeCevabi{
			Basarili: false,
			Mesaj:    "Yetkisiz giriş",
			Kod:      "UNAUTHORIZED",
			Linkler:  []PaylasimLinkiListeOgesi{},
		})
		return
	}

	rows, err := db.Query(`
		SELECT
			sl.id,
			sl.server_id,
			COALESCE(s.sunucu_takma_ad, ''),
			sl.dosya_adi,
			sl.dosya_yolu,
			sl.olusturma_tarihi,
			sl.son_gecerlilik_tarihi,
			sl.iptal_edildi
		FROM share_links sl
		LEFT JOIN sunucular s ON s.id = sl.server_id
		WHERE sl.user_id = $1
		ORDER BY sl.olusturma_tarihi DESC
		LIMIT 100
	`, userID)

	if err != nil {
		fmt.Println("Paylaşım linkleri listeleme hatası:", err)
		paylasimLinkiListeCevabiYaz(w, http.StatusInternalServerError, PaylasimLinkiListeCevabi{
			Basarili: false,
			Mesaj:    "Paylaşım linkleri getirilemedi",
			Kod:      "SHARE_LINKS_LIST_FAILED",
			Linkler:  []PaylasimLinkiListeOgesi{},
		})
		return
	}
	defer rows.Close()

	linkler := []PaylasimLinkiListeOgesi{}

	for rows.Next() {
		var id int
		var serverID int
		var sunucuTakmaAd string
		var dosyaAdi string
		var dosyaYolu string
		var olusturmaTarihi time.Time
		var sonGecerlilik sql.NullTime
		var iptalEdildi bool

		err = rows.Scan(
			&id,
			&serverID,
			&sunucuTakmaAd,
			&dosyaAdi,
			&dosyaYolu,
			&olusturmaTarihi,
			&sonGecerlilik,
			&iptalEdildi,
		)

		if err != nil {
			fmt.Println("Paylaşım linki satır okuma hatası:", err)
			continue
		}

		durum, suresiDoldu := paylasimLinkDurumuHesapla(iptalEdildi, sonGecerlilik)

		sonGecerlilikMetni := ""
		if sonGecerlilik.Valid {
			sonGecerlilikMetni = sonGecerlilik.Time.Format("2006-01-02 15:04")
		}

		linkler = append(linkler, PaylasimLinkiListeOgesi{
			ID:                  id,
			ServerID:            serverID,
			SunucuTakmaAd:       sunucuTakmaAd,
			DosyaAdi:            dosyaAdi,
			DosyaYolu:           dosyaYolu,
			OlusturmaTarihi:     olusturmaTarihi.Format("2006-01-02 15:04"),
			SonGecerlilikTarihi: sonGecerlilikMetni,
			Suresiz:             !sonGecerlilik.Valid,
			IptalEdildi:         iptalEdildi,
			SuresiDoldu:         suresiDoldu,
			Durum:               durum,
		})
	}

	if err = rows.Err(); err != nil {
		fmt.Println("Paylaşım linkleri rows hatası:", err)
		paylasimLinkiListeCevabiYaz(w, http.StatusInternalServerError, PaylasimLinkiListeCevabi{
			Basarili: false,
			Mesaj:    "Paylaşım linkleri getirilemedi",
			Kod:      "SHARE_LINKS_LIST_FAILED",
			Linkler:  []PaylasimLinkiListeOgesi{},
		})
		return
	}

	paylasimLinkiListeCevabiYaz(w, http.StatusOK, PaylasimLinkiListeCevabi{
		Basarili: true,
		Mesaj:    "Paylaşım linkleri getirildi",
		Linkler:  linkler,
	})
}

func paylasimLinkiniIptalEt(w http.ResponseWriter, r *http.Request) {
	corsAyarla(w, "POST, OPTIONS")

	if !postIstekKontrolu(w, r) {
		return
	}

	var bilgiler PaylasimLinkiIptalBilgileri
	if !jsonOku(w, r, &bilgiler) {
		return
	}

	bilgiler.Token = strings.TrimSpace(bilgiler.Token)

	if bilgiler.Token == "" || bilgiler.ShareID <= 0 {
		paylasimLinkiIptalCevabiYaz(w, http.StatusBadRequest, PaylasimLinkiIptalCevabi{
			Basarili: false,
			Mesaj:    "Eksik veya geçersiz veri",
			Kod:      "INVALID_REQUEST",
		})
		return
	}

	userID, err := tokenIleKullaniciDogrula(bilgiler.Token)
	if err != nil {
		paylasimLinkiIptalCevabiYaz(w, http.StatusUnauthorized, PaylasimLinkiIptalCevabi{
			Basarili: false,
			Mesaj:    "Yetkisiz giriş",
			Kod:      "UNAUTHORIZED",
		})
		return
	}

	var serverID int
	var dosyaYolu string
	var dosyaAdi string

	err = db.QueryRow(`
		UPDATE share_links
		SET iptal_edildi = TRUE
		WHERE id = $1 AND user_id = $2
		RETURNING server_id, dosya_yolu, dosya_adi
`, bilgiler.ShareID, userID).Scan(&serverID, &dosyaYolu, &dosyaAdi)

	if err != nil {
		if err == sql.ErrNoRows {
			paylasimLinkiIptalCevabiYaz(w, http.StatusNotFound, PaylasimLinkiIptalCevabi{
				Basarili: false,
				Mesaj:    "Paylaşım linki bulunamadı",
				Kod:      "SHARE_LINK_NOT_FOUND",
			})
			return
		}

		fmt.Println("Paylaşım linki iptal hatası:", err)
		paylasimLinkiIptalCevabiYaz(w, http.StatusInternalServerError, PaylasimLinkiIptalCevabi{
			Basarili: false,
			Mesaj:    "Paylaşım linki iptal edilemedi",
			Kod:      "SHARE_LINK_REVOKE_FAILED",
		})
		return
	}

	aktiviteLogla(
		userID,
		serverID,
		aktiviteShareRevoke,
		dosyaYolu,
		dosyaAdi,
		aktiviteDurumBasarili,
		"",
		map[string]interface{}{
			"share_id": bilgiler.ShareID,
		},
	)

	paylasimLinkiIptalCevabiYaz(w, http.StatusOK, PaylasimLinkiIptalCevabi{
		Basarili: true,
		Mesaj:    "Paylaşım linki iptal edildi",
		ShareID:  bilgiler.ShareID,
	})
}

func aktiviteLoglariniListele(w http.ResponseWriter, r *http.Request) {
	corsAyarla(w, "POST, OPTIONS")

	if !postIstekKontrolu(w, r) {
		return
	}

	var bilgiler AktiviteLogListeleBilgileri
	if !jsonOku(w, r, &bilgiler) {
		return
	}

	bilgiler.Token = strings.TrimSpace(bilgiler.Token)
	bilgiler.ActionType = strings.TrimSpace(bilgiler.ActionType)
	bilgiler.Status = strings.TrimSpace(bilgiler.Status)

	if bilgiler.Token == "" {
		aktiviteLogListeCevabiYaz(w, http.StatusBadRequest, AktiviteLogListeCevabi{
			Basarili: false,
			Mesaj:    "Eksik veya geçersiz veri",
			Kod:      "INVALID_REQUEST",
			Loglar:   []AktiviteLogOgesi{},
		})
		return
	}

	if bilgiler.Limit <= 0 {
		bilgiler.Limit = 100
	}

	if bilgiler.Limit > 200 {
		bilgiler.Limit = 200
	}

	userID, err := tokenIleKullaniciDogrula(bilgiler.Token)
	if err != nil {
		aktiviteLogListeCevabiYaz(w, http.StatusUnauthorized, AktiviteLogListeCevabi{
			Basarili: false,
			Mesaj:    "Yetkisiz giriş",
			Kod:      "UNAUTHORIZED",
			Loglar:   []AktiviteLogOgesi{},
		})
		return
	}

	filtreler := []string{"al.user_id = $1"}
	argumanlar := []interface{}{userID}
	argIndex := 2

	if bilgiler.ServerID > 0 {
		filtreler = append(filtreler, fmt.Sprintf("al.server_id = $%d", argIndex))
		argumanlar = append(argumanlar, bilgiler.ServerID)
		argIndex++
	}

	if bilgiler.ActionType != "" {
		filtreler = append(filtreler, fmt.Sprintf("al.action_type = $%d", argIndex))
		argumanlar = append(argumanlar, bilgiler.ActionType)
		argIndex++
	}

	if bilgiler.Status != "" {
		filtreler = append(filtreler, fmt.Sprintf("al.status = $%d", argIndex))
		argumanlar = append(argumanlar, bilgiler.Status)
		argIndex++
	}

	sorgu := fmt.Sprintf(`
		SELECT
			al.id,
			al.server_id,
			COALESCE(s.sunucu_takma_ad, ''),
			al.action_type,
			al.target_path,
			al.target_name,
			al.status,
			al.error_code,
			al.metadata_json,
			al.created_at
		FROM activity_logs al
		LEFT JOIN sunucular s ON s.id = al.server_id AND s.user_id = al.user_id
		WHERE %s
		ORDER BY al.created_at DESC
		LIMIT $%d
	`, strings.Join(filtreler, " AND "), argIndex)

	argumanlar = append(argumanlar, bilgiler.Limit)

	rows, err := db.Query(sorgu, argumanlar...)
	if err != nil {
		fmt.Println("Aktivite log listeleme hatası:", err)
		aktiviteLogListeCevabiYaz(w, http.StatusInternalServerError, AktiviteLogListeCevabi{
			Basarili: false,
			Mesaj:    "Aktivite logları getirilemedi",
			Kod:      "ACTIVITY_LOGS_LIST_FAILED",
			Loglar:   []AktiviteLogOgesi{},
		})
		return
	}
	defer rows.Close()

	loglar := []AktiviteLogOgesi{}

	for rows.Next() {
		var id int
		var serverID sql.NullInt64
		var sunucuTakmaAd string
		var actionType string
		var targetPath sql.NullString
		var targetName sql.NullString
		var status string
		var errorCode sql.NullString
		var metadataBytes []byte
		var createdAt time.Time

		err = rows.Scan(
			&id,
			&serverID,
			&sunucuTakmaAd,
			&actionType,
			&targetPath,
			&targetName,
			&status,
			&errorCode,
			&metadataBytes,
			&createdAt,
		)

		if err != nil {
			fmt.Println("Aktivite log satır okuma hatası:", err)
			continue
		}

		metadata := map[string]interface{}{}

		if len(metadataBytes) > 0 {
			err = json.Unmarshal(metadataBytes, &metadata)
			if err != nil {
				fmt.Println("Aktivite log metadata parse hatası:", err)
				metadata = map[string]interface{}{
					"metadata_parse_error": true,
				}
			}
		}

		serverIDDegeri := 0
		if serverID.Valid {
			serverIDDegeri = int(serverID.Int64)
		}

		targetPathDegeri := ""
		if targetPath.Valid {
			targetPathDegeri = targetPath.String
		}

		targetNameDegeri := ""
		if targetName.Valid {
			targetNameDegeri = targetName.String
		}

		errorCodeDegeri := ""
		if errorCode.Valid {
			errorCodeDegeri = errorCode.String
		}

		loglar = append(loglar, AktiviteLogOgesi{
			ID:              id,
			ServerID:        serverIDDegeri,
			SunucuTakmaAd:   sunucuTakmaAd,
			ActionType:      actionType,
			TargetPath:      targetPathDegeri,
			TargetName:      targetNameDegeri,
			Status:          status,
			ErrorCode:       errorCodeDegeri,
			Metadata:        metadata,
			OlusturmaTarihi: createdAt.Format("2006-01-02 15:04"),
		})
	}

	if err = rows.Err(); err != nil {
		fmt.Println("Aktivite log rows hatası:", err)
		aktiviteLogListeCevabiYaz(w, http.StatusInternalServerError, AktiviteLogListeCevabi{
			Basarili: false,
			Mesaj:    "Aktivite logları getirilemedi",
			Kod:      "ACTIVITY_LOGS_LIST_FAILED",
			Loglar:   []AktiviteLogOgesi{},
		})
		return
	}

	aktiviteLogListeCevabiYaz(w, http.StatusOK, AktiviteLogListeCevabi{
		Basarili: true,
		Mesaj:    "Aktivite logları getirildi",
		Loglar:   loglar,
	})
}

func aktiviteSonKlasorLoglariniGetir(w http.ResponseWriter, r *http.Request) {
	corsAyarla(w, "POST, OPTIONS")

	if !postIstekKontrolu(w, r) {
		return
	}

	var bilgiler AktiviteSonKlasorBilgileri
	if !jsonOku(w, r, &bilgiler) {
		return
	}

	bilgiler.Token = strings.TrimSpace(bilgiler.Token)
	bilgiler.Yol = strings.TrimSpace(bilgiler.Yol)

	if bilgiler.Token == "" || bilgiler.ServerID <= 0 {
		aktiviteSonKlasorCevabiYaz(w, http.StatusBadRequest, AktiviteSonKlasorCevabi{
			Basarili:    false,
			Mesaj:       "Eksik veya geçersiz veri",
			Kod:         "INVALID_REQUEST",
			Aktiviteler: map[string]AktiviteSonOgesi{},
		})
		return
	}

	userID, err := tokenIleKullaniciDogrula(bilgiler.Token)
	if err != nil {
		aktiviteSonKlasorCevabiYaz(w, http.StatusUnauthorized, AktiviteSonKlasorCevabi{
			Basarili:    false,
			Mesaj:       "Yetkisiz giriş",
			Kod:         "UNAUTHORIZED",
			Aktiviteler: map[string]AktiviteSonOgesi{},
		})
		return
	}

	temizAdlar := []string{}
	gorulenAdlar := map[string]bool{}

	for _, ad := range bilgiler.DosyaAdlari {
		ad = strings.TrimSpace(ad)

		if ad == "" {
			continue
		}

		if !guvenliAdMi(ad) {
			continue
		}

		if gorulenAdlar[ad] {
			continue
		}

		gorulenAdlar[ad] = true
		temizAdlar = append(temizAdlar, ad)
	}

	if len(temizAdlar) == 0 {
		aktiviteSonKlasorCevabiYaz(w, http.StatusOK, AktiviteSonKlasorCevabi{
			Basarili:    true,
			Mesaj:       "Aktivite bulunamadı",
			Aktiviteler: map[string]AktiviteSonOgesi{},
		})
		return
	}

	if len(temizAdlar) > 300 {
		temizAdlar = temizAdlar[:300]
	}

	hedefYollar := []string{}
	for _, ad := range temizAdlar {
		hedefYollar = append(hedefYollar, aktiviteYoluOlustur(bilgiler.Yol, ad))
	}

	placeholderlar := []string{}
	argumanlar := []interface{}{userID, bilgiler.ServerID}

	for index, hedefYol := range hedefYollar {
		placeholderlar = append(placeholderlar, fmt.Sprintf("$%d", index+3))
		argumanlar = append(argumanlar, hedefYol)
	}

	sorgu := fmt.Sprintf(`
		SELECT DISTINCT ON (al.target_path)
			al.target_path,
			al.target_name,
			al.action_type,
			al.created_at
		FROM activity_logs al
		WHERE al.user_id = $1
			AND al.server_id = $2
			AND al.status = 'success'
			AND al.action_type IN (
				'upload',
				'create_file',
				'create_folder',
				'editor_save',
				'rename',
				'move',
				'share_create',
				'share_revoke'
			)
			AND al.target_path IN (%s)
		ORDER BY al.target_path, al.created_at DESC
	`, strings.Join(placeholderlar, ", "))

	rows, err := db.Query(sorgu, argumanlar...)
	if err != nil {
		fmt.Println("Klasör son aktivite listeleme hatası:", err)

		aktiviteSonKlasorCevabiYaz(w, http.StatusInternalServerError, AktiviteSonKlasorCevabi{
			Basarili:    false,
			Mesaj:       "Son aktiviteler getirilemedi",
			Kod:         "LATEST_ACTIVITY_LIST_FAILED",
			Aktiviteler: map[string]AktiviteSonOgesi{},
		})
		return
	}
	defer rows.Close()

	aktiviteler := map[string]AktiviteSonOgesi{}

	for rows.Next() {
		var targetPath string
		var targetName sql.NullString
		var actionType string
		var createdAt time.Time

		err = rows.Scan(
			&targetPath,
			&targetName,
			&actionType,
			&createdAt,
		)

		if err != nil {
			fmt.Println("Klasör son aktivite satır okuma hatası:", err)
			continue
		}

		dosyaAdi := ""
		if targetName.Valid {
			dosyaAdi = targetName.String
		}

		if dosyaAdi == "" {
			dosyaAdi = path.Base(targetPath)
		}

		if dosyaAdi == "." || dosyaAdi == "/" {
			continue
		}

		aktiviteler[dosyaAdi] = AktiviteSonOgesi{
			ActionType:      actionType,
			TargetPath:      targetPath,
			TargetName:      dosyaAdi,
			OlusturmaTarihi: createdAt.Format("2006-01-02 15:04"),
		}
	}

	if err = rows.Err(); err != nil {
		fmt.Println("Klasör son aktivite rows hatası:", err)

		aktiviteSonKlasorCevabiYaz(w, http.StatusInternalServerError, AktiviteSonKlasorCevabi{
			Basarili:    false,
			Mesaj:       "Son aktiviteler getirilemedi",
			Kod:         "LATEST_ACTIVITY_LIST_FAILED",
			Aktiviteler: map[string]AktiviteSonOgesi{},
		})
		return
	}

	aktiviteSonKlasorCevabiYaz(w, http.StatusOK, AktiviteSonKlasorCevabi{
		Basarili:    true,
		Mesaj:       "Son aktiviteler getirildi",
		Aktiviteler: aktiviteler,
	})
}

func paylasimBilgisiGetir(w http.ResponseWriter, r *http.Request) {
	corsAyarla(w, "GET, OPTIONS")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodGet {
		paylasimBilgisiCevabiYaz(w, http.StatusMethodNotAllowed, PaylasimBilgisiCevabi{
			Basarili: false,
			Mesaj:    "Sadece GET isteği kabul edilir",
			Kod:      "METHOD_NOT_ALLOWED",
		})
		return
	}

	paylasimTokeni := urlPaylasimTokeniAl(r, "/api/share/info/")

	if !paylasimTokeniGecerliFormattaMi(paylasimTokeni) {
		paylasimBilgisiCevabiYaz(w, http.StatusBadRequest, PaylasimBilgisiCevabi{
			Basarili: false,
			Mesaj:    "Geçersiz paylaşım linki",
			Kod:      "INVALID_SHARE_TOKEN",
		})
		return
	}

	tokenHash := paylasimTokenHashle(paylasimTokeni)

	var dosyaAdi string
	var paylasanKullanici string
	var sonGecerlilik sql.NullTime
	var iptalEdildi bool

	err := db.QueryRow(`
		SELECT
			sl.dosya_adi,
			k.pionter_kullanici,
			sl.son_gecerlilik_tarihi,
			sl.iptal_edildi
		FROM share_links sl
		INNER JOIN kullanicilar k ON k.id = sl.user_id
		WHERE sl.token_hash = $1
		LIMIT 1
	`, tokenHash).Scan(
		&dosyaAdi,
		&paylasanKullanici,
		&sonGecerlilik,
		&iptalEdildi,
	)

	if err != nil {
		paylasimBilgisiCevabiYaz(w, http.StatusNotFound, PaylasimBilgisiCevabi{
			Basarili: false,
			Mesaj:    "Paylaşım linki bulunamadı",
			Kod:      "SHARE_LINK_NOT_FOUND",
		})
		return
	}

	if iptalEdildi {
		paylasimBilgisiCevabiYaz(w, http.StatusGone, PaylasimBilgisiCevabi{
			Basarili: false,
			Mesaj:    "Bu paylaşım linki iptal edilmiş",
			Kod:      "SHARE_LINK_REVOKED",
		})
		return
	}

	if sonGecerlilik.Valid && time.Now().After(sonGecerlilik.Time) {
		paylasimBilgisiCevabiYaz(w, http.StatusGone, PaylasimBilgisiCevabi{
			Basarili: false,
			Mesaj:    "Bu paylaşım linkinin süresi dolmuş",
			Kod:      "SHARE_LINK_EXPIRED",
		})
		return
	}

	sonGecerlilikMetni := ""

	if sonGecerlilik.Valid {
		sonGecerlilikMetni = sonGecerlilik.Time.Format("2006-01-02 15:04")
	}

	paylasimBilgisiCevabiYaz(w, http.StatusOK, PaylasimBilgisiCevabi{
		Basarili:            true,
		Mesaj:               "Paylaşım bilgisi getirildi",
		DosyaAdi:            dosyaAdi,
		PaylasanKullanici:   paylasanKullanici,
		SonGecerlilikTarihi: sonGecerlilikMetni,
		Suresiz:             !sonGecerlilik.Valid,
	})
}

func paylasimPreviewGetir(w http.ResponseWriter, r *http.Request) {
	corsAyarla(w, "GET, OPTIONS")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodGet {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(DosyaPreviewCevabi{
			Basarili: false,
			Mesaj:    "Sadece GET isteği kabul edilir",
			Kod:      "METHOD_NOT_ALLOWED",
		})
		return
	}

	paylasimTokeni := urlPaylasimTokeniAl(r, "/api/share/preview/")

	if !paylasimTokeniGecerliFormattaMi(paylasimTokeni) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(DosyaPreviewCevabi{
			Basarili: false,
			Mesaj:    "Geçersiz paylaşım linki",
			Kod:      "INVALID_SHARE_TOKEN",
		})
		return
	}

	tokenHash := paylasimTokenHashle(paylasimTokeni)

	var kayit PaylasimLinkiKaydi

	err := db.QueryRow(`
		SELECT
			user_id,
			server_id,
			dosya_yolu,
			dosya_adi,
			son_gecerlilik_tarihi,
			iptal_edildi
		FROM share_links
		WHERE token_hash = $1
		LIMIT 1
	`, tokenHash).Scan(
		&kayit.UserID,
		&kayit.ServerID,
		&kayit.DosyaYolu,
		&kayit.DosyaAdi,
		&kayit.SonGecerlilikTarihi,
		&kayit.IptalEdildi,
	)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(DosyaPreviewCevabi{
			Basarili: false,
			Mesaj:    "Paylaşım linki bulunamadı",
			Kod:      "SHARE_LINK_NOT_FOUND",
		})
		return
	}

	if kayit.IptalEdildi {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusGone)
		json.NewEncoder(w).Encode(DosyaPreviewCevabi{
			Basarili: false,
			Mesaj:    "Bu paylaşım linki iptal edilmiş",
			Kod:      "SHARE_LINK_REVOKED",
		})
		return
	}

	if kayit.SonGecerlilikTarihi.Valid && time.Now().After(kayit.SonGecerlilikTarihi.Time) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusGone)
		json.NewEncoder(w).Encode(DosyaPreviewCevabi{
			Basarili: false,
			Mesaj:    "Bu paylaşım linkinin süresi dolmuş",
			Kod:      "SHARE_LINK_EXPIRED",
		})
		return
	}

	uzanti := dosyaUzantisiAl(kayit.DosyaAdi)
	tip := previewTipiBelirle(uzanti)

	cevap := DosyaPreviewCevabi{
		Basarili: true,
		Mesaj:    "Paylaşım önizlemesi hazır",
		Tip:      tip,
		DosyaAdi: kayit.DosyaAdi,
		Uzanti:   uzanti,
		Mime:     imageMimeBelirle(uzanti),
	}

	if tip != "text" && tip != "image" {
		cevap.Basarili = false
		cevap.Kod = "UNSUPPORTED_FILE_TYPE"
		cevap.Mesaj = "Bu dosya türü için paylaşım önizlemesi yok"

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(cevap)
		return
	}

	kimlik, err := sunucuKimlikSorgulaUserIDIle(kayit.UserID, kayit.ServerID)
	if err != nil {
		fmt.Println("Paylaşım preview credential hatası:", err)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(DosyaPreviewCevabi{
			Basarili: false,
			Mesaj:    "Paylaşılan dosyanın bağlı olduğu sunucu bulunamadı",
			Kod:      "SERVER_NOT_FOUND",
		})
		return
	}

	gercekDosyaYolu, err := guvenliYolOlustur(kimlik.IzoleKlasor, kayit.DosyaYolu)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(DosyaPreviewCevabi{
			Basarili: false,
			Mesaj:    "Paylaşılan dosya yolu geçersiz",
			Kod:      "INVALID_PATH",
		})
		return
	}

	authMethods, err := sshAuthMethodOlustur(kimlik)
	if err != nil {
		fmt.Println("Paylaşım preview SSH auth hatası:", err)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadGateway)
		json.NewEncoder(w).Encode(DosyaPreviewCevabi{
			Basarili: false,
			Mesaj:    "SSH kimlik doğrulama hazırlanamadı",
			Kod:      "SSH_AUTH_FAILED",
		})
		return
	}

	config := &ssh.ClientConfig{
		User:            kimlik.SunucuKullanici,
		Auth:            authMethods,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         8 * time.Second,
	}

	client, err := ssh.Dial("tcp", kimlik.IP+":"+kimlik.Port, config)
	if err != nil {
		fmt.Println("Paylaşım preview SSH bağlantı hatası:", err)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadGateway)
		json.NewEncoder(w).Encode(DosyaPreviewCevabi{
			Basarili: false,
			Mesaj:    "SSH bağlantısı kurulamadı",
			Kod:      "SSH_CONNECTION_FAILED",
		})
		return
	}
	defer client.Close()

	sftpClient, err := sftp.NewClient(client)
	if err != nil {
		fmt.Println("Paylaşım preview SFTP hatası:", err)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadGateway)
		json.NewEncoder(w).Encode(DosyaPreviewCevabi{
			Basarili: false,
			Mesaj:    "SFTP bağlantısı kurulamadı",
			Kod:      "SFTP_CONNECTION_FAILED",
		})
		return
	}
	defer sftpClient.Close()

	dosyaBilgisi, err := sftpClient.Stat(gercekDosyaYolu)
	if err != nil {
		fmt.Println("Paylaşım preview stat hatası:", err)

		if izinHatasiMi(err) {
			cevap.Basarili = false
			cevap.Kod = "PERMISSION_DENIED"
			cevap.Mesaj = izinHatasiMesaji()
		} else {
			cevap.Basarili = false
			cevap.Kod = "FILE_NOT_FOUND"
			cevap.Mesaj = "Paylaşılan dosya bulunamadı"
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(cevap)
		return
	}

	if dosyaBilgisi.IsDir() {
		cevap.Basarili = false
		cevap.Kod = "FOLDER_PREVIEW_NOT_SUPPORTED"
		cevap.Mesaj = "Klasör önizlemesi desteklenmiyor"

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(cevap)
		return
	}

	if tip == "text" {
		icerik, boyut, err := textDosyaPreviewOku(sftpClient, gercekDosyaYolu, textPreviewLimit)
		if err != nil {
			fmt.Println("Paylaşım text preview hatası:", err)

			cevap.Basarili = false
			cevap.Icerik = ""
			cevap.Boyut = boyut

			if boyut > textPreviewLimit {
				cevap.Kod = "FILE_TOO_LARGE"
				cevap.Mesaj = "Dosya önizleme için çok büyük"
			} else if izinHatasiMi(err) {
				cevap.Kod = "PERMISSION_DENIED"
				cevap.Mesaj = izinHatasiMesaji()
			} else {
				cevap.Kod = "PREVIEW_FAILED"
				cevap.Mesaj = "Dosya önizlemesi alınamadı"
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(cevap)
			return
		}

		cevap.Mesaj = "Dosya önizlemesi alındı"
		cevap.Icerik = icerik
		cevap.Boyut = boyut
	}

	if tip == "image" {
		base64Icerik, boyut, err := imageDosyaPreviewOku(sftpClient, gercekDosyaYolu, imagePreviewLimit)
		if err != nil {
			fmt.Println("Paylaşım image preview hatası:", err)

			cevap.Basarili = false
			cevap.Base64 = ""
			cevap.Boyut = boyut

			if boyut > imagePreviewLimit {
				cevap.Kod = "FILE_TOO_LARGE"
				cevap.Mesaj = "Görsel önizleme için çok büyük"
			} else if izinHatasiMi(err) {
				cevap.Kod = "PERMISSION_DENIED"
				cevap.Mesaj = izinHatasiMesaji()
			} else {
				cevap.Kod = "PREVIEW_FAILED"
				cevap.Mesaj = "Görsel önizlemesi alınamadı"
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(cevap)
			return
		}

		cevap.Mesaj = "Görsel önizlemesi alındı"
		cevap.Base64 = base64Icerik
		cevap.Boyut = boyut
		cevap.Mime = imageMimeBelirle(uzanti)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(cevap)
}

func paylasimDosyasiIndir(w http.ResponseWriter, r *http.Request) {
	corsAyarla(w, "GET, OPTIONS")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodGet {
		publicPaylasimHatasiYaz(w, http.StatusMethodNotAllowed, "Sadece GET isteği kabul edilir")
		return
	}

	paylasimTokeni := urlPaylasimTokeniAl(r, "/api/share/download/")

	if !paylasimTokeniGecerliFormattaMi(paylasimTokeni) {
		publicPaylasimHatasiYaz(w, http.StatusBadRequest, "Geçersiz paylaşım linki")
		return
	}

	tokenHash := paylasimTokenHashle(paylasimTokeni)

	var kayit PaylasimLinkiKaydi

	err := db.QueryRow(`
		SELECT
			user_id,
			server_id,
			dosya_yolu,
			dosya_adi,
			son_gecerlilik_tarihi,
			iptal_edildi
		FROM share_links
		WHERE token_hash = $1
		LIMIT 1
	`, tokenHash).Scan(
		&kayit.UserID,
		&kayit.ServerID,
		&kayit.DosyaYolu,
		&kayit.DosyaAdi,
		&kayit.SonGecerlilikTarihi,
		&kayit.IptalEdildi,
	)

	if err != nil {
		publicPaylasimHatasiYaz(w, http.StatusNotFound, "Paylaşım linki bulunamadı")
		return
	}

	if kayit.IptalEdildi {
		publicPaylasimHatasiYaz(w, http.StatusGone, "Bu paylaşım linki iptal edilmiş")
		return
	}

	if kayit.SonGecerlilikTarihi.Valid && time.Now().After(kayit.SonGecerlilikTarihi.Time) {
		publicPaylasimHatasiYaz(w, http.StatusGone, "Bu paylaşım linkinin süresi dolmuş")
		return
	}

	if kayit.DosyaYolu == "" || kayit.DosyaAdi == "" {
		publicPaylasimHatasiYaz(w, http.StatusInternalServerError, "Paylaşım kaydı geçersiz")
		return
	}

	kimlik, err := sunucuKimlikSorgulaUserIDIle(kayit.UserID, kayit.ServerID)
	if err != nil {
		fmt.Println("Paylaşım server credential hatası:", err)
		publicPaylasimHatasiYaz(w, http.StatusNotFound, "Paylaşılan dosyanın bağlı olduğu sunucu bulunamadı")
		return
	}

	gercekDosyaYolu, err := guvenliYolOlustur(kimlik.IzoleKlasor, kayit.DosyaYolu)
	if err != nil {
		publicPaylasimHatasiYaz(w, http.StatusBadRequest, "Paylaşılan dosya yolu geçersiz")
		return
	}

	authMethods, err := sshAuthMethodOlustur(kimlik)
	if err != nil {
		fmt.Println("Paylaşım download SSH auth hatası:", err)
		publicPaylasimHatasiYaz(w, http.StatusBadGateway, "SSH kimlik doğrulama hazırlanamadı")
		return
	}

	config := &ssh.ClientConfig{
		User:            kimlik.SunucuKullanici,
		Auth:            authMethods,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         8 * time.Second,
	}

	client, err := ssh.Dial("tcp", kimlik.IP+":"+kimlik.Port, config)
	if err != nil {
		fmt.Println("Paylaşım download SSH bağlantı hatası:", err)
		publicPaylasimHatasiYaz(w, http.StatusBadGateway, "SSH bağlantısı kurulamadı")
		return
	}
	defer client.Close()

	sftpClient, err := sftp.NewClient(client)
	if err != nil {
		fmt.Println("Paylaşım download SFTP hatası:", err)
		publicPaylasimHatasiYaz(w, http.StatusBadGateway, "SFTP bağlantısı kurulamadı")
		return
	}
	defer sftpClient.Close()

	dosyaBilgisi, err := sftpClient.Stat(gercekDosyaYolu)
	if err != nil {
		fmt.Println("Paylaşım dosya stat hatası:", err)

		if izinHatasiMi(err) {
			publicPaylasimHatasiYaz(w, http.StatusForbidden, izinHatasiMesaji())
			return
		}

		publicPaylasimHatasiYaz(w, http.StatusNotFound, "Paylaşılan dosya bulunamadı")
		return
	}

	if dosyaBilgisi.IsDir() {
		publicPaylasimHatasiYaz(w, http.StatusBadRequest, "Klasör paylaşımı desteklenmiyor")
		return
	}

	acilanDosya, err := sftpClient.Open(gercekDosyaYolu)
	if err != nil {
		fmt.Println("Paylaşım dosya açma hatası:", err)

		if izinHatasiMi(err) {
			publicPaylasimHatasiYaz(w, http.StatusForbidden, izinHatasiMesaji())
			return
		}

		publicPaylasimHatasiYaz(w, http.StatusInternalServerError, "Paylaşılan dosya açılamadı")
		return
	}
	defer acilanDosya.Close()

	temizDosyaAdi := strings.ReplaceAll(kayit.DosyaAdi, `"`, "")
	if temizDosyaAdi == "" {
		temizDosyaAdi = "download"
	}

	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("Content-Length", strconv.FormatInt(dosyaBilgisi.Size(), 10))
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, temizDosyaAdi))

	_, err = io.Copy(w, acilanDosya)
	if err != nil {
		fmt.Println("Paylaşım download stream hatası:", err)
	}
}

func dosyaYukle(w http.ResponseWriter, r *http.Request) {
	corsAyarla(w, "POST, OPTIONS")

	if !postIstekKontrolu(w, r) {
		return
	}
	r.ParseMultipartForm(10 << 20)

	token := strings.TrimSpace(r.FormValue("token"))
	yol := strings.TrimSpace(r.FormValue("yol"))
	serverIDStr := strings.TrimSpace(r.FormValue("server_id"))

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
	userID, err := tokenIleKullaniciDogrula(token)
	if err != nil {
		http.Error(w, "Yetkisiz giriş", http.StatusUnauthorized)
		return
	}

	kimlik, err := sunucuKimlikSorgulaTokenIle(token, serverID)
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
		fmt.Println("Upload SSH bağlantı hatası:", err)
		apiHatasiYaz(w, http.StatusBadGateway, "SSH_CONNECTION_FAILED", "SSH bağlantısı kurulamadı")
		return
	}
	defer client.Close()

	sftpClient, err := sftp.NewClient(client)
	if err != nil {
		fmt.Println("Upload SFTP hatası:", err)
		apiHatasiYaz(w, http.StatusBadGateway, "SFTP_CONNECTION_FAILED", "SFTP bağlantısı kurulamadı")
		return
	}
	defer sftpClient.Close()

	err = sftpClient.MkdirAll(gercekYol)
	if err != nil {
		fmt.Println("Upload klasör hazırlama hatası:", err)

		if izinHatasiMi(err) {
			apiHatasiYaz(w, http.StatusForbidden, "PERMISSION_DENIED", izinHatasiMesaji())
			return
		}

		apiHatasiYaz(w, http.StatusInternalServerError, "FOLDER_PREPARE_FAILED", "Klasör hazırlanamadı")
		return
	}

	hedefDosya, err := sftpClient.Create(tamYol)
	if err != nil {
		fmt.Println("Upload dosya oluşturma hatası:", err)

		if izinHatasiMi(err) {
			apiHatasiYaz(w, http.StatusForbidden, "PERMISSION_DENIED", izinHatasiMesaji())
			return
		}

		apiHatasiYaz(w, http.StatusInternalServerError, "UPLOAD_CREATE_FAILED", "Dosya oluşturulamadı")
		return
	}
	defer hedefDosya.Close()

	_, err = io.Copy(hedefDosya, gelenDosya)
	if err != nil {
		fmt.Println("Upload dosya yazma hatası:", err)

		if izinHatasiMi(err) {
			apiHatasiYaz(w, http.StatusForbidden, "PERMISSION_DENIED", izinHatasiMesaji())
			return
		}

		apiHatasiYaz(w, http.StatusInternalServerError, "UPLOAD_WRITE_FAILED", "Dosya yazılamadı")
		return
	}

	aktiviteLogla(
		userID,
		serverID,
		aktiviteUpload,
		aktiviteYoluOlustur(yol, baslik.Filename),
		baslik.Filename,
		aktiviteDurumBasarili,
		"",
		map[string]interface{}{
			"parent_path": yol,
			"size":        baslik.Size,
		},
	)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"basarili": true,
		"mesaj":    "Dosya yüklendi",
	})
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
	userID, err := tokenIleKullaniciDogrula(bilgiler.Token)
	if err != nil {
		http.Error(w, "Yetkisiz giriş veya sunucu bulunamadı", http.StatusUnauthorized)
		return
	}

	kimlik, err := sunucuKimlikSorgulaTokenIle(bilgiler.Token, bilgiler.ServerID)
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
		fmt.Println("Klasör oluşturma hatası:", err)

		if izinHatasiMi(err) {
			apiHatasiYaz(w, http.StatusForbidden, "PERMISSION_DENIED", izinHatasiMesaji())
			return
		}

		apiHatasiYaz(w, http.StatusInternalServerError, "FOLDER_CREATE_FAILED", "Klasör oluşturulamadı")
		return
	}

	aktiviteLogla(
		userID,
		bilgiler.ServerID,
		aktiviteCreateFolder,
		aktiviteYoluOlustur(bilgiler.Yol, bilgiler.KlasorAdi),
		bilgiler.KlasorAdi,
		aktiviteDurumBasarili,
		"",
		map[string]interface{}{
			"parent_path": bilgiler.Yol,
		},
	)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"mesaj": "Klasör oluşturuldu"}`))
}

func dosyaOlustur(w http.ResponseWriter, r *http.Request) {
	corsAyarla(w, "POST, OPTIONS")

	if !postIstekKontrolu(w, r) {
		return
	}

	var bilgiler DosyaOlusturBilgileri
	if !jsonOku(w, r, &bilgiler) {
		return
	}

	bilgiler.Token = strings.TrimSpace(bilgiler.Token)
	bilgiler.Yol = strings.TrimSpace(bilgiler.Yol)
	bilgiler.DosyaAdi = strings.TrimSpace(bilgiler.DosyaAdi)

	if bilgiler.Token == "" || bilgiler.ServerID <= 0 || bilgiler.DosyaAdi == "" {
		apiHatasiYaz(w, http.StatusBadRequest, "INVALID_REQUEST", "Eksik veya geçersiz veri")
		return
	}

	if !guvenliAdMi(bilgiler.DosyaAdi) {
		apiHatasiYaz(w, http.StatusBadRequest, "INVALID_FILE_NAME", "Geçersiz dosya adı")
		return
	}

	userID, err := tokenIleKullaniciDogrula(bilgiler.Token)
	if err != nil {
		apiHatasiYaz(w, http.StatusUnauthorized, "UNAUTHORIZED", "Yetkisiz giriş veya sunucu bulunamadı")
		return
	}

	kimlik, err := sunucuKimlikSorgulaTokenIle(bilgiler.Token, bilgiler.ServerID)
	if err != nil {
		apiHatasiYaz(w, http.StatusUnauthorized, "UNAUTHORIZED", "Yetkisiz giriş veya sunucu bulunamadı")
		return
	}

	gercekYol, err := guvenliYolOlustur(kimlik.IzoleKlasor, bilgiler.Yol)
	if err != nil {
		apiHatasiYaz(w, http.StatusBadRequest, "INVALID_PATH", "Geçersiz yol")
		return
	}

	yeniDosyaYolu := path.Join(gercekYol, bilgiler.DosyaAdi)

	authMethods, err := sshAuthMethodOlustur(kimlik)
	if err != nil {
		fmt.Println("Dosya oluşturma SSH auth hatası:", err)
		apiHatasiYaz(w, http.StatusBadGateway, "SSH_AUTH_FAILED", "SSH kimlik doğrulama hazırlanamadı")
		return
	}

	config := &ssh.ClientConfig{
		User:            kimlik.SunucuKullanici,
		Auth:            authMethods,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}

	client, err := ssh.Dial("tcp", kimlik.IP+":"+kimlik.Port, config)
	if err != nil {
		fmt.Println("Dosya oluşturma SSH bağlantı hatası:", err)
		apiHatasiYaz(w, http.StatusBadGateway, "SSH_CONNECTION_FAILED", "SSH bağlantısı kurulamadı")
		return
	}
	defer client.Close()

	sftpClient, err := sftp.NewClient(client)
	if err != nil {
		fmt.Println("Dosya oluşturma SFTP hatası:", err)
		apiHatasiYaz(w, http.StatusBadGateway, "SFTP_CONNECTION_FAILED", "SFTP bağlantısı kurulamadı")
		return
	}
	defer sftpClient.Close()

	_, err = sftpClient.Stat(yeniDosyaYolu)
	if err == nil {
		apiHatasiYaz(w, http.StatusConflict, "FILE_ALREADY_EXISTS", "Bu isimde zaten bir dosya veya klasör var")
		return
	}

	if err != nil && izinHatasiMi(err) {
		apiHatasiYaz(w, http.StatusForbidden, "PERMISSION_DENIED", izinHatasiMesaji())
		return
	}

	yeniDosya, err := sftpClient.OpenFile(yeniDosyaYolu, os.O_WRONLY|os.O_CREATE|os.O_EXCL)
	if err != nil {
		fmt.Println("Dosya oluşturma hatası:", err)

		if izinHatasiMi(err) {
			apiHatasiYaz(w, http.StatusForbidden, "PERMISSION_DENIED", izinHatasiMesaji())
			return
		}

		apiHatasiYaz(w, http.StatusInternalServerError, "FILE_CREATE_FAILED", "Dosya oluşturulamadı")
		return
	}
	defer yeniDosya.Close()

	aktiviteLogla(
		userID,
		bilgiler.ServerID,
		aktiviteCreateFile,
		aktiviteYoluOlustur(bilgiler.Yol, bilgiler.DosyaAdi),
		bilgiler.DosyaAdi,
		aktiviteDurumBasarili,
		"",
		map[string]interface{}{
			"parent_path": bilgiler.Yol,
		},
	)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"basarili":  true,
		"mesaj":     "Dosya oluşturuldu",
		"dosya_adi": bilgiler.DosyaAdi,
	})
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

	userID, err := tokenIleKullaniciDogrula(bilgiler.Token)
	if err != nil {
		http.Error(w, "Yetkisiz giriş veya sunucu bulunamadı", http.StatusUnauthorized)
		return
	}

	kimlik, err := sunucuKimlikSorgulaTokenIle(bilgiler.Token, bilgiler.ServerID)
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

	err = sftpYolRecursiveSil(sftpClient, silinecekYol)

	if err != nil {
		fmt.Println("Silme Hatası:", err)

		if izinHatasiMi(err) {
			apiHatasiYaz(w, http.StatusForbidden, "PERMISSION_DENIED", izinHatasiMesaji())
			return
		}

		apiHatasiYaz(w, http.StatusInternalServerError, "DELETE_FAILED", "Dosya veya klasör silinemedi")
		return
	}

	aktiviteLogla(
		userID,
		bilgiler.ServerID,
		aktiviteDelete,
		aktiviteYoluOlustur(bilgiler.Yol, bilgiler.DosyaAdi),
		bilgiler.DosyaAdi,
		aktiviteDurumBasarili,
		"",
		map[string]interface{}{
			"parent_path": bilgiler.Yol,
			"is_folder":   bilgiler.KlasorMu,
		},
	)

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

	userID, err := tokenIleKullaniciDogrula(bilgiler.Token)
	if err != nil {
		http.Error(w, "Yetkisiz giriş veya sunucu bulunamadı", http.StatusUnauthorized)
		return
	}

	kimlik, err := sunucuKimlikSorgulaTokenIle(bilgiler.Token, bilgiler.ServerID)
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

		if izinHatasiMi(err) {
			apiHatasiYaz(w, http.StatusForbidden, "PERMISSION_DENIED", izinHatasiMesaji())
			return
		}

		apiHatasiYaz(w, http.StatusInternalServerError, "RENAME_FAILED", "Yeniden adlandırma başarısız")
		return
	}

	aktiviteLogla(
		userID,
		bilgiler.ServerID,
		aktiviteRename,
		aktiviteYoluOlustur(bilgiler.Yol, bilgiler.YeniAd),
		bilgiler.YeniAd,
		aktiviteDurumBasarili,
		"",
		map[string]interface{}{
			"parent_path": bilgiler.Yol,
			"old_name":    bilgiler.EskiAd,
			"new_name":    bilgiler.YeniAd,
			"old_path":    aktiviteYoluOlustur(bilgiler.Yol, bilgiler.EskiAd),
			"new_path":    aktiviteYoluOlustur(bilgiler.Yol, bilgiler.YeniAd),
		},
	)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"basarili": true,
		"mesaj":    "Yeniden adlandırma başarılı",
	})
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

	userID, err := tokenIleKullaniciDogrula(bilgiler.Token)
	if err != nil {
		http.Error(w, "Yetkisiz giriş veya sunucu bulunamadı", http.StatusUnauthorized)
		return
	}

	kimlik, err := sunucuKimlikSorgulaTokenIle(bilgiler.Token, bilgiler.ServerID)
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

		if izinHatasiMi(err) {
			apiHatasiYaz(w, http.StatusForbidden, "PERMISSION_DENIED", izinHatasiMesaji())
			return
		}

		apiHatasiYaz(w, http.StatusInternalServerError, "MOVE_FAILED", "Taşıma başarısız")
		return
	}

	aktiviteLogla(
		userID,
		bilgiler.ServerID,
		aktiviteMove,
		aktiviteYoluOlustur(bilgiler.HedefYol, bilgiler.DosyaAdi),
		bilgiler.DosyaAdi,
		aktiviteDurumBasarili,
		"",
		map[string]interface{}{
			"source_folder": bilgiler.KaynakYol,
			"target_folder": bilgiler.HedefYol,
			"source_path":   aktiviteYoluOlustur(bilgiler.KaynakYol, bilgiler.DosyaAdi),
			"target_path":   aktiviteYoluOlustur(bilgiler.HedefYol, bilgiler.DosyaAdi),
		},
	)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"basarili": true,
		"mesaj":    "Taşıma başarılı",
	})
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
func kullaniciGirisYap(w http.ResponseWriter, r *http.Request) {
	corsAyarla(w, "POST, OPTIONS")

	if !postIstekKontrolu(w, r) {
		return
	}

	var veri GirisBilgileri
	if !jsonOku(w, r, &veri) {
		return
	}

	veri.PionterKullanici = strings.TrimSpace(veri.PionterKullanici)

	if veri.PionterKullanici == "" || veri.PionterSifre == "" {
		http.Error(w, "Kullanıcı adı/e-posta ve şifre zorunlu", http.StatusBadRequest)
		return
	}

	userID, err := kullaniciDogrula(veri.PionterKullanici, veri.PionterSifre)
	if err != nil {
		http.Error(w, "Kullanıcı bulunamadı veya şifre yanlış", http.StatusUnauthorized)
		return
	}

	gecmisOturumlariTemizle()

	token, err := oturumOlustur(userID)
	if err != nil {
		fmt.Println("Oturum oluşturma hatası:", err)
		http.Error(w, "Oturum oluşturulamadı", http.StatusInternalServerError)
		return
	}

	aktiviteLogla(
		userID,
		0,
		aktiviteLogin,
		"",
		"",
		aktiviteDurumBasarili,
		"",
		map[string]interface{}{},
	)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(GirisCevabi{
		Token: token,
		Mesaj: "Giriş başarılı",
	})
}
func kullaniciCikisYap(w http.ResponseWriter, r *http.Request) {
	corsAyarla(w, "POST, OPTIONS")

	if !postIstekKontrolu(w, r) {
		return
	}

	var veri TokenIstekBilgileri
	if !jsonOku(w, r, &veri) {
		return
	}

	veri.Token = strings.TrimSpace(veri.Token)

	if veri.Token == "" {
		http.Error(w, "Token zorunlu", http.StatusBadRequest)
		return
	}

	userID, err := tokenIleKullaniciDogrula(veri.Token)
	if err != nil {
		http.Error(w, "Oturum geçersiz", http.StatusUnauthorized)
		return
	}

	_, err = db.Exec(`
		DELETE FROM oturumlar
		WHERE token = $1
	`, veri.Token)

	if err != nil {
		fmt.Println("Oturum silme hatası:", err)
		http.Error(w, "Çıkış yapılamadı", http.StatusInternalServerError)
		return
	}

	aktiviteLogla(
		userID,
		0,
		aktiviteLogout,
		"",
		"",
		aktiviteDurumBasarili,
		"",
		map[string]interface{}{},
	)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"mesaj": "Çıkış başarılı"}`))
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

	if strings.TrimSpace(veri.Token) == "" ||
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

	userID, err := tokenIleKullaniciDogrula(veri.Token)
	if err != nil {
		http.Error(w, "Oturum geçersiz", http.StatusUnauthorized)
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

	sifreliSunucuSifre, err := gizliVeriSifrele(veri.SunucuSifre)
	if err != nil {
		fmt.Println("Sunucu şifresi şifrelenemedi:", err)
		http.Error(w, "Sunucu bilgileri güvenli şekilde kaydedilemedi", http.StatusInternalServerError)
		return
	}

	sifreliSSHPrivateKey, err := gizliVeriSifrele(veri.SSHPrivateKey)
	if err != nil {
		fmt.Println("SSH private key şifrelenemedi:", err)
		http.Error(w, "Sunucu bilgileri güvenli şekilde kaydedilemedi", http.StatusInternalServerError)
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
		sifreliSunucuSifre,
		sifreliSSHPrivateKey,
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

	if strings.TrimSpace(veri.Token) == "" || veri.ServerID <= 0 {
		http.Error(w, "Eksik veya geçersiz veri", http.StatusBadRequest)
		return
	}

	userID, err := tokenIleKullaniciDogrula(veri.Token)
	if err != nil {
		http.Error(w, "Oturum geçersiz", http.StatusUnauthorized)
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

	if strings.TrimSpace(veri.Token) == "" ||
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

	userID, err := tokenIleKullaniciDogrula(veri.Token)
	if err != nil {
		http.Error(w, "Oturum geçersiz", http.StatusUnauthorized)
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

	mevcutSunucuSifre, err = gizliVeriCoz(mevcutSunucuSifre)
	if err != nil {
		fmt.Println("Mevcut sunucu şifresi çözülemedi:", err)
		http.Error(w, "Sunucu bilgileri okunamadı", http.StatusInternalServerError)
		return
	}

	mevcutSSHPrivateKey, err = gizliVeriCoz(mevcutSSHPrivateKey)
	if err != nil {
		fmt.Println("Mevcut SSH private key çözülemedi:", err)
		http.Error(w, "Sunucu bilgileri okunamadı", http.StatusInternalServerError)
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
		fmt.Println("Sunucu güncelleme öncesi bağlantı testi hatası:", err)
		http.Error(w, "Sunucu bağlantı testi başarısız", http.StatusBadGateway)
		return
	}

	sifreliSunucuSifre, err := gizliVeriSifrele(veri.SunucuSifre)
	if err != nil {
		fmt.Println("Sunucu şifresi şifrelenemedi:", err)
		http.Error(w, "Sunucu bilgileri güvenli şekilde güncellenemedi", http.StatusInternalServerError)
		return
	}

	sifreliSSHPrivateKey, err := gizliVeriSifrele(veri.SSHPrivateKey)
	if err != nil {
		fmt.Println("SSH private key şifrelenemedi:", err)
		http.Error(w, "Sunucu bilgileri güvenli şekilde güncellenemedi", http.StatusInternalServerError)
		return
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
		sifreliSunucuSifre,
		sifreliSSHPrivateKey,
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

	if strings.TrimSpace(veri.Token) == "" || veri.ServerID <= 0 {
		http.Error(w, "Eksik veya geçersiz veri", http.StatusBadRequest)
		return
	}

	userID, err := tokenIleKullaniciDogrula(veri.Token)
	if err != nil {
		http.Error(w, "Oturum geçersiz", http.StatusUnauthorized)
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

	var veri TokenIstekBilgileri
	if !jsonOku(w, r, &veri) {
		return
	}

	userID, err := tokenIleKullaniciDogrula(veri.Token)
	if err != nil {
		http.Error(w, "Oturum geçersiz", http.StatusUnauthorized)
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

func dosyaUzantisiAl(dosyaAdi string) string {
	temizAd := strings.ToLower(strings.TrimSpace(dosyaAdi))

	if temizAd == ".env" {
		return ".env"
	}

	if strings.HasSuffix(temizAd, ".env.example") {
		return ".env.example"
	}

	if temizAd == "dockerfile" {
		return ".dockerfile"
	}

	if temizAd == "makefile" {
		return ".makefile"
	}

	if temizAd == "cmakelists.txt" {
		return ".cmakelists"
	}

	return path.Ext(temizAd)
}

func textPreviewDestekleniyorMu(uzanti string) bool {
	desteklenenler := map[string]bool{
		".txt":         true,
		".md":          true,
		".json":        true,
		".js":          true,
		".jsx":         true,
		".ts":          true,
		".tsx":         true,
		".go":          true,
		".c":           true,
		".cpp":         true,
		".cc":          true,
		".cxx":         true,
		".h":           true,
		".hpp":         true,
		".cs":          true,
		".css":         true,
		".html":        true,
		".env":         true,
		".env.example": true,
		".yml":         true,
		".yaml":        true,
		".xml":         true,
		".log":         true,
		".py":          true,
		".rs":          true,
		".zig":         true,
		".rb":          true,
		".java":        true,
		".kt":          true,
		".kts":         true,
		".php":         true,
		".swift":       true,
		".dart":        true,
		".lua":         true,
		".r":           true,
		".scala":       true,
		".sh":          true,
		".bash":        true,
		".zsh":         true,
		".sql":         true,
		".toml":        true,
		".ini":         true,
		".conf":        true,
		".dockerfile":  true,
		".makefile":    true,
		".cmakelists":  true,
	}

	return desteklenenler[uzanti]
}

func imagePreviewDestekleniyorMu(uzanti string) bool {
	desteklenenler := map[string]bool{
		".png":  true,
		".jpg":  true,
		".jpeg": true,
		".gif":  true,
		".webp": true,
	}

	return desteklenenler[uzanti]
}

func officeDosyasiMi(uzanti string) bool {
	desteklenenler := map[string]bool{
		".doc":  true,
		".docx": true,
		".xls":  true,
		".xlsx": true,
		".ppt":  true,
		".pptx": true,
	}

	return desteklenenler[uzanti]
}

func arsivDosyasiMi(uzanti string) bool {
	desteklenenler := map[string]bool{
		".zip": true,
		".rar": true,
		".7z":  true,
		".tar": true,
		".gz":  true,
	}

	return desteklenenler[uzanti]
}

func imageMimeBelirle(uzanti string) string {
	switch uzanti {
	case ".png":
		return "image/png"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".gif":
		return "image/gif"
	case ".webp":
		return "image/webp"
	default:
		return ""
	}
}

func previewTipiBelirle(uzanti string) string {
	if imagePreviewDestekleniyorMu(uzanti) {
		return "image"
	}

	if textPreviewDestekleniyorMu(uzanti) {
		return "text"
	}

	if uzanti == ".pdf" {
		return "pdf"
	}

	if officeDosyasiMi(uzanti) {
		return "office"
	}

	if arsivDosyasiMi(uzanti) {
		return "archive"
	}

	return "unsupported"
}

func sftpYolRecursiveSil(sftpClient *sftp.Client, hedefYol string) error {
	bilgi, err := sftpClient.Lstat(hedefYol)
	if err != nil {
		return err
	}

	if bilgi.IsDir() && bilgi.Mode()&os.ModeSymlink == 0 {
		ogeler, err := sftpClient.ReadDir(hedefYol)
		if err != nil {
			return err
		}

		for _, oge := range ogeler {
			ogeYol := path.Join(hedefYol, oge.Name())

			err = sftpYolRecursiveSil(sftpClient, ogeYol)
			if err != nil {
				return err
			}
		}

		return sftpClient.RemoveDirectory(hedefYol)
	}

	return sftpClient.Remove(hedefYol)
}

func textDosyaKaydet(sftpClient *sftp.Client, dosyaYolu string, icerik string, limit int64) (int64, error) {
	icerikBytes := []byte(icerik)

	if int64(len(icerikBytes)) > limit {
		return int64(len(icerikBytes)), fmt.Errorf("dosya kaydetmek için çok büyük")
	}

	dosyaBilgisi, err := sftpClient.Stat(dosyaYolu)
	if err != nil {
		return 0, err
	}

	if dosyaBilgisi.IsDir() {
		return 0, fmt.Errorf("klasör düzenlenemez")
	}

	acilanDosya, err := sftpClient.OpenFile(dosyaYolu, os.O_WRONLY|os.O_TRUNC)
	if err != nil {
		return 0, err
	}
	defer acilanDosya.Close()

	yazilan, err := acilanDosya.Write(icerikBytes)
	if err != nil {
		return int64(yazilan), err
	}

	if yazilan != len(icerikBytes) {
		return int64(yazilan), io.ErrShortWrite
	}

	return int64(yazilan), nil
}

func textDosyaPreviewOku(sftpClient *sftp.Client, dosyaYolu string, limit int64) (string, int64, error) {
	dosyaBilgisi, err := sftpClient.Stat(dosyaYolu)
	if err != nil {
		return "", 0, err
	}

	if dosyaBilgisi.IsDir() {
		return "", 0, fmt.Errorf("klasör önizlenemez")
	}

	boyut := dosyaBilgisi.Size()

	if boyut > limit {
		return "", boyut, fmt.Errorf("dosya önizleme için çok büyük")
	}

	acilanDosya, err := sftpClient.Open(dosyaYolu)
	if err != nil {
		return "", boyut, err
	}
	defer acilanDosya.Close()

	icerikBytes, err := io.ReadAll(io.LimitReader(acilanDosya, limit+1))
	if err != nil {
		return "", boyut, err
	}

	if int64(len(icerikBytes)) > limit {
		return "", boyut, fmt.Errorf("dosya önizleme için çok büyük")
	}

	return string(icerikBytes), boyut, nil
}

func imageDosyaPreviewOku(sftpClient *sftp.Client, dosyaYolu string, limit int64) (string, int64, error) {
	dosyaBilgisi, err := sftpClient.Stat(dosyaYolu)
	if err != nil {
		return "", 0, err
	}

	if dosyaBilgisi.IsDir() {
		return "", 0, fmt.Errorf("klasör önizlenemez")
	}

	boyut := dosyaBilgisi.Size()

	if boyut > limit {
		return "", boyut, fmt.Errorf("görsel önizleme için çok büyük")
	}

	acilanDosya, err := sftpClient.Open(dosyaYolu)
	if err != nil {
		return "", boyut, err
	}
	defer acilanDosya.Close()

	icerikBytes, err := io.ReadAll(io.LimitReader(acilanDosya, limit+1))
	if err != nil {
		return "", boyut, err
	}

	if int64(len(icerikBytes)) > limit {
		return "", boyut, fmt.Errorf("görsel önizleme için çok büyük")
	}

	return base64.StdEncoding.EncodeToString(icerikBytes), boyut, nil
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

func sshKomutCalistir(client *ssh.Client, komut string) (string, error) {
	session, err := client.NewSession()
	if err != nil {
		return "", err
	}
	defer session.Close()

	cikti, err := session.Output(komut)
	if err != nil {
		return "", err
	}

	return strings.TrimSpace(string(cikti)), nil
}

func yuzdeHesapla(kullanilan int, toplam int) float64 {
	if toplam <= 0 {
		return 0
	}

	yuzde := (float64(kullanilan) / float64(toplam)) * 100

	return float64(int(yuzde*10)) / 10
}

func ramBilgisiCoz(cikti string) (int, int, float64, error) {
	parcalar := strings.Fields(cikti)

	if len(parcalar) < 2 {
		return 0, 0, 0, fmt.Errorf("ram çıktısı geçersiz")
	}

	toplam, err := strconv.Atoi(parcalar[0])
	if err != nil {
		return 0, 0, 0, err
	}

	kullanilan, err := strconv.Atoi(parcalar[1])
	if err != nil {
		return 0, 0, 0, err
	}

	return toplam, kullanilan, yuzdeHesapla(kullanilan, toplam), nil
}

func diskBilgisiCoz(cikti string) (int, int, float64, error) {
	parcalar := strings.Fields(cikti)

	if len(parcalar) < 2 {
		return 0, 0, 0, fmt.Errorf("disk çıktısı geçersiz")
	}

	toplam, err := strconv.Atoi(parcalar[0])
	if err != nil {
		return 0, 0, 0, err
	}

	kullanilan, err := strconv.Atoi(parcalar[1])
	if err != nil {
		return 0, 0, 0, err
	}

	return toplam, kullanilan, yuzdeHesapla(kullanilan, toplam), nil
}

func cpuBilgisiCoz(cikti string) (float64, error) {
	parcalar := strings.Fields(cikti)

	if len(parcalar) < 4 {
		return 0, fmt.Errorf("cpu çıktısı geçersiz")
	}

	idle1, err := strconv.ParseFloat(parcalar[0], 64)
	if err != nil {
		return 0, err
	}

	total1, err := strconv.ParseFloat(parcalar[1], 64)
	if err != nil {
		return 0, err
	}

	idle2, err := strconv.ParseFloat(parcalar[2], 64)
	if err != nil {
		return 0, err
	}

	total2, err := strconv.ParseFloat(parcalar[3], 64)
	if err != nil {
		return 0, err
	}

	idleFarki := idle2 - idle1
	totalFarki := total2 - total1

	if totalFarki <= 0 {
		return 0, fmt.Errorf("cpu toplam farkı geçersiz")
	}

	kullanim := (1 - idleFarki/totalFarki) * 100

	if kullanim < 0 {
		kullanim = 0
	}

	if kullanim > 100 {
		kullanim = 100
	}

	return float64(int(kullanim*10)) / 10, nil
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

	veri.Token = strings.TrimSpace(veri.Token)
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

	if veri.Token == "" ||
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

	_, err = tokenIleKullaniciDogrula(veri.Token)
	if err != nil {
		http.Error(w, "Oturum geçersiz", http.StatusUnauthorized)
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

func sunucuStatsGetir(w http.ResponseWriter, r *http.Request) {
	corsAyarla(w, "POST, OPTIONS")

	if !postIstekKontrolu(w, r) {
		return
	}

	var bilgiler SunucuStatsBilgileri
	if !jsonOku(w, r, &bilgiler) {
		return
	}

	bilgiler.Token = strings.TrimSpace(bilgiler.Token)

	if bilgiler.Token == "" || bilgiler.ServerID <= 0 {
		http.Error(w, "Eksik veya geçersiz veri", http.StatusBadRequest)
		return
	}

	kimlik, err := sunucuKimlikSorgulaTokenIle(bilgiler.Token, bilgiler.ServerID)
	if err != nil {
		http.Error(w, "Oturum geçersiz veya sunucu bulunamadı", http.StatusUnauthorized)
		return
	}

	cacheAnahtari := fmt.Sprintf("%s:%d", bilgiler.Token, bilgiler.ServerID)

	if !bilgiler.Force {
		sunucuStatsCacheMutex.Lock()
		cacheKaydi, cacheVarMi := sunucuStatsCache[cacheAnahtari]
		sunucuStatsCacheMutex.Unlock()

		if cacheVarMi && time.Since(cacheKaydi.SonGuncelleme) < sunucuStatsCacheSuresi {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(cacheKaydi.Cevap)
			return
		}
	}

	authMethods, err := sshAuthMethodOlustur(kimlik)
	if err != nil {
		fmt.Println("Stats SSH auth hatası:", err)
		http.Error(w, "SSH kimlik doğrulama hazırlanamadı", http.StatusBadGateway)
		return
	}

	config := &ssh.ClientConfig{
		User:            kimlik.SunucuKullanici,
		Auth:            authMethods,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         5 * time.Second,
	}

	client, err := ssh.Dial("tcp", kimlik.IP+":"+kimlik.Port, config)
	if err != nil {
		fmt.Println("Stats SSH bağlantı hatası:", err)
		http.Error(w, "SSH bağlantısı kurulamadı", http.StatusBadGateway)
		return
	}
	defer client.Close()

	uptimeCikti, err := sshKomutCalistir(client, "uptime -p")
	if err != nil {
		fmt.Println("Uptime komutu çalıştırılamadı:", err)
		http.Error(w, "Sunucu bilgileri alınamadı", http.StatusBadGateway)
		return
	}
	uptimeCikti = strings.TrimPrefix(uptimeCikti, "up ")

	loadAverageCikti, err := sshKomutCalistir(client, "cat /proc/loadavg | awk '{print $1, $2, $3}'")
	if err != nil {
		fmt.Println("Load average alınamadı:", err)
		http.Error(w, "Sunucu bilgileri alınamadı", http.StatusBadGateway)
		return
	}

	cpuCikti, err := sshKomutCalistir(client, "awk '/^cpu / {idle=$5+$6; total=0; for (i=2;i<=8;i++) total+=$i; print idle, total}' /proc/stat; sleep 1; awk '/^cpu / {idle=$5+$6; total=0; for (i=2;i<=8;i++) total+=$i; print idle, total}' /proc/stat")
	if err != nil {
		fmt.Println("CPU bilgisi alınamadı:", err)
		http.Error(w, "Sunucu bilgileri alınamadı", http.StatusBadGateway)
		return
	}

	cpuYuzde, err := cpuBilgisiCoz(cpuCikti)
	if err != nil {
		fmt.Println("CPU bilgisi çözülemedi:", err)
		http.Error(w, "Sunucu bilgileri çözülemedi", http.StatusBadGateway)
		return
	}

	ramCikti, err := sshKomutCalistir(client, "free -m | awk '/Mem:/ {print $2, $3}'")
	if err != nil {
		fmt.Println("RAM bilgisi alınamadı:", err)
		http.Error(w, "Sunucu bilgileri alınamadı", http.StatusBadGateway)
		return
	}

	ramToplam, ramKullanilan, ramYuzde, err := ramBilgisiCoz(ramCikti)
	if err != nil {
		fmt.Println("RAM bilgisi çözülemedi:", err)
		http.Error(w, "Sunucu bilgileri çözülemedi", http.StatusBadGateway)
		return
	}

	diskCikti, err := sshKomutCalistir(client, "df -m / | awk 'NR==2 {print $2, $3}'")
	if err != nil {
		fmt.Println("Disk bilgisi alınamadı:", err)
		http.Error(w, "Sunucu bilgileri alınamadı", http.StatusBadGateway)
		return
	}

	diskToplam, diskKullanilan, diskYuzde, err := diskBilgisiCoz(diskCikti)
	if err != nil {
		fmt.Println("Disk bilgisi çözülemedi:", err)
		http.Error(w, "Sunucu bilgileri çözülemedi", http.StatusBadGateway)
		return
	}

	cevap := SunucuStatsCevabi{
		Basarili: true,
		Mesaj:    "Sunucu bilgileri alındı",

		GuncellemeZamani: time.Now().Format("15:04:05"),

		Uptime:      uptimeCikti,
		LoadAverage: loadAverageCikti,
		CpuYuzde:    cpuYuzde,

		RamToplam:     ramToplam,
		RamKullanilan: ramKullanilan,
		RamYuzde:      ramYuzde,

		DiskToplam:     diskToplam,
		DiskKullanilan: diskKullanilan,
		DiskYuzde:      diskYuzde,
	}

	sunucuStatsCacheMutex.Lock()
	sunucuStatsCache[cacheAnahtari] = SunucuStatsCacheKaydi{
		Cevap:         cevap,
		SonGuncelleme: time.Now(),
	}
	sunucuStatsCacheMutex.Unlock()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(cevap)
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

	if !bcryptHashMi(kayitliSifre) {
		hashlenmisSifre, err := sifreHashle(sifre)
		if err != nil {
			return 0, err
		}

		_, err = db.Exec(`
			UPDATE kullanicilar
			SET pionter_sifre = $1
			WHERE id = $2
		`, hashlenmisSifre, userID)

		if err != nil {
			return 0, err
		}
	}

	return userID, nil
}
func tokenOlustur() (string, error) {
	byteListesi := make([]byte, 32)

	_, err := rand.Read(byteListesi)
	if err != nil {
		return "", err
	}

	return hex.EncodeToString(byteListesi), nil
}

func oturumOlustur(userID int) (string, error) {
	token, err := tokenOlustur()
	if err != nil {
		return "", err
	}

	_, err = db.Exec(`
		INSERT INTO oturumlar (user_id, token, son_gecerlilik_tarihi)
		VALUES ($1, $2, NOW() + INTERVAL '7 days')
	`, userID, token)

	if err != nil {
		return "", err
	}

	return token, nil
}

func tokenIleKullaniciDogrula(token string) (int, error) {
	token = strings.TrimSpace(token)

	if token == "" {
		return 0, fmt.Errorf("token boş")
	}

	var userID int

	err := db.QueryRow(`
		SELECT user_id
		FROM oturumlar
		WHERE token = $1
			AND son_gecerlilik_tarihi > NOW()
	`, token).Scan(&userID)

	if err != nil {
		return 0, err
	}

	return userID, nil
}
func sunucuKimlikSorgulaTokenIle(token string, serverID int) (GizliKimlik, error) {
	var k GizliKimlik

	userID, err := tokenIleKullaniciDogrula(token)
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

	if err != nil {
		return k, err
	}

	kayitliSunucuSifre := k.SunucuSifre
	kayitliSSHPrivateKey := k.SSHPrivateKey

	err = sunucuCredentiallariniGerekirseSifrele(serverID, userID, kayitliSunucuSifre, kayitliSSHPrivateKey)
	if err != nil {
		return k, fmt.Errorf("sunucu credentialları şifrelenemedi: %w", err)
	}

	k.SunucuSifre, err = gizliVeriCoz(k.SunucuSifre)
	if err != nil {
		return k, fmt.Errorf("sunucu şifresi çözülemedi: %w", err)
	}

	k.SSHPrivateKey, err = gizliVeriCoz(k.SSHPrivateKey)
	if err != nil {
		return k, fmt.Errorf("SSH private key çözülemedi: %w", err)
	}

	return k, nil
}

func sunucuKimlikSorgulaUserIDIle(userID int, serverID int) (GizliKimlik, error) {
	var k GizliKimlik

	if userID <= 0 || serverID <= 0 {
		return k, fmt.Errorf("geçersiz kullanıcı veya sunucu")
	}

	err := db.QueryRow(`
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

	if err != nil {
		return k, err
	}

	kayitliSunucuSifre := k.SunucuSifre
	kayitliSSHPrivateKey := k.SSHPrivateKey

	err = sunucuCredentiallariniGerekirseSifrele(serverID, userID, kayitliSunucuSifre, kayitliSSHPrivateKey)
	if err != nil {
		return k, fmt.Errorf("sunucu credentialları şifrelenemedi: %w", err)
	}

	k.SunucuSifre, err = gizliVeriCoz(k.SunucuSifre)
	if err != nil {
		return k, fmt.Errorf("sunucu şifresi çözülemedi: %w", err)
	}

	k.SSHPrivateKey, err = gizliVeriCoz(k.SSHPrivateKey)
	if err != nil {
		return k, fmt.Errorf("SSH private key çözülemedi: %w", err)
	}

	return k, nil
}

func gecmisOturumlariTemizle() {
	_, err := db.Exec(`
		DELETE FROM oturumlar
		WHERE son_gecerlilik_tarihi <= NOW()
	`)

	if err != nil {
		fmt.Println("Geçmiş oturumlar temizlenemedi:", err)
	}
}

const sifreliVeriPrefix = "enc:v1:"

func credentialEncryptionKeyAl() ([]byte, error) {
	anahtarMetni := strings.TrimSpace(os.Getenv("CREDENTIAL_ENCRYPTION_KEY"))
	if anahtarMetni == "" {
		return nil, fmt.Errorf("CREDENTIAL_ENCRYPTION_KEY bulunamadı")
	}

	anahtar, err := base64.StdEncoding.DecodeString(anahtarMetni)
	if err != nil {
		return nil, fmt.Errorf("CREDENTIAL_ENCRYPTION_KEY base64 çözülemedi: %w", err)
	}

	if len(anahtar) != 32 {
		return nil, fmt.Errorf("CREDENTIAL_ENCRYPTION_KEY 32 byte olmalı")
	}

	return anahtar, nil
}

func gizliVeriSifreliMi(veri string) bool {
	return strings.HasPrefix(veri, sifreliVeriPrefix)
}

func gizliVeriSifrele(duzMetin string) (string, error) {
	if duzMetin == "" {
		return "", nil
	}

	anahtar, err := credentialEncryptionKeyAl()
	if err != nil {
		return "", err
	}

	blok, err := aes.NewCipher(anahtar)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(blok)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	_, err = rand.Read(nonce)
	if err != nil {
		return "", err
	}

	sifreliVeri := gcm.Seal(nil, nonce, []byte(duzMetin), nil)
	birlesikVeri := append(nonce, sifreliVeri...)

	return sifreliVeriPrefix + base64.StdEncoding.EncodeToString(birlesikVeri), nil
}

func gizliVeriCoz(veri string) (string, error) {
	if veri == "" {
		return "", nil
	}

	if !gizliVeriSifreliMi(veri) {
		return veri, nil
	}

	anahtar, err := credentialEncryptionKeyAl()
	if err != nil {
		return "", err
	}

	blok, err := aes.NewCipher(anahtar)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(blok)
	if err != nil {
		return "", err
	}

	base64Veri := strings.TrimPrefix(veri, sifreliVeriPrefix)

	birlesikVeri, err := base64.StdEncoding.DecodeString(base64Veri)
	if err != nil {
		return "", err
	}

	nonceBoyutu := gcm.NonceSize()
	if len(birlesikVeri) < nonceBoyutu {
		return "", fmt.Errorf("şifreli veri geçersiz")
	}

	nonce := birlesikVeri[:nonceBoyutu]
	sifreliMetin := birlesikVeri[nonceBoyutu:]

	duzMetin, err := gcm.Open(nil, nonce, sifreliMetin, nil)
	if err != nil {
		return "", err
	}

	return string(duzMetin), nil
}
func sunucuCredentiallariniGerekirseSifrele(serverID int, userID int, kayitliSunucuSifre string, kayitliSSHPrivateKey string) error {
	yeniSunucuSifre := kayitliSunucuSifre
	yeniSSHPrivateKey := kayitliSSHPrivateKey
	guncellemeGerekli := false

	if strings.TrimSpace(kayitliSunucuSifre) != "" && !gizliVeriSifreliMi(kayitliSunucuSifre) {
		sifreliSunucuSifre, err := gizliVeriSifrele(kayitliSunucuSifre)
		if err != nil {
			return err
		}

		yeniSunucuSifre = sifreliSunucuSifre
		guncellemeGerekli = true
	}

	if strings.TrimSpace(kayitliSSHPrivateKey) != "" && !gizliVeriSifreliMi(kayitliSSHPrivateKey) {
		sifreliSSHPrivateKey, err := gizliVeriSifrele(kayitliSSHPrivateKey)
		if err != nil {
			return err
		}

		yeniSSHPrivateKey = sifreliSSHPrivateKey
		guncellemeGerekli = true
	}

	if !guncellemeGerekli {
		return nil
	}

	_, err := db.Exec(`
		UPDATE sunucular
		SET
			sunucu_sifre = $1,
			ssh_private_key = $2
		WHERE id = $3 AND user_id = $4
	`, yeniSunucuSifre, yeniSSHPrivateKey, serverID, userID)

	return err
}
