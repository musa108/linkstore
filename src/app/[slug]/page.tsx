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
    const store = await prisma.store.findUnique({
        where: { slug },
        include: {
            products: {
                where: { inStock: true },
                orderBy: { createdAt: "desc" },
            },
        },
    });

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
