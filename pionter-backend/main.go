package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/pkg/sftp"
	"golang.org/x/crypto/ssh"
)

func main() {
	http.HandleFunc("/api/files", dosyalariGetir)
	fmt.Println("Sunucu 8080 portunda çalışmaya başladı!")
	http.ListenAndServe(":8080", nil)
}

type BaglantiBilgileri struct {
	IP           string `json:"ip"`
	KullaniciAdi string `json:"kullaniciAdi"`
	Sifre        string `json:"sifre"`
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
	config := &ssh.ClientConfig{
		User:            bilgiler.KullaniciAdi,
		Auth:            []ssh.AuthMethod{ssh.Password(bilgiler.Sifre)},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}
	client, err := ssh.Dial("tcp", bilgiler.IP+":22", config)
	if err != nil {
		fmt.Println(err)
		panic(err)
	}
	sftpClient, err := sftp.NewClient(client)
	fmt.Println("Sunucuya başarıyla bağlandım!")
	if err != nil {
		fmt.Println(err)
		panic(err)
	}
	defer client.Close()
	dosyalar, err := sftpClient.ReadDir("/")
	if err != nil {
		fmt.Println(err)
		panic(err)
	}
	defer sftpClient.Close()
	var dosyaListesi []string
	for _, dosya := range dosyalar {
		dosyaListesi = append(dosyaListesi, (dosya.Name()))
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(dosyaListesi)
}
