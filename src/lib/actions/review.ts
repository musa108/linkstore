"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function submitReview(formData: FormData) {
    const orderId = formData.get("orderId") as string;
    const productId = formData.get("productId") as string;
    const customerName = formData.get("customerName") as string;
    const rating = Number(formData.get("rating"));
    const comment = formData.get("comment") as string;

    if (!orderId || !productId || !rating) {
        return { error: "Missing review details" };
    }

    try {
        // Verify order is DELIVERED before allowing a review
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { status: true }
        });

        if (!order || order.status !== "DELIVERED") {
            return { error: "You can only review products from delivered orders." };
        }

        const review = await prisma.review.create({
            data: {
                orderId,
                productId,
                customerName,
                rating,
                comment,
            }
        });

        revalidatePath("/dashboard/reviews");
        revalidatePath(`/[slug]`, 'page'); // Update storefront reviews
        
        return { success: true, review };
    } catch (error) {
        console.error("SUBMIT_REVIEW_ERROR", error);
        return { error: "Could not submit review. Please try again." };
    }
}

export async function getProductReviews(productId: string) {
    try {
        const reviews = await prisma.review.findMany({
            where: { productId },
            orderBy: { createdAt: "desc" }
        });
        return reviews;
    } catch (error) {
        console.error("GET_REVIEWS_ERROR", error);
        return [];
    }
}
