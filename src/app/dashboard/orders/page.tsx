import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import OrderList, { type OrderRow } from "./order-list";

export const dynamic = "force-dynamic";
const PAGE = 100;

export default async function OrdersPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const store = await prisma.store.findUnique({ where: { vendorId: userId }, select: { id: true, slug: true } });
    if (!store) redirect("/setup");

    const orders = await prisma.order.findMany({
        where: { storeId: store.id }, orderBy: { createdAt: "desc" }, take: PAGE,
        include: {
            store: { select: { slug: true } },
            items: { include: { product: { select: { name: true, imageUrl: true } }, variant: { select: { name: true } } } },
            payments: { where: { status: { in: ["SUCCESS", "REFUNDED"] } }, take: 1, include: { refunds: { orderBy: { createdAt: "desc" } } } },
        },
    });

    const serializedOrders = (serializePrisma(orders) as unknown as (OrderRow & { store?: { slug: string } })[]).map((o) => ({
        ...o,
        storeSlug: o.store?.slug ?? store.slug,
    }));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Orders</h1>
                <p className="mt-1 text-foreground/70">Ship paid orders, confirm delivery and handle refunds. Showing your latest {PAGE}.</p>
            </div>
            <OrderList orders={serializedOrders} />
        </div>
    );
}
