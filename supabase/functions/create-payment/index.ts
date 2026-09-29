// POST { course_id, method: "mpgs" | "localbankcards" | "tlync", phone?, lang? }
// → { redirect_url, invoice_no }   (requires a signed-in user)
import { adminClient, corsHeaders, env, json, requireUser } from "../_shared/http.ts";
import { confirmPayment, isGateway } from "../_shared/plutu.ts";

function normalizeLibyanMobile(raw: unknown): string | null {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.startsWith("00218")) d = "0" + d.slice(5);
  else if (d.startsWith("218")) d = "0" + d.slice(3);
  else if (d.length === 9 && d.startsWith("9")) d = "0" + d;
  return /^09[1-6]\d{7}$/.test(d) ? d : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let orderId: string | null = null;
  const db = adminClient();
  try {
    const user = await requireUser(req);
    if (!user) return json({ error: "not_authenticated" }, 401);

    const body = await req.json().catch(() => ({}));
    const { course_id, method, phone, lang } = body ?? {};
    const enabled = (Deno.env.get("PAYMENT_METHODS") ?? "mpgs,localbankcards,tlync").split(",").map((s) => s.trim());
    if (!isGateway(method) || !enabled.includes(method)) return json({ error: "method_unavailable" }, 400);

    const { data: course } = await db.from("courses").select("id, status, price_usd").eq("id", course_id).maybeSingle();
    if (!course || course.status !== "published" || Number(course.price_usd) <= 0) return json({ error: "course_unavailable" }, 400);

    const { data: enrolled } = await db.from("enrollments").select("id").eq("user_id", user.id).eq("course_id", course.id).maybeSingle();
    if (enrolled) return json({ error: "already_enrolled" }, 409);

    const currency = method === "mpgs" ? "USD" : "LYD";
    const { data: price, error: priceErr } = await db.rpc("course_price", { p_course: course.id, p_currency: currency }).single();
    if (priceErr || !price) throw priceErr ?? new Error("price_unavailable");

    let mobile: string | null = null;
    if (method === "tlync") {
      mobile = normalizeLibyanMobile(phone);
      if (!mobile) return json({ error: "bad_phone" }, 400);
    }

    const { data: order, error: orderErr } = await db.from("orders").insert({
      user_id: user.id,
      course_id: course.id,
      method,
      status: "pending",
      amount: price.amount,
      currency,
      fx_rate: price.fx_rate,
      amount_usd: price.amount_usd,
      customer_phone: mobile,
    }).select("id, invoice_no, amount").single();
    if (orderErr || !order) throw orderErr ?? new Error("order_insert_failed");
    orderId = order.id;

    const fnBase = `${env("SUPABASE_URL")}/functions/v1`;
    const redirectUrl = await confirmPayment({
      gateway: method,
      amount: Number(order.amount),
      invoiceNo: order.invoice_no,
      returnUrl: `${fnBase}/plutu-return`,
      callbackUrl: `${fnBase}/plutu-callback`,
      mobileNumber: mobile ?? undefined,
      lang: lang === "en" ? "en" : "ar",
      customerIp: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined,
    });

    return json({ redirect_url: redirectUrl, invoice_no: order.invoice_no });
  } catch (e) {
    console.error("create-payment failed", e);
    if (orderId) await db.from("orders").update({ status: "failed", admin_note: String((e as Error).message).slice(0, 500) }).eq("id", orderId);
    return json({ error: "payment_init_failed" }, 502);
  }
});
