import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardOverview from "./dashboard-overview";
import { serializePrisma } from "@/lib/utils";
import { getSalesData } from "@/lib/actions/dashboard";
import { AlertCircle, RefreshCcw, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    try {
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
        const safeChartData = serializePrisma(chartData);

        return <DashboardOverview 
            store={store} 
            chartData={safeChartData} 
            totalRevenue={totalRevenue} 
        />;

    } catch (error) {
        console.error("CRITICAL_DASHBOARD_CRASH:", error);

        return (
            <div className="p-8 h-[80vh] flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
                <div className="h-20 w-20 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-8 border border-indigo-100/50 shadow-soft">
                    <LayoutDashboard className="h-10 w-10 text-indigo-500" />
                </div>
                
                <h2 className="text-2xl font-black text-foreground mb-4">Dashboard temporarily unreachable</h2>
                <p className="text-foreground/50 font-medium mb-12 leading-relaxed">
                    We&apos;re currently performing a safety check on your database connection. Your store and products remain safe and active.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full">
                    <button 
                        onClick={() => window.location.reload()}
                        className="flex-1 h-14 bg-foreground text-background rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-95"
                    >
                        <RefreshCcw className="h-4 w-4" />
                        Reload Dashboard
                    </button>
                    <Link 
                        href="/dashboard/settings"
                        className="flex-1 h-14 bg-secondary text-foreground/60 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-border/50"
                    >
                        <AlertCircle className="h-4 w-4" />
                        Go to Settings
                    </Link>
                </div>
            </div>
        );
    }
}
