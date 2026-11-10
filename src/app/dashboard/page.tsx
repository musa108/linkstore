import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSalesData } from "@/lib/actions/dashboard";
import { serializePrisma } from "@/lib/utils";
import { toKobo } from "@/domain/money";
import DashboardOverview, { type OverviewData } from "./dashboard-overview";
import MerchantAssistant from "@/components/chat/merchant-assistant";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const store = await prisma.store.findUnique({ where: { vendorId: userId } });
    if (!store) redirect("/setup");

    const [sales, productCount, toShip, recent, lowStock] = await Promise.all([
        getSalesData(store.id, "7d"),
        prisma.product.count({ where: { storeId: store.id } }),
        prisma.order.count({ where: { storeId: store.id, status: "PAID" } }),
        prisma.order.findMany({ where: { storeId: store.id, status: { not: "CANCELLED" } }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, customerName: true, total: true, status: true, createdAt: true } }),
        prisma.variant.findMany({ where: { product: { storeId: store.id }, stockCount: { lte: store.lowStockThreshold } }, select: { id: true, name: true, stockCount: true, product: { select: { name: true } } }, orderBy: { stockCount: "asc" }, take: 5 }),
    ]);

    const chart = "data" in sales && sales.data ? sales.data : [];
    const data: OverviewData = {
        store: { name: store.name, slug: store.slug, visits: store.visits, conversionClicks: store.conversionClicks, hasPayout: Boolean(store.subaccountCode) },
        chart,
        revenue7d: chart.reduce((s, d) => s + d.revenue, 0),
        productCount, toShip,
        recent: serializePrisma(recent).map((o) => ({ id: o.id, customerName: o.customerName.split(" ")[0] ?? o.customerName, total: toKobo(o.total) / 100, status: o.status, createdAt: String(o.createdAt) })),
        lowStock: lowStock.map((v) => ({ id: v.id, label: `${v.product.name} – ${v.name}`, stock: v.stockCount })),
    };
    return (<><DashboardOverview data={data} /><MerchantAssistant /></>);
}
