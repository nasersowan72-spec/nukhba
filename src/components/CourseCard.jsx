import React from "react";
import { Link } from "react-router-dom";
import { Clock, Film, Star, Users } from "lucide-react";
import { CATEGORIES } from "../config.js";
import { useI18n } from "../i18n/index.jsx";
import { compact, duration, money, pick } from "../lib/format.js";
import { Avatar, CourseArt, LevelTag, ProgressBar } from "./ui.jsx";

export default function CourseCard({ course, instructor, progress }) {
  const { t, lang } = useI18n();
  const category = CATEGORIES.find((c) => c.key === course.category);
  const free = Number(course.price_usd) === 0;
  return (
    <Link to={`/courses/${course.slug}`} className="card overflow-hidden flex flex-col h-full group">
      <div className="p-2 pb-0">
        <div className="relative rounded-2xl overflow-hidden">
          <CourseArt course={course} />
          <div className="absolute flex items-start justify-between gap-2" style={{ top: 10, insetInline: 10 }}>
            <LevelTag level={course.level} />
            {course.featured && <span className="chip gold">{t("course.featured")}</span>}
          </div>
          <div className="absolute flex gap-2" style={{ bottom: 10, insetInlineStart: 10 }}>
            <span className="chip"><Film size={12} /> {t("course.lessonsCount", { n: course.lessons_count })}</span>
            <span className="chip"><Clock size={12} /> {duration(course.duration_sec, t)}</span>
          </div>
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-bold gold">{category ? category[lang] : ""}</span>
          <span className="flex items-center gap-1 mute"><Users size={12} /><span className="num">{compact(course.students_count, lang)}</span></span>
        </div>
        <h3 className="text-lg font-extrabold leading-snug mt-2 clamp-2">{pick(course, "title", lang)}</h3>
        <p className="text-sm mute mt-2 clamp-2 leading-relaxed">{pick(course, "subtitle", lang)}</p>
        {instructor && (
          <div className="flex items-center gap-3 mt-4">
            <Avatar person={instructor} size={28} />
            <span className="text-sm font-bold truncate">{instructor.full_name}</span>
          </div>
        )}
        {progress != null && (
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-2"><span className="mute">{t("learn.progress")}</span><span className="font-bold num">{progress}%</span></div>
            <ProgressBar value={progress} height={5} />
          </div>
        )}
        <div className="flex-1" />
        <div className="flex items-center justify-between gap-3 mt-5 pt-4" style={{ borderTop: "1px solid var(--line)" }}>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-black text-xl num">{free ? t("course.free") : money(course.price_usd, "USD", lang)}</span>
            {!free && Number(course.compare_price_usd) > Number(course.price_usd) && (
              <span className="text-xs dim num line-through">{money(course.compare_price_usd, "USD", lang)}</span>
            )}
          </div>
          {course.rating_count > 0 ? (
            <span className="flex items-center gap-1 text-sm font-bold">
              <Star size={13} fill="currentColor" style={{ color: "#F4C95D" }} /> <span className="num">{Number(course.rating_avg).toFixed(1)}</span>
              <span className="text-xs dim num">({compact(course.rating_count, lang)})</span>
            </span>
          ) : <span className="chip" style={{ color: "#5EEAD4" }}>{t("course.new")}</span>}
        </div>
      </div>
    </Link>
  );
}
