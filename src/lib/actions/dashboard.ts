"use server";

import prisma from "@/lib/prisma";
import { requireOwnedStoreById } from "@/server/auth";
import { PAID_STATUSES } from "@/domain/order-state";
import { toKobo } from "@/domain/money";
import { logger, errorInfo } from "@/lib/logger";

const REVENUE_STATUSES = [...PAID_STATUSES]; // PAID + SHIPPED + DELIVERED all count as earned revenue

export async function getSalesData(storeId: string, timeframe: "7d" | "30d" | "all" = "7d") {
    const owned = await requireOwnedStoreById(storeId);
    if (!owned.ok) throw new Error("Unauthorized");

    const startDate = new Date();
    if (timeframe === "7d") startDate.setDate(startDate.getDate() - 7);
    else if (timeframe === "30d") startDate.setDate(startDate.getDate() - 30);
    else startDate.setFullYear(startDate.getFullYear() - 10);

    try {
        const [allPaid, chartOrders] = await Promise.all([
            prisma.order.aggregate({ where: { storeId, status: { in: REVENUE_STATUSES } }, _sum: { total: true } }),
            prisma.order.findMany({ where: { storeId, status: { in: REVENUE_STATUSES }, createdAt: { gte: startDate } }, select: { total: true, createdAt: true }, orderBy: { createdAt: "asc" }, take: 5000 }),
        ]);
        const byDay = new Map<string, { date: string; revenue: number; orders: number }>();
        for (const o of chartOrders) {
            const date = o.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            const row = byDay.get(date) ?? { date, revenue: 0, orders: 0 };
            row.revenue += toKobo(o.total) / 100;
            row.orders += 1;
            byDay.set(date, row);
        }
        return { data: [...byDay.values()], totalRevenue: allPaid._sum.total ? toKobo(allPaid._sum.total) / 100 : 0 };
    } catch (err) {
        logger.error("dashboard.sales_failed", errorInfo(err));
        return { error: "Failed to fetch sales data." };
    }
}

export async function getAnalyticsData(storeId: string): Promise<
    | { storeStats: { visits: number; conversionClicks: number };
        productPerformance: { id: string; name: string; imageUrl: string | null; views: number; unitsSold: number; revenue: number; conversionRate: number }[];
        totalRevenue: number; recentOrders: { total: number; createdAt: Date }[] }
    | { error: string }
> {
    const owned = await requireOwnedStoreById(storeId);
    if (!owned.ok) throw new Error("Unauthorized");
    try {
        const [products, paidOrders] = await Promise.all([
            prisma.product.findMany({
                where: { storeId },
                select: { id: true, name: true, imageUrl: true, views: true, orderItems: { where: { order: { status: { in: REVENUE_STATUSES } } }, select: { quantity: true, priceAtPurchase: true } } },
                take: 500,
            }),
            prisma.order.findMany({ where: { storeId, status: { in: REVENUE_STATUSES } }, select: { total: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 5000 }),
        ]);
        const productPerformance = products.map((p) => {
            const unitsSold = p.orderItems.reduce((s, i) => s + i.quantity, 0);
            const revenueKobo = p.orderItems.reduce((s, i) => s + toKobo(i.priceAtPurchase) * i.quantity, 0);
            return { id: p.id, name: p.name, imageUrl: p.imageUrl, views: p.views, unitsSold, revenue: revenueKobo / 100, conversionRate: p.views > 0 ? Number(((unitsSold / p.views) * 100).toFixed(1)) : 0 };
        }).sort((a, b) => b.revenue - a.revenue);
        return {
            storeStats: { visits: owned.store.visits, conversionClicks: owned.store.conversionClicks },
            productPerformance,
            recentOrders: paidOrders.slice(0, 5).map((o) => ({ total: toKobo(o.total) / 100, createdAt: o.createdAt })),
            totalRevenue: paidOrders.reduce((s, o) => s + toKobo(o.total), 0) / 100,
        };
    } catch (err) {
        logger.error("dashboard.analytics_failed", errorInfo(err));
        return { error: "Failed to fetch analytics data." };
    }
}
