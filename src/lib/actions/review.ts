"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { logger, errorInfo } from "@/lib/logger";

const reviewSchema = z.object({
    orderId: z.string().min(1).max(40), productId: z.string().min(1).max(40),
    rating: z.coerce.number().int().min(1).max(5), comment: z.string().trim().max(1000).optional().transform((v) => v || null),
});

/** Reviews require a DELIVERED order that actually contained the product; the reviewer name comes from the order. */
export async function submitReview(formData: FormData) {
    const parsed = reviewSchema.safeParse({ orderId: formData.get("orderId"), productId: formData.get("productId"), rating: formData.get("rating"), comment: formData.get("comment") ?? undefined });
    if (!parsed.success) return { error: "Please give a rating from 1 to 5." };
    const h = await headers();
    if (!(await rateLimit(`review:${clientIp(h)}`, 10, 10 * 60_000)).allowed) return { error: "Too many requests. Please try again later." };
    const { orderId, productId, rating, comment } = parsed.data;
    try {
        const order = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true, customerName: true, items: { select: { productId: true } } } });
        if (!order || order.status !== "DELIVERED") return { error: "You can only review products from delivered orders." };
        if (!order.items.some((i) => i.productId === productId)) return { error: "That product isn't part of this order." };
        const review = await prisma.review.create({ data: { orderId, productId, customerName: order.customerName, rating, comment } });
        revalidatePath("/dashboard/reviews");
        revalidatePath("/[slug]", "page");
        return { success: true, review };
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return { error: "You've already reviewed this product." };
        logger.error("review.submit_failed", errorInfo(err));
        return { error: "Could not submit review. Please try again." };
    }
}

export async function getProductReviews(productId: string) {
    if (!/^[a-z0-9]{10,40}$/i.test(productId)) return [];
    try {
        return await prisma.review.findMany({ where: { productId }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, customerName: true, rating: true, comment: true, createdAt: true } });
    } catch (err) { logger.warn("review.list_failed", errorInfo(err)); return []; }
}
