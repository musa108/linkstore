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
        const orders = await prisma.order.findMany({
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

        // Group by Date (YYYY-MM-DD)
        const aggregatedData = orders.reduce((acc, order) => {
            const dateObj = new Date(order.createdAt);
            const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // e.g. "Oct 24"

            if (!acc[dateStr]) {
                acc[dateStr] = { date: dateStr, revenue: 0, orders: 0 };
            }
            acc[dateStr].revenue += Number(order.total);
            acc[dateStr].orders += 1;
            return acc;
        }, {} as Record<string, { date: string; revenue: number; orders: number }>);

        // Convert the record to an array
        const chartData = Object.values(aggregatedData);
        const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);

        return { data: chartData, totalRevenue };
    } catch (error) {
        console.error("GET_SALES_DATA_ERROR", error);
        return { error: "Failed to fetch sales data." };
    }
}
