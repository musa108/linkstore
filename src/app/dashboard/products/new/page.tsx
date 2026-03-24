import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProductForm from "./product-form";

export default async function NewProductPage() {
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

    return (
        <div className="space-y-10">
            <div className="flex flex-col gap-2">
                <h2 className="text-4xl font-black text-foreground tracking-tight">Add New Product</h2>
                <p className="text-sm font-bold text-foreground/40 uppercase tracking-widest">List a new item on your storefront</p>
            </div>

            <div className="bento-card max-w-3xl bg-card p-10">
                <ProductForm storeId={store.id} />
            </div>
        </div>
    );
}
