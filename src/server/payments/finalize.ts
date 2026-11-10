import type { PrismaClient } from "@prisma/client";
import prisma from "@/lib/prisma";
import { verifyPaystackTransaction, type VerifiedTransaction } from "@/lib/paystack";
import { logger } from "@/lib/logger";

/**
 * The ONLY code path that may mark a payment SUCCESS / an order PAID.
 * Called by the webhook, the browser callback page and the reconciliation job.
 * It never trusts the caller: it asks Paystack, then checks amount + currency
 * against the Payment row we created from server-side prices.
 *
 * Idempotent: any number of concurrent/duplicate calls apply the financial and
 * stock effects exactly once (guarded by conditional UPDATEs, not by read-then-write).
 */
export type FinalizeOutcome =
    | { status: "success"; orderId: string; alreadyApplied: boolean }
    | { status: "pending" }
    | { status: "failed"; reason: string }
    | { status: "mismatch" }
    | { status: "not_found" }
    | { status: "error"; retryable: true };

type VerifyFn = (reference: string) => ReturnType<typeof verifyPaystackTransaction>;
export interface FinalizeDeps { db?: PrismaClient; verify?: VerifyFn }
export type FinalizeSource = "callback" | "webhook" | "reconcile";

export async function finalizePayment(reference: string, source: FinalizeSource, deps: FinalizeDeps = {}): Promise<FinalizeOutcome> {
    const db = deps.db ?? prisma;
    const verify = deps.verify ?? verifyPaystackTransaction;

    const payment = await db.payment.findUnique({ where: { reference } });
    if (!payment) return { status: "not_found" };
    if (payment.status === "SUCCESS") return { status: "success", orderId: payment.orderId, alreadyApplied: true };
    if (payment.status === "REFUNDED") return { status: "failed", reason: "REFUNDED" };

    const v = await verify(reference);
    if (!v.ok) {
        // "Transaction reference not found" = customer never reached Paystack's page.
        if (!v.ambiguous && /not found/i.test(v.error)) return { status: "pending" };
        logger.warn("payment.verify_unavailable", { reference, source, error: v.error });
        return { status: "error", retryable: true };
    }
    const tx: VerifiedTransaction = v.data;

    if (tx.status === "abandoned" || tx.status === "failed" || tx.status === "reversed") {
        await db.payment.updateMany({
            where: { id: payment.id, status: "INITIALIZED" },
            data: { status: tx.status === "abandoned" ? "ABANDONED" : "FAILED", failureReason: (tx.gateway_response ?? tx.status).slice(0, 200) },
        });
        return { status: "failed", reason: tx.status };
    }
    if (tx.status !== "success") return { status: "pending" };

    if (tx.reference !== payment.reference || tx.amount !== payment.amountKobo || tx.currency !== payment.currency) {
        logger.error("payment.amount_mismatch", { reference, expectedKobo: payment.amountKobo, paidKobo: tx.amount, expectedCurrency: payment.currency, paidCurrency: tx.currency, source });
        await db.payment.updateMany({ where: { id: payment.id, status: { in: ["INITIALIZED", "FAILED", "ABANDONED"] } }, data: { status: "FAILED", failureReason: "AMOUNT_OR_CURRENCY_MISMATCH" } });
        await recordEvent(db, `mismatch:${reference}`, "payment.amount_mismatch", reference, payment.id, { expectedKobo: payment.amountKobo, paidKobo: tx.amount, currency: tx.currency });
        return { status: "mismatch" };
    }

    const applied = await db.$transaction(async (tx2) => {
        const flipped = await tx2.payment.updateMany({
            where: { id: payment.id, status: { in: ["INITIALIZED", "FAILED", "ABANDONED"] } },
            data: { status: "SUCCESS", paidAt: new Date(), providerTransactionId: String(tx.id), failureReason: null },
        });
        if (flipped.count === 0) return false; // another caller already applied it

        const orderFlip = await tx2.order.updateMany({
            where: { id: payment.orderId, status: { in: ["PENDING", "CANCELLED"] } },
            data: { status: "PAID", paystackReference: reference },
        });
        if (orderFlip.count === 1) {
            const items = await tx2.orderItem.findMany({ where: { orderId: payment.orderId, variantId: { not: null } } });
            for (const it of items) {
                const dec = await tx2.variant.updateMany({ where: { id: it.variantId!, stockCount: { gte: it.quantity } }, data: { stockCount: { decrement: it.quantity } } });
                if (dec.count === 0) {
                    // Paid for stock we no longer have: keep the money state correct, surface to the merchant.
                    await tx2.paymentEvent.create({
                        data: { eventKey: `stock_conflict:${reference}:${it.id}`, type: "stock.conflict", reference, paymentId: payment.id, status: "PROCESSED", processedAt: new Date(), payload: { variantId: it.variantId, quantity: it.quantity } },
                    });
                    logger.warn("payment.stock_conflict", { reference, orderId: payment.orderId, variantId: it.variantId });
                }
            }
        }
        await tx2.paymentEvent.upsert({
            where: { eventKey: `finalized:${reference}` },
            create: { eventKey: `finalized:${reference}`, type: `payment.finalized.${source}`, reference, paymentId: payment.id, status: "PROCESSED", processedAt: new Date(), payload: { amountKobo: tx.amount, currency: tx.currency } },
            update: {},
        });
        return true;
    });

    logger.info("payment.finalized", { reference, orderId: payment.orderId, source, appliedNow: applied });
    return { status: "success", orderId: payment.orderId, alreadyApplied: !applied };
}

async function recordEvent(db: PrismaClient, eventKey: string, type: string, reference: string, paymentId: string, payload: object) {
    await db.paymentEvent.upsert({
        where: { eventKey },
        create: { eventKey, type, reference, paymentId, status: "PROCESSED", processedAt: new Date(), payload },
        update: {},
    });
}
