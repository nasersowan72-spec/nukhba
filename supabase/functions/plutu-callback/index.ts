// POST — server-to-server notification from Plutu (T-Lync).
// Deploy with --no-verify-jwt.
import { json } from "../_shared/http.ts";
import { settle } from "../_shared/settle.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  try {
    const type = req.headers.get("content-type") ?? "";
    let entries: [string, string][] = [];
    if (type.includes("application/json")) {
      const body = await req.json();
      entries = Object.entries(body ?? {}).map(([k, v]) => [k, v == null ? "" : String(v)]);
    } else {
      const form = await req.formData();
      entries = [...form.entries()].map(([k, v]) => [k, String(v)]);
    }
    const result = await settle(entries, "tlync");
    if (result.status === "invalid") return json({ ok: false }, 400);
    return json({ ok: true, status: result.status });
  } catch (e) {
    console.error("plutu-callback failed", e);
    return json({ ok: false }, 500);
  }
});
