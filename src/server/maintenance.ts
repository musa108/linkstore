import type { PrismaClient } from "@prisma/client";
import prisma from "@/lib/prisma";
import { finalizePayment, type FinalizeDeps } from "./payments/finalize";
import { logger } from "@/lib/logger";
import { purgeExpiredBuckets } from "@/lib/rate-limit";

const HOUR = 3_600_000;

/**
 * Scheduled housekeeping (see vercel.json). Safe to run repeatedly.
 *  1. Reconcile payments stuck INITIALIZED for >10 min by asking the provider (recovers missed webhooks).
 *  2. Mark payments still unpaid after 24h ABANDONED and cancel their PENDING orders (expiry).
 *  3. Prune storefront chat history older than `chatRetentionDays` (privacy/retention).
 */
export async function runMaintenance(opts: { now?: Date; chatRetentionDays?: number; db?: PrismaClient } & FinalizeDeps = {}) {
    const db = opts.db ?? prisma;
    const now = opts.now ?? new Date();
    const result = { reconciled: 0, expiredPayments: 0, cancelledOrders: 0, prunedChats: 0, purgedRateBuckets: 0 };

    const stuck = await db.payment.findMany({
        where: { status: "INITIALIZED", createdAt: { lt: new Date(now.getTime() - 10 * 60_000), gt: new Date(now.getTime() - 24 * HOUR) } },
        select: { reference: true }, take: 100, orderBy: { createdAt: "asc" },
    });
    for (const p of stuck) {
        const r = await finalizePayment(p.reference, "reconcile", opts);
        if (r.status === "success" && !r.alreadyApplied) result.reconciled++;
    }

    const cutoff = new Date(now.getTime() - 24 * HOUR);
    const expired = await db.payment.updateMany({ where: { status: "INITIALIZED", createdAt: { lt: cutoff } }, data: { status: "ABANDONED", failureReason: "EXPIRED" } });
    result.expiredPayments = expired.count;
    const cancelled = await db.order.updateMany({
        where: { status: "PENDING", createdAt: { lt: cutoff }, payments: { none: { status: { in: ["SUCCESS", "INITIALIZED"] } } } },
        data: { status: "CANCELLED" },
    });
    result.cancelledOrders = cancelled.count;

    const days = opts.chatRetentionDays ?? 30;
    const pruned = await db.chatConversation.deleteMany({ where: { updatedAt: { lt: new Date(now.getTime() - days * 24 * HOUR) } } });
    result.prunedChats = pruned.count;

    result.purgedRateBuckets = await purgeExpiredBuckets().catch(() => 0);

    logger.info("maintenance.done", result);
    return result;
}
