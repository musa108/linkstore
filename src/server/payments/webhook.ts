import { createHash } from "node:crypto";
import { z } from "zod";
import { Prisma, type PrismaClient } from "@prisma/client";
import prisma from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/paystack";
import { finalizePayment, type FinalizeDeps } from "./finalize";
import { completeRefund, failRefund, resolveRefundForEvent } from "./refunds";
import { logger, errorInfo } from "@/lib/logger";

const eventSchema = z.object({
    event: z.string().min(1).max(100),
    data: z.object({
        id: z.union([z.number(), z.string()]).optional(),
        reference: z.string().max(200).optional(),
        transaction_reference: z.string().max(200).optional(),
        amount: z.number().optional(),
        transaction: z.object({ reference: z.string().optional() }).passthrough().optional(),
    }).passthrough(),
});

export interface WebhookResult { httpStatus: number; body: { ok: boolean; note?: string } }

/** Pure-ish handler (raw body + signature in, HTTP result out) so it is fully testable. */
export async function handlePaystackWebhook(
    rawBody: string, signature: string | null, secret: string | undefined, deps: FinalizeDeps & { db?: PrismaClient } = {},
): Promise<WebhookResult> {
    const db = deps.db ?? prisma;
    if (!verifyWebhookSignature(rawBody, signature, secret)) {
        logger.warn("webhook.bad_signature");
        return { httpStatus: 401, body: { ok: false } };
    }
    let parsed;
    try { parsed = eventSchema.parse(JSON.parse(rawBody)); } catch {
        // Signed but unparseable: acknowledge so Paystack stops retrying; nothing we can do with it.
        logger.warn("webhook.invalid_payload");
        return { httpStatus: 200, body: { ok: true, note: "ignored-invalid" } };
    }

    const { event, data } = parsed;
    const reference = data.reference ?? data.transaction_reference ?? data.transaction?.reference;
    const eventKey = data.id !== undefined || reference
        ? `${event}:${data.id ?? ""}:${reference ?? ""}`
        : `raw:${createHash("sha256").update(rawBody).digest("hex")}`;

    // Idempotency: the unique eventKey makes duplicate deliveries a no-op.
    let eventId: string;
    try {
        const row = await db.paymentEvent.create({ data: { eventKey, type: event, reference: reference ?? null, payload: JSON.parse(rawBody) as Prisma.InputJsonValue } });
        eventId = row.id;
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            const existing = await db.paymentEvent.findUnique({ where: { eventKey } });
            if (existing && (existing.status === "PROCESSED" || existing.status === "IGNORED")) {
                return { httpStatus: 200, body: { ok: true, note: "duplicate" } };
            }
            eventId = existing!.id; // previous attempt crashed/failed → reprocess (recoverable)
        } else {
            logger.error("webhook.persist_failed", errorInfo(err));
            return { httpStatus: 500, body: { ok: false } }; // let Paystack retry
        }
    }

    const mark = (status: "PROCESSED" | "IGNORED" | "FAILED", error?: string) =>
        db.paymentEvent.update({ where: { id: eventId }, data: { status, error: error ?? null, processedAt: new Date() } });

    try {
        if (event === "charge.success" && reference) {
            const r = await finalizePayment(reference, "webhook", deps);
            if (r.status === "error") { await mark("FAILED", "provider_unavailable"); return { httpStatus: 500, body: { ok: false } }; }
            await mark(r.status === "not_found" ? "IGNORED" : "PROCESSED");
            return { httpStatus: 200, body: { ok: true } };
        }

        if (event.startsWith("refund.") && reference) {
            const refund = await resolveRefundForEvent({ reference, providerRefundId: data.id !== undefined ? String(data.id) : undefined, amountKobo: typeof data.amount === "number" ? data.amount : undefined }, db);
            if (!refund) { await mark("IGNORED"); return { httpStatus: 200, body: { ok: true } }; }
            if (event === "refund.processed") await completeRefund(refund.id, { db });
            else if (event === "refund.failed") await failRefund(refund.id, "Refund failed at provider", { db });
            await mark("PROCESSED");
            return { httpStatus: 200, body: { ok: true } };
        }

        if (event === "charge.dispute.create" && reference) {
            const payment = await db.payment.findUnique({ where: { reference } });
            if (payment) await db.order.updateMany({ where: { id: payment.orderId }, data: { isDisputed: true, disputeReason: "Chargeback opened with payment provider" } });
            await mark(payment ? "PROCESSED" : "IGNORED");
            return { httpStatus: 200, body: { ok: true } };
        }

        await mark("IGNORED");
        return { httpStatus: 200, body: { ok: true } };
    } catch (err) {
        logger.error("webhook.processing_failed", { event, reference, ...errorInfo(err) });
        await mark("FAILED", "exception").catch(() => undefined);
        return { httpStatus: 500, body: { ok: false } };
    }
}
