/* ══════════════════════════════════════════════════════════════════
   BRAND SETTINGS — change the platform's name and identity here only.
   Every page, email link and legal document reads from this file.
   ══════════════════════════════════════════════════════════════════ */
export const BRAND = {
  name: { ar: "نُخبة", en: "Nukhba" },
  fullName: { ar: "أكاديمية نُخبة", en: "Nukhba Academy" },
  tagline: { ar: "حيث يتعلّم القادة من القادة", en: "Where leaders learn from leaders" },
  legalEntity: { ar: "أكاديمية نُخبة للتدريب", en: "Nukhba Academy" }, // registered company name
  country: { ar: "ليبيا", en: "Libya" },
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || "support@example.com",
  siteUrl: (import.meta.env.VITE_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "")).replace(/\/+$/, ""),
};

export const CATEGORIES = [
  { key: "ai", ar: "الذكاء الاصطناعي", en: "Artificial intelligence" },
  { key: "finance", ar: "المال والاستثمار", en: "Finance & investing" },
  { key: "leadership", ar: "القيادة والمنتجات", en: "Leadership & product" },
  { key: "general", ar: "عام", en: "General" },
];

export const LEVELS = {
  beginner: { ar: "مبتدئ", en: "Beginner", color: "#5EEAD4", rank: 1 },
  intermediate: { ar: "متوسط", en: "Intermediate", color: "#93C5FD", rank: 2 },
  advanced: { ar: "متقدم", en: "Advanced", color: "#C4B5FD", rank: 3 },
  executive: { ar: "تنفيذي", en: "Executive", color: "#F4DC8F", rank: 3 },
};

/* Course artwork palettes (no image needed) */
export const THEMES = {
  gold: { a: "#3B2A0B", b: "#0D1220", glow: "#D4AF37" },
  teal: { a: "#0F766E", b: "#0B1220", glow: "#5EEAD4" },
  violet: { a: "#4C1D95", b: "#0B0F1E", glow: "#A78BFA" },
  ember: { a: "#7C2D12", b: "#120C0B", glow: "#FB923C" },
  rose: { a: "#831843", b: "#12070D", glow: "#F472B6" },
};

/* Checkout methods switched on in .env (VITE_PAYMENT_METHODS) */
export const PAYMENT_METHODS = (import.meta.env.VITE_PAYMENT_METHODS || "bank_transfer")
  .split(",").map((s) => s.trim()).filter(Boolean);
