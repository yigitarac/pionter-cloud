export const dosyaBoyutuYaz = (boyut) => {
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

export const gecersizDosyaVeyaKlasorAdiMi = (ad) => {
  return (
    ad.includes("/") ||
    ad.includes("\\") ||
    ad.includes("..") ||
    ad.includes("⁄")
  );
};

export const gecersizYolMu = (yol) => {
  return yol.includes("..") || yol.includes("\\") || yol.includes("⁄");
};
