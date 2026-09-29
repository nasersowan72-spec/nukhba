import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Check, ChevronDown, Clock, Film, Lock, PlayCircle, Users } from "lucide-react";
import { CATEGORIES } from "../config.js";
import { useI18n } from "../i18n/index.jsx";
import { useAuth } from "../auth/AuthProvider.jsx";
import { useTitle } from "../components/Layout.jsx";
import { Alert, Avatar, CourseArt, EmptyState, LevelTag, PageLoader, Spinner, Stars } from "../components/ui.jsx";
import { enrollFree, getCourse, getInstructors, getReviews, isEnrolled } from "../lib/api.js";
import { clock, compact, date, duration, money, pick } from "../lib/format.js";

export default function CoursePage() {
  const { slug } = useParams();
  const { t, lang } = useI18n();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(undefined);
  const [instructor, setInstructor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [enrolled, setEnrolled] = useState(false);
  const [openModule, setOpenModule] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  useTitle(course ? pick(course, "title", lang) : "");

  useEffect(() => {
    let alive = true;
    setCourse(undefined);
    getCourse(slug).then(async (c) => {
      if (!alive) return;
      setCourse(c);
      if (!c) return;
      const [people, revs] = await Promise.all([getInstructors([c.instructor_id]), getReviews(c.id)]);
      if (!alive) return;
      setInstructor(people[c.instructor_id] || null);
      setReviews(revs);
    }).catch((e) => { console.error(e); if (alive) setCourse(null); });
    return () => { alive = false; };
  }, [slug]);

  useEffect(() => {
    if (!course || !user) { setEnrolled(false); return; }
    isEnrolled(course.id, user.id).then(setEnrolled).catch(() => setEnrolled(false));
  }, [course, user]);

  if (course === undefined) return <PageLoader />;
  if (course === null) {
    return (
      <div className="shell py-16">
        <EmptyState title={t("course.notFound")} desc={t("course.notFoundDesc")} action={<Link to="/" className="btn btn-gold">{t("nav.courses")}</Link>} />
      </div>
    );
  }

  const free = Number(course.price_usd) === 0;
  const owner = user && (user.id === course.instructor_id || isAdmin);
  const hasAccess = enrolled || owner;
  const category = CATEGORIES.find((c) => c.key === course.category);
  const outcomes = (lang === "en" && course.outcomes_en?.length ? course.outcomes_en : course.outcomes_ar?.length ? course.outcomes_ar : course.outcomes_en) || [];
  const description = pick(course, "description", lang);
  const firstLesson = course.lessons[0];

  const primaryAction = async () => {
    setError(null);
    if (hasAccess) { navigate(`/learn/${course.slug}`); return; }
    if (!user) { navigate(`/login?next=${encodeURIComponent(`/courses/${course.slug}`)}`); return; }
    if (!free) { navigate(`/checkout/${course.slug}`); return; }
    setBusy(true);
    try { await enrollFree(course.id); navigate(`/learn/${course.slug}`); }
    catch (e) { console.error(e); setError(t("errors.generic")); }
    finally { setBusy(false); }
  };

  const actionLabel = hasAccess ? t("course.continue") : free ? t("course.enrollFree") : t("course.buy");

  return (
    <div className="shell pt-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            {category && <span className="chip gold">{category[lang]}</span>}
            <LevelTag level={course.level} />
            {course.status !== "published" && <span className="chip" style={{ color: "#FBBF24" }}>{t(`status.${course.status}`)}</span>}
          </div>
          <h1 className="font-black mt-4" style={{ fontSize: "clamp(1.8rem, 3.6vw, 2.8rem)", lineHeight: 1.25 }}>{pick(course, "title", lang)}</h1>
          <p className="mute text-lg mt-4 leading-relaxed">{pick(course, "subtitle", lang)}</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-6 text-sm">
            {course.rating_count > 0 && (
              <span className="flex items-center gap-2"><Stars value={Number(course.rating_avg)} /><b className="num">{Number(course.rating_avg).toFixed(1)}</b><span className="dim num">({compact(course.rating_count, lang)})</span></span>
            )}
            <span className="flex items-center gap-2 mute"><Users size={15} /> {t("course.students", { n: compact(course.students_count, lang) })}</span>
            <span className="flex items-center gap-2 mute"><Film size={15} /> {t("course.lessonsCount", { n: course.lessons_count })}</span>
            <span className="flex items-center gap-2 mute"><Clock size={15} /> {duration(course.duration_sec, t)}</span>
          </div>
          {instructor && (
            <div className="flex items-center gap-3 mt-6">
              <Avatar person={instructor} size={44} />
              <div>
                <div className="font-bold">{instructor.full_name}</div>
                {instructor.headline && <div className="text-sm mute">{instructor.headline}</div>}
              </div>
            </div>
          )}

          {outcomes.length > 0 && (
            <section className="panel p-6 mt-10">
              <h2 className="text-xl font-extrabold">{t("course.outcomes")}</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {outcomes.map((o) => (
                  <li key={o} className="flex items-start gap-3 text-sm leading-relaxed">
                    <Check size={16} className="gold flex-shrink-0 mt-1" /> {o}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {description && (
            <section className="mt-10">
              <h2 className="text-xl font-extrabold">{t("course.about")}</h2>
              <div className="prose-nx mt-4">{description.split(/\n{1,}/).filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}</div>
            </section>
          )}

          <section className="mt-10">
            <h2 className="text-xl font-extrabold">{t("course.curriculum")}</h2>
            <p className="mute text-sm mt-1">{t("course.curriculumMeta", { m: course.modules.length, l: course.lessons_count, d: duration(course.duration_sec, t) })}</p>
            <div className="flex flex-col gap-3 mt-5">
              {course.modules.map((m, i) => {
                const open = openModule === i;
                return (
                  <div key={m.id} className="panel overflow-hidden">
                    <button type="button" onClick={() => setOpenModule(open ? -1 : i)} className="w-full flex items-center justify-between gap-3 p-4 text-start" aria-expanded={open}>
                      <span className="font-bold">{pick(m, "title", lang)}</span>
                      <span className="flex items-center gap-3 text-xs mute flex-shrink-0">
                        {t("course.lessonsCount", { n: m.lessons.length })}
                        <ChevronDown size={16} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .3s" }} />
                      </span>
                    </button>
                    {open && (
                      <ul className="px-4 pb-4 flex flex-col gap-1">
                        {m.lessons.map((l) => {
                          const canWatch = hasAccess || l.is_preview;
                          const row = (
                            <>
                              {canWatch ? <PlayCircle size={16} className="gold flex-shrink-0" /> : <Lock size={15} className="dim flex-shrink-0" />}
                              <span className="flex-1 text-sm">{pick(l, "title", lang)}</span>
                              {l.is_preview && !hasAccess && <span className="chip" style={{ color: "#5EEAD4" }}>{t("course.preview")}</span>}
                              <span className="text-xs dim num">{clock(l.duration_sec)}</span>
                            </>
                          );
                          return (
                            <li key={l.id}>
                              {canWatch ? (
                                <Link to={`/learn/${course.slug}/${l.id}`} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/5">{row}</Link>
                              ) : <div className="flex items-center gap-3 rounded-xl px-3 py-2">{row}</div>}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {instructor?.bio && (
            <section className="mt-10 panel p-6">
              <h2 className="text-xl font-extrabold">{t("course.instructor")}</h2>
              <div className="flex items-center gap-3 mt-4"><Avatar person={instructor} size={52} /><div className="font-bold">{instructor.full_name}</div></div>
              <p className="mute mt-4 leading-loose">{instructor.bio}</p>
            </section>
          )}

          <section className="mt-10">
            <h2 className="text-xl font-extrabold">{t("course.reviews")}</h2>
            {reviews.length === 0 ? <p className="mute text-sm mt-3">{t("course.noReviews")}</p> : (
              <div className="flex flex-col gap-3 mt-5">
                {reviews.map((r) => (
                  <div key={r.id} className="panel p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3"><Avatar person={r.author} size={34} /><span className="font-bold text-sm">{r.author?.full_name || t("course.student")}</span></div>
                      <span className="text-xs dim">{date(r.created_at, lang)}</span>
                    </div>
                    <div className="mt-3"><Stars value={r.rating} size={13} /></div>
                    {r.body && <p className="text-sm mute mt-2 leading-relaxed">{r.body}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="lg:sticky self-start" style={{ top: 90 }}>
          <div className="panel p-3" style={{ boxShadow: "0 40px 100px -40px rgba(0,0,0,.95)" }}>
            <div className="rounded-2xl overflow-hidden"><CourseArt course={course} /></div>
            <div className="p-3">
              <div className="flex items-baseline gap-3 mt-2">
                <span className="font-display font-black text-3xl num">{free ? t("course.free") : money(course.price_usd, "USD", lang)}</span>
                {!free && Number(course.compare_price_usd) > Number(course.price_usd) && <span className="dim num line-through">{money(course.compare_price_usd, "USD", lang)}</span>}
              </div>
              {!free && <p className="text-xs mute mt-2">{t("course.priceNote")}</p>}
              {error && <div className="mt-4"><Alert>{error}</Alert></div>}
              <button type="button" className="btn btn-gold w-full mt-5" style={{ height: 52 }} onClick={primaryAction} disabled={busy}>
                {busy && <Spinner size={16} />} {actionLabel}
              </button>
              {!hasAccess && firstLesson?.is_preview && (
                <Link to={`/learn/${course.slug}/${firstLesson.id}`} className="btn btn-ghost w-full mt-3">{t("course.watchPreview")}</Link>
              )}
              <ul className="mt-5 flex flex-col gap-2 text-sm mute">
                <li className="flex items-center gap-2"><Check size={14} className="gold" /> {t("course.perkLifetime")}</li>
                <li className="flex items-center gap-2"><Check size={14} className="gold" /> {t("course.perkCertificate")}</li>
                <li className="flex items-center gap-2"><Check size={14} className="gold" /> {t("course.perkDevices")}</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
