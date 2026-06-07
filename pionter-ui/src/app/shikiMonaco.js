import { shikiToMonaco } from "@shikijs/monaco";
import { createHighlighter } from "shiki";

export const PIONTER_MONACO_DARK_THEME = "gruvbox-dark-medium";
export const PIONTER_MONACO_LIGHT_THEME = "gruvbox-light-medium";

let shikiHazirPromise = null;

const monacoDilIdleri = [
  "javascript",
  "typescript",
  "json",
  "go",
  "css",
  "html",
  "markdown",
  "python",
  "java",
  "php",
  "sql",
  "yaml",
  "xml",
  "shellscript",
  "rust",
  "ruby",
  "c",
  "cpp",
  "csharp",
  "dockerfile",
  "toml",
  "ini",
  "plaintext",
];

const shikiDilleri = [
  "javascript",
  "typescript",
  "jsx",
  "tsx",
  "json",
  "go",
  "css",
  "html",
  "markdown",
  "python",
  "java",
  "php",
  "sql",
  "yaml",
  "xml",
  "shellscript",
  "rust",
  "ruby",
  "c",
  "cpp",
  "csharp",
  "dockerfile",
  "toml",
  "ini",
];

const monacoDilleriniKaydet = (monaco) => {
  const mevcutDiller = new Set(
    monaco.languages.getLanguages().map((dil) => dil.id),
  );

  monacoDilIdleri.forEach((dilID) => {
    if (!mevcutDiller.has(dilID)) {
      monaco.languages.register({ id: dilID });
    }
  });
};

export const pionterMonacoShikiHazirla = (monaco) => {
  if (!monaco) {
    return Promise.resolve();
  }

  if (!shikiHazirPromise) {
    shikiHazirPromise = (async () => {
      monacoDilleriniKaydet(monaco);

      const highlighter = await createHighlighter({
        themes: [PIONTER_MONACO_DARK_THEME, PIONTER_MONACO_LIGHT_THEME],
        langs: shikiDilleri,
      });

      shikiToMonaco(highlighter, monaco);
    })();
  }

  return shikiHazirPromise;
};

export const pionterMonacoTemasiAl = (karanlikMod) => {
  return karanlikMod ? PIONTER_MONACO_DARK_THEME : PIONTER_MONACO_LIGHT_THEME;
};
