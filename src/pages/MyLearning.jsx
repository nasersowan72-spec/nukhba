import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { useI18n } from "../i18n/index.jsx";
import { useAuth } from "../auth/AuthProvider.jsx";
import { useTitle } from "../components/Layout.jsx";
import CourseCard from "../components/CourseCard.jsx";
import { Alert, EmptyState, PageLoader } from "../components/ui.jsx";
import { getInstructors, getProgress, myEnrollments } from "../lib/api.js";

export default function MyLearning() {
  const { t } = useI18n();
  const { user } = useAuth();
  useTitle(t("nav.myLearning"));
  const [items, setItems] = useState(null);
  const [people, setPeople] = useState({});
  const [done, setDone] = useState({});
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [rows, progress] = await Promise.all([myEnrollments(user.id), getProgress(user.id)]);
        const courses = rows.map((r) => r.course).filter(Boolean);
        const counts = {};
        progress.forEach((p) => { if (p.completed_at) counts[p.course_id] = (counts[p.course_id] || 0) + 1; });
        const instructors = await getInstructors(courses.map((c) => c.instructor_id));
        if (!alive) return;
        setItems(courses); setDone(counts); setPeople(instructors);
      } catch (e) { console.error(e); if (alive) setError(true); }
    })();
    return () => { alive = false; };
  }, [user.id]);

  return (
    <div className="shell pt-8">
      <h1 className="text-3xl font-black">{t("nav.myLearning")}</h1>
      <div className="mt-8">
        {error ? <Alert>{t("errors.load")}</Alert>
          : !items ? <PageLoader />
          : items.length === 0 ? (
            <EmptyState icon={BookOpen} title={t("my.emptyTitle")} desc={t("my.emptyDesc")} action={<Link to="/" className="btn btn-gold">{t("nav.courses")}</Link>} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {items.map((c) => (
                <CourseCard key={c.id} course={c} instructor={people[c.instructor_id]}
                  progress={c.lessons_count ? Math.min(100, Math.round(((done[c.id] || 0) / c.lessons_count) * 100)) : 0} />
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
