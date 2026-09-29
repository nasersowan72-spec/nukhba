import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import ar from "./ar.js";
import en from "./en.js";

const DICTS = { ar, en };
const I18nContext = createContext(null);

function detectLang() {
  try {
    const saved = localStorage.getItem("lang");
    if (saved === "ar" || saved === "en") return saved;
  } catch { /* storage unavailable */ }
  const nav = (typeof navigator !== "undefined" && (navigator.language || "")) || "";
  return nav.toLowerCase().startsWith("ar") ? "ar" : "en";
}

const lookup = (dict, key) => key.split(".").reduce((o, k) => (o == null ? undefined : o[k]), dict);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(detectLang);
  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    try { localStorage.setItem("lang", lang); } catch { /* ignore */ }
  }, [lang, dir]);

  const t = useCallback((key, vars) => {
    let s = lookup(DICTS[lang], key);
    if (s == null) s = lookup(DICTS.ar, key);
    if (s == null) return key;
    if (vars) s = String(s).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ""));
    return s;
  }, [lang]);

  const value = useMemo(() => ({ lang, dir, t, setLang, toggle: () => setLang((l) => (l === "ar" ? "en" : "ar")) }), [lang, dir, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
