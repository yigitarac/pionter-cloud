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
