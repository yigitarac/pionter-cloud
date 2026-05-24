"use client";

import { useState, useEffect } from "react";

export default function AnaSayfa() {
  const [dosyalar, setDosyalar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [ip, setIp] = useState("");
  const [kullaniciAdi, setKullaniciAdi] = useState("");
  const [sifre, setSifre] = useState("");
  const [mevcutYol, setMevcutYol] = useState("/");
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
        yol: mevcutYol,
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
  const klasoreGir = (dosya) => {
    setYukleniyor(true);
    let yeniYol = "";
    if (!dosya.klasorMu) {
      return;
    } else if (mevcutYol === "/") {
      yeniYol = "/" + dosya.ad;
    } else {
      yeniYol = mevcutYol + "/" + dosya.ad;
    }
    setMevcutYol(yeniYol);
    fetch("http://localhost:8080/api/files", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ip: ip,
        kullaniciAdi: kullaniciAdi,
        sifre: sifre,
        yol: yeniYol,
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
  const oncekiKlasoreDon = () => {
    let yeniYol = "";
    if (mevcutYol === "/") {
      return;
    } else {
      let index = mevcutYol.lastIndexOf("/");
      yeniYol = mevcutYol.substring(0, index);
      if (yeniYol === "") {
        yeniYol = "/";
      }
    }
    setMevcutYol(yeniYol);
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
        yol: yeniYol,
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
        {(() => {
          if (yukleniyor) {
            return <p>Sunucuya Bağlanılıyor...</p>;
          } else {
            return dosyalar.map((dosya, index) => (
              <li
                key={index}
                onClick={() => klasoreGir(dosya)}
                className="cursor-pointer hover:bg-gray-200"
              >
                {" "}
                {dosya.ad} {dosya.klasorMu ? "📁" : "📄"}
              </li>
            ));
          }
        })()}
      </ul>
      <button
        onClick={oncekiKlasoreDon}
        className="bg-blue-500 p-2 rounded text-white font-bold"
      >
        {" "}
        ÖNCEKİ KLASÖRE DÖN{" "}
      </button>
    </div>
  );
}
