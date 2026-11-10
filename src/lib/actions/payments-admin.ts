"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireOwnedOrder } from "@/server/auth";
import { decideRefund, requestRefund } from "@/server/payments/refunds";
import { toKobo } from "@/domain/money";
import { compareSettlements, type SettlementRow } from "@/server/reconciliation";
import { logger, errorInfo } from "@/lib/logger";

/** Merchant: ask for a refund on one of THEIR orders. Amount in naira (optional ⇒ full remaining amount). */
export async function requestOrderRefund(orderId: string, reason: string, amountNaira?: string) {
    const owned = await requireOwnedOrder(orderId);
    if (!owned.ok) return { error: owned.error };
    let amountKobo: number | undefined;
    if (amountNaira && amountNaira.trim() !== "") {
        try { amountKobo = toKobo(amountNaira); } catch { return { error: "Enter a valid refund amount." }; }
    }
    try {
        const r = await requestRefund({ orderId, requestedBy: owned.userId, reason, amountKobo });
        if (!r.ok) return { error: r.error };
        revalidatePath("/dashboard/orders");
        return { success: true };
    } catch (err) { logger.error("refund.request_failed", errorInfo(err)); return { error: "Could not submit refund request." }; }
}

/** Admin: approve (calls Paystack) or reject. */
export async function decideRefundAction(refundId: string, approve: boolean) {
    const admin = await requireAdmin();
    if (!admin.ok) return { error: admin.error };
    const parsed = z.string().min(1).max(40).safeParse(refundId);
    if (!parsed.success) return { error: "Invalid refund." };
    try {
        const r = await decideRefund({ refundId, adminId: admin.userId, approve });
        revalidatePath("/dashboard/admin/payments");
        return r.ok ? { success: true, status: r.status } : { error: r.error };
    } catch (err) { logger.error("refund.decide_failed", errorInfo(err)); return { error: "Could not process the refund decision." }; }
}

export async function runSettlementReport(days: number): Promise<{ rows: SettlementRow[] } | { error: string }> {
    const admin = await requireAdmin();
    if (!admin.ok) return { error: admin.error };
    const d = Math.min(90, Math.max(1, Math.floor(days) || 7));
    const to = new Date(); const from = new Date(to.getTime() - d * 86_400_000);
    try { return { rows: await compareSettlements({ from, to }) }; }
    catch (err) { logger.error("settlement.report_failed", errorInfo(err)); return { error: "Could not build the settlement report." }; }
}
