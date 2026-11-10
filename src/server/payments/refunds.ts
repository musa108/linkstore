import type { PrismaClient } from "@prisma/client";
import prisma from "@/lib/prisma";
import { createPaystackRefund } from "@/lib/paystack";
import { PAID_STATUSES } from "@/domain/order-state";
import { logger } from "@/lib/logger";

/**
 * Refund workflow:  merchant REQUESTS → platform admin APPROVES → Paystack refund API → webhook confirms.
 * Why admin approval: with split payments the platform's commission and the provider's balance rules
 * are involved, so a merchant must not be able to move money out unilaterally.
 *
 *  REQUESTED → REJECTED
 *  REQUESTED → APPROVED → PROCESSING → PROCESSED | FAILED
 *  (APPROVED with failureReason = provider timeout: outcome unknown; verify on Paystack before retrying)
 */
export const OPEN_REFUND_STATES = ["REQUESTED", "APPROVED", "PROCESSING"] as const;
const COUNTED_STATES = [...OPEN_REFUND_STATES, "PROCESSED"];

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };
export interface RefundDeps { db?: PrismaClient; createRefund?: typeof createPaystackRefund }

export async function requestRefund(input: { orderId: string; requestedBy: string; reason: string; amountKobo?: number }, deps: RefundDeps = {}): Promise<Result<{ refundId: string }>> {
    const db = deps.db ?? prisma;
    const reason = input.reason.trim();
    if (reason.length < 5 || reason.length > 500) return { ok: false, error: "Please give a reason (5–500 characters)." };

    return db.$transaction(async (tx) => {
        const order = await tx.order.findUnique({ where: { id: input.orderId }, include: { payments: { where: { status: "SUCCESS" }, orderBy: { paidAt: "desc" }, take: 1 } } });
        if (!order) return { ok: false as const, error: "Order not found." };
        if (!(PAID_STATUSES as readonly string[]).includes(order.status)) return { ok: false as const, error: "Only paid orders can be refunded." };
        const payment = order.payments[0];
        if (!payment) return { ok: false as const, error: "No successful payment found for this order." };

        await tx.$queryRaw`SELECT id FROM "Payment" WHERE id = ${payment.id} FOR UPDATE`; // serialise concurrent requests
        const existing = await tx.refund.findMany({ where: { paymentId: payment.id, status: { in: COUNTED_STATES } } });
        if (existing.some((r) => (OPEN_REFUND_STATES as readonly string[]).includes(r.status))) return { ok: false as const, error: "A refund for this order is already in progress." };
        const alreadyKobo = existing.reduce((s, r) => s + r.amountKobo, 0);
        const remaining = payment.amountKobo - alreadyKobo;
        const amountKobo = input.amountKobo ?? remaining;
        if (!Number.isInteger(amountKobo) || amountKobo <= 0) return { ok: false as const, error: "Invalid refund amount." };
        if (amountKobo > remaining) return { ok: false as const, error: "Refund amount exceeds what is left to refund on this payment." };

        const refund = await tx.refund.create({ data: { paymentId: payment.id, amountKobo, reason, requestedBy: input.requestedBy } });
        return { ok: true as const, refundId: refund.id };
    });
}

