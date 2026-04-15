"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { initializePaystackTransaction } from "@/lib/paystack";

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
    if (!customerEmail || !customerName || !customerPhone || !address || !itemsJson || !origin || !storeSlug) {
        return { error: "Missing required details for checkout." };
    }

    const items = JSON.parse(itemsJson);

    if (!items || items.length === 0) {
        return { error: "Your cart is empty." };
    }

    try {
        const store = await prisma.store.findUnique({
            where: { id: storeId },
            select: { subaccountCode: true }
        });

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

        // Initialize Paystack Payment
        const callbackUrl = `${origin}/${storeSlug}/verify`;
        const paystackResponse = await initializePaystackTransaction(
            customerEmail,
            Number(total),
            order.id,
            callbackUrl,
            store?.subaccountCode || undefined
        );

        if (!paystackResponse.status) {
            console.error("PAYSTACK_INIT_ERROR", paystackResponse.message);
            return { error: "Payment system unavailable. Please try again later." };
        }

        revalidatePath("/dashboard/orders");
        return { 
            order, 
            authorizationUrl: paystackResponse.data.authorization_url 
        };
    } catch (error) {
        console.error("CREATE_ORDER_ERROR", error);
        return { error: "Could not create order." };
    }
}

export async function updateOrderStatus(orderId: string, status: string) {
    try {
        // First, check if the order is already delivered to prevent further edits
        const existingOrder = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (existingOrder?.status === "DELIVERED") {
            return { error: "This order has been delivered and cannot be modified." };
        }

        const updateData: any = { status };
        
        if (status === "SHIPPED") {
            updateData.shippedAt = new Date();
        }

        const order = await prisma.order.update({
            where: { id: orderId },
            data: updateData,
        });

        revalidatePath("/dashboard/orders");
        revalidatePath(`/[slug]/track/${orderId}`, 'page');
        return { order };
    } catch (error) {
        console.error("UPDATE_ORDER_STATUS_ERROR", error);
        return { error: "Could not update order status." };
    }
}

export async function confirmOrderDelivery(orderId: string, role: "VENDOR" | "CUSTOMER") {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) return { error: "Order not found" };

        const updateData: any = {};
        if (role === "VENDOR") updateData.vendorConfirmedDelivery = true;
        if (role === "CUSTOMER") updateData.customerConfirmedDelivery = true;

        // Check if this confirmation completes the process
        const isVendorDone = role === "VENDOR" ? true : order.vendorConfirmedDelivery;
        const isCustomerDone = role === "CUSTOMER" ? true : order.customerConfirmedDelivery;

        if (isVendorDone && isCustomerDone) {
            updateData.status = "DELIVERED";
            updateData.deliveredAt = new Date();
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: updateData,
        });

        revalidatePath("/dashboard/orders");
        revalidatePath(`/[slug]/track/${orderId}`, 'page');
        return { order: updatedOrder };
    } catch (error) {
        console.error("CONFIRM_DELIVERY_ERROR", error);
        return { error: "Failed to confirm delivery" };
    }
}

export async function reportDispute(orderId: string, reason: string) {
    try {
        const order = await prisma.order.update({
            where: { id: orderId },
            data: { 
                isDisputed: true,
                disputeReason: reason,
            },
        });

        revalidatePath(`/dashboard/orders`);
        return { success: true, order };
    } catch (error) {
        console.error("REPORT_DISPUTE_ERROR", error);
        return { error: "An error occurred while reporting the dispute. Please contact support." };
    }
}
