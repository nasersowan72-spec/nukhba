// Verifies a Plutu callback and settles the matching order (idempotent).
import { adminClient } from "./http.ts";
import { type Gateway, isGateway, verifyCallback } from "./plutu.ts";

export type SettleResult = { invoice: string | null; status: "paid" | "canceled" | "failed" | "pending" | "invalid" };

export async function settle(entries: [string, string][], fallbackGateway?: Gateway): Promise<SettleResult> {
  const params = Object.fromEntries(entries);
  const gateway = isGateway(params.gateway) ? params.gateway : fallbackGateway;
  const invoice = params.invoice_no ?? null;
  if (!gateway || !invoice) return { invoice, status: "invalid" };

  if (!(await verifyCallback(gateway, entries))) {
    console.warn("Plutu callback with invalid signature", { invoice, gateway });
    return { invoice, status: "invalid" };
  }

  const db = adminClient();
  const { data: order } = await db.from("orders").select("id, status, amount").eq("invoice_no", invoice).maybeSingle();
  if (!order) return { invoice, status: "invalid" };
  if (order.status === "paid") return { invoice, status: "paid" };

  if (params.approved === "1") {
    const paidAmount = Number(params.amount);
    if (!Number.isFinite(paidAmount) || Math.abs(paidAmount - Number(order.amount)) > 0.009) {
      await db.from("orders").update({ status: "failed", raw: params, admin_note: "amount_mismatch" }).eq("id", order.id);
      return { invoice, status: "failed" };
    }
    const { error } = await db.rpc("fulfill_order", { p_order: order.id, p_txn: params.transaction_id ?? null, p_raw: params });
    if (error) throw error;
    return { invoice, status: "paid" };
  }

  if (params.canceled) {
    await db.from("orders").update({ status: "canceled", raw: params }).eq("id", order.id).eq("status", "pending");
    return { invoice, status: "canceled" };
  }
  return { invoice, status: "pending" };
}