export async function decideRefund(input: { refundId: string; adminId: string; approve: boolean }, deps: RefundDeps = {}): Promise<Result<{ status: string }>> {
    const db = deps.db ?? prisma;
    const createRefund = deps.createRefund ?? createPaystackRefund;

    if (!input.approve) {
        const r = await db.refund.updateMany({ where: { id: input.refundId, status: "REQUESTED" }, data: { status: "REJECTED", decidedBy: input.adminId, decidedAt: new Date() } });
        return r.count === 1 ? { ok: true, status: "REJECTED" } : { ok: false, error: "This refund can no longer be rejected." };
    }

    // First approval (REQUESTED) or a deliberate retry after an ambiguous provider failure (APPROVED + failureReason).
    const claimed = await db.refund.updateMany({
        where: { id: input.refundId, OR: [{ status: "REQUESTED" }, { status: "APPROVED", failureReason: { not: null } }] },
        data: { status: "APPROVED", decidedBy: input.adminId, decidedAt: new Date(), failureReason: null },
    });
    if (claimed.count !== 1) return { ok: false, error: "This refund was already decided by someone else." };

    const refund = await db.refund.findUniqueOrThrow({ where: { id: input.refundId }, include: { payment: true } });
    const res = await createRefund({ reference: refund.payment.reference, amountKobo: refund.amountKobo });

    if (!res.ok) {
        if (res.ambiguous) {
            await db.refund.update({ where: { id: refund.id }, data: { failureReason: `Provider did not respond (${res.error}). Check Paystack for this refund BEFORE retrying.` } });
            logger.error("refund.provider_ambiguous", { refundId: refund.id });
            return { ok: false, error: "Paystack didn't respond. Check the refund on your Paystack dashboard before retrying." };
        }
        await db.refund.update({ where: { id: refund.id }, data: { status: "FAILED", failureReason: res.error.slice(0, 300) } });
        return { ok: false, error: res.error };
    }

    const providerStatus = String(res.data.status ?? "");
    await db.refund.update({ where: { id: refund.id }, data: { status: "PROCESSING", providerRefundId: String(res.data.id), providerStatus } });
    logger.info("refund.submitted", { refundId: refund.id, providerStatus });
    if (providerStatus === "processed") await completeRefund(refund.id, { db });
    return { ok: true, status: providerStatus === "processed" ? "PROCESSED" : "PROCESSING" };
}

/** Marks a refund PROCESSED and, if the payment is now fully refunded, moves payment + order to REFUNDED. Idempotent. */
export async function completeRefund(refundId: string, deps: { db?: PrismaClient } = {}) {
    const db = deps.db ?? prisma;
    await db.$transaction(async (tx) => {
        const flipped = await tx.refund.updateMany({ where: { id: refundId, status: { in: ["PROCESSING", "APPROVED", "REQUESTED"] } }, data: { status: "PROCESSED", providerStatus: "processed" } });
        const refund = await tx.refund.findUniqueOrThrow({ where: { id: refundId }, include: { payment: true } });
        if (flipped.count === 0 && refund.status !== "PROCESSED") return;
        const processed = await tx.refund.aggregate({ where: { paymentId: refund.paymentId, status: "PROCESSED" }, _sum: { amountKobo: true } });
        if ((processed._sum.amountKobo ?? 0) >= refund.payment.amountKobo) {
            await tx.payment.updateMany({ where: { id: refund.paymentId, status: "SUCCESS" }, data: { status: "REFUNDED" } });
            await tx.order.updateMany({ where: { id: refund.payment.orderId, status: { in: [...PAID_STATUSES] } }, data: { status: "REFUNDED" } });
        }
    });
}

export async function failRefund(refundId: string, reason: string, deps: { db?: PrismaClient } = {}) {
    const db = deps.db ?? prisma;
    await db.refund.updateMany({ where: { id: refundId, status: { in: ["PROCESSING", "APPROVED"] } }, data: { status: "FAILED", failureReason: reason.slice(0, 300) } });
}

/** Finds the Refund a provider event refers to; creates a PROCESSED record for refunds made directly in Paystack's dashboard. */
export async function resolveRefundForEvent(args: { reference: string; providerRefundId?: string; amountKobo?: number }, db: PrismaClient = prisma) {
    const payment = await db.payment.findUnique({ where: { reference: args.reference } });
    if (!payment) return null;
    if (args.providerRefundId) {
        const byId = await db.refund.findFirst({ where: { paymentId: payment.id, providerRefundId: args.providerRefundId } });
        if (byId) return byId;
    }
    const open = await db.refund.findFirst({ where: { paymentId: payment.id, status: { in: ["PROCESSING", "APPROVED"] } }, orderBy: { createdAt: "asc" } });
    if (open) return open;
    return db.refund.create({ data: { paymentId: payment.id, amountKobo: args.amountKobo ?? payment.amountKobo, reason: "Refund created outside LinkStore (Paystack dashboard)", status: "PROCESSING", requestedBy: "provider", providerRefundId: args.providerRefundId ?? null } });
}
