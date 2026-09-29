import React from "react";
import { Link, useParams } from "react-router-dom";
import { BRAND } from "../config.js";
import { useI18n } from "../i18n/index.jsx";
import { useTitle } from "../components/Layout.jsx";
import { EmptyState } from "../components/ui.jsx";
import { LEGAL } from "../content/legal.js";

export default function Legal() {
  const { doc } = useParams();
  const { t, lang } = useI18n();
  const page = LEGAL[doc]?.[lang];
  useTitle(page?.title || "");
  if (!page) return <div className="shell py-16"><EmptyState title={t("course.notFound")} action={<Link to="/" className="btn btn-gold">{t("nav.courses")}</Link>} /></div>;
  const fill = (s) => s
    .replaceAll("{entity}", BRAND.legalEntity[lang]).replaceAll("{brand}", BRAND.fullName[lang])
    .replaceAll("{email}", BRAND.supportEmail).replaceAll("{country}", BRAND.country[lang]);
  return (
    <article className="shell py-12 max-w-3xl">
      <h1 className="text-3xl md:text-4xl font-black">{page.title}</h1>
      <p className="dim text-sm mt-3">{t("legal.updated")} {page.updated}</p>
      {page.sections.map((s) => (
        <section key={s.h} className="mt-8">
          <h2 className="text-xl font-extrabold">{fill(s.h)}</h2>
          {s.p.map((p, i) => <p key={i} className="mute mt-3 leading-loose">{fill(p)}</p>)}
        </section>
      ))}
    </article>
  );
}
