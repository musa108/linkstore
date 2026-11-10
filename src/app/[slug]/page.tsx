import { notFound } from "next/navigation";
import Link from "next/link";
import { RefreshCcw, Store as StoreIcon } from "lucide-react";
import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { logger, errorInfo } from "@/lib/logger";
import type { Product, Store } from "@/types";
import ClientStorefront from "./client-storefront";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const store = await prisma.store.findUnique({ where: { slug }, select: { name: true, description: true } }).catch(() => null);
    return store ? { title: `${store.name} – Shop`, description: store.description ?? `Shop ${store.name} online.` } : { title: "Store not found" };
}

export default async function PublicStorePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    try {
        const store = await prisma.store.findUnique({
            where: { slug },
            include: {
                products: {
                    where: { inStock: true }, orderBy: { createdAt: "desc" }, take: 200,
                    include: { variants: true, media: { orderBy: { order: "asc" } }, reviews: { orderBy: { createdAt: "desc" }, take: 10 } },
                },
            },
        });
        if (!store) notFound();

        // Public data only: payout/bank fields and the vendor id never reach the browser.
        const { products, bankName, accountNumber, accountName, subaccountCode, commissionPercentage, vendorId, ...publicStore } = store;
        void bankName; void accountNumber; void accountName; void subaccountCode; void commissionPercentage; void vendorId;

        return <ClientStorefront store={serializePrisma(publicStore) as unknown as Store} products={serializePrisma(products) as unknown as Product[]} />;
    } catch (error) {
        if (typeof error === "object" && error !== null && "digest" in error) throw error; // let notFound() through
        logger.error("storefront.render_failed", { slug, ...errorInfo(error) });
        return (
            <main className="flex min-h-screen items-center justify-center bg-canvas p-6 text-center">
                <div className="w-full max-w-md rounded-[28px] border border-border bg-white p-10">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-primary"><StoreIcon className="h-8 w-8" aria-hidden /></div>
                    <h1 className="text-2xl font-bold">This store is temporarily unavailable</h1>
                    <p className="mt-3 leading-relaxed text-foreground/75">We couldn&apos;t load the store just now. Please try again in a moment.</p>
                    <Link href={`/${slug}`} className="btn btn-primary mt-8 w-full"><RefreshCcw className="h-4 w-4" aria-hidden />Try again</Link>
                </div>
            </main>
        );
    }
}
