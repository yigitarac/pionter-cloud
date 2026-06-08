"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { loader as monacoLoader } from "@monaco-editor/react";
import { useParams } from "next/navigation";
import {
  pionterMonacoShikiHazirla,
  pionterMonacoTemasiAl,
} from "../../shikiMonaco";
import EditorLoadingState from "../../components/EditorLoadingState";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => null,
});

const dosyaUzantisiAl = (dosyaAdi) => {
  const temizAd = String(dosyaAdi || "")
    .toLowerCase()
    .trim();

  if (temizAd === ".env") return ".env";
  if (temizAd.endsWith(".env.example")) return ".env.example";
  if (temizAd === "dockerfile") return ".dockerfile";
  if (temizAd === "makefile") return ".makefile";
  if (temizAd === "cmakelists.txt") return ".cmakelists";

  const sonNoktaIndex = temizAd.lastIndexOf(".");

  if (sonNoktaIndex === -1) return "";

  return temizAd.slice(sonNoktaIndex);
};

const monacoDiliAl = (dosyaAdi) => {
  const uzanti = dosyaUzantisiAl(dosyaAdi || "");

  if (uzanti === ".js" || uzanti === ".jsx") return "javascript";
  if (uzanti === ".ts" || uzanti === ".tsx") return "typescript";
  if (uzanti === ".json") return "json";
  if (uzanti === ".go") return "go";
  if (uzanti === ".css") return "css";
  if (uzanti === ".html") return "html";
  if (uzanti === ".md") return "markdown";
  if (uzanti === ".py") return "python";
  if (uzanti === ".java") return "java";
  if (uzanti === ".php") return "php";
  if (uzanti === ".sql") return "sql";
  if ([".yml", ".yaml"].includes(uzanti)) return "yaml";
  if (uzanti === ".xml") return "xml";
  if ([".sh", ".bash", ".zsh"].includes(uzanti)) return "shellscript";
  if (uzanti === ".rs") return "rust";
  if (uzanti === ".rb") return "ruby";
  if (uzanti === ".cs") return "csharp";
  if ([".c", ".h"].includes(uzanti)) return "c";
  if ([".cpp", ".cc", ".cxx", ".hpp"].includes(uzanti)) return "cpp";
  if (uzanti === ".dockerfile") return "dockerfile";
  if (uzanti === ".toml") return "toml";
  if (uzanti === ".ini" || uzanti === ".conf") return "ini";

  return "plaintext";
};

