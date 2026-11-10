import type { PrismaClient } from "@prisma/client";
import prisma from "@/lib/prisma";
import { toKobo } from "@/domain/money";
import { PAID_STATUSES } from "@/domain/order-state";
import { listPaystackSettlements, type PaystackSettlement } from "@/lib/paystack";

export type Severity = "critical" | "warning" | "info";
export interface Finding { code: string; severity: Severity; message: string; reference?: string; orderId?: string }

const HOUR = 3_600_000;

/**
 * INTERNAL ledger reconciliation (fully verified by tests): detects states that should be impossible
 * or that need a human – money received but order not paid, paid orders with no successful payment,
 * order total ≠ payment amount, double payments, stuck attempts/refunds, unresolved stock conflicts.
 */
export async function reconcileLedger(db: PrismaClient = prisma, now = new Date()): Promise<Finding[]> {
    const findings: Finding[] = [];

    const paidNoPayment = await db.order.findMany({ where: { status: { in: [...PAID_STATUSES] }, payments: { none: { status: { in: ["SUCCESS", "REFUNDED"] } } } }, select: { id: true }, take: 100 });
    for (const o of paidNoPayment) findings.push({ code: "ORDER_PAID_WITHOUT_PAYMENT", severity: "critical", message: "Order is marked paid but has no successful payment record.", orderId: o.id });

    const successNotPaid = await db.payment.findMany({ where: { status: "SUCCESS", order: { status: { in: ["PENDING", "CANCELLED"] } } }, select: { reference: true, orderId: true }, take: 100 });
    for (const p of successNotPaid) findings.push({ code: "PAYMENT_SUCCESS_ORDER_NOT_PAID", severity: "critical", message: "Money was received but the order is not marked paid.", reference: p.reference, orderId: p.orderId });

    const succeeded = await db.payment.findMany({ where: { status: { in: ["SUCCESS", "REFUNDED"] } }, include: { order: { select: { total: true } } }, orderBy: { createdAt: "desc" }, take: 2000 });
    const perOrder = new Map<string, number>();
    for (const p of succeeded) {
        perOrder.set(p.orderId, (perOrder.get(p.orderId) ?? 0) + 1);
        if (toKobo(p.order.total) !== p.amountKobo) findings.push({ code: "TOTAL_MISMATCH", severity: "critical", message: `Order total (${toKobo(p.order.total)} kobo) differs from the payment amount (${p.amountKobo} kobo).`, reference: p.reference, orderId: p.orderId });
    }
    for (const [orderId, n] of perOrder) if (n > 1) findings.push({ code: "MULTIPLE_SUCCESSFUL_PAYMENTS", severity: "critical", message: `${n} successful payments exist for one order – the customer may have been charged twice.`, orderId });

    const stale = await db.payment.findMany({ where: { status: "INITIALIZED", createdAt: { lt: new Date(now.getTime() - HOUR), gt: new Date(now.getTime() - 24 * HOUR) } }, select: { reference: true, orderId: true }, take: 100 });
    for (const p of stale) findings.push({ code: "PAYMENT_STUCK_INITIALIZED", severity: "warning", message: "Payment attempt unresolved for over an hour (webhook missed? the maintenance job will retry).", reference: p.reference, orderId: p.orderId });

    const mism = await db.paymentEvent.findMany({ where: { type: "payment.amount_mismatch", receivedAt: { gt: new Date(now.getTime() - 30 * 24 * HOUR) } }, select: { reference: true }, take: 100 });
    for (const e of mism) findings.push({ code: "AMOUNT_MISMATCH", severity: "critical", message: "A payment arrived with a different amount/currency than expected and was NOT applied.", reference: e.reference ?? undefined });

    const conflicts = await db.paymentEvent.findMany({ where: { type: "stock.conflict", receivedAt: { gt: new Date(now.getTime() - 30 * 24 * HOUR) } }, select: { reference: true }, take: 100 });
    for (const e of conflicts) findings.push({ code: "STOCK_CONFLICT", severity: "warning", message: "Customer paid for an item that was out of stock by then – contact them or refund.", reference: e.reference ?? undefined });

    const stuckRefunds = await db.refund.findMany({ where: { status: { in: ["PROCESSING", "APPROVED"] }, updatedAt: { lt: new Date(now.getTime() - 72 * HOUR) } }, include: { payment: { select: { reference: true, orderId: true } } }, take: 100 });
    for (const r of stuckRefunds) findings.push({ code: "REFUND_STUCK", severity: "warning", message: `Refund has been ${r.status.toLowerCase()} for over 72h.`, reference: r.payment.reference, orderId: r.payment.orderId });

    return findings;
}

export interface SettlementRow { storeId: string; storeName: string; subaccountCode: string; expectedKobo: number; settledKobo: number | null; deltaKobo: number | null; status: "MATCHED" | "DELTA" | "UNAVAILABLE"; note?: string }

/**
 * PROVIDER settlement comparison – INFORMATIONAL. Expected = Σ merchant share of SUCCESS payments in the window
 * minus processed refunds. Compared with Paystack's settlement totals for the store's subaccount. Settlements lag
 * (typically T+1), so recent deltas are normal; UNAVAILABLE means the provider response could not be used.
 * Field names of /settlement are NOT verified against a live account here – see Architecture.md.
 */
export async function compareSettlements(
    args: { from: Date; to: Date },
    deps: { db?: PrismaClient; list?: (q: { from: string; to: string; subaccount?: string }) => Promise<{ ok: true; data: PaystackSettlement[] } | { ok: false; error: string }> } = {},
): Promise<SettlementRow[]> {
    const db = deps.db ?? prisma;
    const list = deps.list ?? listPaystackSettlements;
    const stores = await db.store.findMany({ where: { subaccountCode: { not: null } }, select: { id: true, name: true, subaccountCode: true }, take: 500 });
    const rows: SettlementRow[] = [];
    for (const s of stores) {
        const pays = await db.payment.findMany({ where: { order: { storeId: s.id }, status: { in: ["SUCCESS", "REFUNDED"] }, paidAt: { gte: args.from, lte: args.to } }, include: { refunds: { where: { status: "PROCESSED" } } } });
        const expectedKobo = pays.reduce((sum, p) => {
            const refunded = p.refunds.reduce((a, r) => a + r.amountKobo, 0);
            const keptShare = p.amountKobo === 0 ? 0 : Math.round(p.merchantShareKobo * (1 - Math.min(1, refunded / p.amountKobo)));
            return sum + keptShare;
        }, 0);
        const res = await list({ from: args.from.toISOString().slice(0, 10), to: args.to.toISOString().slice(0, 10), subaccount: s.subaccountCode! });
        if (!res.ok || !Array.isArray(res.data)) { rows.push({ storeId: s.id, storeName: s.name, subaccountCode: s.subaccountCode!, expectedKobo, settledKobo: null, deltaKobo: null, status: "UNAVAILABLE", note: res.ok ? "Unexpected provider response" : res.error }); continue; }
        const done = res.data.filter((x) => ["success", "processed", "settled"].includes(String(x.status ?? "").toLowerCase()));
        const settledKobo = done.reduce((a, x) => a + Number(x.total_processed ?? x.total_amount ?? 0), 0);
        const deltaKobo = settledKobo - expectedKobo;
        rows.push({ storeId: s.id, storeName: s.name, subaccountCode: s.subaccountCode!, expectedKobo, settledKobo, deltaKobo, status: Math.abs(deltaKobo) <= 100 ? "MATCHED" : "DELTA", note: res.data.length > done.length ? `${res.data.length - done.length} settlement(s) not yet settled` : undefined });
    }
    return rows;
}
