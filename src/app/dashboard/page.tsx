import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardOverview from "./dashboard-overview";
import { serializePrisma } from "@/lib/utils";
import { getSalesData } from "@/lib/actions/dashboard";

export default async function DashboardPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    // Fetch store to see if it exists
    const storeRaw = await prisma.store.findUnique({
        where: { vendorId: userId },
        include: {
            _count: {
                select: { products: true, orders: true },
            },
        },
    });

    if (!storeRaw) {
        redirect("/setup");
    }

    // Fetch sales data
    const salesDataResponse = await getSalesData(storeRaw.id, "7d");
    const chartData = salesDataResponse.data || [];
    const totalRevenue = salesDataResponse.totalRevenue || 0;

    // Convert Decimals to Numbers/Strings for client components for consistent handling
    const store = serializePrisma(storeRaw);

    return <DashboardOverview store={store} chartData={chartData} totalRevenue={totalRevenue} />;
}
