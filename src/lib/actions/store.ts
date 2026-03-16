"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createStore(formData: FormData) {
    const { userId } = await auth();

    if (!userId) {
        return { error: "Unauthorized" };
    }

    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;

    if (!name || !slug) {
        return { error: "Name and slug are required" };
    }

    // Basic slug validation (lowercased, no spaces)
    const formattedSlug = slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    try {
        // Check if slug is already taken
        const existingStore = await prisma.store.findUnique({
            where: { slug: formattedSlug }
        });

        if (existingStore) {
            return { error: "This store link is already taken. Try another." };
        }

        const store = await prisma.store.create({
            data: {
                vendorId: userId,
                name,
                slug: formattedSlug,
            }
        });

        revalidatePath("/dashboard");
        return { store };
    } catch (error) {
        console.error("CREATE_STORE_ERROR", error);
        return { error: "Could not create store. Please try again." };
    }
}

export async function updateStore(storeId: string, formData: FormData) {
    const { userId } = await auth();

    if (!userId) {
        return { error: "Unauthorized" };
    }

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const islandDeliveryFee = formData.get("islandDeliveryFee") as string;
    const mainlandDeliveryFee = formData.get("mainlandDeliveryFee") as string;
    const logoUrl = formData.get("logoUrl") as string;
    const primaryColor = formData.get("primaryColor") as string;
    const announcement = formData.get("announcement") as string;

    try {
        const store = await prisma.store.update({
            where: { id: storeId, vendorId: userId },
            data: {
                name,
                description,
                islandDeliveryFee: Number(islandDeliveryFee),
                mainlandDeliveryFee: Number(mainlandDeliveryFee),
                logoUrl,
                primaryColor,
                announcement,
            },
        });

        revalidatePath("/dashboard/settings");
        revalidatePath("/dashboard");
        return { store };
    } catch (error) {
        console.error("UPDATE_STORE_ERROR", error);
        return { error: "Could not update settings." };
    }
}

export async function trackConversion(storeId: string) {
    try {
        await prisma.store.update({
            where: { id: storeId },
            data: { conversionClicks: { increment: 1 } }
        });
        return { success: true };
    } catch (error) {
        console.error("TRACK_CONVERSION_ERROR", error);
        return { error: "Failed to track conversion" };
    }
}
