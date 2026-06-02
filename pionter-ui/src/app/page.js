"use client";

import { useState, useRef, useEffect } from "react";
import { sozluk } from "./sozluk";
import {
  dosyaBoyutuYaz,
  gecersizDosyaVeyaKlasorAdiMi,
  gecersizYolMu,
} from "./yardimcilar";
import Toast from "./components/Toast";
import LoadingState from "./components/LoadingState";

export default function AnaSayfa() {
  const [dosyalar, setDosyalar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [kullaniciAdi, setKullaniciAdi] = useState("");
  const [sifre, setSifre] = useState("");
  const [eposta, setEposta] = useState("");
  const [mevcutYol, setMevcutYol] = useState("/");
  const [sunucuIp, setSunucuIp] = useState("");
  const [sunucuKullanici, setSunucuKullanici] = useState("root");
  const [sunucuSifre, setSunucuSifre] = useState("");
  const [izoleKlasor, setIzoleKlasor] = useState("/PionterCloud");
  const [girisYapildi, setGirisYapildi] = useState(false);
  const [seciliSunucu, setSeciliSunucu] = useState(null);
  const [karanlikMod, setKaranlikMod] = useState(true);
  const [dil, setDil] = useState("en");
  const [surukleniyor, setSurukleniyor] = useState(false);
  const dosyaGirdiRef = useRef(null);
  const toastTimeoutRef = useRef(null);
  const dragCounterRef = useRef(0);
  const sunucuStatsIstekDevamEdiyorRef = useRef(false);
  const [sunucuFormAcik, setSunucuFormAcik] = useState(false);
  const [sunucuTakmaAd, setSunucuTakmaAd] = useState("");
  const [sunucuPort, setSunucuPort] = useState("22");
  const [baglantiTipi, setBaglantiTipi] = useState("password");
  const [sshPrivateKey, setSshPrivateKey] = useState("");
  const [sunucular, setSunucular] = useState([]);
  const [dosyaMesaji, setDosyaMesaji] = useState("");
  const [yeniKlasorAdi, setYeniKlasorAdi] = useState("");
  const [acikMenuIndex, setAcikMenuIndex] = useState(null);
  const [aramaMetni, setAramaMetni] = useState("");
  const [toast, setToast] = useState(null);
  const [renameModalAcik, setRenameModalAcik] = useState(false);
  const [serverDeleteModalAcik, setServerDeleteModalAcik] = useState(false);
  const [silinecekSunucu, setSilinecekSunucu] = useState(null);
  const [yenidenAdlandirilacakDosya, setYenidenAdlandirilacakDosya] =
    useState(null);
  const [yeniAd, setYeniAd] = useState("");
  const [moveModalAcik, setMoveModalAcik] = useState(false);
  const [tasinacakDosya, setTasinacakDosya] = useState(null);
  const [deleteModalAcik, setDeleteModalAcik] = useState(false);
  const [silinecekDosya, setSilinecekDosya] = useState(null);
  const [yuklemeMesaji, setYuklemeMesaji] = useState("");
  const [hedefKlasorler, setHedefKlasorler] = useState([]);
  const [hedefKlasorlerYukleniyor, setHedefKlasorlerYukleniyor] =
    useState(false);
  const [hedefKlasorGezintiYolu, setHedefKlasorGezintiYolu] = useState("/");
  const hedefKlasorCacheRef = useRef({});
  const [serverEditModalAcik, setServerEditModalAcik] = useState(false);
  const [duzenlenecekSunucu, setDuzenlenecekSunucu] = useState(null);
  const [oturumToken, setOturumToken] = useState("");
  const [yuklemeYuzdesi, setYuklemeYuzdesi] = useState(null);
  const [seciliOgeAnahtarlari, setSeciliOgeAnahtarlari] = useState([]);
  const [topluSilmeModalAcik, setTopluSilmeModalAcik] = useState(false);
  const [klasorModalAcik, setKlasorModalAcik] = useState(false);
  const [ayarMenusuAcik, setAyarMenusuAcik] = useState(false);
  const [solPanelAcik, setSolPanelAcik] = useState(false);
  const [topluTasimaModalAcik, setTopluTasimaModalAcik] = useState(false);
  const [sunucuStats, setSunucuStats] = useState(null);
  const [sunucuStatsYukleniyor, setSunucuStatsYukleniyor] = useState(false);
  const [sunucuStatsHatasi, setSunucuStatsHatasi] = useState("");

  const t = sozluk[dil];

  const secimleriTemizle = () => {
    setSeciliOgeAnahtarlari([]);
  };

  const yeniKayitOlustur = () => {
    if (yukleniyor) return;

    const temizKullaniciAdi = kullaniciAdi.trim();
    const temizEposta = eposta.trim();

    if (!temizKullaniciAdi || !sifre) {
      toastGoster(t.loginMissing, "error");
      return;
    }

    if (!temizEposta) {
      toastGoster(t.emailMissing, "error");
      return;
    }

    if (!temizEposta.includes("@") || !temizEposta.includes(".")) {
      toastGoster(t.invalidEmail, "error");
      return;
    }

    setYukleniyor(true);
    setYuklemeMesaji(t.registeringAccount);

    fetch("http://localhost:8080/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pionter_kullanici: temizKullaniciAdi,
        pionter_email: temizEposta,
        pionter_sifre: sifre,
      }),
    })
      .then((cevap) => {
        setYukleniyor(false);
        setYuklemeMesaji("");
        if (cevap.ok) {
          toastGoster(t.regSuccess, "success");
          setIsLogin(true);
        } else {
          toastGoster(t.regFail, "error");
        }
      })
      .catch((hata) => {
        console.log("Kayıt Hatası:", hata);
        setYukleniyor(false);
        setYuklemeMesaji("");
        toastGoster(t.regFail, "error");
      });
  };

  const klasoruYenile = (hedefYol, sunucu = seciliSunucu) => {
    if (!sunucu) {
      toastGoster(t.selectServerFirst, "error");
      return;
    }
    const gonderilecekVeri = {
      token: oturumToken,
      yol: hedefYol,
      server_id: sunucu.id,
    };
    fetch("http://localhost:8080/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(gonderilecekVeri),
    })
      .then((cevap) => {
        if (oturumHatasiKontrolEt(cevap)) {
          throw new Error("Oturum geçersiz");
        }

        if (!cevap.ok) {
          throw new Error("Dosyalar getirilemedi");
        }

        return cevap.json();
      })
      .then((veri) => {
        if (veri.basarili) {
          const gelenDosyalar = veri.dosyalar || [];

          setDosyalar(gelenDosyalar);

          if (gelenDosyalar.length === 0) {
            setDosyaMesaji("");
          } else {
            setDosyaMesaji(veri.mesaj || "");
          }
        } else {
          setDosyalar([]);
          setDosyaMesaji(
            dil === "tr"
              ? "Dosyalar getirilemedi."
              : "Files could not be loaded.",
          );
        }

        setYukleniyor(false);
        setYuklemeMesaji("");
      })
      .catch((hata) => {
        if (hata.message === "Oturum geçersiz") {
          return;
        }
        console.log("Hata:", hata);
        setDosyalar([]);
        setDosyaMesaji(
          dil === "tr"
            ? "Dosyalar getirilemedi."
            : "Files could not be loaded.",
        );
        setYukleniyor(false);
        toastGoster(
          dil === "tr"
            ? "Dosyalar getirilemedi."
            : "Files could not be loaded.",
          "error",
        );
      });
  };

  const girisKayitModunuDegistir = () => {
    if (yukleniyor) return;

    setIsLogin(!isLogin);
    setKullaniciAdi("");
    setEposta("");
    setSifre("");
    setOturumToken("");
  };

  const baglantiyiBaslat = () => {
    if (yukleniyor) return;

    const temizKullaniciAdi = kullaniciAdi.trim();

    if (!temizKullaniciAdi || !sifre) {
      toastGoster(t.loginMissing, "error");
      return;
    }

    setYukleniyor(true);
    setYuklemeMesaji(t.loggingIn);

    fetch("http://localhost:8080/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pionter_kullanici: temizKullaniciAdi,
        pionter_sifre: sifre,
      }),
    })
      .then((cevap) => {
        if (!cevap.ok) {
          throw new Error("Giriş başarısız");
        }

        return cevap.json();
      })
      .then((veri) => {
        setOturumToken(veri.token);
        setKullaniciAdi(temizKullaniciAdi);

        sunuculariGetir(veri.token);
      })
      .catch((hata) => {
        console.log("Login hatası:", hata);
        setOturumToken("");
        setYukleniyor(false);
        setYuklemeMesaji("");
        toastGoster(
          dil === "tr" ? "Giriş başarısız." : "Login failed.",
          "error",
        );
      });
  };

  const klasoreGir = (dosya) => {
    if (!dosya.klasorMu) {
      dosyayiIndir(dosya);
      return;
    }
    setYukleniyor(true);
    setYuklemeMesaji(t.loadingFiles);
    let yeniYol =
      mevcutYol === "/" ? "/" + dosya.ad : mevcutYol + "/" + dosya.ad;
    setMevcutYol(yeniYol);
    setAramaMetni("");
    secimleriTemizle();
    klasoruYenile(yeniYol);
  };

  const oncekiKlasoreDon = () => {
    if (mevcutYol === "/") return;
    let index = mevcutYol.lastIndexOf("/");
    let yeniYol = mevcutYol.substring(0, index);
    if (yeniYol === "") yeniYol = "/";
    setMevcutYol(yeniYol);
    setAramaMetni("");
    secimleriTemizle();
    setYukleniyor(true);
    setYuklemeMesaji(t.loadingFiles);
    klasoruYenile(yeniYol);
  };

  const yolaGit = (hedefYol) => {
    if (hedefYol === mevcutYol) return;

    setMevcutYol(hedefYol);
    setAramaMetni("");
    secimleriTemizle();
    setDosyaMesaji("");
    setAcikMenuIndex(null);
    setYukleniyor(true);
    setYuklemeMesaji(t.loadingFiles);
    klasoruYenile(hedefYol);
  };

  const sunucularaDon = () => {
    setSeciliSunucu(null);
    setMevcutYol("/");
    setDosyalar([]);
    setDosyaMesaji("");
    setAramaMetni("");
    secimleriTemizle();
    setYeniKlasorAdi("");
    setKlasorModalAcik(false);
    setAcikMenuIndex(null);
    setYukleniyor(false);
    setYuklemeMesaji("");
    setYuklemeYuzdesi(null);
    setHedefKlasorGezintiYolu("/");
    setServerDeleteModalAcik(false);
    setSilinecekSunucu(null);
    setServerEditModalAcik(false);
    setDuzenlenecekSunucu(null);
    setTopluSilmeModalAcik(false);
    setAyarMenusuAcik(false);
    setSolPanelAcik(false);
    setTopluTasimaModalAcik(false);
    setSunucuStats(null);
    setSunucuStatsYukleniyor(false);
    setSunucuStatsHatasi("");

    setRenameModalAcik(false);
    setYenidenAdlandirilacakDosya(null);
    setYeniAd("");

    setMoveModalAcik(false);
    setTasinacakDosya(null);
    setHedefKlasorler([]);
    hedefKlasorCacheRef.current = {};

    setDeleteModalAcik(false);
    setSilinecekDosya(null);
  };

  const sunucuEklemeEkraniniAc = () => {
    if (yukleniyor) return;

    sunucularaDon();
    setSunucuFormAcik(true);
    setSolPanelAcik(false);
  };

  const oturumHatasiKontrolEt = (cevap) => {
    if (cevap.status === 401) {
      oturumuTemizle();
      toastGoster(t.sessionExpired, "error");
      return true;
    }

    return false;
  };

  const oturumuTemizle = () => {
    setOturumToken("");
    setGirisYapildi(false);
    setKullaniciAdi("");
    setSifre("");
    setEposta("");
    setAyarMenusuAcik(false);
    setSolPanelAcik(false);
    setTopluTasimaModalAcik(false);
    setSunucuStats(null);
    setSunucuStatsYukleniyor(false);
    setSunucuStatsHatasi("");

    setSeciliSunucu(null);
    setSunucular([]);
    setDosyalar([]);
    setDosyaMesaji("");
    setMevcutYol("/");
    setAramaMetni("");
    secimleriTemizle();
    setYeniKlasorAdi("");
    setKlasorModalAcik(false);
    setAcikMenuIndex(null);

    setSunucuFormAcik(false);
    sunucuFormunuTemizle();

    setServerEditModalAcik(false);
    setDuzenlenecekSunucu(null);
    setServerDeleteModalAcik(false);
    setSilinecekSunucu(null);
    setTopluSilmeModalAcik(false);

    setRenameModalAcik(false);
    setYenidenAdlandirilacakDosya(null);
    setYeniAd("");

    setMoveModalAcik(false);
    setTasinacakDosya(null);
    setHedefKlasorler([]);
    setHedefKlasorGezintiYolu("/");
    hedefKlasorCacheRef.current = {};

    setDeleteModalAcik(false);
    setSilinecekDosya(null);

    setYukleniyor(false);
    setYuklemeMesaji("");
    setYuklemeYuzdesi(null);
  };

  const cikisYap = () => {
    if (yukleniyor) return;

    const mevcutToken = oturumToken;

    if (!mevcutToken) {
      oturumuTemizle();
      return;
    }

    setYukleniyor(true);
    setYuklemeMesaji(t.loggingOut);

    fetch("http://localhost:8080/api/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: mevcutToken,
      }),
    })
      .then((cevap) => {
        if (!cevap.ok) {
          throw new Error("Çıkış yapılamadı");
        }

        oturumuTemizle();
        toastGoster(t.logoutSuccess, "success");
      })
      .catch((hata) => {
        console.log("Çıkış hatası:", hata);
        oturumuTemizle();
        toastGoster(t.logoutFailed, "error");
      });
  };

  const sunucuSec = (sunucu) => {
    if (yukleniyor) return;

    setSeciliSunucu(sunucu);
    setMevcutYol("/");
    setDosyalar([]);
    setDosyaMesaji("");
    setAramaMetni("");
    secimleriTemizle();
    setYeniKlasorAdi("");
    setAcikMenuIndex(null);
    setTopluTasimaModalAcik(false);
    setSunucuStats(null);
    setSunucuStatsYukleniyor(false);
    setSunucuStatsHatasi("");

    setRenameModalAcik(false);
    setYenidenAdlandirilacakDosya(null);
    setYeniAd("");

    setTopluSilmeModalAcik(false);
    setMoveModalAcik(false);
    setTasinacakDosya(null);
    setHedefKlasorGezintiYolu("/");
    setHedefKlasorler([]);
    hedefKlasorCacheRef.current = {};

    setDeleteModalAcik(false);
    setSilinecekDosya(null);

    setYukleniyor(true);
    setYuklemeMesaji(t.loadingFiles);

    klasoruYenile("/", sunucu);
    sunucuStatsGetir(sunucu);
  };

  const sunucuStatsGetir = (sunucu = seciliSunucu, sessiz = false) => {
    if (sunucuStatsIstekDevamEdiyorRef.current) return;

    if (!sunucu) {
      setSunucuStatsHatasi(
        dil === "tr" ? "Sunucu seçilmedi." : "No server selected.",
      );
      return;
    }

    if (!oturumToken) {
      setSunucuStatsHatasi(
        dil === "tr" ? "Oturum bulunamadı." : "Session not found.",
      );
      return;
    }

    const sessizYenileme = sessiz;

    sunucuStatsIstekDevamEdiyorRef.current = true;

    if (!sessizYenileme) {
      setSunucuStatsYukleniyor(true);
    }

    setSunucuStatsHatasi("");

    fetch("http://localhost:8080/api/server/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: oturumToken,
        server_id: sunucu.id,
      }),
    })
      .then((cevap) => {
        if (oturumHatasiKontrolEt(cevap)) {
          throw new Error("Oturum geçersiz");
        }

        if (!cevap.ok) {
          throw new Error("Sunucu bilgileri alınamadı");
        }

        return cevap.json();
      })
      .then((veri) => {
        if (!veri.basarili) {
          throw new Error("Sunucu bilgileri alınamadı");
        }

        setSunucuStats(veri);
        setSunucuStatsYukleniyor(false);
        setSunucuStatsHatasi("");
      })
      .catch((hata) => {
        if (hata.message === "Oturum geçersiz") {
          setSunucuStatsYukleniyor(false);
          return;
        }

        console.log("Sunucu stats hatası:", hata);
        setSunucuStatsYukleniyor(false);

        if (!sessizYenileme) {
          setSunucuStats(null);
          setSunucuStatsHatasi(
            dil === "tr"
              ? "Sunucu bilgileri alınamadı."
              : "Server stats could not be loaded.",
          );
        }
      })
      .finally(() => {
        sunucuStatsIstekDevamEdiyorRef.current = false;
      });
  };

  const megabaytYaz = (deger) => {
    if (deger === null || deger === undefined) return "-";

    if (deger >= 1024) {
      return `${(deger / 1024).toFixed(1)} GB`;
    }

    return `${deger} MB`;
  };

  const yuzdeSinirla = (deger) => {
    const sayi = Number(deger);

    if (Number.isNaN(sayi)) return 0;
    if (sayi < 0) return 0;
    if (sayi > 100) return 100;

    return sayi;
  };

  const dosyayiIndir = (dosya) => {
    if (yukleniyor) return;
    if (!seciliSunucu) {
      toastGoster(t.selectServerFirst, "error");
      return;
    }
    setYukleniyor(true);
    setYuklemeMesaji(t.downloadingFile);
    let dosyaYolu =
      mevcutYol === "/" ? "/" + dosya.ad : mevcutYol + "/" + dosya.ad;
    fetch("http://localhost:8080/api/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: oturumToken,
        yol: dosyaYolu,
        server_id: seciliSunucu.id,
      }),
    })
      .then((cevap) => {
        if (oturumHatasiKontrolEt(cevap)) {
          throw new Error("Oturum geçersiz");
        }

        if (!cevap.ok) {
          throw new Error("Dosya indirilemedi");
        }

        return cevap.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = dosya.ad;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        setYukleniyor(false);
        setYuklemeMesaji("");
      })
      .catch((hata) => {
        if (hata.message === "Oturum geçersiz") {
          return;
        }
        console.log(hata);
        setYukleniyor(false);
        setYuklemeMesaji("");
        toastGoster(
          dil === "tr"
            ? "Dosya indirilemedi."
            : "File could not be downloaded.",
          "error",
        );
      });
  };

  const tekDosyaYukle = (dosya, sira = 1, toplam = 1) => {
    if (!dosya) {
      return Promise.reject(new Error("Dosya bulunamadı"));
    }

    if (gecersizDosyaVeyaKlasorAdiMi(dosya.name)) {
      return Promise.reject(new Error("Geçersiz dosya adı"));
    }

    if (!seciliSunucu) {
      return Promise.reject(new Error("Sunucu seçilmedi"));
    }

    const gorunenDosyaAdi =
      dosya.name.length > 40 ? dosya.name.slice(0, 37) + "..." : dosya.name;

    setYuklemeMesaji(
      toplam > 1
        ? `${t.uploadingFile} (${sira}/${toplam}) - ${gorunenDosyaAdi}`
        : `${t.uploadingFile} - ${gorunenDosyaAdi}`,
    );
    setYuklemeYuzdesi(0);

    const formData = new FormData();
    formData.append("token", oturumToken);
    formData.append("yol", mevcutYol);
    formData.append("server_id", seciliSunucu.id);
    formData.append("dosya", dosya);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open("POST", "http://localhost:8080/api/upload");

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;

        const yuzde = Math.round((event.loaded / event.total) * 100);
        setYuklemeYuzdesi(yuzde);
      };

      xhr.onload = () => {
        if (oturumHatasiKontrolEt(xhr)) {
          setYuklemeYuzdesi(null);
          reject(new Error("Oturum geçersiz"));
          return;
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
          return;
        }

        console.log("Yükleme başarısız:", xhr.status, xhr.responseText);
        reject(new Error("Yükleme başarısız"));
      };

      xhr.onerror = () => {
        console.log("Yükleme bağlantı hatası");
        reject(new Error("Yükleme bağlantı hatası"));
      };

      xhr.send(formData);
    });
  };

  const dosyalariYukle = async (dosyaListesi) => {
    if (yukleniyor) return;
    if (!dosyaListesi || dosyaListesi.length === 0) return;

    if (!seciliSunucu) {
      toastGoster(t.selectServerFirst, "error");
      return;
    }

    const yuklenecekDosyalar = Array.from(dosyaListesi);

    const gecersizDosya = yuklenecekDosyalar.find((dosya) =>
      gecersizDosyaVeyaKlasorAdiMi(dosya.name),
    );

    if (gecersizDosya) {
      toastGoster(t.invalidFileName, "error");
      return;
    }

    setYukleniyor(true);
    setYuklemeYuzdesi(0);

    try {
      for (let i = 0; i < yuklenecekDosyalar.length; i++) {
        await tekDosyaYukle(
          yuklenecekDosyalar[i],
          i + 1,
          yuklenecekDosyalar.length,
        );
      }

      toastGoster(
        yuklenecekDosyalar.length > 1 ? t.multiUploadSuccess : t.uploadSuccess,
        "success",
      );

      secimleriTemizle();
      setYuklemeYuzdesi(null);
      setYuklemeMesaji(t.loadingFiles);
      hedefKlasorCacheRef.current = {};
      klasoruYenile(mevcutYol);
    } catch (hata) {
      if (hata.message === "Oturum geçersiz") {
        return;
      }

      console.log("Yükleme hatası:", hata);
      setYukleniyor(false);
      setYuklemeMesaji("");
      setYuklemeYuzdesi(null);
      toastGoster(t.uploadFailed, "error");
    }
  };

  const klasorModaliniKapat = () => {
    setKlasorModalAcik(false);
    setYeniKlasorAdi("");
  };

  const klasorOlustur = () => {
    if (yukleniyor) return;
    if (!seciliSunucu) {
      toastGoster(t.selectServerFirst, "error");
      return;
    }
    const temizKlasorAdi = yeniKlasorAdi.trim();

    if (!temizKlasorAdi) {
      toastGoster(t.folderNameEmpty, "error");
      return;
    }
    if (gecersizDosyaVeyaKlasorAdiMi(temizKlasorAdi)) {
      toastGoster(t.invalidFolderName, "error");
      return;
    }
    setYukleniyor(true);
    setYuklemeMesaji(t.creatingFolder);
    fetch("http://localhost:8080/api/folders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: oturumToken,
        yol: mevcutYol,
        server_id: seciliSunucu.id,
        klasor_adi: temizKlasorAdi,
      }),
    })
      .then((cevap) => {
        if (oturumHatasiKontrolEt(cevap)) {
          throw new Error("Oturum geçersiz");
        }

        if (!cevap.ok) {
          throw new Error("Klasör oluşturulamadı");
        }

        setYeniKlasorAdi("");
        setKlasorModalAcik(false);
        toastGoster(t.folderCreateSuccess, "success");
        secimleriTemizle();
        setYukleniyor(true);
        hedefKlasorCacheRef.current = {};
        klasoruYenile(mevcutYol);
      })
      .catch((hata) => {
        if (hata.message === "Oturum geçersiz") {
          return;
        }
        console.log("Klasör oluşturma hatası:", hata);
        setYukleniyor(false);
        setYuklemeMesaji("");
        toastGoster(t.folderCreateFailed, "error");
      });
  };

  const dosyaVeyaKlasorSil = (dosya) => {
    if (!seciliSunucu) {
      toastGoster(t.selectServerFirst, "error");
      return;
    }

    setSilinecekDosya(dosya);
    setDeleteModalAcik(true);
    setAcikMenuIndex(null);
  };

  const silmeyiOnayla = () => {
    if (yukleniyor) return;
    if (!silinecekDosya) return;

    const silinecekDosyaAdi = silinecekDosya.ad;
    const silinecekKlasorMu = silinecekDosya.klasorMu;

    setDeleteModalAcik(false);
    setSilinecekDosya(null);
    setYukleniyor(true);
    setYuklemeMesaji(t.deletingItem);

    fetch("http://localhost:8080/api/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: oturumToken,
        yol: mevcutYol,
        server_id: seciliSunucu.id,
        dosya_adi: silinecekDosyaAdi,
        klasor_mu: silinecekKlasorMu,
      }),
    })
      .then((cevap) => {
        if (oturumHatasiKontrolEt(cevap)) {
          throw new Error("Oturum geçersiz");
        }

        if (!cevap.ok) {
          throw new Error("Silme başarısız");
        }

        toastGoster(
          dil === "tr" ? "Silme başarılı." : "Deleted successfully.",
          "success",
        );
        secimleriTemizle();
        hedefKlasorCacheRef.current = {};
        klasoruYenile(mevcutYol);
      })
      .catch((hata) => {
        if (hata.message === "Oturum geçersiz") {
          return;
        }
        console.log("Silme hatası:", hata);
        setYukleniyor(false);
        setYuklemeMesaji("");
        toastGoster(t.deleteFailed, "error");
      });
  };

  const dosyaVeyaKlasorYenidenAdlandir = (dosya) => {
    if (!seciliSunucu) {
      toastGoster(t.selectServerFirst, "error");
      return;
    }
    setYenidenAdlandirilacakDosya(dosya);
    setYeniAd(dosya.ad);
    setRenameModalAcik(true);
    setAcikMenuIndex(null);
  };
  const yenidenAdlandirmayiOnayla = () => {
    if (yukleniyor) return;
    if (!yenidenAdlandirilacakDosya) return;

    const temizYeniAd = yeniAd.trim();

    if (!temizYeniAd) {
      toastGoster(t.folderNameEmpty, "error");
      return;
    }

    if (gecersizDosyaVeyaKlasorAdiMi(temizYeniAd)) {
      toastGoster(t.invalidFileName, "error");
      return;
    }

    if (temizYeniAd === yenidenAdlandirilacakDosya.ad) {
      setRenameModalAcik(false);
      setYenidenAdlandirilacakDosya(null);
      setYeniAd("");
      return;
    }

    setYukleniyor(true);
    setYuklemeMesaji(t.renamingItem);
    setRenameModalAcik(false);

    fetch("http://localhost:8080/api/rename", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: oturumToken,
        yol: mevcutYol,
        server_id: seciliSunucu.id,
        eski_ad: yenidenAdlandirilacakDosya.ad,
        yeni_ad: temizYeniAd,
      }),
    })
      .then((cevap) => {
        if (oturumHatasiKontrolEt(cevap)) {
          throw new Error("Oturum geçersiz");
        }

        if (!cevap.ok) {
          throw new Error("Yeniden adlandırma başarısız");
        }

        toastGoster(
          dil === "tr"
            ? "Yeniden adlandırma başarılı."
            : "Renamed successfully.",
          "success",
        );

        setYenidenAdlandirilacakDosya(null);
        setYeniAd("");
        secimleriTemizle();
        hedefKlasorCacheRef.current = {};
        klasoruYenile(mevcutYol);
      })
      .catch((hata) => {
        if (hata.message === "Oturum geçersiz") {
          return;
        }
        console.log("Yeniden adlandırma hatası:", hata);
        setYukleniyor(false);
        setYuklemeMesaji("");
        toastGoster(t.renameFailed, "error");
      });
  };

  const hedefKlasorleriGetir = (hedefYol = "/") => {
    if (!seciliSunucu) return;

    if (hedefKlasorCacheRef.current[hedefYol]) {
      setHedefKlasorler(hedefKlasorCacheRef.current[hedefYol]);
      return;
    }

    setHedefKlasorlerYukleniyor(true);

    fetch("http://localhost:8080/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: oturumToken,
        yol: hedefYol,
        server_id: seciliSunucu.id,
      }),
    })
      .then((cevap) => {
        if (oturumHatasiKontrolEt(cevap)) {
          throw new Error("Oturum geçersiz");
        }

        if (!cevap.ok) {
          throw new Error("Hedef klasörler getirilemedi");
        }

        return cevap.json();
      })
      .then((veri) => {
        const sadeceKlasorler = (veri.dosyalar || []).filter(
          (dosya) => dosya.klasorMu,
        );

        hedefKlasorCacheRef.current[hedefYol] = sadeceKlasorler;

        setHedefKlasorler(sadeceKlasorler);
        setHedefKlasorlerYukleniyor(false);
      })
      .catch((hata) => {
        if (hata.message === "Oturum geçersiz") {
          return;
        }
        console.log("Hedef klasörler getirilemedi:", hata);
        setHedefKlasorler([]);
        setHedefKlasorlerYukleniyor(false);
        toastGoster(
          dil === "tr"
            ? "Hedef klasörler getirilemedi."
            : "Target folders could not be loaded.",
          "error",
        );
      });
  };

  const hedefKlasorYolunaGit = (hedefYol) => {
    if (hedefKlasorlerYukleniyor) return;

    setHedefKlasorGezintiYolu(hedefYol);
    hedefKlasorleriGetir(hedefYol);
  };

  const hedefKlasoreGir = (klasorYolu) => {
    hedefKlasorYolunaGit(klasorYolu);
  };

  const hedefUstKlasoreDon = () => {
    if (hedefKlasorlerYukleniyor) return;
    if (hedefKlasorGezintiYolu === "/") return;

    const sonSlashIndex = hedefKlasorGezintiYolu.lastIndexOf("/");
    let ustYol = hedefKlasorGezintiYolu.substring(0, sonSlashIndex);

    if (ustYol === "") {
      ustYol = "/";
    }

    setHedefKlasorGezintiYolu(ustYol);
    hedefKlasorleriGetir(ustYol);
  };

  const dosyaVeyaKlasorTasi = (dosya) => {
    if (!seciliSunucu) {
      toastGoster(t.selectServerFirst, "error");
      return;
    }
    setTasinacakDosya(dosya);
    setHedefKlasorGezintiYolu("/");
    setHedefKlasorler([]);
    setMoveModalAcik(true);
    setAcikMenuIndex(null);
    hedefKlasorleriGetir("/");
  };
  const tasimayiOnayla = () => {
    if (yukleniyor) return;
    if (!tasinacakDosya) return;

    const temizHedefYol = hedefKlasorGezintiYolu.trim();

    if (!temizHedefYol) {
      toastGoster(t.targetPathEmpty, "error");
      return;
    }

    if (gecersizYolMu(temizHedefYol)) {
      toastGoster(t.invalidTargetPath, "error");
      return;
    }

    const hedefYol = temizHedefYol.startsWith("/")
      ? temizHedefYol
      : "/" + temizHedefYol;
    if (hedefYol === mevcutYol) {
      toastGoster(t.alreadyInThisFolder, "error");
      return;
    }
    if (
      tasinacakDosya.klasorMu &&
      (hedefYol === tasinacakDosyaYolu ||
        hedefYol.startsWith(tasinacakDosyaYolu + "/"))
    ) {
      toastGoster(
        dil === "tr"
          ? "Bir klasör kendi içine taşınamaz."
          : "A folder cannot be moved into itself.",
        "error",
      );
      return;
    }
    setMoveModalAcik(false);
    setYukleniyor(true);
    setYuklemeMesaji(t.movingItem);

    fetch("http://localhost:8080/api/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: oturumToken,
        server_id: seciliSunucu.id,
        kaynak_yol: mevcutYol,
        hedef_yol: hedefYol,
        dosya_adi: tasinacakDosya.ad,
      }),
    })
      .then((cevap) => {
        if (oturumHatasiKontrolEt(cevap)) {
          throw new Error("Oturum geçersiz");
        }

        if (!cevap.ok) {
          throw new Error("Taşıma başarısız");
        }

        toastGoster(
          dil === "tr" ? "Taşıma başarılı." : "Moved successfully.",
          "success",
        );

        setTasinacakDosya(null);
        secimleriTemizle();
        hedefKlasorCacheRef.current = {};
        klasoruYenile(mevcutYol);
      })
      .catch((hata) => {
        if (hata.message === "Oturum geçersiz") {
          return;
        }
        console.log("Taşıma hatası:", hata);
        setYukleniyor(false);
        setYuklemeMesaji("");
        toastGoster(t.moveFailed, "error");
      });
  };

  const toastGoster = (mesaj, tip = "info") => {
    setToast({ mesaj, tip });

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 3000);
  };

  const dosyaSurukleniyorMu = (e) => {
    return Array.from(e.dataTransfer?.types || []).includes("Files");
  };

  useEffect(() => {
    const pencereSuruklemeBasladi = (e) => {
      if (!seciliSunucu || yukleniyor || !dosyaSurukleniyorMu(e)) {
        return;
      }

      e.preventDefault();
      dragCounterRef.current += 1;
      setSurukleniyor(true);
    };

    const pencereSuruklemeUstte = (e) => {
      if (!seciliSunucu || yukleniyor || !dosyaSurukleniyorMu(e)) {
        return;
      }

      e.preventDefault();
      setSurukleniyor(true);
    };

    const pencereSuruklemeAyrildi = (e) => {
      if (!seciliSunucu || yukleniyor || !dosyaSurukleniyorMu(e)) {
        return;
      }

      e.preventDefault();
      dragCounterRef.current -= 1;

      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0;
        setSurukleniyor(false);
      }
    };

    const pencereDosyaBirakildi = (e) => {
      if (!seciliSunucu || !dosyaSurukleniyorMu(e)) {
        return;
      }

      e.preventDefault();
      dragCounterRef.current = 0;
      setSurukleniyor(false);

      if (yukleniyor) {
        return;
      }

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        dosyalariYukle(e.dataTransfer.files);
      }
    };

    window.addEventListener("dragenter", pencereSuruklemeBasladi);
    window.addEventListener("dragover", pencereSuruklemeUstte);
    window.addEventListener("dragleave", pencereSuruklemeAyrildi);
    window.addEventListener("drop", pencereDosyaBirakildi);

    return () => {
      window.removeEventListener("dragenter", pencereSuruklemeBasladi);
      window.removeEventListener("dragover", pencereSuruklemeUstte);
      window.removeEventListener("dragleave", pencereSuruklemeAyrildi);
      window.removeEventListener("drop", pencereDosyaBirakildi);
    };
  }, [seciliSunucu, yukleniyor, mevcutYol, oturumToken]);

  useEffect(() => {
    if (!girisYapildi || !seciliSunucu || !oturumToken) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (document.hidden) return;
      if (yukleniyor) return;

      sunucuStatsGetir(seciliSunucu, true);
    }, 60000);

    return () => {
      window.clearInterval(intervalId);
    };

    // sunucuStatsGetir her render'da yeniden oluştuğu için bilerek dependency'ye eklemiyom
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [girisYapildi, seciliSunucu, oturumToken, yukleniyor]);

  const butonlaSecildi = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      dosyalariYukle(e.target.files);
      e.target.value = "";
    }
  };
  const sunuculariGetir = (token = oturumToken) => {
    if (!token) {
      toastGoster(
        dil === "tr" ? "Oturum bulunamadı." : "Session not found.",
        "error",
      );
      return;
    }
    setYukleniyor(true);
    setYuklemeMesaji(t.loadingServers);

    fetch("http://localhost:8080/api/servers/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
      }),
    })
      .then((cevap) => {
        if (oturumHatasiKontrolEt(cevap)) {
          throw new Error("Oturum geçersiz");
        }

        if (!cevap.ok) {
          throw new Error("Sunucular getirilemedi");
        }

        return cevap.json();
      })
      .then((veri) => {
        const duzenlenmisSunucular = veri.map((sunucu) => ({
          id: sunucu.id,
          takmaAd: sunucu.sunucu_takma_ad,
          ip: sunucu.sunucu_ip,
          kullanici: sunucu.sunucu_kullanici,
          port: sunucu.sunucu_port,
          baglantiTipi: sunucu.baglanti_tipi,
          izoleKlasor: sunucu.izole_klasor,
          sabitli: sunucu.sabitli,
        }));

        setSunucular(duzenlenmisSunucular);
        setGirisYapildi(true);
        setYukleniyor(false);
        setYuklemeMesaji("");
      })
      .catch((hata) => {
        if (hata.message === "Oturum geçersiz") {
          return;
        }
        console.log("Sunucular getirilemedi:", hata);
        setYukleniyor(false);
        setYuklemeMesaji("");
        toastGoster(
          dil === "tr"
            ? "Giriş başarısız veya sunucular getirilemedi."
            : "Login failed or servers could not be loaded.",
          "error",
        );
      });
  };

  const sunucuFormunuTemizle = () => {
    setSunucuTakmaAd("");
    setSunucuIp("");
    setSunucuKullanici("root");
    setSunucuPort("22");
    setSunucuSifre("");
    setSshPrivateKey("");
    setIzoleKlasor("/PionterCloud");
    setBaglantiTipi("password");
  };

  const baglantiTipiniDegistir = (yeniBaglantiTipi) => {
    setBaglantiTipi(yeniBaglantiTipi);

    if (yeniBaglantiTipi === "password") {
      setSshPrivateKey("");
    }
    if (yeniBaglantiTipi === "ssh_key") {
      setSunucuSifre("");
    }
  };

  const sunucuDuzenlemeModaliniAc = (sunucu) => {
    if (yukleniyor) return;

    setDuzenlenecekSunucu(sunucu);

    setSunucuTakmaAd(sunucu.takmaAd);
    setSunucuIp(sunucu.ip);
    setSunucuKullanici(sunucu.kullanici);
    setSunucuPort(sunucu.port || "22");
    setBaglantiTipi(sunucu.baglantiTipi || "password");
    setIzoleKlasor(sunucu.izoleKlasor);

    setSunucuSifre("");
    setSshPrivateKey("");

    setServerEditModalAcik(true);
  };

  const sunucuSabitlemeDegistir = (sunucu) => {
    if (yukleniyor) return;

    const yeniSabitliDurumu = !sunucu.sabitli;

    fetch("http://localhost:8080/api/servers/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: oturumToken,
        server_id: sunucu.id,
        sabitli: yeniSabitliDurumu,
      }),
    })
      .then((cevap) => {
        if (oturumHatasiKontrolEt(cevap)) {
          throw new Error("Oturum geçersiz");
        }

        if (!cevap.ok) {
          throw new Error("Sunucu sabitleme durumu güncellenemedi");
        }

        setSunucular((mevcutSunucular) =>
          mevcutSunucular
            .map((mevcutSunucu) =>
              mevcutSunucu.id === sunucu.id
                ? { ...mevcutSunucu, sabitli: yeniSabitliDurumu }
                : mevcutSunucu,
            )
            .sort((a, b) => {
              if (a.sabitli && !b.sabitli) return -1;
              if (!a.sabitli && b.sabitli) return 1;

              return b.id - a.id;
            }),
        );
      })
      .catch((hata) => {
        if (hata.message === "Oturum geçersiz") {
          return;
        }
        console.log("Sunucu sabitleme hatası:", hata);
        toastGoster(t.serverPinFailed, "error");
      });
  };

  const sunucuDuzenlemeModaliniKapat = () => {
    setServerEditModalAcik(false);
    setDuzenlenecekSunucu(null);
    sunucuFormunuTemizle();
  };

  const sunucuSilmeModaliniAc = (sunucu) => {
    if (yukleniyor) return;

    setSilinecekSunucu(sunucu);
    setServerDeleteModalAcik(true);
  };

  const topluSilmeyiOnayla = async () => {
    if (yukleniyor) return;

    const seciliOgeler = seciliOgeleriGetir();

    if (seciliOgeler.length === 0) {
      setTopluSilmeModalAcik(false);
      return;
    }

    setTopluSilmeModalAcik(false);
    setYukleniyor(true);
    setYuklemeMesaji(`${t.deletingSelectedItems} (0/${seciliOgeler.length})`);

    try {
      for (let i = 0; i < seciliOgeler.length; i++) {
        const oge = seciliOgeler[i];

        setYuklemeMesaji(
          `${t.deletingSelectedItems} (${i + 1}/${seciliOgeler.length})`,
        );

        const cevap = await fetch("http://localhost:8080/api/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: oturumToken,
            yol: mevcutYol,
            server_id: seciliSunucu.id,
            dosya_adi: oge.ad,
            klasor_mu: oge.klasorMu,
          }),
        });

        if (oturumHatasiKontrolEt(cevap)) {
          throw new Error("Oturum geçersiz");
        }

        if (!cevap.ok) {
          throw new Error("Toplu silme başarısız");
        }
      }

      toastGoster(t.selectedItemsDeleted, "success");

      secimleriTemizle();
      hedefKlasorCacheRef.current = {};
      klasoruYenile(mevcutYol);
    } catch (hata) {
      if (hata.message === "Oturum geçersiz") {
        return;
      }

      console.log("Toplu silme hatası:", hata);
      setYukleniyor(false);
      setYuklemeMesaji("");
      toastGoster(t.bulkDeleteFailed, "error");
    }
  };

  const sunucuSilmeyiOnayla = () => {
    if (yukleniyor) return;
    if (!silinecekSunucu) return;

    setServerDeleteModalAcik(false);
    setYukleniyor(true);
    setYuklemeMesaji(t.deletingServer);

    fetch("http://localhost:8080/api/servers/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: oturumToken,
        server_id: silinecekSunucu.id,
      }),
    })
      .then((cevap) => {
        if (oturumHatasiKontrolEt(cevap)) {
          throw new Error("Oturum geçersiz");
        }

        if (!cevap.ok) {
          throw new Error("Sunucu silinemedi");
        }

        toastGoster(t.deleteServerSuccess, "success");

        setSunucular((mevcutSunucular) =>
          mevcutSunucular.filter((sunucu) => sunucu.id !== silinecekSunucu.id),
        );

        setSilinecekSunucu(null);
        setYukleniyor(false);
        setYuklemeMesaji("");
      })
      .catch((hata) => {
        if (hata.message === "Oturum geçersiz") {
          return;
        }
        console.log("Sunucu silme hatası:", hata);
        setSilinecekSunucu(null);
        setYukleniyor(false);
        setYuklemeMesaji("");
        toastGoster(t.deleteServerFailed, "error");
      });
  };

  const sunucuKaydet = () => {
    if (yukleniyor) return;
    const temizSunucuTakmaAd = sunucuTakmaAd.trim();
    const temizSunucuIp = sunucuIp.trim();
    const temizSunucuKullanici = sunucuKullanici.trim();
    const temizSunucuPort = sunucuPort.trim();
    const temizIzoleKlasor = izoleKlasor.trim();
    if (
      !temizSunucuTakmaAd ||
      !temizSunucuIp ||
      !temizSunucuKullanici ||
      !temizSunucuPort ||
      !temizIzoleKlasor
    ) {
      toastGoster(t.serverRequiredFields, "error");
      return;
    }
    const portSayisi = Number(temizSunucuPort);

    if (!Number.isInteger(portSayisi) || portSayisi < 1 || portSayisi > 65535) {
      toastGoster(t.invalidServerPort, "error");
      return;
    }
    if (!temizIzoleKlasor.startsWith("/")) {
      toastGoster(t.invalidIsolatedFolder, "error");
      return;
    }

    if (baglantiTipi === "password" && !sunucuSifre) {
      toastGoster(t.serverPasswordRequired, "error");
      return;
    }

    if (baglantiTipi === "ssh_key" && !sshPrivateKey.trim()) {
      toastGoster(t.sshKeyRequired, "error");
      return;
    }

    setYukleniyor(true);
    setYuklemeMesaji(t.savingServer);

    fetch("http://localhost:8080/api/servers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: oturumToken,

        sunucu_takma_ad: temizSunucuTakmaAd,
        sunucu_ip: temizSunucuIp,
        sunucu_port: temizSunucuPort,
        sunucu_kullanici: temizSunucuKullanici,
        baglanti_tipi: baglantiTipi,
        sunucu_sifre: baglantiTipi === "password" ? sunucuSifre : "",
        ssh_private_key: baglantiTipi === "ssh_key" ? sshPrivateKey : "",
        izole_klasor: temizIzoleKlasor,
      }),
    })
      .then((cevap) => {
        if (oturumHatasiKontrolEt(cevap)) {
          throw new Error("Oturum geçersiz");
        }

        if (!cevap.ok) {
          throw new Error("Sunucu kaydedilemedi");
        }

        sunuculariGetir();
        toastGoster(t.serverSaveSuccess, "success");

        setYukleniyor(false);
        setYuklemeMesaji("");

        sunucuFormunuTemizle();
        setSunucuFormAcik(false);
      })
      .catch((hata) => {
        if (hata.message === "Oturum geçersiz") {
          return;
        }
        console.log("Sunucu kayıt hatası:", hata);
        setYukleniyor(false);
        setYuklemeMesaji("");
        toastGoster(t.serverSaveFailed, "error");
      });
  };

  const sunucuGuncelle = () => {
    if (yukleniyor) return;
    if (!duzenlenecekSunucu) return;

    const temizSunucuTakmaAd = sunucuTakmaAd.trim();
    const temizSunucuIp = sunucuIp.trim();
    const temizSunucuKullanici = sunucuKullanici.trim();
    const temizSunucuPort = sunucuPort.trim();
    const temizIzoleKlasor = izoleKlasor.trim();

    if (
      !temizSunucuTakmaAd ||
      !temizSunucuIp ||
      !temizSunucuKullanici ||
      !temizSunucuPort ||
      !temizIzoleKlasor
    ) {
      toastGoster(t.serverRequiredFields, "error");
      return;
    }

    const portSayisi = Number(temizSunucuPort);

    if (!Number.isInteger(portSayisi) || portSayisi < 1 || portSayisi > 65535) {
      toastGoster(t.invalidServerPort, "error");
      return;
    }

    if (!temizIzoleKlasor.startsWith("/")) {
      toastGoster(t.invalidIsolatedFolder, "error");
      return;
    }

    setYukleniyor(true);
    setYuklemeMesaji(t.updatingServer);

    fetch("http://localhost:8080/api/servers/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: oturumToken,

        server_id: duzenlenecekSunucu.id,
        sunucu_takma_ad: temizSunucuTakmaAd,
        sunucu_ip: temizSunucuIp,
        sunucu_port: temizSunucuPort,
        sunucu_kullanici: temizSunucuKullanici,
        baglanti_tipi: baglantiTipi,
        sunucu_sifre: baglantiTipi === "password" ? sunucuSifre : "",
        ssh_private_key: baglantiTipi === "ssh_key" ? sshPrivateKey : "",
        izole_klasor: temizIzoleKlasor,
      }),
    })
      .then((cevap) => {
        if (oturumHatasiKontrolEt(cevap)) {
          throw new Error("Oturum geçersiz");
        }

        if (!cevap.ok) {
          throw new Error("Sunucu güncellenemedi");
        }

        toastGoster(t.serverUpdateSuccess, "success");

        setSunucular((mevcutSunucular) =>
          mevcutSunucular.map((sunucu) =>
            sunucu.id === duzenlenecekSunucu.id
              ? {
                  ...sunucu,
                  takmaAd: temizSunucuTakmaAd,
                  ip: temizSunucuIp,
                  port: temizSunucuPort,
                  kullanici: temizSunucuKullanici,
                  baglantiTipi,
                  izoleKlasor: temizIzoleKlasor,
                }
              : sunucu,
          ),
        );

        setYukleniyor(false);
        setYuklemeMesaji("");
        sunucuDuzenlemeModaliniKapat();
      })
      .catch((hata) => {
        if (hata.message === "Oturum geçersiz") {
          return;
        }
        console.log("Sunucu güncelleme hatası:", hata);
        setYukleniyor(false);
        setYuklemeMesaji("");
        toastGoster(t.serverUpdateFailed, "error");
      });
  };

  const yolParcalari = mevcutYol.split("/").filter(Boolean);
  const hedefKlasorYolParcalari = hedefKlasorGezintiYolu
    .split("/")
    .filter(Boolean);
  const moveHedefiMevcutKlasorMu =
    moveModalAcik && hedefKlasorGezintiYolu === mevcutYol;
  const tasinacakDosyaYolu = tasinacakDosya
    ? mevcutYol === "/"
      ? "/" + tasinacakDosya.ad
      : mevcutYol + "/" + tasinacakDosya.ad
    : "";

  const moveHedefiTasinanKlasorunIcindeMi =
    moveModalAcik &&
    tasinacakDosya?.klasorMu &&
    (hedefKlasorGezintiYolu === tasinacakDosyaYolu ||
      hedefKlasorGezintiYolu.startsWith(tasinacakDosyaYolu + "/"));
  const hedefKlasorlerGosterilecek = hedefKlasorler.filter((klasor) => {
    if (!tasinacakDosya?.klasorMu) return true;

    if (hedefKlasorGezintiYolu !== mevcutYol) return true;

    return klasor.ad !== tasinacakDosya.ad;
  });

  const dosyaAnahtariOlustur = (dosya) => {
    return `${dosya.klasorMu ? "klasor" : "dosya"}:${dosya.ad}`;
  };

  const dosyaSeciliMi = (dosya) => {
    return seciliOgeAnahtarlari.includes(dosyaAnahtariOlustur(dosya));
  };

  const dosyaSeciminiDegistir = (dosya) => {
    const anahtar = dosyaAnahtariOlustur(dosya);

    setSeciliOgeAnahtarlari((mevcutSecimler) => {
      if (mevcutSecimler.includes(anahtar)) {
        return mevcutSecimler.filter((secim) => secim !== anahtar);
      }

      return [...mevcutSecimler, anahtar];
    });
  };

  const topluTasimaModaliniAc = () => {
    if (yukleniyor) return;

    const seciliOgeler = seciliOgeleriGetir();

    if (seciliOgeler.length === 0) {
      return;
    }

    setHedefKlasorGezintiYolu("/");
    setHedefKlasorler([]);
    hedefKlasorCacheRef.current = {};
    setTopluTasimaModalAcik(true);
    hedefKlasorleriGetir("/");
  };

  const topluSilmeModaliniAc = () => {
    if (yukleniyor) return;

    const seciliOgeler = seciliOgeleriGetir();

    if (seciliOgeler.length === 0) {
      return;
    }

    setTopluSilmeModalAcik(true);
  };

  const seciliOgeleriGetir = () => {
    return dosyalar.filter((dosya) => dosyaSeciliMi(dosya));
  };

  const topluTasimayiOnayla = async () => {
    if (yukleniyor) return;

    const seciliOgeler = seciliOgeleriGetir();

    if (seciliOgeler.length === 0) {
      setTopluTasimaModalAcik(false);
      return;
    }

    const temizHedefYol = hedefKlasorGezintiYolu.trim();

    if (!temizHedefYol) {
      toastGoster(t.targetPathEmpty, "error");
      return;
    }

    if (gecersizYolMu(temizHedefYol)) {
      toastGoster(t.invalidTargetPath, "error");
      return;
    }

    const hedefYol = temizHedefYol.startsWith("/")
      ? temizHedefYol
      : "/" + temizHedefYol;

    if (hedefYol === mevcutYol) {
      toastGoster(t.alreadyInThisFolder, "error");
      return;
    }

    const hedefSeciliKlasorunIcindeMi = seciliOgeler.some((oge) => {
      if (!oge.klasorMu) return false;

      const ogeYolu =
        mevcutYol === "/" ? "/" + oge.ad : mevcutYol + "/" + oge.ad;

      return hedefYol === ogeYolu || hedefYol.startsWith(ogeYolu + "/");
    });

    if (hedefSeciliKlasorunIcindeMi) {
      toastGoster(
        dil === "tr"
          ? "Bir klasör kendi içine veya kendi alt klasörüne taşınamaz."
          : "A folder cannot be moved into itself or one of its subfolders.",
        "error",
      );
      return;
    }

    setTopluTasimaModalAcik(false);
    setYukleniyor(true);
    setYuklemeMesaji(`${t.movingSelectedItems} (0/${seciliOgeler.length})`);

    try {
      for (let i = 0; i < seciliOgeler.length; i++) {
        const oge = seciliOgeler[i];

        setYuklemeMesaji(
          `${t.movingSelectedItems} (${i + 1}/${seciliOgeler.length})`,
        );

        const cevap = await fetch("http://localhost:8080/api/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: oturumToken,
            server_id: seciliSunucu.id,
            kaynak_yol: mevcutYol,
            hedef_yol: hedefYol,
            dosya_adi: oge.ad,
          }),
        });

        if (oturumHatasiKontrolEt(cevap)) {
          throw new Error("Oturum geçersiz");
        }

        if (!cevap.ok) {
          throw new Error("Toplu taşıma başarısız");
        }
      }

      toastGoster(t.selectedItemsMoved, "success");

      secimleriTemizle();
      setTopluTasimaModalAcik(false);
      setHedefKlasorGezintiYolu("/");
      setHedefKlasorler([]);
      hedefKlasorCacheRef.current = {};
      klasoruYenile(mevcutYol);
    } catch (hata) {
      if (hata.message === "Oturum geçersiz") {
        return;
      }

      console.log("Toplu taşıma hatası:", hata);
      setYukleniyor(false);
      setYuklemeMesaji("");
      setTopluTasimaModalAcik(false);
      setHedefKlasorGezintiYolu("/");
      setHedefKlasorler([]);
      toastGoster(t.bulkMoveFailed, "error");
    }
  };

  const topluSilmeSeciliOgeler = topluSilmeModalAcik
    ? seciliOgeleriGetir()
    : [];

  const topluTasimaSeciliOgeler = topluTasimaModalAcik
    ? seciliOgeleriGetir()
    : [];

  const topluTasimaHedefiMevcutKlasorMu =
    topluTasimaModalAcik && hedefKlasorGezintiYolu === mevcutYol;

  const topluTasimaHedefiSeciliKlasorunIcindeMi =
    topluTasimaModalAcik &&
    topluTasimaSeciliOgeler.some((oge) => {
      if (!oge.klasorMu) return false;

      const ogeYolu =
        mevcutYol === "/" ? "/" + oge.ad : mevcutYol + "/" + oge.ad;

      return (
        hedefKlasorGezintiYolu === ogeYolu ||
        hedefKlasorGezintiYolu.startsWith(ogeYolu + "/")
      );
    });

  const topluTasimaHedefKlasorlerGosterilecek = topluTasimaModalAcik
    ? hedefKlasorler.filter((klasor) => {
        if (hedefKlasorGezintiYolu !== mevcutYol) return true;

        return !topluTasimaSeciliOgeler.some(
          (oge) => oge.klasorMu && oge.ad === klasor.ad,
        );
      })
    : [];

  const aktifHedefKlasorlerGosterilecek = topluTasimaModalAcik
    ? topluTasimaHedefKlasorlerGosterilecek
    : hedefKlasorlerGosterilecek;

  const aktifTasimaHedefiMevcutKlasorMu = topluTasimaModalAcik
    ? topluTasimaHedefiMevcutKlasorMu
    : moveHedefiMevcutKlasorMu;

  const aktifTasimaHedefiTasinanKlasorunIcindeMi = topluTasimaModalAcik
    ? topluTasimaHedefiSeciliKlasorunIcindeMi
    : moveHedefiTasinanKlasorunIcindeMi;

  const listelenenOgelerinHepsiSeciliMi = () => {
    if (gosterilecekDosyalar.length === 0) {
      return false;
    }

    return gosterilecekDosyalar.every((dosya) => dosyaSeciliMi(dosya));
  };

  const listelenenOgeleriSec = () => {
    if (gosterilecekDosyalar.length === 0) {
      return;
    }

    setSeciliOgeAnahtarlari((mevcutSecimler) => {
      const yeniSecimler = [...mevcutSecimler];

      gosterilecekDosyalar.forEach((dosya) => {
        const anahtar = dosyaAnahtariOlustur(dosya);

        if (!yeniSecimler.includes(anahtar)) {
          yeniSecimler.push(anahtar);
        }
      });

      return yeniSecimler;
    });
  };

  const gosterilecekDosyalar = dosyalar
    .filter((dosya) =>
      dosya.ad.toLowerCase().includes(aramaMetni.toLowerCase()),
    )
    .sort((a, b) => {
      if (a.klasorMu && !b.klasorMu) return -1;
      if (!a.klasorMu && b.klasorMu) return 1;

      return a.ad.localeCompare(b.ad, dil === "tr" ? "tr" : "en", {
        sensitivity: "base",
      });
    });
  return (
    <div
      className={karanlikMod ? "dark" : ""}
      lang={dil === "tr" ? "tr" : "en"}
    >
      <Toast toast={toast} />
      {klasorModalAcik && (
        <div
          onClick={klasorModaliniKapat}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-[#d5c4a1] bg-[#fbf1c7] p-5 text-[#3c3836] shadow-xl dark:border-[#504945] dark:bg-[#282828] dark:text-[#ebdbb2]"
          >
            <h2 className="mb-2 text-lg font-bold text-[#3c3836] dark:text-[#ebdbb2]">
              {t.newFolderTitle}
            </h2>

            <input
              type="text"
              value={yeniKlasorAdi}
              onChange={(e) => setYeniKlasorAdi(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  klasorOlustur();
                }

                if (e.key === "Escape") {
                  klasorModaliniKapat();
                }
              }}
              placeholder={t.folderNamePlaceholder}
              className="w-full rounded-lg border border-[#d5c4a1] bg-[#ebdbb2] px-4 py-2.5 text-sm text-[#3c3836] placeholder-[#928374] focus:outline-none dark:border-[#504945] dark:bg-[#3c3836] dark:text-[#ebdbb2] dark:placeholder-[#a89984]"
              autoFocus
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={klasorModaliniKapat}
                className="rounded-lg bg-[#d5c4a1] px-4 py-2 text-sm font-bold text-[#3c3836] transition-colors hover:bg-[#a89984] dark:bg-[#504945] dark:text-[#ebdbb2] dark:hover:bg-[#665c54]"
              >
                {t.cancel}
              </button>

              <button
                type="button"
                onClick={klasorOlustur}
                disabled={yukleniyor}
                className="rounded-lg bg-[#458588] px-4 py-2 text-sm font-bold text-[#fbf1c7] transition-colors hover:bg-[#076678] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#83a598] dark:text-[#282828] dark:hover:bg-[#458588]"
              >
                {t.createFolder}
              </button>
            </div>
          </div>
        </div>
      )}
      {renameModalAcik && (
        <div
          onClick={() => {
            setRenameModalAcik(false);
            setYenidenAdlandirilacakDosya(null);
            setYeniAd("");
          }}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-[#d5c4a1] dark:border-[#504945] bg-[#fbf1c7] dark:bg-[#282828] text-[#3c3836] dark:text-[#ebdbb2] p-5 shadow-xl"
          >
            <h2 className="text-lg font-bold mb-2 text-[#3c3836] dark:text-[#ebdbb2]">
              {t.renameModalTitle}
            </h2>

            <p className="text-sm text-[#7c6f64] dark:text-[#a89984] mb-4 truncate">
              {yenidenAdlandirilacakDosya?.ad}
            </p>

            <input
              type="text"
              value={yeniAd}
              onChange={(e) => setYeniAd(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  yenidenAdlandirmayiOnayla();
                }

                if (e.key === "Escape") {
                  setRenameModalAcik(false);
                  setYenidenAdlandirilacakDosya(null);
                  setYeniAd("");
                }
              }}
              placeholder={t.newNamePlaceholder}
              className="w-full px-4 py-2.5 bg-[#ebdbb2] dark:bg-[#3c3836] rounded-lg border border-[#d5c4a1] dark:border-[#504945] text-sm text-[#3c3836] dark:text-[#ebdbb2] placeholder-[#928374] dark:placeholder-[#a89984] focus:outline-none"
              autoFocus
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => {
                  setRenameModalAcik(false);
                  setYenidenAdlandirilacakDosya(null);
                  setYeniAd("");
                }}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-[#d5c4a1] dark:bg-[#504945] hover:bg-[#a89984] dark:hover:bg-[#665c54] text-[#3c3836] dark:text-[#ebdbb2] transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>

              <button
                onClick={yenidenAdlandirmayiOnayla}
                disabled={yukleniyor}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-[#458588] dark:bg-[#83a598] hover:bg-[#076678] dark:hover:bg-[#458588] text-[#fbf1c7] dark:text-[#282828] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.confirmRename}
              </button>
            </div>
          </div>
        </div>
      )}
      {(moveModalAcik || topluTasimaModalAcik) && (
        <div
          onClick={() => {
            setMoveModalAcik(false);
            setTopluTasimaModalAcik(false);
            setTasinacakDosya(null);
            setHedefKlasorler([]);
            setHedefKlasorGezintiYolu("/");
          }}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-xl border border-[#d5c4a1] dark:border-[#504945] bg-[#fbf1c7] dark:bg-[#282828] text-[#3c3836] dark:text-[#ebdbb2] p-5 shadow-xl"
          >
            <div className="mb-4">
              <h2 className="text-lg font-bold text-[#3c3836] dark:text-[#ebdbb2]">
                {topluTasimaModalAcik ? t.bulkMoveModalTitle : t.moveModalTitle}
              </h2>

              <p className="mt-1 truncate text-sm text-[#7c6f64] dark:text-[#a89984]">
                {topluTasimaModalAcik
                  ? `${topluTasimaSeciliOgeler.length} ${t.selectedItems}`
                  : tasinacakDosya?.ad}
              </p>

              {topluTasimaModalAcik && (
                <div className="mt-3 rounded-lg border border-[#d5c4a1] bg-[#ebdbb2] p-3 dark:border-[#504945] dark:bg-[#3c3836]">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#7c6f64] dark:text-[#a89984]">
                    {t.selectedItemsPreview}
                  </p>

                  <div className="space-y-1">
                    {topluTasimaSeciliOgeler.slice(0, 5).map((oge) => (
                      <p
                        key={`${oge.klasorMu ? "klasor" : "dosya"}:${oge.ad}`}
                        className="flex items-center gap-2 truncate text-xs text-[#3c3836] dark:text-[#ebdbb2]"
                      >
                        {oge.klasorMu ? (
                          <svg
                            className="h-4 w-4 shrink-0 text-[#458588] dark:text-[#83a598]"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                          </svg>
                        ) : (
                          <svg
                            className="h-4 w-4 shrink-0 text-[#a89984]"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM13 9V3.5L18.5 9H13z" />
                          </svg>
                        )}

                        <span className="truncate">{oge.ad}</span>
                      </p>
                    ))}
                  </div>

                  {topluTasimaSeciliOgeler.length > 5 && (
                    <p className="mt-2 text-xs font-bold text-[#7c6f64] dark:text-[#a89984]">
                      +{topluTasimaSeciliOgeler.length - 5} {t.moreItems}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-[#d5c4a1] dark:border-[#504945] bg-[#ebdbb2] dark:bg-[#3c3836] px-4 py-3">
              <p className="text-xs font-bold text-[#7c6f64] dark:text-[#a89984] mb-1">
                {t.currentMoveTarget}
              </p>

              <div className="flex items-center gap-1 min-w-0 flex-wrap">
                {hedefKlasorGezintiYolu === "/" ? (
                  <span className="text-sm font-bold cursor-default text-[#458588] dark:text-[#83a598]">
                    {t.homeFolder}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => hedefKlasorYolunaGit("/")}
                    disabled={hedefKlasorlerYukleniyor}
                    className="text-sm font-bold transition-colors cursor-pointer text-[#3c3836] dark:text-[#ebdbb2] hover:text-[#458588] dark:hover:text-[#83a598] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t.homeFolder}
                  </button>
                )}

                {hedefKlasorYolParcalari.map((parca, index) => {
                  const hedefYol =
                    "/" + hedefKlasorYolParcalari.slice(0, index + 1).join("/");

                  const aktifMi = hedefYol === hedefKlasorGezintiYolu;

                  return (
                    <div
                      key={hedefYol}
                      className="flex items-center gap-1 min-w-0"
                    >
                      <span className="text-sm text-[#928374] dark:text-[#a89984]">
                        /
                      </span>

                      {aktifMi ? (
                        <span className="inline-block text-sm font-bold truncate max-w-[120px] cursor-default text-[#458588] dark:text-[#83a598]">
                          {parca}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => hedefKlasorYolunaGit(hedefYol)}
                          disabled={hedefKlasorlerYukleniyor}
                          className="text-sm font-bold truncate max-w-[120px] transition-colors cursor-pointer text-[#3c3836] dark:text-[#ebdbb2] hover:text-[#458588] dark:hover:text-[#83a598] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {parca}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-[#d5c4a1] dark:border-[#504945] bg-[#ebdbb2] dark:bg-[#3c3836] p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#7c6f64] dark:text-[#a89984]">
                    {dil === "tr" ? "Alt klasörler" : "Subfolders"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={hedefUstKlasoreDon}
                  disabled={
                    hedefKlasorGezintiYolu === "/" || hedefKlasorlerYukleniyor
                  }
                  className="shrink-0 rounded-md px-3 py-1.5 text-xs font-bold bg-[#d5c4a1] dark:bg-[#504945] hover:bg-[#a89984] dark:hover:bg-[#665c54] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {dil === "tr" ? "Geri" : "Back"}
                </button>
              </div>

              {hedefKlasorlerYukleniyor ? (
                <p className="text-xs text-[#928374] dark:text-[#a89984]">
                  {dil === "tr"
                    ? "Klasörler yükleniyor..."
                    : "Loading folders..."}
                </p>
              ) : aktifHedefKlasorlerGosterilecek.length === 0 ? (
                <p className="text-xs text-[#928374] dark:text-[#a89984]">
                  {dil === "tr"
                    ? "Bu klasörde alt klasör yok. Buraya taşıyabilirsin."
                    : "No subfolders here. You can move the item here."}
                </p>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                  {aktifHedefKlasorlerGosterilecek.map((klasor) => {
                    const klasorYolu =
                      hedefKlasorGezintiYolu === "/"
                        ? "/" + klasor.ad
                        : hedefKlasorGezintiYolu + "/" + klasor.ad;

                    return (
                      <button
                        key={klasor.ad}
                        type="button"
                        onClick={() => hedefKlasoreGir(klasorYolu)}
                        className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-[#d5c4a1] dark:hover:bg-[#504945] transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <svg
                          className="w-5 h-5 text-[#458588] dark:text-[#83a598] shrink-0"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                        </svg>

                        <span className="truncate">{klasor.ad}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {aktifTasimaHedefiMevcutKlasorMu && (
              <p className="mt-3 text-xs text-[#928374] dark:text-[#a89984]">
                {dil === "tr"
                  ? "Bu öğe zaten bu klasörde."
                  : "This item is already in this folder."}
              </p>
            )}

            {aktifTasimaHedefiTasinanKlasorunIcindeMi && (
              <p className="mt-3 text-xs text-[#928374] dark:text-[#a89984]">
                {dil === "tr"
                  ? "Bir klasör kendi içine veya kendi alt klasörüne taşınamaz."
                  : "A folder cannot be moved into itself or one of its subfolders."}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => {
                  setMoveModalAcik(false);
                  setTopluTasimaModalAcik(false);
                  setTasinacakDosya(null);
                  setHedefKlasorler([]);
                  setHedefKlasorGezintiYolu("/");
                }}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-[#d5c4a1] dark:bg-[#504945] hover:bg-[#a89984] dark:hover:bg-[#665c54] text-[#3c3836] dark:text-[#ebdbb2] transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>

              <button
                onClick={
                  topluTasimaModalAcik ? topluTasimayiOnayla : tasimayiOnayla
                }
                disabled={
                  yukleniyor ||
                  aktifTasimaHedefiMevcutKlasorMu ||
                  aktifTasimaHedefiTasinanKlasorunIcindeMi
                }
                className="px-4 py-2 rounded-lg text-sm font-bold bg-[#458588] dark:bg-[#83a598] hover:bg-[#076678] dark:hover:bg-[#458588] text-[#fbf1c7] dark:text-[#282828] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.confirmMoveHere}
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteModalAcik && (
        <div
          onClick={() => {
            setDeleteModalAcik(false);
            setSilinecekDosya(null);
          }}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-[#d5c4a1] dark:border-[#504945] bg-[#fbf1c7] dark:bg-[#282828] text-[#3c3836] dark:text-[#ebdbb2] p-5 shadow-xl"
          >
            <h2 className="text-lg font-bold mb-2 text-[#3c3836] dark:text-[#ebdbb2]">
              {t.deleteModalTitle}
            </h2>

            <p className="text-sm text-[#7c6f64] dark:text-[#a89984] mb-2">
              {t.deleteModalText}
            </p>

            <p className="text-sm font-bold mb-5 truncate text-[#cc241d]">
              {silinecekDosya?.ad}
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteModalAcik(false);
                  setSilinecekDosya(null);
                }}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-[#d5c4a1] dark:bg-[#504945] hover:bg-[#a89984] dark:hover:bg-[#665c54] text-[#3c3836] dark:text-[#ebdbb2] transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>

              <button
                onClick={silmeyiOnayla}
                disabled={yukleniyor}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-[#cc241d] hover:bg-[#9d0006] text-[#fbf1c7] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.confirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}
      {serverDeleteModalAcik && (
        <div
          onClick={() => {
            setServerDeleteModalAcik(false);
            setSilinecekSunucu(null);
          }}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-[#d5c4a1] dark:border-[#504945] bg-[#fbf1c7] dark:bg-[#282828] text-[#3c3836] dark:text-[#ebdbb2] p-5 shadow-xl"
          >
            <h2 className="text-lg font-bold mb-2 text-[#3c3836] dark:text-[#ebdbb2]">
              {t.deleteServerTitle}
            </h2>

            <p className="text-sm text-[#7c6f64] dark:text-[#a89984] mb-2">
              {t.deleteServerText}
            </p>

            <p className="text-sm font-bold mb-5 truncate text-[#cc241d]">
              {silinecekSunucu?.takmaAd}
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setServerDeleteModalAcik(false);
                  setSilinecekSunucu(null);
                }}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-[#d5c4a1] dark:bg-[#504945] hover:bg-[#a89984] dark:hover:bg-[#665c54] text-[#3c3836] dark:text-[#ebdbb2] transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>

              <button
                onClick={sunucuSilmeyiOnayla}
                disabled={yukleniyor}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-[#cc241d] hover:bg-[#9d0006] text-[#fbf1c7] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.confirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}
      {topluSilmeModalAcik && (
        <div
          onClick={() => setTopluSilmeModalAcik(false)}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-[#d5c4a1] dark:border-[#504945] bg-[#fbf1c7] dark:bg-[#282828] text-[#3c3836] dark:text-[#ebdbb2] p-5 shadow-xl"
          >
            <h2 className="text-lg font-bold mb-2 text-[#3c3836] dark:text-[#ebdbb2]">
              {t.deleteSelectedTitle}
            </h2>

            <div className="mb-5">
              <p className="text-sm text-[#7c6f64] dark:text-[#a89984]">
                {topluSilmeSeciliOgeler.length} - {t.deleteSelectedConfirmText}
              </p>

              <div className="mt-3 rounded-lg border border-[#d5c4a1] bg-[#ebdbb2] p-3 dark:border-[#504945] dark:bg-[#3c3836]">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#7c6f64] dark:text-[#a89984]">
                  {t.selectedItemsPreview}
                </p>

                <div className="space-y-1">
                  {topluSilmeSeciliOgeler.slice(0, 5).map((oge) => (
                    <p
                      key={`${oge.klasorMu ? "klasor" : "dosya"}:${oge.ad}`}
                      className="flex items-center gap-2 truncate text-xs text-[#3c3836] dark:text-[#ebdbb2]"
                    >
                      {oge.klasorMu ? (
                        <svg
                          className="h-4 w-4 shrink-0 text-[#458588] dark:text-[#83a598]"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                        </svg>
                      ) : (
                        <svg
                          className="h-4 w-4 shrink-0 text-[#a89984]"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM13 9V3.5L18.5 9H13z" />
                        </svg>
                      )}

                      <span className="truncate">{oge.ad}</span>
                    </p>
                  ))}
                </div>

                {topluSilmeSeciliOgeler.length > 5 && (
                  <p className="mt-2 text-xs font-bold text-[#7c6f64] dark:text-[#a89984]">
                    +{topluSilmeSeciliOgeler.length - 5} {t.moreItems}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setTopluSilmeModalAcik(false)}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-[#d5c4a1] dark:bg-[#504945] hover:bg-[#a89984] dark:hover:bg-[#665c54] text-[#3c3836] dark:text-[#ebdbb2] transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>

              <button
                onClick={topluSilmeyiOnayla}
                disabled={yukleniyor}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-[#cc241d] hover:bg-[#9d0006] text-[#fbf1c7] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.confirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}
      {serverEditModalAcik && (
        <div
          onClick={sunucuDuzenlemeModaliniKapat}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-xl border border-[#d5c4a1] dark:border-[#504945] bg-[#fbf1c7] dark:bg-[#282828] text-[#3c3836] dark:text-[#ebdbb2] p-5 shadow-xl"
          >
            <h2 className="text-lg font-bold mb-1 text-[#3c3836] dark:text-[#ebdbb2]">
              {t.editServerTitle}
            </h2>

            <p className="text-sm text-[#7c6f64] dark:text-[#a89984] mb-5 truncate">
              {duzenlenecekSunucu?.takmaAd}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder={t.serverNickname}
                value={sunucuTakmaAd}
                onChange={(e) => setSunucuTakmaAd(e.target.value)}
                className="px-4 py-3 bg-[#ebdbb2] dark:bg-[#3c3836] rounded-lg border border-[#d5c4a1] dark:border-[#504945] text-sm text-[#3c3836] dark:text-[#ebdbb2] placeholder-[#928374] dark:placeholder-[#a89984] focus:outline-none"
              />

              <input
                type="text"
                placeholder={t.srvIp}
                value={sunucuIp}
                onChange={(e) => setSunucuIp(e.target.value)}
                className="px-4 py-3 bg-[#ebdbb2] dark:bg-[#3c3836] rounded-lg border border-[#d5c4a1] dark:border-[#504945] text-sm text-[#3c3836] dark:text-[#ebdbb2] placeholder-[#928374] dark:placeholder-[#a89984] focus:outline-none"
              />

              <input
                type="text"
                placeholder={t.sshUser}
                value={sunucuKullanici}
                onChange={(e) => setSunucuKullanici(e.target.value)}
                className="px-4 py-3 bg-[#ebdbb2] dark:bg-[#3c3836] rounded-lg border border-[#d5c4a1] dark:border-[#504945] text-sm text-[#3c3836] dark:text-[#ebdbb2] placeholder-[#928374] dark:placeholder-[#a89984] focus:outline-none"
              />

              <input
                type="text"
                placeholder={t.sshPort}
                value={sunucuPort}
                onChange={(e) => setSunucuPort(e.target.value)}
                className="px-4 py-3 bg-[#ebdbb2] dark:bg-[#3c3836] rounded-lg border border-[#d5c4a1] dark:border-[#504945] text-sm text-[#3c3836] dark:text-[#ebdbb2] placeholder-[#928374] dark:placeholder-[#a89984] focus:outline-none"
              />

              <select
                value={baglantiTipi}
                onChange={(e) => baglantiTipiniDegistir(e.target.value)}
                className="px-4 py-3 bg-[#ebdbb2] dark:bg-[#3c3836] rounded-lg border border-[#d5c4a1] dark:border-[#504945] text-sm text-[#3c3836] dark:text-[#ebdbb2] focus:outline-none"
              >
                <option value="password">{t.connectWithPassword}</option>
                <option value="ssh_key">{t.connectWithKey}</option>
              </select>

              <input
                type="text"
                placeholder={t.isolatedFolder}
                value={izoleKlasor}
                onChange={(e) => setIzoleKlasor(e.target.value)}
                className="px-4 py-3 bg-[#ebdbb2] dark:bg-[#3c3836] rounded-lg border border-[#d5c4a1] dark:border-[#504945] text-sm text-[#3c3836] dark:text-[#ebdbb2] placeholder-[#928374] dark:placeholder-[#a89984] focus:outline-none"
              />
            </div>

            {baglantiTipi === "password" ? (
              <input
                type="password"
                placeholder={t.srvPass}
                value={sunucuSifre}
                onChange={(e) => setSunucuSifre(e.target.value)}
                className="mt-4 w-full px-4 py-3 bg-[#ebdbb2] dark:bg-[#3c3836] rounded-lg border border-[#d5c4a1] dark:border-[#504945] text-sm text-[#3c3836] dark:text-[#ebdbb2] placeholder-[#928374] dark:placeholder-[#a89984] focus:outline-none"
              />
            ) : (
              <textarea
                placeholder={t.sshPrivateKey}
                value={sshPrivateKey}
                onChange={(e) => setSshPrivateKey(e.target.value)}
                className="mt-4 w-full min-h-32 px-4 py-3 bg-[#ebdbb2] dark:bg-[#3c3836] rounded-lg border border-[#d5c4a1] dark:border-[#504945] text-sm text-[#3c3836] dark:text-[#ebdbb2] placeholder-[#928374] dark:placeholder-[#a89984] focus:outline-none"
              />
            )}

            <p className="mt-3 text-xs text-[#7c6f64] dark:text-[#a89984]">
              {t.serverCredentialsOptional}
            </p>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={sunucuDuzenlemeModaliniKapat}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-[#d5c4a1] dark:bg-[#504945] hover:bg-[#a89984] dark:hover:bg-[#665c54] text-[#3c3836] dark:text-[#ebdbb2] transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>

              <button
                onClick={sunucuGuncelle}
                disabled={yukleniyor}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-[#458588] dark:bg-[#83a598] hover:bg-[#076678] dark:hover:bg-[#458588] text-[#fbf1c7] dark:text-[#282828] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.saveServerChanges}
              </button>
            </div>
          </div>
        </div>
      )}
      <div
        onClick={() => {
          setAcikMenuIndex(null);
          setAyarMenusuAcik(false);
        }}
        className="min-h-screen bg-[#fbf1c7] dark:bg-[#282828] text-[#3c3836] dark:text-[#ebdbb2] font-sans transition-colors duration-200"
      >
        <header
          className={
            girisYapildi
              ? "hidden"
              : "sticky top-0 z-10 bg-[#fbf1c7] dark:bg-[#282828] border-b border-[#d5c4a1] dark:border-[#3c3836] px-6 py-4 flex justify-between items-center"
          }
        >
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

          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setAyarMenusuAcik((acik) => !acik);
              }}
              className="flex items-center gap-2 rounded-lg border border-[#d5c4a1] bg-[#ebdbb2] px-3 py-2 text-sm font-bold text-[#3c3836] transition-colors hover:border-[#458588] dark:border-[#504945] dark:bg-[#3c3836] dark:text-[#ebdbb2] dark:hover:border-[#83a598]"
            >
              {girisYapildi ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#458588] text-xs font-black text-[#fbf1c7] dark:bg-[#83a598] dark:text-[#282828]">
                  {kullaniciAdi ? kullaniciAdi.charAt(0).toUpperCase() : "P"}
                </span>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.607 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
                  />
                </svg>
              )}

              <span className="hidden sm:inline">{t.settings}</span>
            </button>

            {ayarMenusuAcik && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-xl border border-[#d5c4a1] bg-[#fbf1c7] shadow-xl dark:border-[#504945] dark:bg-[#282828]"
              >
                <button
                  type="button"
                  onClick={() => {
                    setDil(dil === "en" ? "tr" : "en");
                    setAyarMenusuAcik(false);
                  }}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold text-[#3c3836] transition-colors hover:bg-[#ebdbb2] dark:text-[#ebdbb2] dark:hover:bg-[#3c3836]"
                >
                  <span>{t.language}</span>

                  <span className="text-[#458588] dark:text-[#83a598]">
                    {dil === "en" ? "English" : "Türkçe"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setKaranlikMod(!karanlikMod);
                    setAyarMenusuAcik(false);
                  }}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold text-[#3c3836] transition-colors hover:bg-[#ebdbb2] dark:text-[#ebdbb2] dark:hover:bg-[#3c3836]"
                >
                  <span>{t.theme}</span>

                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ebdbb2] text-[#458588] dark:bg-[#3c3836] dark:text-[#83a598]"
                    title={karanlikMod ? t.darkMode : t.lightMode}
                    aria-label={karanlikMod ? t.darkMode : t.lightMode}
                  >
                    {karanlikMod ? (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.36 6.36-.7-.7M6.34 6.34l-.7-.7m12.02 0-.7.7M6.34 17.66l-.7.7M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"
                        />
                      </svg>
                    )}
                  </span>
                </button>

                {girisYapildi && (
                  <button
                    type="button"
                    onClick={() => {
                      setAyarMenusuAcik(false);
                      cikisYap();
                    }}
                    disabled={yukleniyor}
                    className="flex w-full items-center px-4 py-3 text-left text-sm font-bold text-[#cc241d] transition-colors hover:bg-[#ebdbb2] disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-[#3c3836]"
                  >
                    <span>{t.logout}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </header>
        {girisYapildi && (
          <aside
            onClick={(e) => e.stopPropagation()}
            className={`fixed left-0 top-0 bottom-0 z-30 hidden flex-col border-r border-[#d5c4a1]/80 bg-[#ebdbb2]/95 text-[#3c3836] shadow-xl backdrop-blur-xl transition-all duration-200 dark:border-[#504945] dark:bg-[#282828]/95 dark:text-[#ebdbb2] lg:flex ${
              solPanelAcik ? "w-80" : "w-16"
            }`}
          >
            <div
              className={`flex h-16 items-center border-b border-[#d5c4a1]/80 dark:border-[#3c3836] ${
                solPanelAcik ? "justify-between px-3" : "justify-center px-2"
              }`}
            >
              {solPanelAcik ? (
                <>
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#458588] text-[#fbf1c7] dark:bg-[#83a598] dark:text-[#282828]">
                      <svg
                        className="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M19.35 10.04A7.49 7.49 0 0 0 5.64 7.11 5.994 5.994 0 0 0 6 19h13a4.996 4.996 0 0 0 .35-8.96z" />
                      </svg>
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-black tracking-wide">
                        PionterCloud
                      </p>
                      <p className="truncate text-xs text-[#7c6f64] dark:text-[#a89984]">
                        {t.servers}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSolPanelAcik(false);
                    }}
                    className="group relative flex h-9 w-9 items-center justify-center overflow-visible rounded-lg border border-[#d5c4a1] bg-[#fbf1c7] text-[#3c3836] transition-colors hover:border-[#458588] dark:border-[#504945] dark:bg-[#282828] dark:text-[#ebdbb2] dark:hover:border-[#83a598]"
                    aria-label={t.closeSidebar}
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <rect
                        x="3"
                        y="4"
                        width="18"
                        height="16"
                        rx="2"
                        strokeWidth="2"
                      />
                      <path d="M9 4v16" strokeWidth="2" />
                    </svg>

                    <span className="pointer-events-none absolute right-0 top-11 z-[9999] whitespace-nowrap rounded-lg border border-[#d5c4a1] bg-[#fbf1c7] px-3 py-2 text-xs font-bold text-[#3c3836] opacity-0 shadow-xl transition-opacity group-hover:opacity-100 dark:border-[#504945] dark:bg-[#282828] dark:text-[#ebdbb2]">
                      {t.closeSidebar}
                    </span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSolPanelAcik(true);
                  }}
                  className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#d5c4a1] bg-[#fbf1c7] text-[#458588] transition-colors hover:border-[#458588] dark:border-[#504945] dark:bg-[#282828] dark:text-[#83a598] dark:hover:border-[#83a598]"
                  title={t.openSidebar}
                  aria-label={t.openSidebar}
                >
                  <svg
                    className="h-5 w-5 group-hover:hidden"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19.35 10.04A7.49 7.49 0 0 0 5.64 7.11 5.994 5.994 0 0 0 6 19h13a4.996 4.996 0 0 0 .35-8.96z" />
                  </svg>

                  <svg
                    className="hidden h-5 w-5 group-hover:block"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="16"
                      rx="2"
                      strokeWidth="2"
                    />
                    <path d="M9 4v16" strokeWidth="2" />
                  </svg>

                  <span className="pointer-events-none absolute left-12 top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg border border-[#d5c4a1] bg-[#fbf1c7] px-3 py-2 text-xs font-bold text-[#3c3836] opacity-0 shadow-xl transition-opacity group-hover:opacity-100 dark:border-[#504945] dark:bg-[#282828] dark:text-[#ebdbb2]">
                    {t.openSidebar}
                  </span>
                </button>
              )}
            </div>

            {solPanelAcik && (
              <div className="border-b border-[#d5c4a1]/80 px-3 py-3 dark:border-[#3c3836]">
                <button
                  type="button"
                  onClick={() => {
                    sunucularaDon();
                    setSolPanelAcik(false);
                  }}
                  disabled={yukleniyor}
                  className="w-full rounded-xl border border-[#d5c4a1] bg-[#fbf1c7] px-3 py-2 text-sm font-bold text-[#3c3836] transition-colors hover:border-[#458588] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#504945] dark:bg-[#282828] dark:text-[#ebdbb2] dark:hover:border-[#83a598]"
                >
                  {t.backToServers}
                </button>
              </div>
            )}

            <div
              className={`flex-1 p-3 custom-scrollbar ${
                solPanelAcik ? "overflow-y-auto" : "overflow-visible"
              }`}
            >
              {solPanelAcik && (
                <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wide text-[#7c6f64] dark:text-[#a89984]">
                  {t.servers}
                </p>
              )}

              <div className="space-y-2">
                {sunucular.length === 0 && (
                  <button
                    type="button"
                    onClick={sunucuEklemeEkraniniAc}
                    disabled={yukleniyor}
                    className={
                      solPanelAcik
                        ? "flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#a89984] bg-[#fbf1c7]/70 px-4 py-8 text-center transition-colors hover:border-[#458588] hover:bg-[#fbf1c7] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#504945] dark:bg-[#282828]/70 dark:hover:border-[#83a598] dark:hover:bg-[#282828]"
                        : "group relative mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-[#a89984] text-xl font-black text-[#458588] transition-colors hover:border-[#458588] hover:bg-[#fbf1c7] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#504945] dark:text-[#83a598] dark:hover:border-[#83a598] dark:hover:bg-[#282828]"
                    }
                    aria-label={t.addServer}
                  >
                    {solPanelAcik ? (
                      <>
                        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#458588] text-2xl font-black text-[#fbf1c7] dark:bg-[#83a598] dark:text-[#282828]">
                          +
                        </span>

                        <span className="text-sm font-black text-[#3c3836] dark:text-[#ebdbb2]">
                          {t.addServer}
                        </span>

                        <span className="mt-1 text-xs text-[#7c6f64] dark:text-[#a89984]">
                          {t.noServersYet}
                        </span>
                      </>
                    ) : (
                      <>
                        +
                        <span className="pointer-events-none fixed left-[4.75rem] z-[999] whitespace-nowrap rounded-lg border border-[#d5c4a1] bg-[#fbf1c7] px-3 py-2 text-xs font-bold text-[#3c3836] opacity-0 shadow-xl transition-opacity group-hover:opacity-100 dark:border-[#504945] dark:bg-[#282828] dark:text-[#ebdbb2]">
                          {t.addServer}
                        </span>
                      </>
                    )}
                  </button>
                )}
                {sunucular.map((sunucu) => {
                  const aktifMi = seciliSunucu?.id === sunucu.id;
                  const onizlemeOgeleri =
                    aktifMi && dosyalar.length > 0 ? dosyalar.slice(0, 3) : [];

                  return (
                    <button
                      key={sunucu.id}
                      type="button"
                      onClick={() => {
                        if (!aktifMi) {
                          sunucuSec(sunucu);
                        }
                      }}
                      disabled={yukleniyor}
                      className={`group relative rounded-xl text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        solPanelAcik
                          ? `w-full border px-3 py-3 ${
                              aktifMi
                                ? "border-[#458588] bg-[#d5c4a1] dark:border-[#83a598] dark:bg-[#282828]"
                                : "border-transparent hover:border-[#458588] hover:bg-[#fbf1c7] dark:hover:border-[#83a598] dark:hover:bg-[#282828]"
                            }`
                          : `mx-auto flex h-10 w-10 items-center justify-center p-0 ${
                              aktifMi
                                ? "bg-[#458588] text-[#fbf1c7] hover:bg-[#076678] dark:bg-[#83a598] dark:text-[#282828] dark:hover:bg-[#458588]"
                                : "bg-[#fbf1c7] text-[#3c3836] hover:bg-[#d5c4a1] dark:bg-[#282828] dark:text-[#ebdbb2] dark:hover:bg-[#3c3836]"
                            }`
                      }`}
                    >
                      <div
                        className={`flex items-center ${
                          solPanelAcik
                            ? "gap-3"
                            : "h-full w-full justify-center"
                        }`}
                      >
                        <span
                          className={`flex shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                            solPanelAcik
                              ? "h-9 w-9 bg-[#458588] text-[#fbf1c7] dark:bg-[#83a598] dark:text-[#282828]"
                              : "h-full w-full bg-transparent text-current"
                          }`}
                        >
                          {sunucu.sabitli
                            ? "★"
                            : sunucu.takmaAd?.charAt(0)?.toUpperCase() || "S"}
                        </span>

                        {!solPanelAcik && (
                          <span className="pointer-events-none fixed left-[4.75rem] z-[999] whitespace-nowrap rounded-lg border border-[#d5c4a1] bg-[#fbf1c7] px-3 py-2 text-xs font-bold text-[#3c3836] opacity-0 shadow-xl transition-opacity group-hover:opacity-100 dark:border-[#504945] dark:bg-[#282828] dark:text-[#ebdbb2]">
                            {sunucu.takmaAd}
                          </span>
                        )}

                        {solPanelAcik && (
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold">
                              {sunucu.takmaAd}
                            </span>
                            <span className="block truncate text-xs text-[#7c6f64] dark:text-[#a89984]">
                              {sunucu.kullanici}@{sunucu.ip}:
                              {sunucu.port || "22"}
                            </span>
                          </span>
                        )}
                      </div>

                      {solPanelAcik && aktifMi && (
                        <div className="mt-3 rounded-lg border border-[#d5c4a1] bg-[#fbf1c7] px-3 py-2 dark:border-[#504945] dark:bg-[#1d2021]">
                          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#7c6f64] dark:text-[#a89984]">
                            {t.serverPreview}
                          </p>

                          {onizlemeOgeleri.length > 0 ? (
                            <div className="space-y-1">
                              {onizlemeOgeleri.map((oge) => (
                                <p
                                  key={`${oge.klasorMu ? "klasor" : "dosya"}:${oge.ad}`}
                                  className="flex items-center gap-2 truncate text-xs text-[#3c3836] dark:text-[#ebdbb2]"
                                >
                                  {oge.klasorMu ? (
                                    <svg
                                      className="h-4 w-4 shrink-0 text-[#458588] dark:text-[#83a598]"
                                      fill="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                                    </svg>
                                  ) : (
                                    <svg
                                      className="h-4 w-4 shrink-0 text-[#a89984]"
                                      fill="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM13 9V3.5L18.5 9H13z" />
                                    </svg>
                                  )}

                                  <span className="truncate">{oge.ad}</span>
                                </p>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-[#928374] dark:text-[#a89984]">
                              {t.noPreview}
                            </p>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {solPanelAcik && sunucular.length > 0 && (
                <button
                  type="button"
                  onClick={sunucuEklemeEkraniniAc}
                  disabled={yukleniyor}
                  className="mt-5 flex h-11 w-full items-center justify-center rounded-xl border border-dashed border-[#a89984] bg-transparent text-xl font-black text-[#458588] transition-colors hover:border-[#458588] hover:bg-[#fbf1c7] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#504945] dark:text-[#83a598] dark:hover:border-[#83a598] dark:hover:bg-[#282828]"
                  title={t.addServer}
                  aria-label={t.addServer}
                >
                  +
                </button>
              )}
            </div>

            <div className="border-t border-[#d5c4a1]/80 px-2 py-3 dark:border-[#504945]">
              {solPanelAcik ? (
                <div className="rounded-xl border border-[#d5c4a1] bg-[#fbf1c7] p-3 dark:border-[#504945] dark:bg-[#3c3836]">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#458588] text-xs font-black text-[#fbf1c7] dark:bg-[#83a598] dark:text-[#282828]">
                      {kullaniciAdi
                        ? kullaniciAdi.charAt(0).toUpperCase()
                        : "P"}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">
                        {kullaniciAdi || "Pionter"}
                      </p>
                      <p className="truncate text-xs text-[#7c6f64] dark:text-[#a89984]">
                        {t.settings}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setDil(dil === "en" ? "tr" : "en")}
                      className="rounded-lg bg-[#ebdbb2] px-2 py-2 text-xs font-bold transition-colors hover:bg-[#d5c4a1] dark:bg-[#282828] dark:hover:bg-[#504945]"
                    >
                      {dil === "en" ? "EN" : "TR"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setKaranlikMod(!karanlikMod)}
                      className="flex items-center justify-center rounded-lg bg-[#ebdbb2] px-2 py-2 transition-colors hover:bg-[#d5c4a1] dark:bg-[#282828] dark:hover:bg-[#504945]"
                      aria-label={karanlikMod ? t.darkMode : t.lightMode}
                    >
                      {karanlikMod ? (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.36 6.36-.7-.7M6.34 6.34l-.7-.7m12.02 0-.7.7M6.34 17.66l-.7.7M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"
                          />
                        </svg>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={cikisYap}
                      disabled={yukleniyor}
                      className="rounded-lg bg-[#ebdbb2] px-2 py-2 text-xs font-bold text-[#cc241d] transition-colors hover:bg-[#d5c4a1] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#282828] dark:hover:bg-[#504945]"
                    >
                      {t.logout}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setSolPanelAcik(true)}
                    className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#458588] text-xs font-black text-[#fbf1c7] transition-colors hover:bg-[#076678] dark:bg-[#83a598] dark:text-[#282828] dark:hover:bg-[#458588]"
                    aria-label={kullaniciAdi || "Profile"}
                  >
                    {kullaniciAdi ? kullaniciAdi.charAt(0).toUpperCase() : "P"}

                    <span className="pointer-events-none fixed left-[4.75rem] z-[999] whitespace-nowrap rounded-lg border border-[#d5c4a1] bg-[#fbf1c7] px-3 py-2 text-xs font-bold text-[#3c3836] opacity-0 shadow-xl transition-opacity group-hover:opacity-100 dark:border-[#504945] dark:bg-[#282828] dark:text-[#ebdbb2]">
                      {kullaniciAdi || "Profile"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </aside>
        )}
        <main
          className={
            girisYapildi
              ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:pl-24 py-8"
              : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
          }
        >
          {girisYapildi && !seciliSunucu && (
            <div className="mb-8 rounded-xl border border-[#d5c4a1] dark:border-[#504945] bg-[#ebdbb2] dark:bg-[#3c3836] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">{t.myServers}</h2>

                  {sunucular.length === 0 && (
                    <p className="mt-1 text-sm text-[#7c6f64] dark:text-[#a89984]">
                      {t.serversDraftInfo}
                    </p>
                  )}
                </div>
              </div>
              {sunucuFormAcik && (
                <div className="mb-6 rounded-xl border border-[#d5c4a1] dark:border-[#504945] bg-[#fbf1c7] dark:bg-[#282828] p-5">
                  <h3 className="text-lg font-bold mb-4">{t.newServer}</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder={t.serverNickname}
                      value={sunucuTakmaAd}
                      onChange={(e) => setSunucuTakmaAd(e.target.value)}
                      className="px-4 py-3 bg-[#ebdbb2] dark:bg-[#3c3836] rounded-lg border border-[#d5c4a1] dark:border-[#504945] text-sm text-[#3c3836] dark:text-[#ebdbb2] placeholder-[#928374] dark:placeholder-[#a89984] focus:outline-none"
                    />

                    <input
                      type="text"
                      placeholder={t.srvIp}
                      value={sunucuIp}
                      onChange={(e) => setSunucuIp(e.target.value)}
                      className="px-4 py-3 bg-[#ebdbb2] dark:bg-[#3c3836] rounded-lg border border-[#d5c4a1] dark:border-[#504945] text-sm text-[#3c3836] dark:text-[#ebdbb2] placeholder-[#928374] dark:placeholder-[#a89984] focus:outline-none"
                    />

                    <input
                      type="text"
                      placeholder={t.sshUser}
                      value={sunucuKullanici}
                      onChange={(e) => setSunucuKullanici(e.target.value)}
                      className="px-4 py-3 bg-[#ebdbb2] dark:bg-[#3c3836] rounded-lg border border-[#d5c4a1] dark:border-[#504945] text-sm text-[#3c3836] dark:text-[#ebdbb2] placeholder-[#928374] dark:placeholder-[#a89984] focus:outline-none"
                    />

                    <input
                      type="text"
                      placeholder={t.sshPort}
                      value={sunucuPort}
                      onChange={(e) => setSunucuPort(e.target.value)}
                      className="px-4 py-3 bg-[#ebdbb2] dark:bg-[#3c3836] rounded-lg border border-[#d5c4a1] dark:border-[#504945] text-sm text-[#3c3836] dark:text-[#ebdbb2] placeholder-[#928374] dark:placeholder-[#a89984] focus:outline-none"
                    />

                    <select
                      value={baglantiTipi}
                      onChange={(e) => baglantiTipiniDegistir(e.target.value)}
                      className="px-4 py-3 bg-[#ebdbb2] dark:bg-[#3c3836] rounded-lg border border-[#d5c4a1] dark:border-[#504945] text-sm text-[#3c3836] dark:text-[#ebdbb2] placeholder-[#928374] dark:placeholder-[#a89984] focus:outline-none"
                    >
                      <option value="password">{t.connectWithPassword}</option>
                      <option value="ssh_key">{t.connectWithKey}</option>
                    </select>

                    <input
                      type="text"
                      placeholder={t.isolatedFolder}
                      value={izoleKlasor}
                      onChange={(e) => setIzoleKlasor(e.target.value)}
                      className="px-4 py-3 bg-[#ebdbb2] dark:bg-[#3c3836] rounded-lg border border-[#d5c4a1] dark:border-[#504945] text-sm text-[#3c3836] dark:text-[#ebdbb2] placeholder-[#928374] dark:placeholder-[#a89984] focus:outline-none"
                    />
                  </div>

                  {baglantiTipi === "password" ? (
                    <input
                      type="password"
                      placeholder={t.srvPass}
                      value={sunucuSifre}
                      onChange={(e) => setSunucuSifre(e.target.value)}
                      className="mt-4 w-full px-4 py-3 bg-[#ebdbb2] dark:bg-[#3c3836] rounded-lg border border-[#d5c4a1] dark:border-[#504945] text-sm text-[#3c3836] dark:text-[#ebdbb2] placeholder-[#928374] dark:placeholder-[#a89984] focus:outline-none"
                    />
                  ) : (
                    <textarea
                      placeholder={t.sshPrivateKey}
                      value={sshPrivateKey}
                      onChange={(e) => setSshPrivateKey(e.target.value)}
                      className="mt-4 w-full min-h-32 px-4 py-3 bg-[#ebdbb2] dark:bg-[#3c3836] rounded-lg border border-[#d5c4a1] dark:border-[#504945] text-sm text-[#3c3836] dark:text-[#ebdbb2] placeholder-[#928374] dark:placeholder-[#a89984] focus:outline-none"
                    />
                  )}

                  <div className="flex justify-end gap-3 mt-5">
                    <button
                      onClick={() => {
                        sunucuFormunuTemizle();
                        setSunucuFormAcik(false);
                      }}
                      className="px-4 py-2 rounded-lg text-sm font-bold bg-[#d5c4a1] dark:bg-[#504945] hover:bg-[#a89984] dark:hover:bg-[#665c54] transition-colors cursor-pointer"
                    >
                      {t.cancel}
                    </button>

                    <button
                      onClick={sunucuKaydet}
                      disabled={yukleniyor}
                      className="px-4 py-2 rounded-lg text-sm font-bold bg-[#458588] dark:bg-[#83a598] hover:bg-[#076678] dark:hover:bg-[#458588] text-[#fbf1c7] dark:text-[#282828] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {yukleniyor ? t.savingServer : t.save}
                    </button>
                  </div>
                </div>
              )}
              {sunucular.length === 0 ? (
                <button
                  type="button"
                  onClick={sunucuEklemeEkraniniAc}
                  disabled={yukleniyor}
                  title={t.addServer}
                  aria-label={t.addServer}
                  className="flex min-h-[110px] w-full items-center justify-center rounded-lg border border-dashed border-[#a89984] bg-transparent text-2xl font-black text-[#458588] transition-colors hover:border-[#458588] hover:bg-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#7c6f64] dark:text-[#83a598] dark:hover:border-[#83a598] dark:hover:bg-transparent"
                >
                  +
                </button>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sunucular.map((sunucu) => (
                    <div
                      key={sunucu.id}
                      onClick={() => sunucuSec(sunucu)}
                      className="rounded-xl border border-[#d5c4a1] dark:border-[#504945] bg-[#fbf1c7] dark:bg-[#282828] p-4 cursor-pointer hover:scale-[1.01] transition-transform"
                    >
                      <div className="mb-1 flex items-start justify-between gap-3">
                        <h3 className="font-bold text-lg truncate">
                          {sunucu.takmaAd}
                        </h3>

                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              sunucuSabitlemeDegistir(sunucu);
                            }}
                            className={`rounded-md px-2 py-1 text-xs font-bold transition-colors cursor-pointer hover:bg-[#d5c4a1] dark:hover:bg-[#504945] ${
                              sunucu.sabitli
                                ? "text-[#d79921]"
                                : "text-[#7c6f64] dark:text-[#a89984]"
                            }`}
                          >
                            {sunucu.sabitli ? t.unpinServer : t.pinServer}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              sunucuDuzenlemeModaliniAc(sunucu);
                            }}
                            className="rounded-md px-2 py-1 text-xs font-bold text-[#458588] dark:text-[#83a598] hover:bg-[#d5c4a1] dark:hover:bg-[#504945] transition-colors cursor-pointer"
                          >
                            {t.editServer}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              sunucuSilmeModaliniAc(sunucu);
                            }}
                            className="rounded-md px-2 py-1 text-xs font-bold text-[#cc241d] hover:bg-[#d5c4a1] dark:hover:bg-[#504945] transition-colors cursor-pointer"
                          >
                            {t.deleteItem}
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-[#7c6f64] dark:text-[#a89984]">
                        {sunucu.kullanici}@{sunucu.ip}:{sunucu.port}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-[#928374] dark:text-[#a89984]">
                        <span className="truncate">
                          {sunucu.izoleKlasor} · {sunucu.baglantiTipi}
                        </span>

                        {sunucu.sabitli && (
                          <span className="shrink-0 rounded-full bg-[#d79921]/20 px-2 py-0.5 font-bold text-[#d79921]">
                            {t.pinnedServer}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {!girisYapildi && (
            <div className="min-h-[70vh] flex items-center justify-center">
              <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="text-center lg:text-left">
                  <div className="inline-flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#458588] dark:bg-[#83a598] flex items-center justify-center shadow-sm">
                      <svg
                        className="w-7 h-7 text-[#fbf1c7] dark:text-[#282828]"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
                      </svg>
                    </div>

                    <h2 className="text-3xl font-black tracking-tight">
                      Pionter
                      <span className="text-[#458588] dark:text-[#83a598]">
                        Cloud
                      </span>
                    </h2>
                  </div>

                  <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-4 text-[#3c3836] dark:text-[#ebdbb2]">
                    {t.authTitle}
                  </h1>

                  <p className="text-base lg:text-lg text-[#7c6f64] dark:text-[#a89984] max-w-xl mx-auto lg:mx-0">
                    {t.authSubtitle}
                  </p>
                </div>

                <div className="w-full max-w-md mx-auto">
                  <div className="rounded-2xl border border-[#d5c4a1] dark:border-[#504945] bg-[#ebdbb2] dark:bg-[#3c3836] p-6 shadow-lg">
                    <div className="mb-6">
                      <h2 className="text-2xl font-black mb-2">
                        {isLogin ? t.loginTitle : t.registerTitle}
                      </h2>

                      <p className="text-sm text-[#7c6f64] dark:text-[#a89984]">
                        {isLogin ? t.loginInfo : t.registerInfo}
                      </p>
                    </div>

                    <div className="flex flex-col gap-4">
                      <input
                        type="text"
                        placeholder={
                          isLogin
                            ? t.loginIdentifierPlaceholder
                            : t.registerUsernamePlaceholder
                        }
                        value={kullaniciAdi}
                        onChange={(e) => setKullaniciAdi(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            isLogin ? baglantiyiBaslat() : yeniKayitOlustur();
                          }
                        }}
                        className="w-full px-4 py-3 bg-[#fbf1c7] dark:bg-[#282828] rounded-lg border border-[#d5c4a1] dark:border-[#504945] text-sm text-[#3c3836] dark:text-[#ebdbb2] placeholder-[#928374] dark:placeholder-[#a89984] focus:outline-none"
                      />

                      {!isLogin && (
                        <input
                          type="email"
                          placeholder={t.emailPlaceholder}
                          value={eposta}
                          onChange={(e) => setEposta(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              yeniKayitOlustur();
                            }
                          }}
                          className="px-4 py-3 bg-[#fbf1c7] dark:bg-[#282828] rounded-lg border border-[#d5c4a1] dark:border-[#504945] text-sm text-[#3c3836] dark:text-[#ebdbb2] placeholder-[#928374] dark:placeholder-[#a89984] focus:outline-none"
                        />
                      )}

                      <input
                        type="password"
                        placeholder={t.passPlaceholder}
                        value={sifre}
                        onChange={(e) => setSifre(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            isLogin ? baglantiyiBaslat() : yeniKayitOlustur();
                          }
                        }}
                        className="w-full px-4 py-3 bg-[#fbf1c7] dark:bg-[#282828] rounded-lg border border-[#d5c4a1] dark:border-[#504945] text-sm text-[#3c3836] dark:text-[#ebdbb2] placeholder-[#928374] dark:placeholder-[#a89984] focus:outline-none"
                      />

                      <button
                        onClick={isLogin ? baglantiyiBaslat : yeniKayitOlustur}
                        disabled={yukleniyor}
                        className={`w-full px-5 py-3 rounded-lg text-sm font-black transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                          isLogin
                            ? "bg-[#458588] dark:bg-[#83a598] hover:bg-[#076678] dark:hover:bg-[#458588] text-[#fbf1c7] dark:text-[#282828]"
                            : "bg-[#d79921] hover:bg-[#b57614] text-[#fbf1c7]"
                        }`}
                      >
                        {yukleniyor
                          ? isLogin
                            ? t.loadingServers
                            : t.registeringAccount
                          : isLogin
                            ? t.connectBtn
                            : t.registerBtn}
                      </button>
                    </div>

                    <div className="mt-6 pt-5 border-t border-[#d5c4a1] dark:border-[#504945] text-center">
                      <button
                        onClick={girisKayitModunuDegistir}
                        disabled={yukleniyor}
                        className="text-sm font-bold text-[#7c6f64] dark:text-[#a89984] hover:text-[#458588] dark:hover:text-[#83a598] transition-colors underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLogin ? t.switchToReg : t.switchToLogin}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <input
            ref={dosyaGirdiRef}
            type="file"
            multiple
            onChange={butonlaSecildi}
            className="hidden"
          />

          <div
            className={
              seciliSunucu ? "min-h-[calc(100vh-8rem)] pb-10" : "hidden"
            }
          >
            {surukleniyor && seciliSunucu && !yukleniyor && (
              <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center bg-black/50 px-4">
                <div className="rounded-2xl border-2 border-dashed border-[#83a598] bg-[#282828] px-8 py-6 text-center shadow-2xl">
                  <p className="text-lg font-bold text-[#ebdbb2]">
                    {t.dropFilesToUpload}
                  </p>

                  <p className="mt-2 text-sm text-[#a89984]">
                    {t.releaseMouseToUpload}
                  </p>
                </div>
              </div>
            )}
            {seciliSunucu && (
              <div className="mb-4 rounded-xl border border-[#d5c4a1] bg-[#ebdbb2] p-4 text-[#3c3836] dark:border-[#504945] dark:bg-[#3c3836] dark:text-[#ebdbb2]">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#7c6f64] dark:text-[#a89984]">
                      {t.selectedServer}
                    </p>

                    <h2 className="truncate text-base font-black text-[#3c3836] dark:text-[#ebdbb2]">
                      {seciliSunucu.takmaAd}
                    </h2>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => sunucuStatsGetir()}
                      disabled={sunucuStatsYukleniyor || yukleniyor}
                      className="rounded-lg border border-[#d5c4a1] bg-[#fbf1c7] px-4 py-2 text-sm font-bold text-[#3c3836] transition-colors hover:border-[#458588] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#504945] dark:bg-[#282828] dark:text-[#ebdbb2] dark:hover:border-[#83a598]"
                    >
                      {sunucuStatsYukleniyor ? t.loadingStats : t.refreshStats}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sunucularaDon();
                        setSolPanelAcik(false);
                      }}
                      disabled={yukleniyor}
                      className="rounded-lg border border-[#d5c4a1] bg-[#fbf1c7] px-4 py-2 text-sm font-bold text-[#3c3836] transition-colors hover:border-[#458588] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#504945] dark:bg-[#282828] dark:text-[#ebdbb2] dark:hover:border-[#83a598]"
                    >
                      {t.backToServers}
                    </button>
                  </div>
                </div>

                {sunucuStatsYukleniyor && !sunucuStats ? (
                  <p className="text-sm text-[#7c6f64] dark:text-[#a89984]">
                    {t.loadingStats}
                  </p>
                ) : sunucuStatsHatasi && !sunucuStats ? (
                  <p className="text-sm font-bold text-[#cc241d]">
                    {t.statsLoadFailed}
                  </p>
                ) : sunucuStats ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex min-h-[96px] flex-col rounded-lg border border-[#d5c4a1] bg-[#fbf1c7] p-3 dark:border-[#504945] dark:bg-[#282828]">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#7c6f64] dark:text-[#a89984]">
                        {t.cpuUsage}
                      </p>
                      <p className="mt-2 text-xl font-black">
                        {sunucuStats.cpu_yuzde}%
                      </p>
                      <div className="mt-auto pt-3">
                        <div className="h-1.5 overflow-hidden rounded-full bg-[#d5c4a1] dark:bg-[#504945]">
                          <div
                            className="h-full rounded-full bg-[#458588] dark:bg-[#83a598]"
                            style={{
                              width: `${yuzdeSinirla(sunucuStats.cpu_yuzde)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex min-h-[96px] flex-col rounded-lg border border-[#d5c4a1] bg-[#fbf1c7] p-3 dark:border-[#504945] dark:bg-[#282828]">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#7c6f64] dark:text-[#a89984]">
                        {t.ramUsage}
                      </p>
                      <p className="mt-2 text-xl font-black">
                        {sunucuStats.ram_yuzde}%
                      </p>
                      <p className="mt-2 text-xs text-[#7c6f64] dark:text-[#a89984]">
                        {megabaytYaz(sunucuStats.ram_kullanilan)} /{" "}
                        {megabaytYaz(sunucuStats.ram_toplam)} {t.used}
                      </p>
                      <div className="mt-auto pt-3">
                        <div className="h-1.5 overflow-hidden rounded-full bg-[#d5c4a1] dark:bg-[#504945]">
                          <div
                            className="h-full rounded-full bg-[#458588] dark:bg-[#83a598]"
                            style={{
                              width: `${yuzdeSinirla(sunucuStats.ram_yuzde)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex min-h-[96px] flex-col rounded-lg border border-[#d5c4a1] bg-[#fbf1c7] p-3 dark:border-[#504945] dark:bg-[#282828]">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#7c6f64] dark:text-[#a89984]">
                        {t.diskUsage}
                      </p>
                      <p className="mt-2 text-xl font-black">
                        {sunucuStats.disk_yuzde}%
                      </p>
                      <p className="mt-2 text-xs text-[#7c6f64] dark:text-[#a89984]">
                        {megabaytYaz(sunucuStats.disk_kullanilan)} /{" "}
                        {megabaytYaz(sunucuStats.disk_toplam)} {t.used}
                      </p>
                      <div className="mt-auto pt-3">
                        <div className="h-1.5 overflow-hidden rounded-full bg-[#d5c4a1] dark:bg-[#504945]">
                          <div
                            className="h-full rounded-full bg-[#458588] dark:bg-[#83a598]"
                            style={{
                              width: `${yuzdeSinirla(sunucuStats.disk_yuzde)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex min-h-[96px] flex-col rounded-lg border border-[#d5c4a1] bg-[#fbf1c7] p-3 dark:border-[#504945] dark:bg-[#282828]">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#7c6f64] dark:text-[#a89984]">
                        {t.uptime}
                      </p>

                      <p className="mt-2 line-clamp-2 text-sm font-black">
                        {sunucuStats.uptime || "-"}
                      </p>

                      <div className="mt-auto pt-3">
                        <span className="inline-flex items-center rounded-full bg-[#d5c4a1] px-2 py-0.5 text-xs font-bold text-[#3c3836] dark:bg-[#504945] dark:text-[#ebdbb2]">
                          {t.serverReachable}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[#7c6f64] dark:text-[#a89984]">
                    {t.loadingStats}
                  </p>
                )}
              </div>
            )}
            <div className="mb-4 rounded-xl border border-[#d5c4a1] bg-[#ebdbb2] p-3 dark:border-[#504945] dark:bg-[#3c3836]">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={aramaMetni}
                  onChange={(e) => setAramaMetni(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-[#d5c4a1] bg-[#fbf1c7] px-4 py-3 text-sm text-[#3c3836] placeholder-[#928374] focus:outline-none dark:border-[#504945] dark:bg-[#282828] dark:text-[#ebdbb2] dark:placeholder-[#a89984]"
                />

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {seciliOgeAnahtarlari.length > 0 ? (
                    <>
                      <span className="rounded-lg border border-[#d5c4a1] bg-[#fbf1c7] px-3 py-3 text-sm font-bold text-[#3c3836] dark:border-[#504945] dark:bg-[#282828] dark:text-[#ebdbb2]">
                        {seciliOgeAnahtarlari.length} {t.selectedItems}
                      </span>

                      <button
                        type="button"
                        onClick={topluTasimaModaliniAc}
                        disabled={yukleniyor}
                        className="shrink-0 rounded-lg bg-[#458588] px-4 py-3 text-sm font-bold text-[#fbf1c7] transition-colors hover:bg-[#076678] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#83a598] dark:text-[#282828] dark:hover:bg-[#458588]"
                      >
                        {t.moveSelected}
                      </button>

                      <button
                        type="button"
                        onClick={topluSilmeModaliniAc}
                        disabled={yukleniyor}
                        className="shrink-0 rounded-lg bg-[#cc241d] px-4 py-3 text-sm font-bold text-[#fbf1c7] transition-colors hover:bg-[#9d0006] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {t.deleteSelected}
                      </button>

                      <button
                        type="button"
                        onClick={secimleriTemizle}
                        disabled={yukleniyor}
                        className="shrink-0 rounded-lg border border-[#d5c4a1] bg-[#fbf1c7] px-4 py-3 text-sm font-bold text-[#3c3836] transition-colors hover:border-[#458588] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#504945] dark:bg-[#282828] dark:text-[#ebdbb2] dark:hover:border-[#83a598]"
                      >
                        {t.clearSelection}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => dosyaGirdiRef.current?.click()}
                        disabled={yukleniyor}
                        className="shrink-0 rounded-lg bg-[#458588] px-4 py-3 text-sm font-bold text-[#fbf1c7] transition-colors hover:bg-[#076678] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#83a598] dark:text-[#282828] dark:hover:bg-[#458588]"
                      >
                        {t.upload}
                      </button>

                      <button
                        type="button"
                        onClick={() => setKlasorModalAcik(true)}
                        disabled={yukleniyor}
                        className="shrink-0 rounded-lg border border-[#d5c4a1] bg-[#fbf1c7] px-4 py-3 text-sm font-bold text-[#3c3836] transition-colors hover:border-[#458588] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#504945] dark:bg-[#282828] dark:text-[#ebdbb2] dark:hover:border-[#83a598]"
                      >
                        {t.newFolder}
                      </button>

                      {gosterilecekDosyalar.length > 0 &&
                        !listelenenOgelerinHepsiSeciliMi() && (
                          <button
                            type="button"
                            onClick={listelenenOgeleriSec}
                            className="shrink-0 rounded-lg border border-[#d5c4a1] bg-[#fbf1c7] px-4 py-3 text-sm font-bold text-[#3c3836] transition-colors hover:border-[#458588] dark:border-[#504945] dark:bg-[#282828] dark:text-[#ebdbb2] dark:hover:border-[#83a598]"
                          >
                            {t.selectListed}
                          </button>
                        )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6 pb-2 border-b border-[#d5c4a1] dark:border-[#504945]">
              <div className="flex items-center text-sm font-medium text-[#7c6f64] dark:text-[#a89984]">
                <button
                  title={t.upFolder}
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
                <span className="opacity-70 mr-2">{t.currentPath}</span>

                <div className="flex items-center gap-1 min-w-0 flex-wrap">
                  {mevcutYol === "/" ? (
                    <span className="font-bold cursor-default text-[#458588] dark:text-[#83a598]">
                      {t.homeFolder}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => yolaGit("/")}
                      className="font-bold transition-colors cursor-pointer hover:text-[#458588] dark:hover:text-[#83a598]"
                    >
                      {t.homeFolder}
                    </button>
                  )}

                  {yolParcalari.map((parca, index) => {
                    const hedefYol =
                      "/" + yolParcalari.slice(0, index + 1).join("/");

                    const aktifMi = hedefYol === mevcutYol;

                    return (
                      <div
                        key={hedefYol}
                        className="flex items-center gap-1 min-w-0"
                      >
                        <span className="opacity-50">/</span>

                        {aktifMi ? (
                          <span className="inline-block font-bold truncate max-w-[140px] cursor-default text-[#458588] dark:text-[#83a598]">
                            {parca}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => yolaGit(hedefYol)}
                            className="font-bold truncate max-w-[140px] transition-colors cursor-pointer hover:text-[#458588] dark:hover:text-[#83a598]"
                          >
                            {parca}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {yukleniyor ? (
              <LoadingState
                yukleniyor={yukleniyor}
                mesaj={yuklemeMesaji || t.loading}
                progress={yuklemeYuzdesi}
                progressLabel={t.uploadProgress}
              />
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
                <p className="text-sm">{dosyaMesaji || t.emptyFolder}</p>
              </div>
            ) : gosterilecekDosyalar.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#928374] dark:text-[#a89984]">
                <p className="text-sm">{t.noSearchResults}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {gosterilecekDosyalar.map((dosya, index) => (
                  <div
                    key={index}
                    onClick={() => klasoreGir(dosya)}
                    className="group relative flex flex-col items-center min-w-0 rounded-xl border border-[#d5c4a1] dark:border-[#504945] bg-[#ebdbb2] dark:bg-[#3c3836] p-4 transition-all hover:border-[#458588] dark:hover:border-[#83a598] hover:shadow-md cursor-pointer"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        dosyaSeciminiDegistir(dosya);
                      }}
                      className={`absolute left-3 top-3 z-10 flex h-5 w-5 items-center justify-center rounded border text-xs font-bold transition-colors ${
                        dosyaSeciliMi(dosya)
                          ? "border-[#458588] bg-[#458588] text-[#fbf1c7] dark:border-[#83a598] dark:bg-[#83a598] dark:text-[#282828]"
                          : "border-[#a89984] bg-[#fbf1c7] text-transparent dark:border-[#665c54] dark:bg-[#282828]"
                      }`}
                      aria-label={
                        dosyaSeciliMi(dosya) ? t.unselectItem : t.selectItem
                      }
                    >
                      ✓
                    </button>
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
                    <span
                      title={dosya.ad}
                      className="block text-sm font-medium text-center w-full max-w-full truncate px-1 text-[#3c3836] dark:text-[#ebdbb2]"
                    >
                      {dosya.ad}
                    </span>
                    <div className="mt-1 text-[11px] text-center text-[#928374] dark:text-[#a89984] leading-tight">
                      <p>
                        {dosya.klasorMu ? "-" : dosyaBoyutuYaz(dosya.boyut)}
                      </p>
                      <p className="truncate max-w-full">
                        {dosya.degistirilme}
                      </p>
                    </div>
                    <div className="absolute right-2 top-2">
                      <button
                        title="Menu"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAcikMenuIndex(
                            acikMenuIndex === index ? null : index,
                          );
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md bg-[#d5c4a1] dark:bg-[#504945] hover:bg-[#a89984] dark:hover:bg-[#665c54] text-[#3c3836] dark:text-[#ebdbb2] transition-all cursor-pointer"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                      </button>

                      {acikMenuIndex === index && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-9 z-20 w-44 rounded-lg border border-[#d5c4a1] dark:border-[#504945] bg-[#fbf1c7] dark:bg-[#282828] shadow-lg overflow-hidden"
                        >
                          <button
                            onClick={() => {
                              setAcikMenuIndex(null);
                              dosyaVeyaKlasorYenidenAdlandir(dosya);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-[#ebdbb2] dark:hover:bg-[#3c3836] transition-colors"
                          >
                            {t.renameItem}
                          </button>
                          <button
                            onClick={() => {
                              setAcikMenuIndex(null);
                              dosyaVeyaKlasorTasi(dosya);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-[#ebdbb2] dark:hover:bg-[#3c3836] transition-colors"
                          >
                            {t.moveItem}
                          </button>
                          <button
                            onClick={() => {
                              setAcikMenuIndex(null);
                              dosyaVeyaKlasorSil(dosya);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-[#cc241d] hover:bg-[#ebdbb2] dark:hover:bg-[#3c3836] transition-colors"
                          >
                            {t.deleteItem}
                          </button>
                        </div>
                      )}
                    </div>
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
