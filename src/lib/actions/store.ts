"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { createPaystackSubaccount } from "@/lib/paystack";
import { revalidatePath } from "next/cache";

export async function createStore(formData: FormData) {
    const { userId } = await auth();

    if (!userId) {
        return { error: "Unauthorized" };
    }

    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;

    if (!name || !slug) {
        return { error: "Name and Link are required" };
    }

    try {
        const store = await prisma.store.create({
            data: {
                name,
                slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                vendorId: userId,
                primaryColor: "#4f46e6", // Default color
            },
        });

        return { store };
    } catch (error: any) {
        console.error("CREATE_STORE_ERROR", error);
        if (error.code === "P2002") {
            return { error: "This store link is already taken." };
        }
        return { error: "Could not create store." };
    }
}

export async function updateStore(storeId: string, formData: FormData) {
    const { userId } = await auth();
    if (!userId) {
        return { error: "Unauthorized" };
    }

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const announcement = formData.get("announcement") as string;
    const logoUrl = formData.get("logoUrl") as string;
    const primaryColor = formData.get("primaryColor") as string;
    const mainlandDeliveryFee = formData.get("mainlandDeliveryFee") as string;
    const islandDeliveryFee = formData.get("islandDeliveryFee") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const lowStockThreshold = formData.get("lowStockThreshold") as string;

    try {
        const store = await prisma.store.update({
            where: { id: storeId, vendorId: userId },
            data: {
                name,
                description,
                announcement,
                logoUrl,
                primaryColor,
                mainlandDeliveryFee: Number(mainlandDeliveryFee),
                islandDeliveryFee: Number(islandDeliveryFee),
                phoneNumber,
                lowStockThreshold: parseInt(lowStockThreshold) || 5,
            },
        });

        revalidatePath("/dashboard/settings");
        revalidatePath(`/${store.slug}`);
        return { store };
    } catch (error) {
        console.error("UPDATE_STORE_ERROR", error);
        return { error: "Could not update store." };
    }
}

export async function updateStorePayoutDetails(formData: FormData) {
    const { userId } = await auth();
    if (!userId) {
        return { error: "Unauthorized" };
    }

    const bankName = formData.get("bankName") as string;
    const accountNumber = formData.get("accountNumber") as string;
    const accountName = formData.get("accountName") as string;
    const bankCode = formData.get("bankCode") as string;

    if (!bankName || !accountNumber || !accountName || !bankCode) {
        return { error: "All payout details are required." };
    }

    try {
        const store = await prisma.store.findUnique({
            where: { vendorId: userId },
        });

        if (!store) {
            return { error: "Store not found." };
        }

        // Create subaccount on Paystack
        // Using a default 5% commission for the developer
        const paystackResponse = await createPaystackSubaccount(
            store.name,
            bankCode,
            accountNumber,
            5.0 
        );

        if (!paystackResponse.status) {
            console.error("PAYSTACK_SUBACCOUNT_ERROR", paystackResponse.message);
            return { error: paystackResponse.message || "Failed to create Paystack subaccount." };
        }

        // Save subaccount details to the database
        await prisma.store.update({
            where: { id: store.id },
            data: {
                bankName,
                accountNumber,
                accountName,
                subaccountCode: paystackResponse.data.subaccount_code,
            },
        });

        revalidatePath("/dashboard/settings");
        return { success: true };
    } catch (error) {
        console.error("UPDATE_PAYOUT_DETAILS_ERROR", error);
        return { error: "Could not update payout details." };
    }
}

export async function trackConversion(storeId: string) {
    try {
        await prisma.store.update({
            where: { id: storeId },
            data: {
                conversionClicks: {
                    increment: 1,
                },
            },
        });
    } catch (error) {
        console.error("TRACK_CONVERSION_ERROR", error);
    }
}

export async function trackVisit(storeId: string) {
    try {
        await prisma.store.update({
            where: { id: storeId },
            data: {
                visits: {
                    increment: 1,
                },
            },
        });
    } catch (error) {
        console.error("TRACK_VISIT_ERROR", error);
    }
}
