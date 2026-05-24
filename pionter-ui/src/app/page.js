"use client";

import { useState, useEffect } from "react";

export default function AnaSayfa() {
  const [dosyalar, setDosyalar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [ip, setIp] = useState("");
  const [kullaniciAdi, setKullaniciAdi] = useState("");
  const [sifre, setSifre] = useState("");
  const baglantiyiBaslat = () => {
    setYukleniyor(true);
    fetch("http://localhost:8080/api/files", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ip: ip,
        kullaniciAdi: kullaniciAdi,
        sifre: sifre,
      }),
    })
      .then((cevap) => cevap.json())
      .then((veri) => {
        setDosyalar(veri);
        setYukleniyor(false);
      })
      .catch((hata) => {
        console.log("Hata:", hata);
        setYukleniyor(false);
      });
  };
  return (
    <div>
      <h1>Pionter Cloud</h1>
      <div>
        <input
          type="text"
          placeholder="Sunucu IP (Örn: 60.223.112.141)"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          className="text-black p-2 m-2 rounded"
        />
        <input
          type="text"
          placeholder="Kullanıcı adı (Örn: root)"
          value={kullaniciAdi}
          onChange={(e) => setKullaniciAdi(e.target.value)}
          className="text-black p-2 m-2 rounded"
        />
        <input
          type="password"
          placeholder="Şifreniz"
          value={sifre}
          onChange={(e) => setSifre(e.target.value)}
          className="text-black p-2 m-2 rounded"
        />
        <button
          onClick={baglantiyiBaslat}
          className="bg-blue-500 p-2 rounded text-white font-bold"
        >
          BAĞLAN
        </button>
      </div>
      <ul>
        {yukleniyor ? (
          <p>Sunucuya Bağlanılıyor...</p>
        ) : (
          dosyalar.map((dosya, index) => (
            <li key={index}> {dosya.ad} {dosya.klasorMu ? "📁" : "📄"}</li>
          ))
        )}
      </ul>
    </div>
  );
}
