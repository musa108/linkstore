"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { startCheckout, type CheckoutResult } from "@/server/checkout";
import { requireOwnedOrder, currentUserId } from "@/server/auth";
import { canTransition, MERCHANT_SETTABLE, PAID_STATUSES } from "@/domain/order-state";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { logger, errorInfo } from "@/lib/logger";

async function baseUrl(): Promise<string> {
    // Prefer configured URL: the Host header is attacker-influenced and feeds Paystack's callback.
    if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
    return `${h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")}://${host}`;
}

/** Public checkout. Client sends ids + quantities only; every price/total is computed on the server. */
export async function createOrder(input: unknown): Promise<CheckoutResult> {
    const h = await headers();
    const rl = (await rateLimit(`checkout:${clientIp(h)}`, 10, 10 * 60_000));
    if (!rl.allowed) return { error: "Too many checkout attempts. Please wait a few minutes and try again." };
    return startCheckout(input, { baseUrl: await baseUrl(), allowWithoutPayout: process.env.ALLOW_CHECKOUT_WITHOUT_PAYOUT === "true" });
}

/** Merchant action. Only fulfilment transitions are allowed; PAID can only come from verified payment evidence. */
export async function updateOrderStatus(orderId: string, status: string) {
    const owned = await requireOwnedOrder(orderId);
    if (!owned.ok) return { error: owned.error };
    if (!MERCHANT_SETTABLE.includes(status as never) || !canTransition(owned.order.status, status)) {
        return { error: `An order that is ${owned.order.status.toLowerCase()} cannot be changed to ${status.toLowerCase()}.` };
    }
    try {
        const updateData: { status: string; shippedAt?: Date; deliveredAt?: Date } = { status };
        if (status === "SHIPPED") {
            updateData.shippedAt = new Date();
        } else if (status === "DELIVERED") {
            updateData.deliveredAt = new Date();
        }
        const res = await prisma.order.updateMany({ where: { id: orderId, status: owned.order.status }, data: updateData });
        if (res.count === 0) return { error: "This order was just updated. Refresh and try again." };
        revalidatePath("/dashboard/orders");
        revalidatePath(`/[slug]/track/${orderId}`, "page");
        return { order: await prisma.order.findUnique({ where: { id: orderId } }) };
    } catch (err) {
        logger.error("order.update_status_failed", { orderId, ...errorInfo(err) });
        return { error: "Could not update order status." };
    }
}

/**
 * Dual confirmation. The caller's ROLE IS DERIVED ON THE SERVER: a signed-in merchant who owns the
 * order's store is the vendor; anyone else is the customer (the unguessable order id is the customer's capability).
 */
export async function confirmOrderDelivery(orderId: string) {
    const parsed = z.string().min(1).max(40).safeParse(orderId);
    if (!parsed.success) return { error: "Order not found" };
    const userId = await currentUserId();
    try {
        const result = await prisma.$transaction(async (tx) => {
            await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${orderId} FOR UPDATE`;
            const order = await tx.order.findUnique({ where: { id: orderId }, include: { store: { select: { vendorId: true } } } });
            if (!order) return { error: "Order not found" } as const;
            if (order.status !== "SHIPPED") return { error: "Only shipped orders can be confirmed as delivered." } as const;
            const isVendor = Boolean(userId) && order.store.vendorId === userId;
            const vendorDone = isVendor || order.vendorConfirmedDelivery;
            const customerDone = !isVendor || order.customerConfirmedDelivery;
            const done = vendorDone && customerDone;
            const updated = await tx.order.update({
                where: { id: orderId },
                data: { vendorConfirmedDelivery: vendorDone, customerConfirmedDelivery: customerDone, ...(done ? { status: "DELIVERED", deliveredAt: new Date() } : {}) },
            });
            return { order: updated } as const;
        });
        revalidatePath("/dashboard/orders");
        revalidatePath(`/[slug]/track/${orderId}`, "page");
        return result;
    } catch (err) {
        logger.error("order.confirm_delivery_failed", { orderId, ...errorInfo(err) });
        return { error: "Failed to confirm delivery" };
    }
}

export async function reportDispute(orderId: string, reason: string) {
    const parsed = z.object({ orderId: z.string().min(1).max(40), reason: z.string().trim().min(3).max(500) }).safeParse({ orderId, reason });
    if (!parsed.success) return { error: "Please describe the problem (3–500 characters)." };
    const h = await headers();
    if (!(await rateLimit(`dispute:${clientIp(h)}`, 5, 10 * 60_000)).allowed) return { error: "Too many requests. Please try again later." };
    try {
        const res = await prisma.order.updateMany({
            where: { id: orderId, status: { in: [...PAID_STATUSES] }, isDisputed: false },
            data: { isDisputed: true, disputeReason: parsed.data.reason },
        });
        if (res.count === 0) return { error: "This order can't be disputed (it may be unpaid or already disputed)." };
        revalidatePath("/dashboard/orders");
        return { success: true };
    } catch (err) {
        logger.error("order.dispute_failed", { orderId, ...errorInfo(err) });
        return { error: "An error occurred while reporting the dispute. Please contact support." };
    }
}
