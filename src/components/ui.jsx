import React from "react";
import { Star, Crown, Loader2, BrainCircuit, LineChart, Briefcase, GraduationCap } from "lucide-react";
import { LEVELS, THEMES } from "../config.js";
import { useI18n } from "../i18n/index.jsx";

export const cx = (...c) => c.filter(Boolean).join(" ");

export function Spinner({ size = 18, className }) {
  return <Loader2 size={size} className={cx("spin", className)} aria-hidden="true" />;
}

export function PageLoader() {
  const { t } = useI18n();
  return (
    <div className="shell flex items-center justify-center gap-3 mute" style={{ minHeight: "50vh" }} role="status">
      <Spinner /> {t("common.loading")}
    </div>
  );
}

export function EmptyState({ icon: Icon = GraduationCap, title, desc, action }) {
  return (
    <div className="panel flex flex-col items-center text-center px-6 py-14">
      <div className="flex items-center justify-center rounded-2xl mb-5" style={{ width: 60, height: 60, background: "rgba(212,175,55,.1)", border: "1px solid rgba(212,175,55,.25)", color: "#F4DC8F" }}>
        <Icon size={26} />
      </div>
      <h2 className="text-xl font-extrabold">{title}</h2>
      {desc && <p className="mute text-sm mt-2 max-w-md leading-relaxed">{desc}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Alert({ tone = "error", children }) {
  const c = tone === "error" ? ["#FDA4AF", "rgba(251,113,133,.1)", "rgba(251,113,133,.3)"]
    : tone === "success" ? ["#6EE7B7", "rgba(52,211,153,.1)", "rgba(52,211,153,.3)"]
    : ["#F4DC8F", "rgba(212,175,55,.08)", "rgba(212,175,55,.28)"];
  return (
    <div role={tone === "error" ? "alert" : "status"} className="rounded-xl px-4 py-3 text-sm leading-relaxed"
      style={{ color: c[0], background: c[1], border: `1px solid ${c[2]}` }}>
      {children}
    </div>
  );
}

export function Stars({ value = 0, size = 14 }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} / 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} size={size} fill={value >= i + 0.5 ? "currentColor" : "none"} style={{ color: value >= i + 0.5 ? "#F4C95D" : "rgba(255,255,255,.25)" }} />
      ))}
    </span>
  );
}

export function ProgressBar({ value = 0, height = 6 }) {
  const v = Math.max(0, Math.min(100, value));
  const done = v >= 100;
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: "rgba(255,255,255,.07)" }} role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full" style={{
        width: `${v}%`, transition: "width .8s var(--ease)",
        background: done ? "linear-gradient(90deg,#10B981,#5EEAD4)" : "linear-gradient(90deg,#AD8628,#F4DC8F)",
        boxShadow: v > 0 ? `0 0 12px ${done ? "rgba(52,211,153,.5)" : "rgba(212,175,55,.5)"}` : "none",
      }} />
    </div>
  );
}

export function LevelTag({ level }) {
  const { lang } = useI18n();
  const l = LEVELS[level] || LEVELS.intermediate;
  return (
    <span className="chip" style={{ color: l.color, borderColor: `${l.color}40` }}>
      {level === "executive" && <Crown size={11} />} {l[lang]}
    </span>
  );
}

export function Avatar({ person, size = 36 }) {
  const name = person?.full_name || "?";
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("");
  if (person?.avatar_url) {
    return <img src={person.avatar_url} alt="" width={size} height={size} className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />;
  }
  return (
    <span className="rounded-full flex items-center justify-center font-display font-black flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4, color: "#1A1405", background: "var(--gold-grad)" }} aria-hidden="true">
      {initials}
    </span>
  );
}

const CATEGORY_ICON = { ai: BrainCircuit, finance: LineChart, leadership: Briefcase };

/** Course artwork: uses the uploaded cover when present, otherwise a generated composition. */
export function CourseArt({ course, className }) {
  const th = THEMES[course?.theme] || THEMES.gold;
  const Icon = CATEGORY_ICON[course?.category] || GraduationCap;
  return (
    <div className={cx("relative w-full overflow-hidden", className)} style={{ aspectRatio: "16 / 9", background: `radial-gradient(110% 90% at 85% 5%, ${th.a}, transparent 60%), linear-gradient(135deg, ${th.b}, #06080D)` }}>
      {course?.cover_url ? (
        <img src={course.cover_url} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <>
          <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)", backgroundSize: "28px 28px", WebkitMaskImage: "radial-gradient(circle, #000, transparent 72%)", maskImage: "radial-gradient(circle, #000, transparent 72%)" }} />
          <div className="absolute rounded-full" style={{ width: "46%", aspectRatio: "1", top: "50%", left: "50%", transform: "translate(-50%,-50%)", border: `1px solid ${th.glow}40` }} />
          <div className="absolute flex items-center justify-center rounded-2xl" style={{ width: "18%", aspectRatio: "1", top: "50%", left: "50%", transform: "translate(-50%,-50%)", color: th.glow, background: "rgba(11,15,23,.5)", border: `1px solid ${th.glow}66`, boxShadow: `0 0 50px ${th.glow}55` }}>
            <Icon style={{ width: "48%", height: "48%" }} strokeWidth={1.6} />
          </div>
        </>
      )}
    </div>
  );
}
