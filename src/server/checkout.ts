import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { computeSplit, fromKobo, percentToBps, toKobo } from "@/domain/money";
import { priceOrder } from "@/domain/pricing";
import { initializePaystackTransaction } from "@/lib/paystack";
import { logger, errorInfo } from "@/lib/logger";

export const checkoutInput = z.object({
    storeSlug: z.string().min(1).max(80),
    idempotencyKey: z.string().min(8).max(80).regex(/^[A-Za-z0-9_-]+$/),
    customerName: z.string().trim().min(2).max(100),
    customerEmail: z.string().trim().toLowerCase().email().max(200),
    customerPhone: z.string().trim().regex(/^[+\d][\d\s-]{7,19}$/, "Enter a valid phone number"),
    address: z.string().trim().min(8).max(500),
    deliveryArea: z.enum(["MAINLAND", "ISLAND"]),
    items: z.array(z.object({
        productId: z.string().min(1).max(40),
        variantId: z.string().max(40).nullish(),
        quantity: z.number().int(),
    })).min(1).max(30),
});
export type CheckoutInput = z.infer<typeof checkoutInput>;
export type CheckoutResult = { authorizationUrl: string; orderId: string } | { error: string };

export interface CheckoutDeps {
    db?: PrismaClient;
    baseUrl: string;
    allowWithoutPayout?: boolean;
    initialize?: typeof initializePaystackTransaction;
}

/**
 * Creates an order + payment attempt using ONLY trusted server data, then asks Paystack for a
 * checkout URL. The client contributes ids/quantities/contact details – never prices or totals.
 */
export async function startCheckout(raw: unknown, deps: CheckoutDeps): Promise<CheckoutResult> {
    const db = deps.db ?? prisma;
    const initialize = deps.initialize ?? initializePaystackTransaction;

    const parsed = checkoutInput.safeParse(raw);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check your details and try again." };
    const input = parsed.data;

    const store = await db.store.findUnique({ where: { slug: input.storeSlug } });
    if (!store) return { error: "Store not found." };
    if (!store.subaccountCode && !deps.allowWithoutPayout) {
        return { error: "This store hasn't finished setting up payments yet. Please contact the seller." };
    }

    // Idempotency: a retry of the same checkout attempt must not create a second order.
    const existing = await db.order.findUnique({ where: { idempotencyKey: input.idempotencyKey }, include: { payments: true } });
    if (existing && existing.storeId !== store.id) return { error: "Invalid checkout session. Please refresh and try again." };
    if (existing && existing.status !== "PENDING") return { error: "This order has already been paid. Check your email for confirmation." };

    const catalog = await db.product.findMany({
        where: { id: { in: [...new Set(input.items.map((i) => i.productId))] }, storeId: store.id },
        include: { variants: true },
    });

    const priced = priceOrder({
        storeId: store.id,
        requested: input.items,
        catalog: catalog.map((p) => ({ id: p.id, storeId: p.storeId, name: p.name, price: p.price, inStock: p.inStock, variants: p.variants.map((v) => ({ id: v.id, name: v.name, price: v.price, stockCount: v.stockCount })) })),
        deliveryFeeKobo: toKobo(input.deliveryArea === "ISLAND" ? store.islandDeliveryFee : store.mainlandDeliveryFee),
    });
    if (!priced.ok) return { error: priced.error };

    const split = computeSplit(priced.totalKobo, percentToBps(store.commissionPercentage));
    const reference = `ls_${randomUUID().replaceAll("-", "")}`;

    let orderId: string;
    try {
        if (existing) {
            orderId = existing.id;
            // Re-pricing on retry: refresh totals from current catalog and open a fresh payment attempt.
            await db.$transaction([
                db.order.update({ where: { id: orderId }, data: { subtotal: fromKobo(priced.subtotalKobo), deliveryFee: fromKobo(priced.deliveryKobo), total: fromKobo(priced.totalKobo) } }),
                db.payment.updateMany({ where: { orderId, status: "INITIALIZED" }, data: { status: "ABANDONED", failureReason: "SUPERSEDED" } }),
                db.payment.create({ data: { orderId, reference, amountKobo: split.amountKobo, commissionBps: split.commissionBps, commissionKobo: split.commissionKobo, merchantShareKobo: split.merchantShareKobo, subaccountCode: store.subaccountCode } }),
            ]);
        } else {
            const order = await db.order.create({
                data: {
                    storeId: store.id, idempotencyKey: input.idempotencyKey,
                    customerName: input.customerName, customerEmail: input.customerEmail, customerPhone: input.customerPhone,
                    address: input.address, deliveryArea: input.deliveryArea,
                    deliveryFee: fromKobo(priced.deliveryKobo), subtotal: fromKobo(priced.subtotalKobo), total: fromKobo(priced.totalKobo),
                    status: "PENDING",
                    items: { create: priced.lines.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity, priceAtPurchase: fromKobo(l.unitKobo) })) },
                    payments: { create: { reference, amountKobo: split.amountKobo, commissionBps: split.commissionBps, commissionKobo: split.commissionKobo, merchantShareKobo: split.merchantShareKobo, subaccountCode: store.subaccountCode } },
                },
            });
            orderId = order.id;
        }
    } catch (err) {
        logger.error("checkout.persist_failed", errorInfo(err));
        return { error: "Could not create your order. Please try again." };
    }

    const init = await initialize({
        email: input.customerEmail, amountKobo: split.amountKobo, reference,
        callbackUrl: `${deps.baseUrl}/${store.slug}/verify`, subaccount: store.subaccountCode ?? undefined, metadata: { orderId, storeId: store.id },
    });
    if (!init.ok) {
        logger.error("checkout.initialize_failed", { orderId, reference, ambiguous: init.ambiguous, error: init.error });
        // Ambiguous (timeout) → leave INITIALIZED; the reconcile job resolves it. Definite failure → close attempt.
        if (!init.ambiguous) await db.payment.updateMany({ where: { reference, status: "INITIALIZED" }, data: { status: "FAILED", failureReason: init.error.slice(0, 200) } });
        return { error: "Payment system unavailable. Please try again in a moment." };
    }
    logger.info("checkout.initialized", { orderId, reference, amountKobo: split.amountKobo });
    return { authorizationUrl: init.data.authorization_url, orderId };
}
