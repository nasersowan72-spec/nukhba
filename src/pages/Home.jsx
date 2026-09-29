import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Film, Globe2, Search, ShieldCheck } from "lucide-react";
import { BRAND, CATEGORIES } from "../config.js";
import { useI18n } from "../i18n/index.jsx";
import { useTitle } from "../components/Layout.jsx";
import CourseCard from "../components/CourseCard.jsx";
import { Alert, CourseArt, EmptyState, PageLoader, cx } from "../components/ui.jsx";
import { getInstructors, listCourses } from "../lib/api.js";
import { pick } from "../lib/format.js";

const normalize = (s = "") => String(s).toLowerCase()
  .replace(/[\u064B-\u0652\u0640]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");

export default function Home() {
  const { t, lang } = useI18n();
  useTitle(t("home.metaTitle"));
  const [courses, setCourses] = useState(null);
  const [people, setPeople] = useState({});
  const [error, setError] = useState(null);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const catalogRef = useRef(null);

  useEffect(() => {
    let alive = true;
    listCourses()
      .then(async (rows) => {
        if (!alive) return;
        setCourses(rows);
        setPeople(await getInstructors(rows.map((c) => c.instructor_id)));
      })
      .catch((e) => { console.error(e); if (alive) setError(true); });
    return () => { alive = false; };
  }, []);

  const visible = useMemo(() => {
    if (!courses) return [];
    const q = normalize(query.trim());
    return courses.filter((c) =>
      (category === "all" || c.category === category) &&
      (!q || normalize(`${c.title_ar} ${c.title_en} ${c.subtitle_ar} ${c.subtitle_en} ${people[c.instructor_id]?.full_name || ""}`).includes(q)));
  }, [courses, category, query, people]);

  const featured = courses?.find((c) => c.featured) || courses?.[0];
  const usedCategories = CATEGORIES.filter((c) => courses?.some((x) => x.category === c.key));

  return (
    <>
      <section className="shell grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pt-10 md:pt-16 pb-16">
        <div className="rise">
          <h1 className="gold-text font-black" style={{ fontSize: "clamp(2.1rem, 4.4vw, 3.7rem)", lineHeight: 1.22 }}>
            {t("home.headline")}
          </h1>
          <p className="mute mt-6 text-base md:text-lg max-w-xl" style={{ lineHeight: 1.9 }}>{t("home.subhead")}</p>
          <div className="flex flex-wrap gap-3 mt-8">
            <button type="button" className="btn btn-gold" style={{ height: 52 }} onClick={() => catalogRef.current?.scrollIntoView({ behavior: "smooth" })}>
              {t("home.browse")}
            </button>
            {featured && (
              <Link to={`/courses/${featured.slug}`} className="btn btn-ghost" style={{ height: 52 }}>{t("home.featuredCta")}</Link>
            )}
          </div>
        </div>
        {featured && (
          <Link to={`/courses/${featured.slug}`} className="panel p-3 rise block" style={{ animationDelay: "120ms", boxShadow: "0 50px 120px -40px rgba(0,0,0,.95), 0 0 100px -50px rgba(212,175,55,.5)" }}>
            <div className="rounded-2xl overflow-hidden"><CourseArt course={featured} /></div>
            <div className="p-3 pt-4">
              <div className="text-xs font-bold gold">{t("home.featuredLabel")}</div>
              <div className="font-display font-extrabold text-xl mt-1">{pick(featured, "title", lang)}</div>
              <div className="mute text-sm mt-1 clamp-2">{pick(featured, "subtitle", lang)}</div>
            </div>
          </Link>
        )}
      </section>

      <section className="shell grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Film, k: "cinematic" },
          { icon: BadgeCheck, k: "certificates" },
          { icon: ShieldCheck, k: "payments" },
          { icon: Globe2, k: "bilingual" },
        ].map(({ icon: Icon, k }) => (
          <div key={k} className="rounded-2xl p-4" style={{ border: "1px solid var(--line)", background: "rgba(255,255,255,.015)" }}>
            <Icon size={18} className="gold" />
            <div className="font-bold text-sm mt-3">{t(`home.trust.${k}.title`)}</div>
            <div className="text-xs mute mt-1 leading-relaxed">{t(`home.trust.${k}.desc`)}</div>
          </div>
        ))}
      </section>

      <section ref={catalogRef} className="shell mt-16" style={{ scrollMarginTop: 90 }}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-black">{t("home.catalogTitle")}</h2>
            <p className="mute mt-2">{t("home.catalogSub", { brand: BRAND.name[lang] })}</p>
          </div>
          <label className="relative block w-full md:w-80">
            <span className="sr-only">{t("home.search")}</span>
            <Search size={16} className="dim absolute top-1/2 -translate-y-1/2" style={{ insetInlineStart: 14 }} />
            <input className="input" style={{ paddingInlineStart: 40 }} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("home.search")} />
          </label>
        </div>

        {usedCategories.length > 1 && (
          <div className="flex gap-2 mt-6 overflow-x-auto pb-1" role="tablist" aria-label={t("home.categories")}>
            {[{ key: "all", ar: t("home.all"), en: t("home.all") }, ...usedCategories].map((c) => (
              <button key={c.key} type="button" role="tab" aria-selected={category === c.key} onClick={() => setCategory(c.key)}
                className={cx("btn btn-sm", category === c.key ? "btn-gold" : "btn-ghost")}>
                {c[lang]}
              </button>
            ))}
          </div>
        )}

        <div className="mt-8">
          {error ? <Alert>{t("errors.load")}</Alert>
            : !courses ? <PageLoader />
            : visible.length === 0 ? (
              <EmptyState icon={Search} title={courses.length ? t("home.noMatch") : t("home.emptyTitle")} desc={courses.length ? t("home.noMatchDesc") : t("home.emptyDesc")} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {visible.map((c) => <CourseCard key={c.id} course={c} instructor={people[c.instructor_id]} />)}
              </div>
            )}
        </div>
      </section>
    </>
  );
}
