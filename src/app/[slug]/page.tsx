import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import ClientStorefront from "./client-storefront";
import { serializePrisma } from "@/lib/utils";

export default async function PublicStorePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let store: any;
    
    try {
        // Try fetching with all new gallery and variant data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        store = await (prisma.store.findUnique as any)({
            where: { slug },
            include: {
                products: {
                    where: { inStock: true },
                    include: { variants: true, media: true },
                    orderBy: { createdAt: "desc" },
                },
            },
        });
    } catch (err) {
        console.error("PRISMA_GALLERY_FETCH_ERROR, falling back to minimal...", err);
        // Fallback: Fetch only the absolute essentials to keep the page alive
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        store = await (prisma.store.findUnique as any)({
            where: { slug },
            include: {
                products: {
                    where: { inStock: true }
                },
            },
        });
    }

    if (!store) {
        notFound();
    }

    // Increment visits (background/asynchronous in RSC)
    await prisma.store.update({
        where: { id: store.id },
        data: { visits: { increment: 1 } }
    }).catch(err => console.error("TRACK_VISIT_ERROR", err));

    return <ClientStorefront store={serializePrisma(store)} products={serializePrisma(store.products)} />;
}
