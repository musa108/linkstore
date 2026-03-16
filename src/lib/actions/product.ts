"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface VariantInput {
    id?: string;
    name: string;
    sku?: string | null;
    price?: string | number | null;
    stockCount?: string | number;
}

export async function createProduct(storeId: string, formData: FormData) {
    const { userId } = await auth();
    if (!userId) return { error: "Unauthorized" };

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = formData.get("price") as string;
    const imageUrl = formData.get("imageUrl") as string;
    const inStock = formData.get("inStock") === "on";
    const variantsJson = formData.get("variants") as string | null;

    let variantsData: VariantInput[] = [];
    if (variantsJson) {
        try {
            variantsData = JSON.parse(variantsJson);
        } catch (e) {
            console.error("Failed to parse variants JSON", e);
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
                variants: {
                    create: variantsData.map((v: VariantInput) => ({
                        name: v.name,
                        sku: v.sku || null,
                        price: v.price ? Number(v.price) : null,
                        stockCount: Number(v.stockCount) || 0,
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
    const variantsJson = formData.get("variants") as string | null;

    let variantsData: VariantInput[] = [];
    if (variantsJson) {
        try {
            variantsData = JSON.parse(variantsJson);
        } catch (e) {
            console.error("Failed to parse variants JSON", e);
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
                variants: {
                    deleteMany: { id: { in: variantsToDelete } },
                    upsert: variantsData.map((v: VariantInput) => ({
                        where: { id: v.id || "new_id_will_fail_to_match" },
                        update: {
                            name: v.name,
                            sku: v.sku || null,
                            price: v.price ? Number(v.price) : null,
                            stockCount: Number(v.stockCount) || 0,
                        },
                        create: {
                            name: v.name,
                            sku: v.sku || null,
                            price: v.price ? Number(v.price) : null,
                            stockCount: Number(v.stockCount) || 0,
                        }
                    }))
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
