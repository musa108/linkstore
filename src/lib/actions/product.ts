"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireOwnedProduct, requireOwnedStoreById } from "@/server/auth";
import { fromKobo, toKobo } from "@/domain/money";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { logger, errorInfo } from "@/lib/logger";

const moneyField = z.union([z.string(), z.number()]).transform((v, ctx) => {
    try {
        const kobo = toKobo(v);
        if (kobo <= 0 || kobo > 1_000_000_000) throw new Error("range");
        return fromKobo(kobo);
    } catch { ctx.addIssue({ code: "custom", message: "Enter a valid price" }); return z.NEVER; }
});
const httpsUrl = z.string().url().max(500).refine((u) => u.startsWith("https://"), "URLs must be https");

const variantSchema = z.object({
    id: z.string().max(40).optional(),
    name: z.string().trim().min(1).max(80),
    sku: z.string().trim().max(60).nullish(),
    price: z.union([z.string(), z.number(), z.null()]).optional().transform((v, ctx) => {
        if (v === null || v === undefined || v === "") return null;
        const r = moneyField.safeParse(v);
        if (!r.success) { ctx.addIssue({ code: "custom", message: "Invalid variant price" }); return z.NEVER; }
        return r.data;
    }),
    stockCount: z.coerce.number().int().min(0).max(1_000_000).default(0),
    lowStockThreshold: z.number().int().min(0).max(100000).nullish(),
});
const mediaSchema = z.object({ url: httpsUrl, type: z.enum(["IMAGE", "VIDEO"]), order: z.number().int().min(0).max(50) });

const productSchema = z.object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(2000).optional().transform((v) => v || null),
    price: moneyField,
    imageUrl: httpsUrl.nullish().or(z.literal("")).transform((v) => v || null),
    inStock: z.boolean(),
    lowStockThreshold: z.coerce.number().int().min(0).max(100000).nullable(),
    variants: z.array(variantSchema).max(50),
    media: z.array(mediaSchema).max(10),
});

function parseForm(formData: FormData) {
    const json = (k: string) => { const v = formData.get(k); if (!v || typeof v !== "string") return []; try { return JSON.parse(v); } catch { return null; } };
    const lst = formData.get("lowStockThreshold");
    return productSchema.safeParse({
        name: formData.get("name"), description: formData.get("description") ?? undefined, price: formData.get("price"),
        imageUrl: formData.get("imageUrl") ?? undefined, inStock: formData.get("inStock") === "on",
        lowStockThreshold: lst ? lst : null, variants: json("variants"), media: json("media"),
    });
}
const firstIssue = (e: z.ZodError) => e.issues[0]?.message ?? "Invalid product details";

export async function createProduct(storeId: string, formData: FormData) {
    const owned = await requireOwnedStoreById(storeId);
    if (!owned.ok) return { error: owned.error };
    const parsed = parseForm(formData);
    if (!parsed.success) return { error: firstIssue(parsed.error) };
    const d = parsed.data;
    try {
        const product = await prisma.product.create({
            data: {
                storeId: owned.store.id, name: d.name, description: d.description, price: d.price, imageUrl: d.imageUrl, inStock: d.inStock, lowStockThreshold: d.lowStockThreshold,
                variants: { create: d.variants.map((v) => ({ name: v.name, sku: v.sku || null, price: v.price, stockCount: v.stockCount, lowStockThreshold: v.lowStockThreshold ?? null })) },
                media: { create: d.media },
            },
        });
        revalidatePath("/dashboard/products");
        revalidatePath(`/${owned.store.slug}`);
        return { product };
    } catch (err) {
        logger.error("product.create_failed", errorInfo(err));
        return { error: "Could not create product." };
    }
}

export async function updateProduct(productId: string, formData: FormData) {
    const owned = await requireOwnedProduct(productId);
    if (!owned.ok) return { error: owned.error };
    const parsed = parseForm(formData);
    if (!parsed.success) return { error: firstIssue(parsed.error) };
    const d = parsed.data;
    try {
        const current = await prisma.variant.findMany({ where: { productId }, select: { id: true } });
        const keep = new Set(d.variants.map((v) => v.id).filter((x): x is string => Boolean(x)));
        const toDelete = current.map((v) => v.id).filter((id) => !keep.has(id));
        // Variants referenced by past orders are kept (history integrity) – nulling would corrupt order items.
        const referenced = toDelete.length ? await prisma.orderItem.count({ where: { variantId: { in: toDelete } } }) : 0;
        if (referenced > 0) return { error: "An option you removed was already ordered. Set its stock to 0 instead of deleting it." };

        const product = await prisma.product.update({
            where: { id: productId },
            data: {
                name: d.name, description: d.description, price: d.price, imageUrl: d.imageUrl, inStock: d.inStock, lowStockThreshold: d.lowStockThreshold,
                variants: {
                    deleteMany: { id: { in: toDelete } },
                    // Nested upsert is scoped to THIS product's variants; foreign ids cannot match.
                    upsert: d.variants.map((v) => ({
                        where: { id: v.id ?? "new" },
                        update: { name: v.name, sku: v.sku || null, price: v.price, stockCount: v.stockCount, lowStockThreshold: v.lowStockThreshold ?? null },
                        create: { name: v.name, sku: v.sku || null, price: v.price, stockCount: v.stockCount, lowStockThreshold: v.lowStockThreshold ?? null },
                    })),
                },
                media: { deleteMany: {}, create: d.media },
            },
        });
        revalidatePath("/dashboard/products");
        return { product };
    } catch (err) {
        logger.error("product.update_failed", { productId, ...errorInfo(err) });
        return { error: "Could not update product." };
    }
}

export async function deleteProduct(productId: string) {
    const owned = await requireOwnedProduct(productId);
    if (!owned.ok) return { error: owned.error };
    try {
        await prisma.product.delete({ where: { id: productId } });
        revalidatePath("/dashboard/products");
        return { success: true };
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
            return { error: "This product has past orders and can't be deleted. Mark it out of stock instead." };
        }
        logger.error("product.delete_failed", { productId, ...errorInfo(err) });
        return { error: "Could not delete product." };
    }
}

/** Public counter (storefront). Rate-limited per IP+product so it can't be trivially inflated. */
export async function trackProductView(productId: string) {
    if (!/^[a-z0-9]{10,40}$/i.test(productId)) return;
    const h = await headers();
    if (!(await rateLimit(`pv:${clientIp(h)}:${productId}`, 3, 10 * 60_000)).allowed) return;
    try { await prisma.product.updateMany({ where: { id: productId }, data: { views: { increment: 1 } } }); }
    catch (err) { logger.warn("product.track_view_failed", errorInfo(err)); }
}
