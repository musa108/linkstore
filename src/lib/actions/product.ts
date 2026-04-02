"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface MediaInput {
    id?: string;
    url: string;
    type: string; // IMAGE or VIDEO
    order: number;
}

interface VariantInput {
    id?: string;
    name: string;
    sku?: string | null;
    price?: string | number | null;
    stockCount?: string | number;
    lowStockThreshold?: number | null;
}

export async function createProduct(storeId: string, formData: FormData) {
    const { userId } = await auth();
    if (!userId) return { error: "Unauthorized" };

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = formData.get("price") as string;
    const imageUrl = formData.get("imageUrl") as string;
    const inStock = formData.get("inStock") === "on";
    const lowStockThreshold = formData.get("lowStockThreshold") as string | null;
    const variantsJson = formData.get("variants") as string | null;
    const mediaJson = formData.get("media") as string | null;

    let variantsData: VariantInput[] = [];
    if (variantsJson) {
        try {
            variantsData = JSON.parse(variantsJson);
        } catch (e) {
            console.error("Failed to parse variants JSON", e);
        }
    }

    let mediaData: MediaInput[] = [];
    if (mediaJson) {
        try {
            mediaData = JSON.parse(mediaJson);
        } catch (e) {
            console.error("Failed to parse media JSON", e);
        }
    }

    try {
        const product = await (prisma.product.create as unknown as (args: unknown) => Promise<unknown>)({
            data: {
                storeId,
                name,
                description,
                price: Number(price),
                imageUrl,
                inStock,
                lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : null,
                variants: {
                    create: variantsData.map((v: VariantInput) => ({
                        name: v.name,
                        sku: v.sku || null,
                        price: v.price ? Number(v.price) : null,
                        stockCount: Number(v.stockCount) || 0,
                        lowStockThreshold: v.lowStockThreshold || null,
                    })),
                },
                media: {
                    create: mediaData.map((m: MediaInput) => ({
                        url: m.url,
                        type: m.type,
                        order: m.order,
                    })),
                },
            },
        });

        revalidatePath("/dashboard/products");
        return { product };
    } catch (error) {
        console.error("CREATE_PRODUCT_ERROR", error);
        return { error: "Could not create product." };
    }
}

export async function updateProduct(productId: string, formData: FormData) {
    const { userId } = await auth();
    if (!userId) return { error: "Unauthorized" };

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = formData.get("price") as string;
    const imageUrl = formData.get("imageUrl") as string;
    const inStock = formData.get("inStock") === "on";
    const lowStockThreshold = formData.get("lowStockThreshold") as string | null;
    const variantsJson = formData.get("variants") as string | null;
    const mediaJson = formData.get("media") as string | null;

    let variantsData: VariantInput[] = [];
    if (variantsJson) {
        try {
            variantsData = JSON.parse(variantsJson);
        } catch (e) {
            console.error("Failed to parse variants JSON", e);
        }
    }

    let mediaData: MediaInput[] = [];
    if (mediaJson) {
        try {
            mediaData = JSON.parse(mediaJson);
        } catch (e) {
            console.error("Failed to parse media JSON", e);
        }
    }

    try {
        const currentVariants = await (prisma as unknown as { variant: { findMany: (args: unknown) => Promise<unknown[]> } }).variant.findMany({ where: { productId } }) as { id: string }[];
        const currentVariantIds = currentVariants.map((v: { id: string }) => v.id);
        const incomingVariantIds = variantsData.filter((v: VariantInput) => v.id).map((v: VariantInput) => v.id);
        const variantsToDelete = currentVariantIds.filter((id: string) => !incomingVariantIds.includes(id));

        const product = await (prisma.product.update as unknown as (args: unknown) => Promise<unknown>)({
            where: { id: productId },
            data: {
                name,
                description,
                price: Number(price),
                imageUrl,
                inStock,
                lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : null,
                variants: {
                    deleteMany: { id: { in: variantsToDelete } },
                    upsert: variantsData.map((v: VariantInput) => ({
                        where: { id: v.id || "new_id_will_fail_to_match" },
                        update: {
                            name: v.name,
                            sku: v.sku || null,
                            price: v.price ? Number(v.price) : null,
                            stockCount: Number(v.stockCount) || 0,
                            lowStockThreshold: v.lowStockThreshold || null,
                        },
                        create: {
                            name: v.name,
                            sku: v.sku || null,
                            price: v.price ? Number(v.price) : null,
                            stockCount: Number(v.stockCount) || 0,
                            lowStockThreshold: v.lowStockThreshold || null,
                        }
                    }))
                },
                media: {
                    deleteMany: {}, // Simplest way to sync is to redraw the media collection for now
                    create: mediaData.map((m: MediaInput) => ({
                        url: m.url,
                        type: m.type,
                        order: m.order,
                    })),
                }
            },
        });

        revalidatePath("/dashboard/products");
        return { product };
    } catch (error) {
        console.error("UPDATE_PRODUCT_ERROR", error);
        return { error: "Could not update product." };
    }
}

export async function deleteProduct(productId: string) {
    const { userId } = await auth();
    if (!userId) return { error: "Unauthorized" };

    try {
        await prisma.product.delete({
            where: { id: productId },
        });

        revalidatePath("/dashboard/products");
        return { success: true };
    } catch (error) {
        console.error("DELETE_PRODUCT_ERROR", error);
        return { error: "Could not delete product." };
    }
}

export async function trackProductView(productId: string) {
    try {
        await (prisma.product.update as unknown as (args: unknown) => Promise<unknown>)({
            where: { id: productId },
            data: {
                views: {
                    increment: 1,
                },
            },
        });
    } catch (error) {
        console.error("TRACK_PRODUCT_VIEW_ERROR", error);
    }
}
