import { tool } from "ai";
import { z } from "zod";
import type { PrismaClient } from "@prisma/client";
import { PAID_STATUSES } from "@/domain/order-state";
import { toKobo } from "@/domain/money";

/**
 * MERCHANT-context tools. `storeId` comes from the verified Clerk session (never from the model/client).
 * All tools are READ-ONLY. The one "action" tool only returns a PROPOSAL; the dashboard UI shows a confirm
 * button that calls the normal, authorised server action – the model never executes a mutation.
 * Customer PII is minimised before it reaches the model (first name only; no email/phone/address).
 */
export interface MerchantToolContext { db: PrismaClient; store: { id: string; slug: string; lowStockThreshold: number } }

const shortId = (id: string) => id.slice(-6).toUpperCase();

export function createMerchantTools({ db, store }: MerchantToolContext) {
    return {
        sales_summary: tool({
            description: "Revenue, order count and best-selling products for the last N days (paid, shipped and delivered orders).",
            inputSchema: z.object({ days: z.number().int().min(1).max(90).default(7) }),
            execute: async ({ days }) => {
                const since = new Date(Date.now() - days * 86_400_000);
                const orders = await db.order.findMany({ where: { storeId: store.id, status: { in: [...PAID_STATUSES] }, createdAt: { gte: since } }, select: { total: true, items: { select: { quantity: true, product: { select: { name: true } } } } }, take: 5000 });
                const totalKobo = orders.reduce((s, o) => s + toKobo(o.total), 0);
                const units = new Map<string, number>();
                for (const o of orders) for (const i of o.items) units.set(i.product.name, (units.get(i.product.name) ?? 0) + i.quantity);
                return {
                    days, orders: orders.length, revenueNaira: totalKobo / 100,
                    averageOrderNaira: orders.length ? Math.round(totalKobo / orders.length) / 100 : 0,
                    topProducts: [...units.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, unitsSold]) => ({ name, unitsSold })),
                };
            },
        }),

        list_orders: tool({
            description: "List this store's most recent orders, optionally filtered by status. Customer details are limited to first name.",
            inputSchema: z.object({ status: z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]).optional(), limit: z.number().int().min(1).max(10).default(10) }),
            execute: async ({ status, limit }) => {
                const orders = await db.order.findMany({ where: { storeId: store.id, ...(status ? { status } : {}) }, orderBy: { createdAt: "desc" }, take: limit, include: { items: { include: { product: { select: { name: true } } } } } });
                return {
                    count: orders.length,
                    orders: orders.map((o) => ({
                        orderId: o.id, ref: shortId(o.id), customerFirstName: o.customerName.split(" ")[0], status: o.status === "PENDING" ? "AWAITING_PAYMENT" : o.status,
                        totalNaira: toKobo(o.total) / 100, items: o.items.map((i) => `${i.quantity}× ${i.product.name}`), placedAt: o.createdAt.toISOString(), disputed: o.isDisputed,
                    })),
                };
            },
        }),

        find_products: tool({
            description: "Search this store's products (including out-of-stock) with price and stock per option.",
            inputSchema: z.object({ query: z.string().trim().max(80).optional() }),
            execute: async ({ query }) => {
                const products = await db.product.findMany({
                    where: { storeId: store.id, ...(query ? { name: { contains: query, mode: "insensitive" as const } } : {}) },
                    include: { variants: { select: { name: true, stockCount: true } } }, take: 10, orderBy: { createdAt: "desc" },
                });
                return { count: products.length, products: products.map((p) => ({ name: p.name, priceNaira: toKobo(p.price) / 100, inStock: p.inStock, options: p.variants.map((v) => ({ name: v.name, stock: v.stockCount })) })) };
            },
        }),

        low_stock: tool({
            description: "Options that are at or below the store's low-stock threshold.",
            inputSchema: z.object({}),
            execute: async () => {
                const v = await db.variant.findMany({ where: { product: { storeId: store.id }, stockCount: { lte: store.lowStockThreshold } }, select: { name: true, stockCount: true, product: { select: { name: true } } }, orderBy: { stockCount: "asc" }, take: 15 });
                return { threshold: store.lowStockThreshold, items: v.map((x) => ({ product: x.product.name, option: x.name, stock: x.stockCount })) };
            },
        }),

        propose_mark_shipped: tool({
            description: "Propose marking a PAID order as shipped. This does NOT change anything: it returns a proposal the merchant must confirm with a button. Only use after the merchant asks to ship a specific order.",
            inputSchema: z.object({ orderId: z.string().trim().min(5).max(40) }),
            execute: async ({ orderId }) => {
                const order = await db.order.findFirst({ where: { id: orderId, storeId: store.id }, select: { id: true, status: true, customerName: true } });
                if (!order) return { error: "I couldn't find that order in your store." };
                if (order.status !== "PAID") return { error: `That order is ${order.status.toLowerCase()}; only paid orders can be marked as shipped.` };
                return { proposal: { action: "MARK_SHIPPED" as const, orderId: order.id, ref: shortId(order.id), label: `Mark order ${shortId(order.id)} (${order.customerName.split(" ")[0]}) as shipped` } };
            },
        }),
    };
}
