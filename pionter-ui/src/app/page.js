"use client";

import { useState, useRef } from "react";
import { sozluk } from "./sozluk";
import { dosyaBoyutuYaz } from "./yardimcilar";

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

  const t = sozluk[dil];

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
      kullaniciAdi: kullaniciAdi,
      sifre: sifre,
      yol: hedefYol,
      server_id: sunucu.id,
    };
    fetch("http://localhost:8080/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(gonderilecekVeri),
    })
      .then((cevap) => {
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
  };

  const baglantiyiBaslat = () => {
    if (yukleniyor) return;

    const temizKullaniciAdi = kullaniciAdi.trim();

    if (!temizKullaniciAdi || !sifre) {
      toastGoster(t.loginMissing, "error");
      return;
    }

    setKullaniciAdi(temizKullaniciAdi);
    sunuculariGetir(temizKullaniciAdi);
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
    klasoruYenile(yeniYol);
  };

  const oncekiKlasoreDon = () => {
    if (mevcutYol === "/") return;
    let index = mevcutYol.lastIndexOf("/");
    let yeniYol = mevcutYol.substring(0, index);
    if (yeniYol === "") yeniYol = "/";
    setMevcutYol(yeniYol);
    setAramaMetni("");
    setYukleniyor(true);
    setYuklemeMesaji(t.loadingFiles);
    klasoruYenile(yeniYol);
  };

  const yolaGit = (hedefYol) => {
    if (hedefYol === mevcutYol) return;

    setMevcutYol(hedefYol);
    setAramaMetni("");
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
    setYeniKlasorAdi("");
    setAcikMenuIndex(null);
    setYukleniyor(false);
    setYuklemeMesaji("");
    setHedefKlasorGezintiYolu("/");
    setServerDeleteModalAcik(false);
    setSilinecekSunucu(null);
    setServerEditModalAcik(false);
    setDuzenlenecekSunucu(null);

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

  const sunucuSec = (sunucu) => {
    if (yukleniyor) return;

    setSeciliSunucu(sunucu);
    setMevcutYol("/");
    setDosyalar([]);
    setDosyaMesaji("");
    setAramaMetni("");
    setYeniKlasorAdi("");
    setAcikMenuIndex(null);

    setRenameModalAcik(false);
    setYenidenAdlandirilacakDosya(null);
    setYeniAd("");

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
        kullaniciAdi,
        sifre,
        yol: dosyaYolu,
        server_id: seciliSunucu.id,
      }),
    })
      .then((cevap) => {
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

  const sunucuyaDosyaYukle = (dosya) => {
    if (yukleniyor) return;
    if (!dosya) return;
    if (
      dosya.name.includes("/") ||
      dosya.name.includes("\\") ||
      dosya.name.includes("..") ||
      dosya.name.includes("⁄")
    ) {
      toastGoster(t.invalidFileName, "error");
      return;
    }
    if (!seciliSunucu) {
      toastGoster(t.selectServerFirst, "error");
      return;
    }
    setYukleniyor(true);
    setYuklemeMesaji(t.uploadingFile);

    const formData = new FormData();
    formData.append("kullaniciAdi", kullaniciAdi);
    formData.append("sifre", sifre);
    formData.append("yol", mevcutYol);
    formData.append("server_id", seciliSunucu.id);
    formData.append("dosya", dosya);

    fetch("http://localhost:8080/api/upload", {
      method: "POST",
      body: formData,
    })
      .then((cevap) => {
        if (cevap.ok) {
          toastGoster(t.uploadSuccess, "success");
          klasoruYenile(mevcutYol);
        } else {
          console.log("Yükleme başarısız!");
          setYukleniyor(false);
          setYuklemeMesaji("");
          toastGoster(t.uploadFailed, "error");
        }
      })
      .catch((hata) => {
        console.log("Yükleme Hatası:", hata);
        setYukleniyor(false);
        setYuklemeMesaji("");
        toastGoster(t.uploadFailed, "error");
      });
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
    if (
      temizKlasorAdi.includes("/") ||
      temizKlasorAdi.includes("\\") ||
      temizKlasorAdi.includes("..") ||
      temizKlasorAdi.includes("⁄")
    ) {
      toastGoster(t.invalidFolderName, "error");
      return;
    }
    setYukleniyor(true);
    setYuklemeMesaji(t.creatingFolder);
    fetch("http://localhost:8080/api/folders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kullaniciAdi,
        sifre,
        yol: mevcutYol,
        server_id: seciliSunucu.id,
        klasor_adi: temizKlasorAdi,
      }),
    })
      .then((cevap) => {
        if (!cevap.ok) {
          throw new Error("Klasör oluşturulamadı");
        }

        setYeniKlasorAdi("");
        toastGoster(t.folderCreateSuccess, "success");
        setYukleniyor(true);
        hedefKlasorCacheRef.current = {};
        klasoruYenile(mevcutYol);
      })
      .catch((hata) => {
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
        kullaniciAdi,
        sifre,
        yol: mevcutYol,
        server_id: seciliSunucu.id,
        dosya_adi: silinecekDosyaAdi,
        klasor_mu: silinecekKlasorMu,
      }),
    })
      .then((cevap) => {
        if (!cevap.ok) {
          throw new Error("Silme başarısız");
        }

        toastGoster(
          dil === "tr" ? "Silme başarılı." : "Deleted successfully.",
          "success",
        );
        hedefKlasorCacheRef.current = {};
        klasoruYenile(mevcutYol);
      })
      .catch((hata) => {
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

    if (
      temizYeniAd.includes("/") ||
      temizYeniAd.includes("\\") ||
      temizYeniAd.includes("..") ||
      temizYeniAd.includes("⁄")
    ) {
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
        kullaniciAdi,
        sifre,
        yol: mevcutYol,
        server_id: seciliSunucu.id,
        eski_ad: yenidenAdlandirilacakDosya.ad,
        yeni_ad: temizYeniAd,
      }),
    })
      .then((cevap) => {
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
        hedefKlasorCacheRef.current = {};
        klasoruYenile(mevcutYol);
      })
      .catch((hata) => {
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
        kullaniciAdi,
        sifre,
        yol: hedefYol,
        server_id: seciliSunucu.id,
      }),
    })
      .then((cevap) => {
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

    if (
      temizHedefYol.includes("..") ||
      temizHedefYol.includes("\\") ||
      temizHedefYol.includes("⁄")
    ) {
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
        kullaniciAdi,
        sifre,
        server_id: seciliSunucu.id,
        kaynak_yol: mevcutYol,
        hedef_yol: hedefYol,
        dosya_adi: tasinacakDosya.ad,
      }),
    })
      .then((cevap) => {
        if (!cevap.ok) {
          throw new Error("Taşıma başarısız");
        }

        toastGoster(
          dil === "tr" ? "Taşıma başarılı." : "Moved successfully.",
          "success",
        );

        setTasinacakDosya(null);
        hedefKlasorCacheRef.current = {};
        klasoruYenile(mevcutYol);
      })
      .catch((hata) => {
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

  const suruklemeUstte = (e) => {
    e.preventDefault();
    setSurukleniyor(true);
  };

  const suruklemeAyrildi = (e) => {
    e.preventDefault();
    setSurukleniyor(false);
  };

  const dosyaBirakildi = (e) => {
    e.preventDefault();
    setSurukleniyor(false);

    if (yukleniyor) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      sunucuyaDosyaYukle(e.dataTransfer.files[0]);
    }
  };

  const butonlaSecildi = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      sunucuyaDosyaYukle(e.target.files[0]);
    }
  };
  const sunuculariGetir = (girisKimligi = kullaniciAdi) => {
    setYukleniyor(true);
    setYuklemeMesaji(t.loadingServers);

    fetch("http://localhost:8080/api/servers/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pionter_kullanici: girisKimligi,
        pionter_sifre: sifre,
      }),
    })
      .then((cevap) => {
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
        pionter_kullanici: kullaniciAdi,
        pionter_sifre: sifre,
        server_id: sunucu.id,
        sabitli: yeniSabitliDurumu,
      }),
    })
      .then((cevap) => {
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
        pionter_kullanici: kullaniciAdi,
        pionter_sifre: sifre,
        server_id: silinecekSunucu.id,
      }),
    })
      .then((cevap) => {
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
        pionter_kullanici: kullaniciAdi,
        pionter_sifre: sifre,

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
        pionter_kullanici: kullaniciAdi,
        pionter_sifre: sifre,

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
    <div className={karanlikMod ? "dark" : ""}>
      {toast && (
        <div className="fixed right-4 top-4 z-50">
          <div
            className={`rounded-lg px-4 py-3 shadow-lg text-sm font-semibold border ${
              toast.tip === "success"
                ? "bg-[#98971a] text-[#fbf1c7] border-[#79740e]"
                : toast.tip === "error"
                  ? "bg-[#cc241d] text-[#fbf1c7] border-[#9d0006]"
                  : "bg-[#458588] text-[#fbf1c7] border-[#076678]"
            }`}
          >
            {toast.mesaj}
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
      {moveModalAcik && (
        <div
          onClick={() => {
            setMoveModalAcik(false);
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
                {t.moveModalTitle}
              </h2>

              <p className="mt-1 text-sm text-[#7c6f64] dark:text-[#a89984] truncate">
                {tasinacakDosya?.ad}
              </p>
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
              ) : hedefKlasorlerGosterilecek.length === 0 ? (
                <p className="text-xs text-[#928374] dark:text-[#a89984]">
                  {dil === "tr"
                    ? "Bu klasörde alt klasör yok. Buraya taşıyabilirsin."
                    : "No subfolders here. You can move the item here."}
                </p>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                  {hedefKlasorlerGosterilecek.map((klasor) => {
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

            {moveHedefiMevcutKlasorMu && (
              <p className="mt-3 text-xs text-[#928374] dark:text-[#a89984]">
                {dil === "tr"
                  ? "Bu öğe zaten bu klasörde."
                  : "This item is already in this folder."}
              </p>
            )}

            {moveHedefiTasinanKlasorunIcindeMi && (
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
                  setTasinacakDosya(null);
                  setHedefKlasorler([]);
                  setHedefKlasorGezintiYolu("/");
                }}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-[#d5c4a1] dark:bg-[#504945] hover:bg-[#a89984] dark:hover:bg-[#665c54] text-[#3c3836] dark:text-[#ebdbb2] transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>

              <button
                onClick={tasimayiOnayla}
                disabled={
                  yukleniyor ||
                  moveHedefiMevcutKlasorMu ||
                  moveHedefiTasinanKlasorunIcindeMi
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
        onClick={() => setAcikMenuIndex(null)}
        className="min-h-screen bg-[#fbf1c7] dark:bg-[#282828] text-[#3c3836] dark:text-[#ebdbb2] font-sans transition-colors duration-200"
      >
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDil(dil === "en" ? "tr" : "en")}
              className="px-3 py-1.5 rounded-lg font-bold text-sm bg-[#ebdbb2] dark:bg-[#3c3836] hover:bg-[#d5c4a1] dark:hover:bg-[#504945] transition-colors cursor-pointer"
            >
              {dil === "en" ? "TR" : "EN"}
            </button>
            <button
              onClick={() => setKaranlikMod(!karanlikMod)}
              className="p-2 rounded-full hover:bg-[#ebdbb2] dark:hover:bg-[#3c3836] transition-colors cursor-pointer"
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
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {girisYapildi && !seciliSunucu && (
            <div className="mb-8 rounded-xl border border-[#d5c4a1] dark:border-[#504945] bg-[#ebdbb2] dark:bg-[#3c3836] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">{t.myServers}</h2>
                  <p className="text-sm text-[#7c6f64] dark:text-[#a89984] mt-1">
                    {t.serversDraftInfo}
                  </p>
                </div>

                <button
                  onClick={() => setSunucuFormAcik(true)}
                  className="bg-[#458588] dark:bg-[#83a598] hover:bg-[#076678] dark:hover:bg-[#458588] text-[#fbf1c7] dark:text-[#282828] px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer"
                >
                  {t.addServer}
                </button>
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
                <div className="rounded-lg border border-dashed border-[#a89984] dark:border-[#7c6f64] p-8 text-center">
                  <p className="text-sm font-semibold mb-2">{t.noServersYet}</p>
                  <p className="text-xs text-[#7c6f64] dark:text-[#a89984]">
                    {t.noServersInfo}
                  </p>
                </div>
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
          {seciliSunucu && (
            <div
              onDragOver={suruklemeUstte}
              onDragLeave={suruklemeAyrildi}
              onDrop={dosyaBirakildi}
              className={`mb-6 p-8 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-200 ${surukleniyor ? "border-[#458588] bg-[#458588]/10 dark:bg-[#83a598]/10 scale-[1.01]" : "border-[#d5c4a1] dark:border-[#504945] hover:border-[#a89984] dark:hover:border-[#7c6f64] bg-transparent"}`}
            >
              <svg
                className={`w-12 h-12 mb-3 transition-colors ${surukleniyor ? "text-[#458588] dark:text-[#83a598]" : "text-[#928374] dark:text-[#a89984]"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-sm font-medium mb-1">{t.dragDrop}</p>
              <p className="text-xs text-[#928374] dark:text-[#a89984] mb-4">
                {t.orSelect}
              </p>
              <input
                type="file"
                ref={dosyaGirdiRef}
                onChange={butonlaSecildi}
                className="hidden"
              />
              <button
                onClick={() => dosyaGirdiRef.current.click()}
                disabled={yukleniyor}
                className="px-4 py-2 bg-[#d5c4a1] dark:bg-[#504945] hover:bg-[#a89984] dark:hover:bg-[#3c3836] rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.selectBtn}
              </button>
            </div>
          )}
          <div className={seciliSunucu ? "" : "hidden"}>
            {seciliSunucu && (
              <div className="mb-6 rounded-xl border border-[#d5c4a1] dark:border-[#504945] bg-[#ebdbb2] dark:bg-[#3c3836] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#7c6f64] dark:text-[#a89984]">
                      {t.selectedServer}
                    </p>
                    <h2 className="text-lg font-bold">
                      {seciliSunucu.takmaAd}
                    </h2>
                  </div>

                  <button
                    onClick={sunucularaDon}
                    className="px-4 py-2 rounded-lg text-sm font-bold bg-[#d5c4a1] dark:bg-[#504945] hover:bg-[#a89984] dark:hover:bg-[#665c54] transition-colors cursor-pointer"
                  >
                    {t.backToServers}
                  </button>
                </div>
              </div>
            )}
            <div className="mb-4 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder={t.newFolderPlaceholder}
                value={yeniKlasorAdi}
                onChange={(e) => setYeniKlasorAdi(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    klasorOlustur();
                  }
                }}
                className="flex-1 px-4 py-2.5 bg-[#ebdbb2] dark:bg-[#3c3836] rounded-lg border border-[#d5c4a1] dark:border-[#504945] text-sm text-[#3c3836] dark:text-[#ebdbb2] placeholder-[#928374] dark:placeholder-[#a89984] focus:outline-none"
              />

              <button
                onClick={klasorOlustur}
                disabled={yukleniyor}
                className="px-4 py-2.5 rounded-lg text-sm font-bold bg-[#458588] dark:bg-[#83a598] hover:bg-[#076678] dark:hover:bg-[#458588] text-[#fbf1c7] dark:text-[#282828] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.createFolder}
              </button>
            </div>
            <div className="mb-4">
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={aramaMetni}
                onChange={(e) => setAramaMetni(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#ebdbb2] dark:bg-[#3c3836] rounded-lg border border-[#d5c4a1] dark:border-[#504945] text-sm text-[#3c3836] dark:text-[#ebdbb2] placeholder-[#928374] dark:placeholder-[#a89984] focus:outline-none"
              />
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
                  {yuklemeMesaji || t.loading}
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
