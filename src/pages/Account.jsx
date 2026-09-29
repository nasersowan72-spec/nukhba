import React, { useEffect, useState } from "react";
import { useI18n } from "../i18n/index.jsx";
import { useAuth } from "../auth/AuthProvider.jsx";
import { useTitle } from "../components/Layout.jsx";
import { Alert, Spinner } from "../components/ui.jsx";
import { supabase } from "../lib/supabase.js";

export default function Account() {
  const { t, lang, setLang } = useI18n();
  const { user, profile, refreshProfile } = useAuth();
  useTitle(t("nav.account"));
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => { setName(profile?.full_name || ""); }, [profile]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { error } = await supabase.from("profiles").update({ full_name: name.trim(), locale: lang }).eq("id", user.id);
    setBusy(false);
    if (error) { setMsg({ tone: "error", text: t("errors.generic") }); return; }
    await refreshProfile();
    setMsg({ tone: "success", text: t("account.saved") });
  };

  return (
    <div className="shell py-10 max-w-xl">
      <h1 className="text-3xl font-black">{t("nav.account")}</h1>
      <form onSubmit={save} className="panel p-6 mt-8 flex flex-col gap-4">
        <div><label className="label" htmlFor="full_name">{t("auth.name")}</label>
          <input id="full_name" className="input" value={name} onChange={(e) => setName(e.target.value)} required /></div>
        <p className="text-xs dim">{t("account.nameHint")}</p>
        <div><span className="label">{t("auth.email")}</span><div className="input" dir="ltr" style={{ opacity: 0.7 }}>{user.email}</div></div>
        <div>
          <span className="label">{t("account.language")}</span>
          <div className="flex gap-2">
            <button type="button" className={`btn btn-sm ${lang === "ar" ? "btn-gold" : "btn-ghost"}`} onClick={() => setLang("ar")}>العربية</button>
            <button type="button" className={`btn btn-sm ${lang === "en" ? "btn-gold" : "btn-ghost"}`} onClick={() => setLang("en")}>English</button>
          </div>
        </div>
        {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
        <button type="submit" className="btn btn-gold self-start" disabled={busy || !name.trim()}>{busy && <Spinner size={16} />} {t("account.save")}</button>
      </form>
    </div>
  );
}
