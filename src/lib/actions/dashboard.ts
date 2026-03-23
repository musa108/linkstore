"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function getSalesData(storeId: string, timeframe: "7d" | "30d" | "all" = "7d") {
    const { userId } = await auth();
    if (!userId) {
        throw new Error("Unauthorized");
    }

    // Determine the date to filter from
    const startDate = new Date();
    if (timeframe === "7d") {
        startDate.setDate(startDate.getDate() - 7);
    } else if (timeframe === "30d") {
        startDate.setDate(startDate.getDate() - 30);
    } else {
        // "all" - just go back 10 years or rely on no filter
        startDate.setFullYear(startDate.getFullYear() - 10);
    }

    try {
        // Fetch ALL PAID orders for total revenue (ignore timeframe for the summary)
        const allPaidOrders = await prisma.order.findMany({
            where: {
                storeId,
                status: "PAID",
            },
            select: {
                total: true,
            },
        });

        const totalRevenue = allPaidOrders.reduce((sum, order) => sum + Number(order.total), 0);

        // Fetch orders for the CHART (obey timeframe)
        const chartOrders = await prisma.order.findMany({
            where: {
                storeId,
                status: "PAID",
                createdAt: {
                    gte: startDate,
                },
            },
            select: {
                total: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        // Group by Date (YYYY-MM-DD) for the chart
        const aggregatedData = chartOrders.reduce((acc, order) => {
            const dateObj = new Date(order.createdAt);
            const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            if (!acc[dateStr]) {
                acc[dateStr] = { date: dateStr, revenue: 0, orders: 0 };
            }
            acc[dateStr].revenue += Number(order.total);
            acc[dateStr].orders += 1;
            return acc;
        }, {} as Record<string, { date: string; revenue: number; orders: number }>);

        const chartData = Object.values(aggregatedData);

        return { data: chartData, totalRevenue };
    } catch (error) {
        console.error("GET_SALES_DATA_ERROR", error);
        return { error: "Failed to fetch sales data." };
    }
}
