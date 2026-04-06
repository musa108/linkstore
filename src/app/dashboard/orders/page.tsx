import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import OrderList from "./order-list";
import { serializePrisma } from "@/lib/utils";
import { OrderWithItems, Store } from "@/types";

type StoreWithOrders = Store & {
    orders: OrderWithItems[];
};

export default async function OrdersPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    // Using a more restricted type cast to resolve lint errors while handling stale Prisma types
    const storeRaw = await (prisma as unknown as { store: { findUnique: (args: unknown) => Promise<unknown> } }).store.findUnique({
        where: { vendorId: userId },
        include: {
            orders: {
                include: {
                    items: {
                        include: {
                            product: true,
                            variant: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            },
        },
    });

    if (!storeRaw) {
        redirect("/setup");
    }

    const store = serializePrisma(storeRaw);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
                <p className="text-muted-foreground">Monitor and manage your incoming customer orders.</p>
            </div>

            <OrderList orders={(store as StoreWithOrders).orders} storeSlug={(store as Store).slug} />
        </div>
    );
}
