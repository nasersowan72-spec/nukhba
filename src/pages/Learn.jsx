import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Award, Check, Download, Lock, PlayCircle } from "lucide-react";
import { useI18n } from "../i18n/index.jsx";
import { useAuth } from "../auth/AuthProvider.jsx";
import { useTitle } from "../components/Layout.jsx";
import VideoPlayer from "../components/VideoPlayer.jsx";
import { Alert, EmptyState, PageLoader, ProgressBar, Spinner, cx } from "../components/ui.jsx";
import { getCourse, getProgress, isEnrolled, issueCertificate, lessonMedia, saveProgress } from "../lib/api.js";
import { clock, pick } from "../lib/format.js";

export default function Learn() {
  const { slug, lessonId } = useParams();
  const { t, lang, dir } = useI18n();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(undefined);
  const [access, setAccess] = useState(false);
  const [progress, setProgress] = useState({});
  const [media, setMedia] = useState(undefined);
  const [certCode, setCertCode] = useState(null);
  const [certBusy, setCertBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const c = await getCourse(slug);
        if (!alive) return;
        if (!c) { setCourse(null); return; }
        const owner = user && (c.instructor_id === user.id || isAdmin);
        const [enrolled, rows] = await Promise.all([
          owner ? true : isEnrolled(c.id, user?.id),
          user ? getProgress(user.id, c.id) : [],
        ]);
        if (!alive) return;
        setAccess(Boolean(owner || enrolled));
        setProgress(Object.fromEntries(rows.map((r) => [r.lesson_id, r])));
        setCourse(c);
      } catch (e) { console.error(e); if (alive) setCourse(null); }
    })();
    return () => { alive = false; };
  }, [slug, user, isAdmin]);

  const lessons = course?.lessons || [];
  const firstOpen = useMemo(() => lessons.find((l) => !progress[l.id]?.completed_at) || lessons[0], [lessons, progress]);
  const lesson = lessons.find((l) => l.id === lessonId) || (access ? firstOpen : lessons.find((l) => l.is_preview)) || lessons[0];
  const idx = lesson ? lessons.findIndex((l) => l.id === lesson.id) : -1;
  const canWatch = Boolean(lesson && (access || lesson.is_preview));
  useTitle(lesson ? pick(lesson, "title", lang) : "");

  useEffect(() => {
    if (!lesson || !canWatch) { setMedia(null); return; }
    let alive = true;
    setMedia(undefined);
    lessonMedia(lesson.id).then((m) => { if (alive) setMedia(m || { video_url: "" }); }).catch(() => alive && setMedia(null));
    return () => { alive = false; };
  }, [lesson?.id, canWatch]); // eslint-disable-line react-hooks/exhaustive-deps

  const doneCount = lessons.filter((l) => progress[l.id]?.completed_at).length;
  const pct = lessons.length ? Math.round((doneCount / lessons.length) * 100) : 0;

  const persist = useCallback(async (l, patch) => {
    if (!user || !access || !course) return;
    setProgress((p) => ({ ...p, [l.id]: { ...(p[l.id] || {}), lesson_id: l.id, ...patch } }));
    try { await saveProgress(user.id, course.id, l.id, patch); }
    catch (e) { console.error(e); setError(t("errors.saveProgress")); }
  }, [user, access, course, t]);

  const toggleDone = (l) => persist(l, { completed_at: progress[l.id]?.completed_at ? null : new Date().toISOString() });

  const onEnded = () => {
    if (!lesson || !access) return;
    if (!progress[lesson.id]?.completed_at) persist(lesson, { completed_at: new Date().toISOString(), position_sec: 0 });
    const next = lessons[idx + 1];
    if (next) setTimeout(() => navigate(`/learn/${slug}/${next.id}`), 1200);
  };

  const claimCertificate = async () => {
    setCertBusy(true); setError(null);
    try { setCertCode(await issueCertificate(course.id)); }
    catch (e) { console.error(e); setError(t("errors.certificate")); }
    finally { setCertBusy(false); }
  };

  if (course === undefined) return <PageLoader />;
  if (course === null || !lesson) {
    return <div className="shell py-16"><EmptyState title={t("course.notFound")} action={<Link to="/" className="btn btn-gold">{t("nav.courses")}</Link>} /></div>;
  }

  const Prev = dir === "rtl" ? ArrowRight : ArrowLeft;
  const Next = dir === "rtl" ? ArrowLeft : ArrowRight;
  const resources = Array.isArray(media?.resources) ? media.resources : [];

  return (
    <div className="shell pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="min-w-0">
          <Link to={`/courses/${course.slug}`} className="text-sm mute hover:text-white">{pick(course, "title", lang)}</Link>
          <h1 className="text-xl md:text-2xl font-extrabold mt-1">{pick(lesson, "title", lang)}</h1>
        </div>
        {access && (
          <div className="flex items-center gap-3 flex-shrink-0 w-full md:w-72">
            <div className="flex-1"><ProgressBar value={pct} /></div>
            <span className="text-sm font-bold num">{t("learn.doneOf", { d: doneCount, n: lessons.length })}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          {canWatch ? (
            media === undefined ? (
              <div className="w-full flex items-center justify-center mute" style={{ aspectRatio: "16 / 9", background: "#000", borderRadius: 20 }}><Spinner /></div>
            ) : (
              <VideoPlayer key={lesson.id} url={media?.video_url} title={pick(lesson, "title", lang)}
                startAt={progress[lesson.id]?.position_sec || 0}
                onPosition={(sec) => access && persist(lesson, { position_sec: sec })}
                onEnded={onEnded} />
            )
          ) : (
            <div className="panel flex flex-col items-center justify-center text-center p-8" style={{ aspectRatio: "16 / 9" }}>
              <Lock size={28} className="gold" />
              <h2 className="text-xl font-extrabold mt-4">{t("learn.lockedTitle")}</h2>
              <p className="mute text-sm mt-2 max-w-md">{t("learn.lockedDesc")}</p>
              <Link to={`/courses/${course.slug}`} className="btn btn-gold mt-6">{t("course.buy")}</Link>
            </div>
          )}

          {error && <div className="mt-4"><Alert>{error}</Alert></div>}

          <div className="flex flex-wrap items-center justify-between gap-3 mt-5">
            <div className="flex gap-2">
              <button type="button" className="btn btn-ghost" disabled={idx <= 0} onClick={() => navigate(`/learn/${slug}/${lessons[idx - 1].id}`)} aria-label={t("learn.prev")}><Prev size={16} /></button>
              {access && (
                <button type="button" className="btn btn-ghost" onClick={() => toggleDone(lesson)} aria-pressed={Boolean(progress[lesson.id]?.completed_at)}
                  style={progress[lesson.id]?.completed_at ? { color: "#34D399", borderColor: "rgba(52,211,153,.45)" } : undefined}>
                  <Check size={16} /> {progress[lesson.id]?.completed_at ? t("learn.completed") : t("learn.markComplete")}
                </button>
              )}
            </div>
            <button type="button" className="btn btn-gold" disabled={idx >= lessons.length - 1} onClick={() => navigate(`/learn/${slug}/${lessons[idx + 1].id}`)}>
              {t("learn.next")} <Next size={16} />
            </button>
          </div>

          {pick(lesson, "summary", lang) && <p className="mute mt-6 leading-loose">{pick(lesson, "summary", lang)}</p>}

          {resources.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-extrabold">{t("learn.resources")}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {resources.map((r) => (
                  <a key={r.url} href={r.url} target="_blank" rel="noreferrer" className="panel p-4 flex items-center gap-3 hover:border-white/20">
                    <Download size={18} className="gold" />
                    <span className="flex-1 min-w-0"><span className="block text-sm font-bold truncate">{r.name}</span><span className="block text-xs dim">{[r.type, r.size].filter(Boolean).join(" / ")}</span></span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {access && pct === 100 && (
            <section className="panel p-6 mt-8 flex flex-col sm:flex-row sm:items-center gap-4" style={{ borderColor: "rgba(212,175,55,.35)" }}>
              <Award size={32} className="gold flex-shrink-0" />
              <div className="flex-1">
                <h2 className="font-extrabold text-lg">{t("cert.readyTitle")}</h2>
                <p className="mute text-sm mt-1">{certCode ? t("cert.issued", { code: certCode }) : t("cert.readyDesc")}</p>
              </div>
              {certCode ? <Link to={`/verify/${certCode}`} className="btn btn-gold">{t("cert.view")}</Link>
                : <button type="button" className="btn btn-gold" onClick={claimCertificate} disabled={certBusy}>{certBusy && <Spinner size={16} />} {t("cert.claim")}</button>}
            </section>
          )}
        </div>

        <aside className="panel overflow-hidden lg:sticky" style={{ top: 90 }} aria-label={t("course.curriculum")}>
          <div className="p-4 font-extrabold" style={{ borderBottom: "1px solid var(--line)" }}>{t("course.curriculum")}</div>
          <div className="overflow-y-auto p-2" style={{ maxHeight: "calc(100vh - 190px)" }}>
            {course.modules.map((m) => (
              <div key={m.id} className="mb-2">
                <div className="px-3 pt-3 pb-2 text-xs font-bold dim">{pick(m, "title", lang)}</div>
                {m.lessons.map((l) => {
                  const done = Boolean(progress[l.id]?.completed_at);
                  const active = l.id === lesson.id;
                  const open = access || l.is_preview;
                  return (
                    <div key={l.id} className={cx("flex items-center gap-3 rounded-xl px-3 py-2", active && "bg-white/5")} style={active ? { boxShadow: "inset 0 0 0 1px rgba(212,175,55,.35)" } : undefined}>
                      {access ? (
                        <button type="button" onClick={() => toggleDone(l)} aria-pressed={done} aria-label={done ? t("learn.markIncomplete") : t("learn.markComplete")}
                          className="flex items-center justify-center rounded-full flex-shrink-0"
                          style={{ width: 22, height: 22, border: `1.5px solid ${done ? "#34D399" : "rgba(255,255,255,.3)"}`, background: done ? "#10B981" : "transparent" }}>
                          {done && <Check size={12} strokeWidth={3} style={{ color: "#062017" }} />}
                        </button>
                      ) : open ? <PlayCircle size={18} className="gold flex-shrink-0" /> : <Lock size={16} className="dim flex-shrink-0" />}
                      {open ? (
                        <Link to={`/learn/${slug}/${l.id}`} className={cx("flex-1 text-sm", active ? "gold font-bold" : done ? "mute" : "")}>{pick(l, "title", lang)}</Link>
                      ) : <span className="flex-1 text-sm dim">{pick(l, "title", lang)}</span>}
                      <span className="text-xs dim num">{clock(l.duration_sec)}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
