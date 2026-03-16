"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createOrder(formData: FormData) {
    const storeId = formData.get("storeId") as string;
    const customerName = formData.get("customerName") as string;
    const customerEmail = formData.get("customerEmail") as string;
    const customerPhone = formData.get("customerPhone") as string;
    const address = formData.get("address") as string;
    const deliveryArea = formData.get("deliveryArea") as string;
    const deliveryFee = formData.get("deliveryFee") as string;
    const subtotal = formData.get("subtotal") as string;
    const total = formData.get("total") as string;
    const itemsJson = formData.get("items") as string;
    const origin = formData.get("origin") as string;
    const storeSlug = formData.get("storeSlug") as string;
    if (!customerName || !customerEmail || !customerPhone || !address || !itemsJson || !origin || !storeSlug) {
        return { error: "Missing required details for checkout." };
    }

    const items = JSON.parse(itemsJson);

    if (!items || items.length === 0) {
        return { error: "Your cart is empty." };
    }

    try {
        const order = await prisma.order.create({
            data: {
                storeId,
                customerName,
                customerEmail,
                customerPhone,
                address,
                deliveryArea,
                deliveryFee: Number(deliveryFee),
                subtotal: Number(subtotal),
                total: Number(total),
                status: "PENDING",
                items: {
                    create: items.map((item: { id: string; quantity: number; price: number; variantId?: string }) => ({
                        productId: item.id,
                        variantId: item.variantId || null,
                        quantity: item.quantity,
                        priceAtPurchase: Number(item.price),
                    })),
                },
            },
        });

        revalidatePath("/dashboard/orders");
        return { order };
    } catch (error) {
        console.error("CREATE_ORDER_ERROR", error);
        return { error: "Could not create order." };
    }
}

export async function updateOrderStatus(orderId: string, status: string) {
    try {
        const order = await prisma.order.update({
            where: { id: orderId },
            data: { status },
        });

        revalidatePath("/dashboard/orders");
        return { order };
    } catch (error) {
        console.error("UPDATE_ORDER_STATUS_ERROR", error);
        return { error: "Could not update order status." };
    }
}
