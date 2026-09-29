import React from "react";
import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { useI18n } from "../i18n/index.jsx";
import { useTitle } from "../components/Layout.jsx";
import { EmptyState } from "../components/ui.jsx";

export default function NotFound() {
  const { t } = useI18n();
  useTitle(t("notFound.title"));
  return (
    <div className="shell py-16">
      <EmptyState icon={Compass} title={t("notFound.title")} desc={t("notFound.desc")} action={<Link to="/" className="btn btn-gold">{t("nav.courses")}</Link>} />
    </div>
  );
}
