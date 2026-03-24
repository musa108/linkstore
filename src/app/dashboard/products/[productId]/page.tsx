import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import ProductForm from "../new/product-form";
import { serializePrisma } from "@/lib/utils";
import { Product } from "@/types";

export default async function EditProductPage({
    params,
}: {
    params: Promise<{ productId: string }>;
}) {
    const { productId } = await params;
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

    const productRaw = await (prisma as unknown as { product: { findUnique: (args: unknown) => Promise<unknown> } }).product.findUnique({
        where: {
            id: productId,
            storeId: store.id,
        },
        include: {
            variants: true,
        },
    });

    if (!productRaw) {
        notFound();
    }

    const product = serializePrisma(productRaw) as Product;

    return (
        <div className="space-y-10">
            <div className="flex flex-col gap-2">
                <h2 className="text-4xl font-black text-foreground tracking-tight">Edit Product</h2>
                <p className="text-sm font-bold text-foreground/40 uppercase tracking-widest">Modify your listed item details</p>
            </div>

            <div className="bento-card max-w-3xl bg-card p-10">
                <ProductForm storeId={store.id} initialData={product} />
            </div>
        </div>
    );
}
