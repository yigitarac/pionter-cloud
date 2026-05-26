"use client";

import { useState, useRef } from "react";

export default function AnaSayfa() {
  const [dosyalar, setDosyalar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [kullaniciAdi, setKullaniciAdi] = useState("");
  const [sifre, setSifre] = useState("");
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

  const sozluk = {
    en: {
      userPlaceholder: "Pionter Username",
      passPlaceholder: "Password",
      connectBtn: "Login & Connect",
      registerBtn: "Register Account",
      switchToReg: "Need an account? Register here.",
      switchToLogin: "Already have an account? Login here.",
      srvIp: "Server IP",
      srvUser: "Server User (e.g. root)",
      srvPass: "Server Password",
      folder: "Isolated Folder (e.g. /PionterCloud)",
      currentPath: "Current Path:",
      upFolder: "Up",
      loading: "Processing...",
      emptyFolder: "This folder is empty or not connected yet.",
      dragDrop: "Drag and drop files here",
      orSelect: "or select from your computer",
      selectBtn: "Select File",
      regSuccess: "Registration successful! You can now login.",
      regFail: "Registration failed. Username might be taken.",
      myServers: "My Servers",
      serversDraftInfo:
        "We are not saving real servers yet. For now, we are building the screen draft.",
      addServer: "Add Server",
      noServersYet: "No servers added yet.",
      noServersInfo: "In the next task, we will make this form save a server.",
      newServer: "Add New Server",
      serverNickname: "Server Nickname",
      sshUser: "SSH User",
      sshPort: "SSH Port",
      connectWithPassword: "Connect with password",
      connectWithKey: "Connect with SSH key",
      isolatedFolder: "Isolated Folder",
      sshPrivateKey: "SSH Private Key",
      cancel: "Cancel",
      save: "Save",
      saveLater: "We will make the save action work in the next task.",
      loginMissing: "Please enter username and password!",
      selectedServer: "Selected Server",
      backToServers: "Back to Servers",
      newFolderPlaceholder: "New folder name",
      createFolder: "Create Folder",
      deleteItem: "Delete",
      deleteConfirm: "Are you sure you want to delete this item?",
      deleteFailed: "Delete failed.",
      renameItem: "Rename",
      renamePrompt: "Enter the new name:",
      renameFailed: "Rename failed.",
      moveItem: "Move",
      movePrompt: "Enter target folder path:",
      moveFailed: "Move failed.",
      homeFolder: "Home",
      searchPlaceholder: "Search in current folder...",
      noSearchResults: "No matching files or folders found.",
    },
    tr: {
      userPlaceholder: "Pionter Kullanıcı Adı",
      passPlaceholder: "Şifre",
      connectBtn: "Giriş Yap ve Bağlan",
      registerBtn: "Hesap Oluştur",
      switchToReg: "Hesabın yok mu? Buradan kayıt ol.",
      switchToLogin: "Zaten hesabın var mı? Buradan giriş yap.",
      srvIp: "Sunucu IP",
      srvUser: "Sunucu Kullanıcısı (Örn: root)",
      srvPass: "Sunucu Şifresi",
      folder: "İzole Klasör (Örn: /PionterCloud)",
      currentPath: "Mevcut Konum:",
      upFolder: "Üst Klasör",
      loading: "İşlem yapılıyor...",
      emptyFolder: "Bu klasör boş veya henüz bağlanılmadı.",
      dragDrop: "Dosyaları buraya sürükleyin",
      orSelect: "veya bilgisayarınızdan seçin",
      selectBtn: "Dosya Seç",
      regSuccess: "Kayıt başarılı! Şimdi giriş yapabilirsiniz.",
      regFail: "Kayıt başarısız. Kullanıcı adı alınmış olabilir.",
      myServers: "Sunucularım",
      serversDraftInfo:
        "Henüz gerçek sunucu kaydı yapmıyoruz. Şimdilik ekran taslağını kuruyoruz.",
      addServer: "Sunucu Ekle",
      noServersYet: "Henüz sunucu eklenmedi.",
      noServersInfo:
        "Bir sonraki görevde bu formun sunucu kaydetmesini sağlayacağız.",
      newServer: "Yeni Sunucu Ekle",
      serverNickname: "Sunucu Takma Adı",
      sshUser: "SSH Kullanıcısı",
      sshPort: "SSH Portu",
      connectWithPassword: "Şifre ile bağlan",
      connectWithKey: "SSH Key ile bağlan",
      isolatedFolder: "İzole Klasör",
      sshPrivateKey: "SSH Private Key",
      cancel: "Vazgeç",
      save: "Kaydet",
      saveLater: "Kaydetme işlemini bir sonraki görevde yapacağız.",
      loginMissing: "Kullanıcı adı ve şifre gir!",
      selectedServer: "Seçili Sunucu",
      backToServers: "Sunuculara Dön",
      newFolderPlaceholder: "Yeni klasör adı",
      createFolder: "Klasör Oluştur",
      deleteItem: "Sil",
      deleteConfirm: "Bu öğeyi silmek istediğine emin misin?",
      deleteFailed: "Silme başarısız.",
      renameItem: "Yeniden Adlandır",
      renamePrompt: "Yeni adı gir:",
      renameFailed: "Yeniden adlandırma başarısız.",
      moveItem: "Taşı",
      movePrompt: "Hedef klasör yolunu gir:",
      moveFailed: "Taşıma başarısız.",
      homeFolder: "Home",
      searchPlaceholder: "Mevcut klasörde ara...",
      noSearchResults: "Eşleşen dosya veya klasör bulunamadı.",
    },
  };

  const t = sozluk[dil];

  const yeniKayitOlustur = () => {
    if (!kullaniciAdi || !sifre) {
      alert(
        dil === "tr"
          ? "Lütfen kullanıcı adı ve şifre girin!"
          : "Please enter username and password!",
      );
      return;
    }

    setYukleniyor(true);
    fetch("http://localhost:8080/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pionter_kullanici: kullaniciAdi,
        pionter_sifre: sifre,
      }),
    })
      .then((cevap) => {
        setYukleniyor(false);
        if (cevap.ok) {
          alert(t.regSuccess);
          setIsLogin(true);
        } else {
          alert(t.regFail);
        }
      })
      .catch((hata) => {
        console.log("Kayıt Hatası:", hata);
        setYukleniyor(false);
        alert(t.regFail);
      });
  };

  const klasoruYenile = (hedefYol, sunucu = seciliSunucu) => {
    if (!sunucu) {
      alert(
        dil === "tr"
          ? "Önce sunucu seçmelisin."
          : "You must select a server first.",
      );
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
          setDosyalar(veri.dosyalar || []);
          setDosyaMesaji(veri.mesaj || "");
        } else {
          setDosyalar([]);
          setDosyaMesaji(veri.mesaj || "Dosyalar getirilemedi.");
        }
        setYukleniyor(false);
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
        alert(
          dil === "tr"
            ? "Dosyalar getirilemedi."
            : "Files could not be loaded.",
        );
      });
  };

  const baglantiyiBaslat = () => {
    if (!kullaniciAdi || !sifre) {
      alert(t.loginMissing);
      return;
    }

    sunuculariGetir();
  };

  const klasoreGir = (dosya) => {
    if (!dosya.klasorMu) {
      dosyayiIndir(dosya);
      return;
    }
    setYukleniyor(true);
    let yeniYol =
      mevcutYol === "/" ? "/" + dosya.ad : mevcutYol + "/" + dosya.ad;
    setMevcutYol(yeniYol);
    klasoruYenile(yeniYol);
  };

  const oncekiKlasoreDon = () => {
    if (mevcutYol === "/") return;
    let index = mevcutYol.lastIndexOf("/");
    let yeniYol = mevcutYol.substring(0, index);
    if (yeniYol === "") yeniYol = "/";
    setMevcutYol(yeniYol);
    setYukleniyor(true);
    klasoruYenile(yeniYol);
  };

  const yolaGit = (hedefYol) => {
    if (hedefYol === mevcutYol) return;

    setMevcutYol(hedefYol);
    setDosyaMesaji("");
    setAcikMenuIndex(null);
    setYukleniyor(true);
    klasoruYenile(hedefYol);
  };

  const dosyayiIndir = (dosya) => {
    if (!seciliSunucu) {
      alert(
        dil === "tr"
          ? "Önce sunucu seçmelisin"
          : "You must select a server first",
      );
      return;
    }
    setYukleniyor(true);
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
      })
      .catch((hata) => {
        console.log(hata);
        setYukleniyor(false);
      });
  };

  const sunucuyaDosyaYukle = (dosya) => {
    if (!dosya) return;
    if (
      dosya.name.includes("/") ||
      dosya.name.includes("\\") ||
      dosya.name.includes("..") ||
      dosya.name.includes("⁄")
    ) {
      alert(
        dil === "tr"
          ? "Dosya adında /, \\, ⁄ veya .. kullanılamaz."
          : "File name cannot include '/', '\\', '⁄' or '..'.",
      );
      return;
    }
    if (!seciliSunucu) {
      alert(
        dil === "tr"
          ? "Önce sunucu seçmelisin."
          : "You must select a server first.",
      );
      return;
    }
    setYukleniyor(true);

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
          klasoruYenile(mevcutYol);
        } else {
          console.log("Yükleme başarısız!");
          setYukleniyor(false);
        }
      })
      .catch((hata) => {
        console.log("Yükleme Hatası:", hata);
        setYukleniyor(false);
      });
  };
  const klasorOlustur = () => {
    if (!seciliSunucu) {
      alert(
        dil === "tr"
          ? "Önce sunucu seçmelisin."
          : "You must select a server first.",
      );
      return;
    }

    if (!yeniKlasorAdi) {
      alert(
        dil === "tr"
          ? "Klasör adı boş olamaz."
          : "Folder name cannot be empty.",
      );
      return;
    }
    if (
      yeniKlasorAdi.includes("/") ||
      yeniKlasorAdi.includes("\\") ||
      yeniKlasorAdi.includes("..")
    ) {
      alert(
        dil === "tr"
          ? "Klasör adında '/', '\\', veya '..' kullanamazsın."
          : "Folder name cannot include '/', '\\' or '..'.",
      );
      return;
    }
    fetch("http://localhost:8080/api/folders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kullaniciAdi,
        sifre,
        yol: mevcutYol,
        server_id: seciliSunucu.id,
        klasor_adi: yeniKlasorAdi,
      }),
    })
      .then((cevap) => {
        if (!cevap.ok) {
          throw new Error("Klasör oluşturulamadı");
        }

        setYeniKlasorAdi("");
        setYukleniyor(true);
        klasoruYenile(mevcutYol);
      })
      .catch((hata) => {
        console.log("Klasör oluşturma hatası:", hata);
        alert(
          dil === "tr"
            ? "Klasör oluşturulamadı."
            : "Folder could not be created.",
        );
      });
  };

  const dosyaVeyaKlasorSil = (dosya) => {
    if (!seciliSunucu) {
      alert(
        dil === "tr"
          ? "Önce sunucu seçmelisin"
          : "You must select a server first",
      );
      return;
    }

    const onay = window.confirm(`${dosya.ad} - ${t.deleteConfirm}`);
    if (!onay) return;

    setYukleniyor(true);
    setAcikMenuIndex(null);

    fetch("http://localhost:8080/api/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kullaniciAdi,
        sifre,
        yol: mevcutYol,
        server_id: seciliSunucu.id,
        dosya_adi: dosya.ad,
        klasor_mu: dosya.klasorMu,
      }),
    })
      .then((cevap) => {
        if (!cevap.ok) {
          throw new Error("Silme başarısız");
        }

        klasoruYenile(mevcutYol);
      })
      .catch((hata) => {
        console.log("Silme hatası:", hata);
        setYukleniyor(false);
        alert(t.deleteFailed);
      });
  };

  const dosyaVeyaKlasorYenidenAdlandir = (dosya) => {
    if (!seciliSunucu) {
      alert(
        dil === "tr"
          ? "Önce sunucu seçmelisin"
          : "You must select a server first",
      );
      return;
    }

    const yeniAd = window.prompt(t.renamePrompt, dosya.ad);

    if (!yeniAd) {
      return;
    }

    if (
      yeniAd.includes("/") ||
      yeniAd.includes("\\") ||
      yeniAd.includes("..") ||
      yeniAd.includes("⁄")
    ) {
      alert(
        dil === "tr"
          ? "Dosya/klasör adında /, \\, ⁄ veya .. kullanılamaz."
          : "File/folder name cannot include '/', '\\', '⁄' or '..'.",
      );
      return;
    }

    if (yeniAd == dosya.ad) {
      return;
    }

    setYukleniyor(true);
    setAcikMenuIndex(null);

    fetch("http://localhost:8080/api/rename", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kullaniciAdi,
        sifre,
        yol: mevcutYol,
        server_id: seciliSunucu.id,
        eski_ad: dosya.ad,
        yeni_ad: yeniAd,
      }),
    })
      .then((cevap) => {
        if (!cevap.ok) {
          throw new Error("Yeniden adlandırma başarısız");
        }

        klasoruYenile(mevcutYol);
      })
      .catch((hata) => {
        console.log("Yeniden adlandırma hatası:", hata);
        setYukleniyor(false);
        alert(t.renameFailed);
      });
  };

  const dosyaVeyaKlasorTasi = (dosya) => {
    if (!seciliSunucu) {
      alert(
        dil === "tr"
          ? "Önce sunucu seçmelisin."
          : "You must select a server first.",
      );
      return;
    }

    const hedefYolGirdisi = window.prompt(t.movePrompt, "/");

    if (!hedefYolGirdisi) {
      return;
    }

    if (
      hedefYolGirdisi.includes("..") ||
      hedefYolGirdisi.includes("\\") ||
      hedefYolGirdisi.includes("⁄")
    ) {
      alert(
        dil === "tr"
          ? "Hedef yolda \\, ⁄ veya .. kullanılamaz."
          : "Target path cannot include \\, ⁄ or ...",
      );
      return;
    }

    const hedefYol = hedefYolGirdisi.startsWith("/")
      ? hedefYolGirdisi
      : "/" + hedefYolGirdisi;

    if (hedefYol == mevcutYol) {
      alert(
        dil === "tr"
          ? "Zaten bu klasördesin."
          : "This item is already in that folder.",
      );
      return;
    }

    setAcikMenuIndex(null);
    setYukleniyor(true);

    fetch("http://localhost:8080/api/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kullaniciAdi,
        sifre,
        server_id: seciliSunucu.id,
        kaynak_yol: mevcutYol,
        hedef_yol: hedefYol,
        dosya_adi: dosya.ad,
      }),
    })
      .then((cevap) => {
        if (!cevap.ok) {
          throw new Error("Taşıma başarısız");
        }

        klasoruYenile(mevcutYol);
      })
      .catch((hata) => {
        console.log("Taşıma hatası:", hata);
        setYukleniyor(false);
        alert(t.moveFailed);
      });
  };

  const dosyaBoyutuYaz = (boyut) => {
    if (!boyut || boyut === 0) return "0 B";

    if (boyut < 1024) {
      return boyut + " B";
    }

    if (boyut < 1024 * 1024) {
      return (boyut / 1024).toFixed(1) + " KB";
    }

    if (boyut < 1024 * 1024 * 1024) {
      return (boyut / (1024 * 1024)).toFixed(1) + " MB";
    }

    return (boyut / (1024 * 1024 * 1024)).toFixed(1) + " GB";
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      sunucuyaDosyaYukle(e.dataTransfer.files[0]);
    }
  };

  const butonlaSecildi = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      sunucuyaDosyaYukle(e.target.files[0]);
    }
  };
  const sunuculariGetir = () => {
    fetch("http://localhost:8080/api/servers/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pionter_kullanici: kullaniciAdi,
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
        }));

        setSunucular(duzenlenmisSunucular);
        setGirisYapildi(true);
      })
      .catch((hata) => {
        console.log("Sunucular getirilemedi:", hata);
        alert(
          dil === "tr"
            ? "Giriş başarısız veya sunucular getirilemedi."
            : "Login failed or servers could not be loaded.",
        );
      });
  };
  const sunucuKaydet = () => {
    if (
      !sunucuTakmaAd ||
      !sunucuIp ||
      !sunucuKullanici ||
      !sunucuPort ||
      !izoleKlasor
    ) {
      alert(
        dil === "tr"
          ? "Lütfen zorunlu alanları doldur."
          : "Please fill the required fields.",
      );
      return;
    }

    if (baglantiTipi === "password" && !sunucuSifre) {
      alert(
        dil === "tr"
          ? "Lütfen sunucu şifresini gir."
          : "Please enter the server password.",
      );
      return;
    }

    if (baglantiTipi === "ssh_key" && !sshPrivateKey) {
      alert(
        dil === "tr"
          ? "Lütfen SSH private key gir."
          : "Please enter the SSH private key.",
      );
      return;
    }

    const yeniSunucu = {
      id: Date.now(),
      takmaAd: sunucuTakmaAd,
      ip: sunucuIp,
      kullanici: sunucuKullanici,
      port: sunucuPort,
      baglantiTipi: baglantiTipi,
      izoleKlasor: izoleKlasor,
    };

    fetch("http://localhost:8080/api/servers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pionter_kullanici: kullaniciAdi,
        pionter_sifre: sifre,

        sunucu_takma_ad: sunucuTakmaAd,
        sunucu_ip: sunucuIp,
        sunucu_port: sunucuPort,
        sunucu_kullanici: sunucuKullanici,
        baglanti_tipi: baglantiTipi,
        sunucu_sifre: sunucuSifre,
        ssh_private_key: sshPrivateKey,
        izole_klasor: izoleKlasor,
      }),
    })
      .then((cevap) => {
        if (!cevap.ok) {
          throw new Error("Sunucu kaydedilemedi");
        }

        setSunucular([...sunucular, yeniSunucu]);

        setSunucuTakmaAd("");
        setSunucuIp("");
        setSunucuKullanici("root");
        setSunucuPort("22");
        setSunucuSifre("");
        setSshPrivateKey("");
        setIzoleKlasor("/PionterCloud");
        setBaglantiTipi("password");
        setSunucuFormAcik(false);
      })
      .catch((hata) => {
        console.log("Sunucu kayıt hatası:", hata);
        alert(
          dil === "tr" ? "Sunucu kaydedilemedi." : "Server could not be saved.",
        );
      });
  };
  const yolParcalari = mevcutYol.split("/").filter(Boolean);
  return (
    <div className={karanlikMod ? "dark" : ""}>
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
              className="px-3 py-1.5 rounded-lg font-bold text-sm bg-[#ebdbb2] dark:bg-[#3c3836] hover:bg-[#d5c4a1] dark:hover:bg-[#504945] transition-colors"
            >
              {dil === "en" ? "TR" : "EN"}
            </button>
            <button
              onClick={() => setKaranlikMod(!karanlikMod)}
              className="p-2 rounded-full hover:bg-[#ebdbb2] dark:hover:bg-[#3c3836] transition-colors"
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
                  className="bg-[#458588] dark:bg-[#83a598] hover:bg-[#076678] dark:hover:bg-[#458588] text-[#fbf1c7] dark:text-[#282828] px-4 py-2 rounded-lg text-sm font-bold transition-colors"
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
                      className="px-4 py-3 bg-[#ebdbb2] dark:bg-[#3c3836] rounded-lg border border-[#d5c4a1] dark:border-[#504945] text-sm focus:outline-none"
                    />

                    <input
                      type="text"
                      placeholder={t.srvIp}
                      value={sunucuIp}
                      onChange={(e) => setSunucuIp(e.target.value)}
                      className="px-4 py-3 bg-[#ebdbb2] dark:bg-[#3c3836] rounded-lg border border-[#d5c4a1] dark:border-[#504945] text-sm focus:outline-none"
                    />

                    <input
                      type="text"
                      placeholder={t.sshUser}
                      value={sunucuKullanici}
                      onChange={(e) => setSunucuKullanici(e.target.value)}
                      className="px-4 py-3 bg-[#ebdbb2] dark:bg-[#3c3836] rounded-lg border border-[#d5c4a1] dark:border-[#504945] text-sm focus:outline-none"
                    />

                    <input
                      type="text"
                      placeholder={t.sshPort}
                      value={sunucuPort}
                      onChange={(e) => setSunucuPort(e.target.value)}
                      className="px-4 py-3 bg-[#ebdbb2] dark:bg-[#3c3836] rounded-lg border border-[#d5c4a1] dark:border-[#504945] text-sm focus:outline-none"
                    />

                    <select
                      value={baglantiTipi}
                      onChange={(e) => setBaglantiTipi(e.target.value)}
                      className="px-4 py-3 bg-[#ebdbb2] dark:bg-[#3c3836] rounded-lg border border-[#d5c4a1] dark:border-[#504945] text-sm focus:outline-none"
                    >
                      <option value="password">{t.connectWithPassword}</option>
                      <option value="ssh_key">{t.connectWithKey}</option>
                    </select>

                    <input
                      type="text"
                      placeholder={t.isolatedFolder}
                      value={izoleKlasor}
                      onChange={(e) => setIzoleKlasor(e.target.value)}
                      className="px-4 py-3 bg-[#ebdbb2] dark:bg-[#3c3836] rounded-lg border border-[#d5c4a1] dark:border-[#504945] text-sm focus:outline-none"
                    />
                  </div>

                  {baglantiTipi === "password" ? (
                    <input
                      type="password"
                      placeholder={t.srvPass}
                      value={sunucuSifre}
                      onChange={(e) => setSunucuSifre(e.target.value)}
                      className="mt-4 w-full px-4 py-3 bg-[#ebdbb2] dark:bg-[#3c3836] rounded-lg border border-[#d5c4a1] dark:border-[#504945] text-sm focus:outline-none"
                    />
                  ) : (
                    <textarea
                      placeholder={t.sshPrivateKey}
                      value={sshPrivateKey}
                      onChange={(e) => setSshPrivateKey(e.target.value)}
                      className="mt-4 w-full min-h-32 px-4 py-3 bg-[#ebdbb2] dark:bg-[#3c3836] rounded-lg border border-[#d5c4a1] dark:border-[#504945] text-sm focus:outline-none"
                    />
                  )}

                  <div className="flex justify-end gap-3 mt-5">
                    <button
                      onClick={() => setSunucuFormAcik(false)}
                      className="px-4 py-2 rounded-lg text-sm font-bold bg-[#d5c4a1] dark:bg-[#504945] hover:bg-[#a89984] dark:hover:bg-[#665c54] transition-colors"
                    >
                      {t.cancel}
                    </button>

                    <button
                      onClick={sunucuKaydet}
                      className="px-4 py-2 rounded-lg text-sm font-bold bg-[#458588] dark:bg-[#83a598] hover:bg-[#076678] dark:hover:bg-[#458588] text-[#fbf1c7] dark:text-[#282828] transition-colors"
                    >
                      {t.save}
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
                      onClick={() => {
                        setSeciliSunucu(sunucu);
                        setMevcutYol("/");
                        setDosyalar([]);
                        setDosyaMesaji("");
                        setYukleniyor(true);
                        klasoruYenile("/", sunucu);
                      }}
                      className="rounded-xl border border-[#d5c4a1] dark:border-[#504945] bg-[#fbf1c7] dark:bg-[#282828] p-4 cursor-pointer hover:scale-[1.01] transition-transform"
                    >
                      <h3 className="font-bold text-lg mb-1">
                        {sunucu.takmaAd}
                      </h3>
                      <p className="text-sm text-[#7c6f64] dark:text-[#a89984]">
                        {sunucu.kullanici}@{sunucu.ip}:{sunucu.port}
                      </p>
                      <p className="text-xs text-[#928374] dark:text-[#a89984] mt-2">
                        {sunucu.izoleKlasor} · {sunucu.baglantiTipi}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div
            className={`${girisYapildi ? "hidden" : ""} bg-[#ebdbb2] dark:bg-[#3c3836] rounded-xl p-4 mb-8 border border-[#d5c4a1] dark:border-[#504945] shadow-sm flex flex-col gap-4`}
          >
            {isLogin ? (
              <div className="flex flex-col md:flex-row gap-2">
                <input
                  type="text"
                  placeholder={t.userPlaceholder}
                  value={kullaniciAdi}
                  onChange={(e) => setKullaniciAdi(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-transparent border-none focus:ring-0 text-sm placeholder-[#928374] dark:placeholder-[#a89984] focus:outline-none"
                />
                <div className="hidden md:block w-px bg-[#d5c4a1] dark:bg-[#504945] my-2"></div>
                <input
                  type="password"
                  placeholder={t.passPlaceholder}
                  value={sifre}
                  onChange={(e) => setSifre(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-transparent border-none focus:ring-0 text-sm placeholder-[#928374] dark:placeholder-[#a89984] focus:outline-none"
                />
                <button
                  onClick={baglantiyiBaslat}
                  className="bg-[#458588] dark:bg-[#83a598] hover:bg-[#076678] dark:hover:bg-[#458588] text-[#fbf1c7] dark:text-[#282828] px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
                >
                  {t.connectBtn}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
                <input
                  type="text"
                  placeholder={t.userPlaceholder}
                  value={kullaniciAdi}
                  onChange={(e) => setKullaniciAdi(e.target.value)}
                  className="px-4 py-3 bg-[#fbf1c7] dark:bg-[#282828] rounded-lg border border-[#d5c4a1] dark:border-[#504945] text-sm focus:outline-none"
                />
                <input
                  type="password"
                  placeholder={t.passPlaceholder}
                  value={sifre}
                  onChange={(e) => setSifre(e.target.value)}
                  className="px-4 py-3 bg-[#fbf1c7] dark:bg-[#282828] rounded-lg border border-[#d5c4a1] dark:border-[#504945] text-sm focus:outline-none"
                />
                <button
                  onClick={yeniKayitOlustur}
                  className="bg-[#d79921] hover:bg-[#b57614] text-[#fbf1c7] px-6 py-3 rounded-lg text-sm font-bold transition-colors shadow-sm"
                >
                  {t.registerBtn}
                </button>
              </div>
            )}
            <div className="text-center mt-2">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs font-semibold text-[#7c6f64] dark:text-[#a89984] hover:text-[#458588] dark:hover:text-[#83a598] transition-colors underline"
              >
                {isLogin ? t.switchToReg : t.switchToLogin}
              </button>
            </div>
          </div>
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
                className="px-4 py-2 bg-[#d5c4a1] dark:bg-[#504945] hover:bg-[#a89984] dark:hover:bg-[#3c3836] rounded-lg text-sm font-semibold transition-colors"
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
                    onClick={() => setSeciliSunucu(null)}
                    className="px-4 py-2 rounded-lg text-sm font-bold bg-[#d5c4a1] dark:bg-[#504945] hover:bg-[#a89984] dark:hover:bg-[#665c54] transition-colors"
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
                className="flex-1 px-4 py-2.5 bg-[#ebdbb2] dark:bg-[#3c3836] rounded-lg border border-[#d5c4a1] dark:border-[#504945] text-sm focus:outline-none"
              />

              <button
                onClick={klasorOlustur}
                className="px-4 py-2.5 rounded-lg text-sm font-bold bg-[#458588] dark:bg-[#83a598] hover:bg-[#076678] dark:hover:bg-[#458588] text-[#fbf1c7] dark:text-[#282828] transition-colors"
              >
                {t.createFolder}
              </button>
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
                  <button
                    onClick={() => yolaGit("/")}
                    className={`font-bold hover:text-[#458588] dark:hover:text-[#83a598] transition-colors ${
                      mevcutYol === "/"
                        ? "text-[#458588] dark:text-[#83a598]"
                        : ""
                    }`}
                  >
                    {t.homeFolder}
                  </button>

                  {yolParcalari.map((parca, index) => {
                    const hedefYol =
                      "/" + yolParcalari.slice(0, index + 1).join("/");

                    return (
                      <div
                        key={hedefYol}
                        className="flex items-center gap-1 min-w-0"
                      >
                        <span className="opacity-50">/</span>
                        <button
                          onClick={() => yolaGit(hedefYol)}
                          className={`font-bold truncate max-w-[140px] hover:text-[#458588] dark:hover:text-[#83a598] transition-colors ${
                            hedefYol === mevcutYol
                              ? "text-[#458588] dark:text-[#83a598]"
                              : ""
                          }`}
                        >
                          {parca}
                        </button>
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
                  {t.loading}
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
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {dosyalar.map((dosya, index) => (
                  <div
                    key={index}
                    onClick={() => klasoreGir(dosya)}
                    className="group relative flex flex-col items-center p-4 rounded-xl hover:bg-[#ebdbb2] dark:hover:bg-[#3c3836] cursor-pointer transition-all duration-200"
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
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md bg-[#d5c4a1] dark:bg-[#504945] hover:bg-[#a89984] dark:hover:bg-[#665c54] text-[#3c3836] dark:text-[#ebdbb2] transition-all"
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
