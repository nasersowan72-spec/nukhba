export const numberLocale = (lang) => (lang === "ar" ? "ar-LY-u-nu-latn" : "en-US");

const SYMBOL = { USD: { ar: "$", en: "$" }, LYD: { ar: "د.ل", en: "LYD" } };

/** Prices use Western digits in both languages: "$349" / "349 $", "1,919.50 LYD" / "1,919.50 د.ل" */
export function money(amount, currency, lang) {
  const n = Number(amount || 0);
  const num = new Intl.NumberFormat("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(n);
  const sym = SYMBOL[currency]?.[lang] || currency;
  if (currency === "USD" && lang === "en") return `$${num}`;
  return `${num} ${sym}`;
}

export const compact = (n, lang) =>
  lang === "en"
    ? new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(Number(n || 0))
    : new Intl.NumberFormat("en-US").format(Number(n || 0));

export function duration(sec, t) {
  const mins = Math.max(0, Math.round((sec || 0) / 60));
  const h = Math.floor(mins / 60), m = mins % 60;
  if (!h) return t("time.m", { m });
  return m ? t("time.hm", { h, m }) : t("time.h", { h });
}

export function clock(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  const pad = (x) => String(x).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(r)}` : `${m}:${pad(r)}`;
}

export const date = (iso, lang) =>
  new Intl.DateTimeFormat(numberLocale(lang), { dateStyle: "medium" }).format(new Date(iso));

/** Localised field with graceful fallback: pick(course, "title", "en") */
export function pick(obj, field, lang) {
  if (!obj) return "";
  const other = lang === "ar" ? "en" : "ar";
  return obj[`${field}_${lang}`] || obj[`${field}_${other}`] || "";
}
