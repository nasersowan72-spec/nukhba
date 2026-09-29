// GET — Plutu redirects the customer here after checkout (mpgs, localbankcards, tlync).
// Verifies the signature, settles the order, then sends the customer back to the site.
// Deploy with --no-verify-jwt (Plutu does not send a Supabase token).
import { siteUrl } from "../_shared/http.ts";
import { settle } from "../_shared/settle.ts";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const entries = [...url.searchParams.entries()] as [string, string][];
  let invoice = url.searchParams.get("invoice_no");
  let status = "pending";
  try {
    const result = await settle(entries);
    invoice = result.invoice ?? invoice;
    // An unsigned T-Lync return is normal: its confirmation arrives on plutu-callback.
    status = result.status === "invalid" ? "pending" : result.status;
  } catch (e) {
    console.error("plutu-return failed", e);
  }
  const target = new URL(`${siteUrl()}/payment/result`);
  if (invoice) target.searchParams.set("invoice", invoice);
  target.searchParams.set("status", status);
  return Response.redirect(target.toString(), 303);
});
