/* Data access layer — every call is protected by Row Level Security on the server. */
import { supabase } from "./supabase.js";

const COURSE_CARD = "id, slug, category, level, title_ar, title_en, subtitle_ar, subtitle_en, cover_url, theme, price_usd, price_lyd, compare_price_usd, featured, students_count, rating_avg, rating_count, lessons_count, duration_sec, instructor_id";

const unwrap = ({ data, error }) => { if (error) throw error; return data; };

export async function listCourses() {
  return unwrap(await supabase.from("courses").select(COURSE_CARD).eq("status", "published")
    .order("featured", { ascending: false }).order("students_count", { ascending: false }));
}

export async function getInstructors(ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return {};
  const rows = unwrap(await supabase.from("public_profiles").select("*").in("id", unique));
  return Object.fromEntries(rows.map((r) => [r.id, r]));
}

export async function getCourse(slug) {
  const course = unwrap(await supabase.from("courses")
    .select(`${COURSE_CARD}, status, description_ar, description_en, outcomes_ar, outcomes_en, language,
      modules ( id, position, title_ar, title_en,
        lessons ( id, position, title_ar, title_en, summary_ar, summary_en, duration_sec, is_preview ) )`)
    .eq("slug", slug).maybeSingle());
  if (!course) return null;
  course.modules = (course.modules || []).sort((a, b) => a.position - b.position)
    .map((m) => ({ ...m, lessons: (m.lessons || []).sort((a, b) => a.position - b.position) }));
  course.lessons = course.modules.flatMap((m) => m.lessons);
  return course;
}

export async function isEnrolled(courseId, userId) {
  if (!userId) return false;
  const row = unwrap(await supabase.from("enrollments").select("id").eq("course_id", courseId).eq("user_id", userId).maybeSingle());
  return Boolean(row);
}

export async function myEnrollments(userId) {
  return unwrap(await supabase.from("enrollments")
    .select(`created_at, course:courses ( ${COURSE_CARD} )`).eq("user_id", userId).order("created_at", { ascending: false }));
}

export async function lessonMedia(lessonId) {
  return unwrap(await supabase.from("lesson_media").select("video_url, resources").eq("lesson_id", lessonId).maybeSingle());
}

export async function getProgress(userId, courseId) {
  let q = supabase.from("lesson_progress").select("lesson_id, course_id, completed_at, position_sec").eq("user_id", userId);
  if (courseId) q = q.eq("course_id", courseId);
  return unwrap(await q);
}

export async function saveProgress(userId, courseId, lessonId, patch) {
  return unwrap(await supabase.from("lesson_progress").upsert(
    { user_id: userId, course_id: courseId, lesson_id: lessonId, updated_at: new Date().toISOString(), ...patch },
    { onConflict: "user_id,lesson_id" },
  ));
}

export async function getReviews(courseId) {
  const rows = unwrap(await supabase.from("reviews").select("id, rating, body, created_at, user_id")
    .eq("course_id", courseId).order("created_at", { ascending: false }).limit(20));
  const people = await getInstructors(rows.map((r) => r.user_id));
  return rows.map((r) => ({ ...r, author: people[r.user_id] }));
}

export async function getSettings() {
  return unwrap(await supabase.from("app_settings").select("*").maybeSingle());
}

export async function updateSettings(patch) {
  return unwrap(await supabase.from("app_settings").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", true));
}

export async function coursePrice(courseId, currency) {
  const rows = unwrap(await supabase.rpc("course_price", { p_course: courseId, p_currency: currency }));
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function enrollFree(courseId) {
  return unwrap(await supabase.rpc("enroll_free", { p_course: courseId }));
}

export async function startGatewayPayment({ courseId, method, phone, lang }) {
  const { data, error } = await supabase.functions.invoke("create-payment", {
    body: { course_id: courseId, method, phone, lang },
  });
  if (error) {
    let code = "payment_init_failed";
    try { code = (await error.context.json()).error || code; } catch { /* keep default */ }
    throw new Error(code);
  }
  return data;
}

export async function submitBankTransfer({ userId, courseId, currency, file }) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${userId}/${Date.now()}.${ext}`;
  unwrap(await supabase.storage.from("receipts").upload(path, file, { upsert: false, contentType: file.type }));
  return unwrap(await supabase.rpc("create_bank_transfer_order", { p_course: courseId, p_currency: currency, p_receipt_path: path }));
}

export async function getOrder(invoice) {
  return unwrap(await supabase.from("orders").select("invoice_no, status, amount, currency, method, course:courses ( slug, title_ar, title_en )")
    .eq("invoice_no", invoice).maybeSingle());
}

export async function issueCertificate(courseId) {
  return unwrap(await supabase.rpc("issue_certificate", { p_course: courseId }));
}

export async function getCertificate(code) {
  return unwrap(await supabase.from("certificates").select("*").eq("code", code.toUpperCase()).maybeSingle());
}

/* ── Admin ── */
export async function pendingTransfers() {
  return unwrap(await supabase.from("orders")
    .select("id, invoice_no, amount, currency, amount_usd, receipt_path, created_at, buyer:profiles!orders_user_id_fkey ( full_name ), course:courses ( title_ar, title_en )")
    .eq("method", "bank_transfer").eq("status", "awaiting_review").order("created_at"));
}

export async function receiptUrl(path) {
  return unwrap(await supabase.storage.from("receipts").createSignedUrl(path, 600)).signedUrl;
}

export async function reviewTransfer(orderId, approve, note) {
  return unwrap(await supabase.rpc("review_bank_transfer", { p_order: orderId, p_approve: approve, p_note: note || null }));
}