export default function SharePage() {
  const params = useParams();
  const token = params?.token || "";

  const [paylasimBilgisi, setPaylasimBilgisi] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");
  const [previewVerisi, setPreviewVerisi] = useState(null);
  const [previewYukleniyor, setPreviewYukleniyor] = useState(false);
  const [previewHatasi, setPreviewHatasi] = useState("");
  const [monacoShikiHazir, setMonacoShikiHazir] = useState(false);

  const [dil, setDil] = useState(() => {
    if (typeof window === "undefined") return "en";

    const kayitliDil = window.localStorage.getItem("pionter_share_language");

    if (kayitliDil === "tr" || kayitliDil === "en") {
      return kayitliDil;
    }

    if ((navigator.language || "").toLowerCase().startsWith("tr")) {
      return "tr";
    }

    return "en";
  });

  const [karanlikMod, setKaranlikMod] = useState(() => {
    if (typeof window === "undefined") return true;

    const kayitliTema = window.localStorage.getItem("pionter_share_theme");

    if (kayitliTema === "light") return false;
    if (kayitliTema === "dark") return true;

    return true;
  });

  const diliDegistir = () => {
    const yeniDil = dil === "tr" ? "en" : "tr";

    setDil(yeniDil);
    window.localStorage.setItem("pionter_share_language", yeniDil);
  };

  const temayiDegistir = () => {
    const yeniKaranlikMod = !karanlikMod;

    setKaranlikMod(yeniKaranlikMod);
    window.localStorage.setItem(
      "pionter_share_theme",
      yeniKaranlikMod ? "dark" : "light",
    );
  };

  const metinler = useMemo(
    () =>
      dil === "tr"
        ? {
            title: "PionterCloud paylaşımı",
            loading: "Paylaşım bilgisi yükleniyor...",
            sharedBy: "tarafından paylaşıldı",
            download: "İndir",
            file: "Dosya",
            unlimited: "Bu link süresizdir.",
            expiresAt: "Link geçerlilik tarihi:",
            invalid: "Paylaşım linki açılamadı.",
            note: "Bu dosya PionterCloud üzerinden paylaşılmıştır.",
            preview: "Önizleme",
            previewLoading: "Önizleme yükleniyor...",
            previewUnavailable: "Bu dosya için önizleme gösterilemiyor.",
            languageToggle: "EN",
          }
        : {
            title: "PionterCloud share",
            loading: "Loading share information...",
            sharedBy: "shared by",
            download: "Download",
            file: "File",
            unlimited: "This link does not expire.",
            expiresAt: "Link expires at:",
            invalid: "Share link could not be opened.",
            note: "This file was shared through PionterCloud.",
            preview: "Preview",
            previewLoading: "Loading preview...",
            previewUnavailable: "Preview is not available for this file.",
            languageToggle: "TR",
          },
    [dil],
  );

  useEffect(() => {
    if (!token) return;

    let iptalEdildi = false;

    fetch(`http://localhost:8080/api/share/info/${encodeURIComponent(token)}`)
      .then((cevap) => {
        return cevap.json().then((veri) => {
          if (!cevap.ok || !veri.basarili) {
            throw new Error(veri.mesaj || metinler.invalid);
          }

          return veri;
        });
      })
      .then((veri) => {
        if (iptalEdildi) return;

        setPaylasimBilgisi(veri);
        setYukleniyor(false);
        setHata("");
        setPreviewVerisi(null);
        setPreviewHatasi("");
        setPreviewYukleniyor(true);

        fetch(
          `http://localhost:8080/api/share/preview/${encodeURIComponent(token)}`,
        )
          .then((previewCevap) => {
            return previewCevap.json().then((previewVeri) => {
              if (!previewCevap.ok) {
                throw new Error(
                  previewVeri.mesaj || metinler.previewUnavailable,
                );
              }

              return previewVeri;
            });
          })
          .then((previewVeri) => {
            if (iptalEdildi) return;

            setPreviewYukleniyor(false);

            if (previewVeri?.basarili) {
              setPreviewVerisi(previewVeri);
              setPreviewHatasi("");
              return;
            }

            setPreviewVerisi(null);

            if (
              previewVeri?.kod &&
              previewVeri.kod !== "UNSUPPORTED_FILE_TYPE"
            ) {
              setPreviewHatasi(
                previewVeri.mesaj || metinler.previewUnavailable,
              );
            } else {
              setPreviewHatasi("");
            }
          })
          .catch((previewErr) => {
            if (iptalEdildi) return;

            console.log("Share preview error:", previewErr);
            setPreviewVerisi(null);
            setPreviewYukleniyor(false);
            setPreviewHatasi(metinler.previewUnavailable);
          });
      })
      .catch((err) => {
        if (iptalEdildi) return;

        console.log("Share info error:", err);
        setPaylasimBilgisi(null);
        setPreviewVerisi(null);
        setPreviewYukleniyor(false);
        setPreviewHatasi("");
        setYukleniyor(false);
        setHata(err.message || metinler.invalid);
      });

    return () => {
      iptalEdildi = true;
    };
  }, [token, metinler.invalid, metinler.previewUnavailable]);

  useEffect(() => {
    if (
      !previewVerisi?.basarili ||
      previewVerisi?.tip !== "text" ||
      monacoShikiHazir
    ) {
      return;
    }

    let iptalEdildi = false;

    monacoLoader
      .init()
      .then((monaco) => pionterMonacoShikiHazirla(monaco))
      .then(() => {
        if (!iptalEdildi) {
          setMonacoShikiHazir(true);
        }
      })
      .catch((err) => {
        console.log("Shared Monaco preview theme error:", err);

        if (!iptalEdildi) {
          setMonacoShikiHazir(false);
        }
      });

    return () => {
      iptalEdildi = true;
    };
  }, [previewVerisi?.basarili, previewVerisi?.tip, monacoShikiHazir]);

  const downloadUrl = token
    ? `http://localhost:8080/api/share/download/${encodeURIComponent(token)}`
    : "";

  const etkinYukleniyor = token ? yukleniyor : false;
  const etkinHata = token ? hata : metinler.invalid;

  const paylasimMonacoYuksekligiAl = () => {
    const icerik = previewVerisi?.icerik || "";
    const satirSayisi = Math.max(icerik.split("\n").length, 1);

    const satirYuksekligi = 21;
    const editorIcBosluk = 44;
    const minimumYukseklik = 180;
    const maksimumYukseklik = 520;

    const hesaplananYukseklik = satirSayisi * satirYuksekligi + editorIcBosluk;

    const sinirliYukseklik = Math.min(
      Math.max(hesaplananYukseklik, minimumYukseklik),
      maksimumYukseklik,
    );

    return `${sinirliYukseklik}px`;
  };

  return (
    <main
      className={`min-h-screen px-4 py-10 transition-colors ${
        karanlikMod
          ? "bg-[#282828] text-[#ebdbb2]"
          : "bg-[#fbf1c7] text-[#3c3836]"
      }`}
    >
      <div className="fixed right-4 top-4 z-50 flex gap-2">
        <button
          type="button"
          onClick={diliDegistir}
          className={`rounded-lg border px-3 py-2 text-xs font-black shadow-lg transition-colors ${
            karanlikMod
              ? "border-[#504945] bg-[#1d2021] text-[#ebdbb2] hover:border-[#83a598]"
              : "border-[#d5c4a1] bg-[#fbf1c7] text-[#3c3836] hover:border-[#458588]"
          }`}
        >
          {metinler.languageToggle}
        </button>

        <button
          type="button"
          onClick={temayiDegistir}
          aria-label={
            karanlikMod
              ? dil === "tr"
                ? "Aydınlık temaya geç"
                : "Switch to light theme"
              : dil === "tr"
                ? "Karanlık temaya geç"
                : "Switch to dark theme"
          }
          className={`flex h-9 w-9 items-center justify-center rounded-lg border shadow-lg transition-colors ${
            karanlikMod
              ? "border-[#504945] bg-[#1d2021] text-[#fabd2f] hover:border-[#fabd2f]"
              : "border-[#d5c4a1] bg-[#fbf1c7] text-[#7c6f64] hover:border-[#d79921]"
          }`}
        >
          {karanlikMod ? (
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </svg>
          ) : (
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center justify-center">
        <div
          className={`w-full rounded-2xl border p-6 shadow-2xl transition-colors sm:p-8 ${
            karanlikMod
              ? "border-[#504945] bg-[#1d2021]"
              : "border-[#d5c4a1] bg-[#fbf1c7]"
          }`}
        >
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#83a598] text-xl font-black text-[#282828]">
              P
            </div>

            <div>
              <h1
                className={`text-xl font-black ${
                  karanlikMod ? "text-[#fbf1c7]" : "text-[#3c3836]"
                }`}
              >
                {metinler.title}
              </h1>
              <p
                className={`text-sm font-bold ${
                  karanlikMod ? "text-[#a89984]" : "text-[#7c6f64]"
                }`}
              >
                {metinler.note}
              </p>
            </div>
          </div>

          {etkinYukleniyor && (
            <div
              className={`rounded-xl border p-5 ${
                karanlikMod
                  ? "border-[#504945] bg-[#282828]"
                  : "border-[#d5c4a1] bg-[#ebdbb2]"
              }`}
            >
              <p
                className={`animate-pulse text-sm font-bold ${
                  karanlikMod ? "text-[#a89984]" : "text-[#7c6f64]"
                }`}
              >
                {metinler.loading}
              </p>
            </div>
          )}

          {!etkinYukleniyor && etkinHata && (
            <div className="rounded-xl border border-[#fb4934] bg-[#3b2422] p-5">
              <p className="text-sm font-black text-[#fb4934]">{etkinHata}</p>
            </div>
          )}

          {!etkinYukleniyor && !etkinHata && paylasimBilgisi && (
            <div>
              <div
                className={`rounded-xl border p-5 ${
                  karanlikMod
                    ? "border-[#504945] bg-[#282828]"
                    : "border-[#d5c4a1] bg-[#ebdbb2]"
                }`}
              >
                <p
                  className={`mb-2 text-xs font-black uppercase tracking-wide ${
                    karanlikMod ? "text-[#a89984]" : "text-[#7c6f64]"
                  }`}
                >
                  {metinler.file}
                </p>

                <h2
                  className={`break-words text-2xl font-black ${
                    karanlikMod ? "text-[#fbf1c7]" : "text-[#3c3836]"
                  }`}
                >
                  {paylasimBilgisi.dosya_adi}
                </h2>

                <p
                  className={`mt-3 text-sm font-bold ${
                    karanlikMod ? "text-[#a89984]" : "text-[#7c6f64]"
                  }`}
                >
                  <span className="text-[#83a598]">
                    {paylasimBilgisi.paylasan_kullanici}
                  </span>{" "}
                  {metinler.sharedBy}
                </p>

                <div
                  className={`mt-5 rounded-lg border px-4 py-3 ${
                    karanlikMod
                      ? "border-[#3c3836] bg-[#1d2021]"
                      : "border-[#d5c4a1] bg-[#fbf1c7]"
                  }`}
                >
                  <p
                    className={`text-sm font-bold ${
                      karanlikMod ? "text-[#d5c4a1]" : "text-[#7c6f64]"
                    }`}
                  >
                    {paylasimBilgisi.suresiz
                      ? metinler.unlimited
                      : `${metinler.expiresAt} ${paylasimBilgisi.son_gecerlilik_tarihi}`}
                  </p>
                </div>
              </div>

              {(previewYukleniyor ||
                previewHatasi ||
                previewVerisi?.basarili) && (
                <div
                  className={`mt-5 rounded-xl border p-5 ${
                    karanlikMod
                      ? "border-[#504945] bg-[#282828]"
                      : "border-[#d5c4a1] bg-[#ebdbb2]"
                  }`}
                >
                  <p
                    className={`mb-3 text-xs font-black uppercase tracking-wide ${
                      karanlikMod ? "text-[#a89984]" : "text-[#7c6f64]"
                    }`}
                  >
                    {metinler.preview}
                  </p>

                  {previewYukleniyor && (
                    <p
                      className={`animate-pulse text-sm font-bold ${
                        karanlikMod ? "text-[#a89984]" : "text-[#7c6f64]"
                      }`}
                    >
                      {metinler.previewLoading}
                    </p>
                  )}

                  {!previewYukleniyor && previewHatasi && (
                    <p className="text-sm font-bold text-[#fb4934]">
                      {previewHatasi}
                    </p>
                  )}

                  {!previewYukleniyor &&
                    !previewHatasi &&
                    previewVerisi?.basarili &&
                    previewVerisi.tip === "image" && (
                      <div className="overflow-hidden rounded-xl border border-[#504945] bg-[#1d2021]">
                        <img
                          src={`data:${previewVerisi.mime};base64,${previewVerisi.base64}`}
                          alt={previewVerisi.dosya_adi}
                          className="max-h-[60vh] w-full object-contain"
                        />
                      </div>
                    )}

                  {!previewYukleniyor &&
                    !previewHatasi &&
                    previewVerisi?.basarili &&
                    previewVerisi.tip === "text" && (
                      <div
                        className={`overflow-hidden rounded-xl border ${
                          karanlikMod
                            ? "border-[#504945] bg-[#1d2021]"
                            : "border-[#d5c4a1] bg-[#fbf1c7]"
                        }`}
                      >
                        {!monacoShikiHazir ? (
                          <EditorLoadingState
                            karanlikMod={karanlikMod}
                            height={paylasimMonacoYuksekligiAl()}
                            mesaj={
                              dil === "tr"
                                ? "Gruvbox önizleme hazırlanıyor..."
                                : "Preparing Gruvbox preview..."
                            }
                            detay={
                              dil === "tr"
                                ? "Paylaşılan dosya için Shiki renklendirmesi yükleniyor."
                                : "Loading Shiki highlighting for the shared file."
                            }
                          />
                        ) : (
                          <MonacoEditor
                            height={paylasimMonacoYuksekligiAl()}
                            language={monacoDiliAl(
                              previewVerisi?.dosya_adi ||
                                paylasimBilgisi?.dosya_adi ||
                                "",
                            )}
                            theme={pionterMonacoTemasiAl(karanlikMod)}
                            value={previewVerisi.icerik || ""}
                            onMount={(_, monaco) => {
                              monaco.editor.setTheme(
                                pionterMonacoTemasiAl(karanlikMod),
                              );
                            }}
                            options={{
                              readOnly: true,
                              domReadOnly: true,
                              minimap: { enabled: false },
                              fontSize: 13,
                              fontFamily:
                                "JetBrains Mono, Fira Code, Menlo, Monaco, Consolas, monospace",
                              lineHeight: 21,
                              wordWrap: "on",
                              scrollBeyondLastLine: false,
                              automaticLayout: true,
                              tabSize: 2,
                              renderWhitespace: "none",
                              smoothScrolling: true,
                              bracketPairColorization: { enabled: true },
                              guides: {
                                indentation: true,
                                bracketPairs: true,
                              },
                              folding: true,
                              lineNumbers: "on",
                              glyphMargin: false,
                              overviewRulerBorder: false,
                              hideCursorInOverviewRuler: true,
                              renderLineHighlight: "none",
                              contextmenu: false,
                            }}
                          />
                        )}
                      </div>
                    )}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <a
                  href={downloadUrl}
                  className="inline-flex items-center justify-center rounded-xl bg-[#83a598] px-5 py-3 text-sm font-black text-[#282828] transition-colors hover:bg-[#458588] hover:text-[#fbf1c7]"
                >
                  {metinler.download}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
