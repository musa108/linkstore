import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import ProductList from "./product-list";
import { serializePrisma } from "@/lib/utils";

export default async function ProductsPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    const storeRaw = await prisma.store.findUnique({
        where: { vendorId: userId },
        include: {
            products: {
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
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Products</h2>
                    <p className="text-muted-foreground">Manage your store products and inventory.</p>
                </div>
                <Link
                    href="/dashboard/products/new"
                    className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                    <Plus className="h-4 w-4" />
                    Add Product
                </Link>
            </div>

            <ProductList products={store.products} defaultThreshold={store.lowStockThreshold} />
        </div>
    );
}
