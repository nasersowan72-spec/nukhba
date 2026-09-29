// Plutu (plutu.ly) payment gateway client — Libya.
// Docs: https://docs.plutu.ly/api-documentation/payments
//   mpgs            → international Visa/Mastercard, amount in USD
//   localbankcards  → Libyan bank cards (Numo network), amount in LYD
//   tlync           → T-Lync page: Sadad, Edfali, MobiCash, Tadawul cards… amount in LYD
import { env } from "./http.ts";

export type Gateway = "mpgs" | "localbankcards" | "tlync";

const CALLBACK_FIELDS: Record<Gateway, string[]> = {
  localbankcards: ["gateway", "approved", "amount", "invoice_no", "canceled", "transaction_id"],
  mpgs: ["gateway", "approved", "amount", "currency", "invoice_no", "canceled", "transaction_id"],
  tlync: ["gateway", "approved", "amount", "invoice_no", "canceled", "payment_method", "transaction_id"],
};

function baseUrl() {
  return (Deno.env.get("PLUTU_BASE_URL") ?? "https://api.plutus.ly/api/v1").replace(/\/+$/, "");
}

export interface ConfirmInput {
  gateway: Gateway;
  amount: number;
  invoiceNo: string;
  returnUrl: string;
  callbackUrl?: string;   // tlync only
  mobileNumber?: string;  // tlync only (09XXXXXXXX)
  lang?: "ar" | "en";
  customerIp?: string;
}

/** Starts a hosted checkout and returns the URL the customer must be sent to. */
export async function confirmPayment(input: ConfirmInput): Promise<string> {
  const form = new FormData();
  form.set("amount", input.amount.toFixed(2));
  form.set("invoice_no", input.invoiceNo);
  form.set("return_url", input.returnUrl);
  if (input.lang) form.set("lang", input.lang);
  if (input.customerIp) form.set("customer_ip", input.customerIp);
  if (input.gateway === "tlync") {
    if (input.callbackUrl) form.set("callback_url", input.callbackUrl);
    if (input.mobileNumber) form.set("mobile_number", input.mobileNumber);
  }

  const res = await fetch(`${baseUrl()}/transaction/${input.gateway}/confirm`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "X-API-KEY": env("PLUTU_API_KEY"),
      Authorization: `Bearer ${env("PLUTU_ACCESS_TOKEN")}`,
    },
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  const redirect = data?.result?.redirect_url;
  if (!res.ok || !redirect) {
    const code = data?.error?.code ?? `HTTP_${res.status}`;
    const message = data?.error?.message ?? "Plutu request failed";
    throw new Error(`${code}: ${message}`);
  }
  return redirect as string;
}

function toHex(buf: ArrayBuffer) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Verifies Plutu's HMAC-SHA256 callback signature.
 * Plutu signs "key=value&key=value" built from the callback fields in the
 * order they were received (excluding "hashed"), upper-case hex.
 */
export async function verifyCallback(gateway: Gateway, entries: [string, string][]): Promise<boolean> {
  const received = entries.find(([k]) => k === "hashed")?.[1] ?? "";
  if (!received) return false;
  const allowed = CALLBACK_FIELDS[gateway];
  const message = entries
    .filter(([k]) => k !== "hashed" && allowed.includes(k))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env("PLUTU_SECRET_KEY")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = toHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message)));
  return safeEqual(sig, received.toUpperCase());
}

export function isGateway(v: unknown): v is Gateway {
  return v === "mpgs" || v === "localbankcards" || v === "tlync";
}
