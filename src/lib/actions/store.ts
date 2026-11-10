"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { createPaystackSubaccount } from "@/lib/paystack";
import { requireOwnedStoreById, requireStore } from "@/server/auth";
import { fromKobo, percentToBps, toKobo } from "@/domain/money";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { logger, errorInfo } from "@/lib/logger";

// Top-level path segments owned by the app; a store slug must never shadow them.
const RESERVED_SLUGS = new Set(["dashboard", "setup", "sign-in", "sign-up", "api", "_next", "admin", "login", "logout", "static", "public", "favicon", "robots", "sitemap"]);
const slugSchema = z.string().trim().toLowerCase().min(3).max(40)
    .transform((s) => s.replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""))
    .refine((s) => s.length >= 3, "Link must be at least 3 letters or numbers")
    .refine((s) => !RESERVED_SLUGS.has(s), "That link is reserved. Please choose another.");

export async function createStore(formData: FormData) {
    const { userId } = await auth();
    if (!userId) return { error: "Unauthorized" };
    const parsed = z.object({ name: z.string().trim().min(2).max(80), slug: slugSchema }).safeParse({ name: formData.get("name"), slug: formData.get("slug") });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Name and Link are required" };

    if (await prisma.store.findUnique({ where: { vendorId: userId }, select: { id: true } })) return { error: "You already have a store." };
    try {
        const store = await prisma.store.create({ data: { name: parsed.data.name, slug: parsed.data.slug, vendorId: userId, primaryColor: "#4f46e6" } });
        return { store };
    } catch (err: unknown) {
        if (typeof err === "object" && err && "code" in err && (err as { code: string }).code === "P2002") return { error: "This store link is already taken." };
        logger.error("store.create_failed", errorInfo(err));
        return { error: "Could not create store." };
    }
}

const feeField = z.coerce.number().min(0).max(1_000_000);
const storeUpdateSchema = z.object({
    name: z.string().trim().min(2).max(80),
    description: z.string().trim().max(500).optional().transform((v) => v || null),
    announcement: z.string().trim().max(200).optional().transform((v) => v || null),
    logoUrl: z.string().url().max(500).refine((u) => u.startsWith("https://")).nullish().or(z.literal("")).transform((v) => v || null),
    primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a valid colour"),
    mainlandDeliveryFee: feeField, islandDeliveryFee: feeField,
    phoneNumber: z.string().trim().max(20).optional().transform((v) => v || null),
    lowStockThreshold: z.coerce.number().int().min(0).max(100000).default(5),
});

export async function updateStore(storeId: string, formData: FormData) {
    const owned = await requireOwnedStoreById(storeId);
    if (!owned.ok) return { error: owned.error };
    const parsed = storeUpdateSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid store details" };
    const d = parsed.data;
    try {
        const store = await prisma.store.update({
            where: { id: owned.store.id },
            data: { ...d, mainlandDeliveryFee: fromKobo(toKobo(d.mainlandDeliveryFee)), islandDeliveryFee: fromKobo(toKobo(d.islandDeliveryFee)) },
        });
        revalidatePath("/dashboard/settings");
        revalidatePath(`/${store.slug}`);
        return { store };
    } catch (err) {
        logger.error("store.update_failed", errorInfo(err));
        return { error: "Could not update store." };
    }
}

export async function updateStorePayoutDetails(formData: FormData) {
    const owned = await requireStore();
    if (!owned.ok) return { error: owned.error };
    const parsed = z.object({
        bankName: z.string().trim().min(2).max(80), bankCode: z.string().trim().min(2).max(12),
        accountNumber: z.string().regex(/^\d{10}$/, "Account number must be 10 digits"), accountName: z.string().trim().min(2).max(120),
    }).safeParse(Object.fromEntries(formData.entries()));
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "All payout details are required." };
    const h = await headers();
    if (!(await rateLimit(`payout:${owned.userId}`, 5, 60 * 60_000)).allowed || !(await rateLimit(`payout-ip:${clientIp(h)}`, 20, 60 * 60_000)).allowed) {
        return { error: "Too many attempts. Please try again later." };
    }
    const { store } = owned;
    try {
        // Platform commission comes from the store's configured rate (default 5%), as % with 2dp.
        const percentage = percentToBps(store.commissionPercentage) / 100;
        const res = await createPaystackSubaccount(store.name, parsed.data.bankCode, parsed.data.accountNumber, percentage);
        if (!res.ok) return { error: res.error || "Failed to create Paystack subaccount." };
        await prisma.store.update({
            where: { id: store.id },
            data: { bankName: parsed.data.bankName, accountNumber: parsed.data.accountNumber, accountName: parsed.data.accountName, subaccountCode: res.data.subaccount_code },
        });
        revalidatePath("/dashboard/settings");
        return { success: true };
    } catch (err) {
        logger.error("store.payout_failed", errorInfo(err));
        return { error: "Could not update payout details." };
    }
}

/** Public counters: validated id, per-IP throttled, never reveal whether a store exists. */
export async function trackConversion(storeId: string) {
    if (!/^[a-z0-9]{10,40}$/i.test(storeId)) return;
    const h = await headers();
    if (!(await rateLimit(`conv:${clientIp(h)}:${storeId}`, 5, 10 * 60_000)).allowed) return;
    try { await prisma.store.updateMany({ where: { id: storeId }, data: { conversionClicks: { increment: 1 } } }); }
    catch (err) { logger.warn("store.track_conversion_failed", errorInfo(err)); }
}

export async function trackVisit(storeId: string) {
    if (!/^[a-z0-9]{10,40}$/i.test(storeId)) return;
    const h = await headers();
    if (!(await rateLimit(`visit:${clientIp(h)}:${storeId}`, 2, 30 * 60_000)).allowed) return;
    try { await prisma.store.updateMany({ where: { id: storeId }, data: { visits: { increment: 1 } } }); }
    catch (err) { logger.warn("store.track_visit_failed", errorInfo(err)); }
}
