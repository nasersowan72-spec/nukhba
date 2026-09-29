import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Building2, CreditCard, Landmark, Lock, ShieldCheck, Smartphone, Upload } from "lucide-react";
import { PAYMENT_METHODS } from "../config.js";
import { useI18n } from "../i18n/index.jsx";
import { useAuth } from "../auth/AuthProvider.jsx";
import { useTitle } from "../components/Layout.jsx";
import { Alert, CourseArt, EmptyState, PageLoader, Spinner, cx } from "../components/ui.jsx";
import { coursePrice, getCourse, getSettings, isEnrolled, startGatewayPayment, submitBankTransfer } from "../lib/api.js";
import { money, pick } from "../lib/format.js";

const METHODS = [
  { key: "mpgs", icon: CreditCard, currency: "USD" },
  { key: "localbankcards", icon: Landmark, currency: "LYD" },
  { key: "tlync", icon: Smartphone, currency: "LYD" },
  { key: "bank_transfer", icon: Building2, currency: null },
];
const MAX_RECEIPT_MB = 8;

export default function Checkout() {
  const { slug } = useParams();
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  useTitle(t("checkout.title"));

  const [course, setCourse] = useState(undefined);
  const [prices, setPrices] = useState(null);
  const [settings, setSettings] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const available = useMemo(() => METHODS.filter((m) => PAYMENT_METHODS.includes(m.key)), []);
  const [method, setMethod] = useState(available[0]?.key || null);
  const [phone, setPhone] = useState("");
  const [transferCurrency, setTransferCurrency] = useState("LYD");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const c = await getCourse(slug);
        if (!alive) return;
        if (!c) { setCourse(null); return; }
        const [usd, lyd, s, e] = await Promise.all([coursePrice(c.id, "USD"), coursePrice(c.id, "LYD"), getSettings(), isEnrolled(c.id, user.id)]);
        if (!alive) return;
        setPrices({ USD: usd, LYD: lyd }); setSettings(s); setEnrolled(e); setCourse(c);
      } catch (e) { console.error(e); if (alive) setCourse(null); }
    })();
    return () => { alive = false; };
  }, [slug, user.id]);

  if (course === undefined) return <PageLoader />;
  if (course === null) return <div className="shell py-16"><EmptyState title={t("course.notFound")} action={<Link to="/" className="btn btn-gold">{t("nav.courses")}</Link>} /></div>;
  if (enrolled) return <Navigate to={`/learn/${course.slug}`} replace />;
  if (Number(course.price_usd) === 0) return <Navigate to={`/courses/${course.slug}`} replace />;

  const selected = METHODS.find((m) => m.key === method);
  const currency = selected?.currency || transferCurrency;
  const amount = prices?.[currency]?.amount;

  const pay = async () => {
    setError(null);
    if (!selected) return;
    if (method === "tlync" && !/^(\+?218|0)?9[1-6]\d{7}$/.test(phone.replace(/[\s-]/g, ""))) { setError(t("checkout.errors.phone")); return; }
    if (method === "bank_transfer") {
      if (!file) { setError(t("checkout.errors.receipt")); return; }
      if (file.size > MAX_RECEIPT_MB * 1024 * 1024) { setError(t("checkout.errors.receiptSize", { mb: MAX_RECEIPT_MB })); return; }
    }
    setBusy(true);
    try {
      if (method === "bank_transfer") {
        const invoice = await submitBankTransfer({ userId: user.id, courseId: course.id, currency, file });
        navigate(`/payment/result?invoice=${encodeURIComponent(invoice)}&status=awaiting_review`);
      } else {
        const { redirect_url } = await startGatewayPayment({ courseId: course.id, method, phone, lang });
        window.location.assign(redirect_url);
      }
    } catch (e) {
      console.error(e);
      const code = e?.message;
      setError(t(`checkout.errors.${["already_enrolled", "bad_phone", "method_unavailable"].includes(code) ? code : "generic"}`));
      setBusy(false);
    }
  };

  return (
    <div className="shell pt-8 max-w-5xl">
      <h1 className="text-3xl font-black">{t("checkout.title")}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-8">
        <div className="lg:col-span-3 flex flex-col gap-3">
          <h2 className="font-extrabold">{t("checkout.method")}</h2>
          {available.length === 0 && <Alert tone="info">{t("checkout.noMethods")}</Alert>}
          {available.map((m) => {
            const Icon = m.icon;
            const on = method === m.key;
            return (
              <button key={m.key} type="button" onClick={() => { setMethod(m.key); setError(null); }} aria-pressed={on}
                className={cx("panel p-4 flex items-start gap-4 text-start transition-colors", on && "border-gold-500")}
                style={on ? { borderColor: "rgba(212,175,55,.6)", background: "rgba(212,175,55,.06)" } : undefined}>
                <span className="flex items-center justify-center rounded-xl flex-shrink-0" style={{ width: 42, height: 42, background: "rgba(212,175,55,.1)", color: "#F4DC8F" }}><Icon size={19} /></span>
                <span className="flex-1">
                  <span className="block font-bold">{t(`checkout.methods.${m.key}.title`)}</span>
                  <span className="block text-sm mute mt-1 leading-relaxed">{t(`checkout.methods.${m.key}.desc`)}</span>
                </span>
                {m.currency && prices && <span className="font-bold num text-sm">{money(prices[m.currency]?.amount, m.currency, lang)}</span>}
              </button>
            );
          })}

          {method === "tlync" && (
            <div className="panel p-4">
              <label className="label" htmlFor="phone">{t("checkout.phone")}</label>
              <input id="phone" className="input num" dir="ltr" inputMode="tel" autoComplete="tel" placeholder="09XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          )}

          {method === "bank_transfer" && (
            <div className="panel p-4 flex flex-col gap-4">
              <p className="text-sm leading-relaxed whitespace-pre-line">{settings?.[lang === "en" ? "bank_transfer_en" : "bank_transfer_ar"]}</p>
              <div>
                <span className="label">{t("checkout.transferCurrency")}</span>
                <div className="flex gap-2">
                  {["LYD", "USD"].map((c) => (
                    <button key={c} type="button" onClick={() => setTransferCurrency(c)} className={cx("btn btn-sm", transferCurrency === c ? "btn-gold" : "btn-ghost")}>
                      {c} <span className="num">{prices && money(prices[c]?.amount, c, lang)}</span>
                    </button>
                  ))}
                </div>
              </div>
              <label className="label" htmlFor="receipt">{t("checkout.receipt")}</label>
              <label htmlFor="receipt" className="flex items-center gap-3 rounded-xl p-4 cursor-pointer" style={{ border: "1px dashed var(--line2)" }}>
                <Upload size={18} className="gold" />
                <span className="text-sm flex-1 truncate">{file ? file.name : t("checkout.chooseFile")}</span>
              </label>
              <input id="receipt" type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
          )}
        </div>

        <aside className="lg:col-span-2">
          <div className="panel p-3 lg:sticky" style={{ top: 90 }}>
            <div className="rounded-2xl overflow-hidden"><CourseArt course={course} /></div>
            <div className="p-3">
              <div className="font-extrabold">{pick(course, "title", lang)}</div>
              <div className="divider my-4" />
              <div className="flex items-center justify-between">
                <span className="mute">{t("checkout.total")}</span>
                <span className="font-display font-black text-2xl num">{amount != null ? money(amount, currency, lang) : "…"}</span>
              </div>
              {currency === "LYD" && prices && <p className="text-xs dim mt-2">{t("checkout.fxNote", { rate: Number(prices.LYD?.fx_rate).toFixed(2) })}</p>}
              {error && <div className="mt-4"><Alert>{error}</Alert></div>}
              <button type="button" className="btn btn-gold w-full mt-5" style={{ height: 52 }} disabled={busy || !selected || amount == null} onClick={pay}>
                {busy ? <Spinner size={16} /> : <Lock size={16} />} {method === "bank_transfer" ? t("checkout.submitTransfer") : t("checkout.pay")}
              </button>
              <p className="flex items-center gap-2 text-xs dim mt-4"><ShieldCheck size={14} /> {t("checkout.secure")}</p>
              <p className="text-xs dim mt-2 leading-relaxed">
                {t("checkout.agree")} <Link to="/legal/terms" className="gold">{t("legal.terms")}</Link> {t("common.and")} <Link to="/legal/refund" className="gold">{t("legal.refund")}</Link>
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
