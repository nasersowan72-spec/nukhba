import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Award, Search } from "lucide-react";
import { BRAND } from "../config.js";
import { useI18n } from "../i18n/index.jsx";
import { useTitle } from "../components/Layout.jsx";
import { Alert, Spinner } from "../components/ui.jsx";
import { getCertificate } from "../lib/api.js";
import { date } from "../lib/format.js";

export default function Verify() {
  const { code } = useParams();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  useTitle(t("cert.verifyTitle"));
  const [input, setInput] = useState(code || "");
  const [cert, setCert] = useState(undefined);

  useEffect(() => {
    if (!code) { setCert(undefined); return; }
    setCert(undefined);
    getCertificate(code).then((c) => setCert(c || null)).catch(() => setCert(null));
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="shell py-12 max-w-2xl">
      <h1 className="text-3xl font-black">{t("cert.verifyTitle")}</h1>
      <form className="flex gap-2 mt-6" onSubmit={(e) => { e.preventDefault(); if (input.trim()) navigate(`/verify/${input.trim().toUpperCase()}`); }}>
        <input className="input num" dir="ltr" value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("cert.codePlaceholder")} aria-label={t("cert.codePlaceholder")} />
        <button type="submit" className="btn btn-gold"><Search size={16} /> {t("cert.check")}</button>
      </form>
      <div className="mt-8">
        {code && cert === undefined && <div className="flex items-center gap-2 mute"><Spinner /> {t("common.loading")}</div>}
        {code && cert === null && <Alert>{t("cert.notFound")}</Alert>}
        {cert && (
          <div className="panel p-8 text-center" style={{ borderColor: "rgba(212,175,55,.4)", boxShadow: "0 0 90px -40px rgba(212,175,55,.6)" }}>
            <Award size={44} className="gold mx-auto" />
            <p className="mute mt-4">{t("cert.certifies", { brand: BRAND.fullName[lang] })}</p>
            <h2 className="gold-text font-black text-3xl mt-3">{cert.holder_name}</h2>
            <p className="mute mt-4">{t("cert.completed")}</p>
            <p className="font-extrabold text-xl mt-2">{cert.course_title}</p>
            <div className="flex justify-center gap-8 mt-8 text-sm">
              <div><div className="dim text-xs">{t("cert.date")}</div><div className="font-bold mt-1">{date(cert.issued_at, lang)}</div></div>
              <div><div className="dim text-xs">{t("cert.code")}</div><div className="font-bold mt-1 num" dir="ltr">{cert.code}</div></div>
            </div>
            <button type="button" className="btn btn-ghost mt-8" onClick={() => window.print()}>{t("cert.print")}</button>
          </div>
        )}
      </div>
    </div>
  );
}
