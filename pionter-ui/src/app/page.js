"use client";

import { useState } from "react";

export default function AnaSayfa() {
  const [dosyalar, setDosyalar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [ip, setIp] = useState("");
  const [kullaniciAdi, setKullaniciAdi] = useState("");
  const [sifre, setSifre] = useState("");
  const [mevcutYol, setMevcutYol] = useState("/");
  const [karanlikMod, setKaranlikMod] = useState(true);

  const baglantiyiBaslat = () => {
    setYukleniyor(true);
    fetch("http://localhost:8080/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip, kullaniciAdi, sifre, yol: mevcutYol }),
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
    if (!dosya.klasorMu) return;

    setYukleniyor(true);
    let yeniYol = "";
    if (mevcutYol === "/") {
      yeniYol = "/" + dosya.ad;
    } else {
      yeniYol = mevcutYol + "/" + dosya.ad;
    }

    setMevcutYol(yeniYol);

    fetch("http://localhost:8080/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip, kullaniciAdi, sifre, yol: yeniYol }),
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
    if (mevcutYol === "/") return;

    let index = mevcutYol.lastIndexOf("/");
    let yeniYol = mevcutYol.substring(0, index);
    if (yeniYol === "") yeniYol = "/";

    setMevcutYol(yeniYol);
    setYukleniyor(true);

    fetch("http://localhost:8080/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip, kullaniciAdi, sifre, yol: yeniYol }),
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
    <div className={karanlikMod ? "dark" : ""}>
      <div className="min-h-screen bg-[#fbf1c7] dark:bg-[#282828] text-[#3c3836] dark:text-[#ebdbb2] font-sans transition-colors duration-200">
        <header className="sticky top-0 z-10 bg-[#fbf1c7] dark:bg-[#282828] border-b border-[#d5c4a1] dark:border-[#3c3836] px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <svg
              className="w-8 h-8 text-[#458588] dark:text-[#83a598]"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
            </svg>
            <h1 className="text-xl font-bold tracking-tight">
              Pionter
              <span className="text-[#458588] dark:text-[#83a598]">Cloud</span>
            </h1>
          </div>
          <button
            onClick={() => setKaranlikMod(!karanlikMod)}
            className="p-2 rounded-full hover:bg-[#ebdbb2] dark:hover:bg-[#3c3836] transition-colors"
            title="Temayı Değiştir"
          >
            {karanlikMod ? (
              <svg
                className="w-6 h-6 text-[#d79921]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6 text-[#458588]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-[#ebdbb2] dark:bg-[#3c3836] rounded-xl p-2 mb-8 flex flex-col md:flex-row gap-2 border border-[#d5c4a1] dark:border-[#504945] shadow-sm">
            <input
              type="text"
              placeholder="Sunucu IP (Örn: 60.223.112.141)"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-transparent border-none focus:ring-0 text-sm placeholder-[#928374] dark:placeholder-[#a89984] focus:outline-none"
            />
            <div className="hidden md:block w-px bg-[#d5c4a1] dark:bg-[#504945] my-2"></div>
            <input
              type="text"
              placeholder="Kullanıcı Adı"
              value={kullaniciAdi}
              onChange={(e) => setKullaniciAdi(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-transparent border-none focus:ring-0 text-sm placeholder-[#928374] dark:placeholder-[#a89984] focus:outline-none"
            />
            <div className="hidden md:block w-px bg-[#d5c4a1] dark:bg-[#504945] my-2"></div>
            <input
              type="password"
              placeholder="Şifre"
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-transparent border-none focus:ring-0 text-sm placeholder-[#928374] dark:placeholder-[#a89984] focus:outline-none"
            />
            <button
              onClick={baglantiyiBaslat}
              className="bg-[#458588] dark:bg-[#83a598] hover:bg-[#076678] dark:hover:bg-[#458588] text-[#fbf1c7] dark:text-[#282828] px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
            >
              Bağlan
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-[#d5c4a1] dark:border-[#504945]">
              <div className="flex items-center text-sm font-medium text-[#7c6f64] dark:text-[#a89984]">
                <button
                  onClick={oncekiKlasoreDon}
                  className="mr-4 p-1.5 rounded-md hover:bg-[#ebdbb2] dark:hover:bg-[#3c3836] transition-colors"
                  disabled={mevcutYol === "/"}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                </button>
                <span className="truncate max-w-[200px] md:max-w-md lg:max-w-xl">
                  {mevcutYol}
                </span>
              </div>
            </div>

            {yukleniyor ? (
              <div className="flex flex-col items-center justify-center py-20">
                <svg
                  className="animate-spin h-8 w-8 text-[#458588] dark:text-[#83a598] mb-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <p className="text-sm text-[#7c6f64] dark:text-[#a89984] animate-pulse">
                  Sunucu ile iletişim kuruluyor...
                </p>
              </div>
            ) : dosyalar.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#928374] dark:text-[#a89984]">
                <svg
                  className="w-16 h-16 mb-4 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1"
                    d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"
                  />
                </svg>
                <p className="text-sm">
                  Bu klasör boş veya henüz bağlanılmadı.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {dosyalar.map((dosya, index) => (
                  <div
                    key={index}
                    onClick={() => klasoreGir(dosya)}
                    className="group flex flex-col items-center p-4 rounded-xl hover:bg-[#ebdbb2] dark:hover:bg-[#3c3836] cursor-pointer transition-all duration-200"
                  >
                    {dosya.klasorMu ? (
                      <svg
                        className="w-16 h-16 text-[#458588] dark:text-[#83a598] mb-3 group-hover:scale-105 transition-transform"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                      </svg>
                    ) : (
                      <svg
                        className="w-16 h-16 text-[#928374] dark:text-[#a89984] mb-3 group-hover:scale-105 transition-transform"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                      </svg>
                    )}
                    <span className="text-sm font-medium text-center w-full truncate px-1 text-[#3c3836] dark:text-[#ebdbb2]">
                      {dosya.ad}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
