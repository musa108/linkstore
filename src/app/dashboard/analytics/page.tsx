import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getAnalyticsData } from "@/lib/actions/dashboard";
import { serializePrisma } from "@/lib/utils";
import AnalyticsDashboard from "./analytics-dashboard";

export default async function AnalyticsPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    const store = await prisma.store.findUnique({
        where: { vendorId: userId },
    });

    if (!store) {
        redirect("/setup");
    }

    const analyticsData = await getAnalyticsData(store.id);

    if ("error" in analyticsData) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <p className="text-red-500 font-bold">{analyticsData.error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-black text-foreground tracking-tight">Advanced Analytics</h2>
                <p className="text-sm font-bold text-foreground/40 uppercase tracking-widest mt-1">
                    Deep insights into your store performance and customer behavior.
                </p>
            </div>
            <AnalyticsDashboard data={serializePrisma(analyticsData)} />
        </div>
    );
}
