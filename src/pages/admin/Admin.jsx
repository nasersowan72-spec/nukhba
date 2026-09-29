import React, { useCallback, useEffect, useState } from "react";
import { Check, ExternalLink, Settings, Wallet, X } from "lucide-react";
import { useI18n } from "../../i18n/index.jsx";
import { useTitle } from "../../components/Layout.jsx";
import { Alert, EmptyState, PageLoader, Spinner, cx } from "../../components/ui.jsx";
import { getSettings, pendingTransfers, receiptUrl, reviewTransfer, updateSettings } from "../../lib/api.js";
import { date, money, pick } from "../../lib/format.js";

function Transfers() {
  const { t, lang } = useI18n();
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    pendingTransfers().then(setRows).catch((e) => { console.error(e); setError(t("errors.load")); });
  }, [t]);
  useEffect(load, [load]);

  const openReceipt = async (path) => {
    try { window.open(await receiptUrl(path), "_blank", "noopener"); } catch { setError(t("errors.generic")); }
  };
  const decide = async (id, approve) => {
    const note = approve ? null : window.prompt(t("admin.rejectReason")) || null;
    setBusy(id); setError(null);
    try { await reviewTransfer(id, approve, note); setRows((r) => r.filter((x) => x.id !== id)); }
    catch (e) { console.error(e); setError(t("errors.generic")); }
    finally { setBusy(null); }
  };

  if (!rows && !error) return <PageLoader />;
  return (
    <div className="flex flex-col gap-3">
      {error && <Alert>{error}</Alert>}
      {rows && rows.length === 0 && <EmptyState icon={Wallet} title={t("admin.noTransfers")} desc={t("admin.noTransfersDesc")} />}
      {rows?.map((o) => (
        <div key={o.id} className="panel p-4 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="font-bold truncate">{pick(o.course, "title", lang)}</div>
            <div className="text-sm mute mt-1">{o.buyer?.full_name || "—"}</div>
            <div className="text-xs dim mt-1 num" dir="ltr">{o.invoice_no} / {date(o.created_at, lang)}</div>
          </div>
          <div className="font-display font-black text-lg num">{money(o.amount, o.currency, lang)}</div>
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => openReceipt(o.receipt_path)}><ExternalLink size={14} /> {t("admin.receipt")}</button>
            <button type="button" className="btn btn-ghost btn-sm" style={{ color: "#FDA4AF" }} disabled={busy === o.id} onClick={() => decide(o.id, false)}><X size={14} /> {t("admin.reject")}</button>
            <button type="button" className="btn btn-gold btn-sm" disabled={busy === o.id} onClick={() => decide(o.id, true)}>{busy === o.id ? <Spinner size={14} /> : <Check size={14} />} {t("admin.approve")}</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function SettingsForm() {
  const { t } = useI18n();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  useEffect(() => { getSettings().then(setForm).catch(() => setMsg({ tone: "error", text: t("errors.load") })); }, [t]);
  if (!form) return msg ? <Alert>{msg.text}</Alert> : <PageLoader />;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      await updateSettings({
        usd_to_lyd: Number(form.usd_to_lyd), default_instructor_share: Number(form.default_instructor_share),
        bank_transfer_ar: form.bank_transfer_ar, bank_transfer_en: form.bank_transfer_en, support_email: form.support_email || null,
      });
      setMsg({ tone: "success", text: t("account.saved") });
    } catch (err) { console.error(err); setMsg({ tone: "error", text: t("errors.generic") }); }
    finally { setBusy(false); }
  };
  return (
    <form onSubmit={save} className="panel p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
      <div><label className="label" htmlFor="fx">{t("admin.fx")}</label><input id="fx" type="number" step="0.0001" min="0.0001" className="input num" dir="ltr" value={form.usd_to_lyd} onChange={set("usd_to_lyd")} required /></div>
      <div><label className="label" htmlFor="share">{t("admin.share")}</label><input id="share" type="number" step="0.5" min="0" max="100" className="input num" dir="ltr" value={form.default_instructor_share} onChange={set("default_instructor_share")} required /></div>
      <div className="md:col-span-2"><label className="label" htmlFor="bar">{t("admin.bankAr")}</label><textarea id="bar" rows={4} className="input" dir="rtl" value={form.bank_transfer_ar} onChange={set("bank_transfer_ar")} /></div>
      <div className="md:col-span-2"><label className="label" htmlFor="ben">{t("admin.bankEn")}</label><textarea id="ben" rows={4} className="input" dir="ltr" value={form.bank_transfer_en} onChange={set("bank_transfer_en")} /></div>
      <div className="md:col-span-2"><label className="label" htmlFor="sup">{t("admin.supportEmail")}</label><input id="sup" type="email" className="input" dir="ltr" value={form.support_email || ""} onChange={set("support_email")} /></div>
      {msg && <div className="md:col-span-2"><Alert tone={msg.tone}>{msg.text}</Alert></div>}
      <div className="md:col-span-2"><button type="submit" className="btn btn-gold" disabled={busy}>{busy && <Spinner size={16} />} {t("account.save")}</button></div>
    </form>
  );
}

export default function Admin() {
  const { t } = useI18n();
  useTitle(t("nav.admin"));
  const [tab, setTab] = useState("transfers");
  return (
    <div className="shell pt-8">
      <h1 className="text-3xl font-black">{t("nav.admin")}</h1>
      <p className="mute mt-2">{t("admin.sub")}</p>
      <div className="flex gap-2 mt-6" role="tablist">
        {[{ k: "transfers", icon: Wallet }, { k: "settings", icon: Settings }].map(({ k, icon: Icon }) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cx("btn btn-sm", tab === k ? "btn-gold" : "btn-ghost")}>
            <Icon size={14} /> {t(`admin.tabs.${k}`)}
          </button>
        ))}
      </div>
      <div className="mt-6">{tab === "transfers" ? <Transfers /> : <SettingsForm />}</div>
    </div>
  );
}
