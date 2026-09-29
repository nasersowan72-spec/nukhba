import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BRAND } from "../config.js";
import { useI18n } from "../i18n/index.jsx";
import { useAuth } from "../auth/AuthProvider.jsx";
import { useTitle } from "../components/Layout.jsx";
import { Alert, Spinner } from "../components/ui.jsx";
import { supabase } from "../lib/supabase.js";

const safeNext = (v) => (v && v.startsWith("/") && !v.startsWith("//") ? v : "/my-learning");

export default function Auth({ mode: initialMode = "signin" }) {
  const { t, lang } = useI18n();
  const { user, recovery, clearRecovery } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = safeNext(params.get("next"));
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  useTitle(t(`auth.${mode}.title`));

  useEffect(() => { if (recovery) setMode("update"); }, [recovery]);
  useEffect(() => { if (user && mode !== "update" && !recovery) navigate(next, { replace: true }); }, [user, mode, recovery, next, navigate]);

  const redirectTo = `${BRAND.siteUrl}/login?next=${encodeURIComponent(next)}`;

  const submit = async (e) => {
    e.preventDefault();
    setError(null); setNotice(null); setBusy(true);
    try {
      if (mode === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      } else if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name, locale: lang }, emailRedirectTo: redirectTo } });
        if (err) throw err;
        if (!data.session) setNotice(t("auth.checkEmail"));
      } else if (mode === "forgot") {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${BRAND.siteUrl}/reset-password` });
        if (err) throw err;
        setNotice(t("auth.resetSent"));
      } else if (mode === "update") {
        const { error: err } = await supabase.auth.updateUser({ password });
        if (err) throw err;
        clearRecovery();
        navigate("/my-learning", { replace: true });
      }
    } catch (err) {
      const msg = String(err?.message || "");
      setError(/invalid login/i.test(msg) ? t("auth.errors.invalid")
        : /already registered/i.test(msg) ? t("auth.errors.exists")
        : /password/i.test(msg) ? t("auth.errors.password")
        : t("errors.generic"));
    } finally { setBusy(false); }
  };

  const google = async () => {
    setError(null);
    const { error: err } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (err) setError(t("errors.generic"));
  };

  return (
    <div className="shell py-12 flex justify-center">
      <div className="panel p-7 md:p-9 w-full max-w-md">
        <h1 className="text-2xl font-black">{t(`auth.${mode}.title`)}</h1>
        <p className="mute text-sm mt-2">{t(`auth.${mode}.sub`, { brand: BRAND.name[lang] })}</p>

        <form onSubmit={submit} className="flex flex-col gap-4 mt-7" noValidate>
          {mode === "signup" && (
            <div><label className="label" htmlFor="name">{t("auth.name")}</label>
              <input id="name" className="input" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} /></div>
          )}
          {mode !== "update" && (
            <div><label className="label" htmlFor="email">{t("auth.email")}</label>
              <input id="email" type="email" dir="ltr" className="input" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          )}
          {mode !== "forgot" && (
            <div>
              <label className="label" htmlFor="password">{mode === "update" ? t("auth.newPassword") : t("auth.password")}</label>
              <input id="password" type="password" dir="ltr" className="input" minLength={8} required
                autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
              {mode !== "signin" && <p className="text-xs dim mt-2">{t("auth.passwordHint")}</p>}
            </div>
          )}
          {error && <Alert>{error}</Alert>}
          {notice && <Alert tone="success">{notice}</Alert>}
          <button type="submit" className="btn btn-gold w-full" disabled={busy}>{busy && <Spinner size={16} />} {t(`auth.${mode}.cta`)}</button>
        </form>

        {(mode === "signin" || mode === "signup") && (
          <>
            <div className="flex items-center gap-3 my-6 text-xs dim"><span className="divider flex-1" />{t("auth.or")}<span className="divider flex-1" /></div>
            <button type="button" className="btn btn-ghost w-full" onClick={google}>{t("auth.google")}</button>
          </>
        )}

        <div className="flex flex-col gap-2 mt-6 text-sm">
          {mode === "signin" && <>
            <button type="button" className="gold text-start" onClick={() => setMode("forgot")}>{t("auth.forgotLink")}</button>
            <span className="mute">{t("auth.noAccount")} <button type="button" className="gold" onClick={() => setMode("signup")}>{t("auth.signup.cta")}</button></span>
          </>}
          {mode !== "signin" && mode !== "update" && (
            <span className="mute">{t("auth.haveAccount")} <button type="button" className="gold" onClick={() => setMode("signin")}>{t("auth.signin.cta")}</button></span>
          )}
          {mode === "signup" && <p className="text-xs dim leading-relaxed mt-2">{t("auth.consent")} <Link to="/legal/terms" className="gold">{t("legal.terms")}</Link> {t("common.and")} <Link to="/legal/privacy" className="gold">{t("legal.privacy")}</Link></p>}
        </div>
      </div>
    </div>
  );
}
