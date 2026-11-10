import { tool } from "ai";
import { z } from "zod";
import type { PrismaClient } from "@prisma/client";
import { PAID_STATUSES } from "@/domain/order-state";
import { toKobo } from "@/domain/money";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

/**
 * Shopper-context tools. SECURITY MODEL:
 *  - `store` is loaded server-side from the public storefront being viewed; the model can never
 *    choose a store id. Every query below is scoped by store.id.
 *  - Tools are read-only. Nothing here can create/alter orders, stock, prices or payments.
 *  - Order lookup needs the order id AND the exact email (or phone) on that order, is rate-limited
 *    per IP and per order id, and returns one generic failure for "not found" and "wrong details".
 */
export interface ShopperStore { id: string; slug: string; name: string }
export interface ToolContext { db: PrismaClient; store: ShopperStore; clientKey: string }

export const digitsOnly = (s: string) => s.replace(/\D/g, "");

/** Nigerian numbers compare on their last 10 digits (08012345678 ≡ +2348012345678). Needs ≥10 digits. */
export function phonesMatch(a: string, b: string): boolean {
    const x = digitsOnly(a), y = digitsOnly(b);
    if (x.length < 10 || y.length < 10) return false;
    return x.slice(-10) === y.slice(-10);
}

export function emailMatches(a: string, b: string): boolean {
    return a.trim().length > 3 && a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function verificationMatches(order: { customerEmail: string; customerPhone: string }, supplied: string): boolean {
    return emailMatches(order.customerEmail, supplied) || phonesMatch(order.customerPhone, supplied);
}

const GENERIC_ORDER_ERROR = "I couldn't verify that order. Please check the order ID and the email or phone number used at checkout.";

export function createShopperTools(ctx: ToolContext) {
    const { db, store, clientKey } = ctx;
    return {
        search_products: tool({
            description: "Search THIS store's in-stock products by keyword and/or maximum price (in naira). Use this before answering any question about what the store sells, prices or availability.",
            inputSchema: z.object({
                query: z.string().trim().max(80).optional().describe("Keywords, e.g. 'ankara dress'"),
                maxPriceNaira: z.number().positive().max(10_000_000).optional(),
                limit: z.number().int().min(1).max(6).default(6),
            }),
            execute: async ({ query, maxPriceNaira, limit }) => {
                const products = await db.product.findMany({
                    where: {
                        storeId: store.id, inStock: true,
                        ...(query ? { OR: [{ name: { contains: query, mode: "insensitive" as const } }, { description: { contains: query, mode: "insensitive" as const } }] } : {}),
                        ...(maxPriceNaira ? { price: { lte: (maxPriceNaira).toFixed(2) } } : {}),
                    },
                    include: { variants: { select: { id: true, name: true, price: true, stockCount: true } } },
                    orderBy: { createdAt: "desc" }, take: limit,
                });
                return {
                    storeUrl: `/${store.slug}`,
                    count: products.length,
                    products: products.map((p) => ({
                        id: p.id, name: p.name, priceNaira: toKobo(p.price) / 100, imageUrl: p.imageUrl,
                        description: (p.description ?? "").slice(0, 200),
                        options: p.variants.map((v) => ({ id: v.id, name: v.name, priceNaira: toKobo(v.price ?? p.price) / 100, available: v.stockCount > 0, lowStock: v.stockCount > 0 && v.stockCount <= 5 })),
                    })),
                };
            },
        }),

        checkout_link: tool({
            description: "Give the shopper the link to this store's checkout. The assistant cannot take payment or place orders itself: the shopper must add items to their cart (product cards have an Add to cart button) and pay on the secure checkout page.",
            inputSchema: z.object({}),
            execute: async () => ({ checkoutUrl: `/${store.slug}/checkout`, note: "Items must be in the cart first. Payment happens on Paystack's secure page; prices are confirmed at checkout." }),
        }),

        get_store_info: tool({
            description: "Get this store's name, description, announcement and delivery fees.",
            inputSchema: z.object({}),
            execute: async () => {
                const s = await db.store.findUnique({ where: { id: store.id }, select: { name: true, description: true, announcement: true, mainlandDeliveryFee: true, islandDeliveryFee: true } });
                if (!s) return { error: "Store information is unavailable." };
                return { name: s.name, description: s.description, announcement: s.announcement, deliveryFeesNaira: { mainland: toKobo(s.mainlandDeliveryFee) / 100, island: toKobo(s.islandDeliveryFee) / 100 }, refundPolicy: "Not published by the store – direct the customer to contact the seller." };
            },
        }),

        get_order_status: tool({
            description: "Look up an order's status. Requires the order ID AND the email or phone number used at checkout. Never call without both from the customer.",
            inputSchema: z.object({ orderId: z.string().trim().min(5).max(40), verification: z.string().trim().min(5).max(120) }),
            execute: async ({ orderId, verification }) => {
                const byClient = (await rateLimit(`orderlookup:ip:${clientKey}`, 8, 15 * 60_000));
                const byOrder = (await rateLimit(`orderlookup:order:${orderId}`, 5, 15 * 60_000));
                if (!byClient.allowed || !byOrder.allowed) return { error: "Too many lookup attempts. Please try again in a few minutes." };

                const order = await db.order.findFirst({
                    where: { id: orderId, storeId: store.id },
                    include: { items: { include: { product: { select: { name: true } } } } },
                });
                if (!order || !verificationMatches(order, verification)) {
                    logger.info("chat.order_lookup_denied", { storeId: store.id });
                    return { error: GENERIC_ORDER_ERROR };
                }
                return {
                    status: order.status === "PENDING" ? "AWAITING_PAYMENT" : order.status,
                    isPaid: (PAID_STATUSES as readonly string[]).includes(order.status),
                    items: order.items.map((i) => `${i.quantity}× ${i.product.name}`),
                    totalNaira: toKobo(order.total) / 100,
                    placedAt: order.createdAt.toISOString(),
                    trackingUrl: `/${store.slug}/track/${order.id}`,
                };
            },
        }),
    };
}
export type ShopperTools = ReturnType<typeof createShopperTools>;
