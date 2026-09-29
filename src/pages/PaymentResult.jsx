import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useI18n } from "../i18n/index.jsx";
import { useTitle } from "../components/Layout.jsx";
import { Spinner } from "../components/ui.jsx";
import { getOrder } from "../lib/api.js";
import { money, pick } from "../lib/format.js";

const FINAL = ["paid", "failed", "canceled", "refunded", "awaiting_review"];

export default function PaymentResult() {
  const [params] = useSearchParams();
  const invoice = params.get("invoice");
  const { t, lang } = useI18n();
  useTitle(t("result.title"));
  const [order, setOrder] = useState(null);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!invoice) return undefined;
    let alive = true;
    let tries = 0;
    const poll = async () => {
      try {
        const o = await getOrder(invoice);
        if (!alive) return;
        setOrder(o);
        if (o && FINAL.includes(o.status)) return;
      } catch (e) { console.error(e); }
      tries += 1;
      if (tries >= 20) { setTimedOut(true); return; }
      setTimeout(poll, 3000);
    };
    poll();
    return () => { alive = false; };
  }, [invoice]);

  const status = order?.status || "pending";
  const view = {
    paid: { icon: CheckCircle2, color: "#34D399" },
    awaiting_review: { icon: Clock, color: "#F4DC8F" },
    failed: { icon: XCircle, color: "#FB7185" },
    canceled: { icon: XCircle, color: "#FB7185" },
    refunded: { icon: XCircle, color: "#FB7185" },
    pending: { icon: Clock, color: "#F4DC8F" },
  }[status] || { icon: Clock, color: "#F4DC8F" };
  const Icon = view.icon;

  return (
    <div className="shell py-16 max-w-xl">
      <div className="panel p-8 text-center">
        {status === "pending" && !timedOut ? <Spinner size={40} className="gold mx-auto" /> : <Icon size={48} style={{ color: view.color }} className="mx-auto" />}
        <h1 className="text-2xl font-black mt-5">{t(`result.${status}.title`)}</h1>
        <p className="mute mt-3 leading-relaxed">{timedOut && status === "pending" ? t("result.slow") : t(`result.${status}.desc`)}</p>
        {order && (
          <div className="mt-6 text-sm mute flex flex-col gap-1">
            <span>{pick(order.course, "title", lang)}</span>
            <span className="num" dir="ltr">{order.invoice_no} / {money(order.amount, order.currency, lang)}</span>
          </div>
        )}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {status === "paid" && order?.course && <Link to={`/learn/${order.course.slug}`} className="btn btn-gold">{t("course.continue")}</Link>}
          {["failed", "canceled"].includes(status) && order?.course && <Link to={`/checkout/${order.course.slug}`} className="btn btn-gold">{t("result.retry")}</Link>}
          <Link to="/my-learning" className="btn btn-ghost">{t("nav.myLearning")}</Link>
        </div>
      </div>
    </div>
  );
}
