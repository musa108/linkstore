import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

/**
 * Authorisation helpers. EVERY merchant mutation/read must go through one of these –
 * "is signed in" is never sufficient; the resource must belong to the caller's store.
 * All return a discriminated result so callers cannot forget to handle denial.
 */
export type Denied = { ok: false; error: string };
const UNAUTHORIZED: Denied = { ok: false, error: "Unauthorized" };
// Same message for "missing" and "not yours" – avoids confirming other merchants' ids exist.
const NOT_FOUND: Denied = { ok: false, error: "Not found" };

export async function currentUserId(): Promise<string | null> {
    const { userId } = await auth();
    return userId ?? null;
}

export async function requireStore() {
    const userId = await currentUserId();
    if (!userId) return UNAUTHORIZED;
    const store = await prisma.store.findUnique({ where: { vendorId: userId } });
    if (!store) return { ok: false as const, error: "Store not found" };
    return { ok: true as const, userId, store };
}

export async function requireOwnedStoreById(storeId: string) {
    const userId = await currentUserId();
    if (!userId) return UNAUTHORIZED;
    const store = await prisma.store.findFirst({ where: { id: storeId, vendorId: userId } });
    if (!store) return NOT_FOUND;
    return { ok: true as const, userId, store };
}

export async function requireOwnedProduct(productId: string) {
    const userId = await currentUserId();
    if (!userId) return UNAUTHORIZED;
    const product = await prisma.product.findFirst({ where: { id: productId, store: { vendorId: userId } } });
    if (!product) return NOT_FOUND;
    return { ok: true as const, userId, product };
}

export async function requireOwnedOrder(orderId: string) {
    const userId = await currentUserId();
    if (!userId) return UNAUTHORIZED;
    const order = await prisma.order.findFirst({ where: { id: orderId, store: { vendorId: userId } } });
    if (!order) return NOT_FOUND;
    return { ok: true as const, userId, order };
}

/** Platform admins are Clerk user ids listed in ADMIN_USER_IDS (comma separated). Empty ⇒ nobody is admin. */
export function isAdminUserId(userId: string | null | undefined, list = process.env.ADMIN_USER_IDS): boolean {
    if (!userId || !list) return false;
    return list.split(",").map((x) => x.trim()).filter(Boolean).includes(userId);
}

export async function requireAdmin() {
    const userId = await currentUserId();
    if (!userId) return UNAUTHORIZED;
    if (!isAdminUserId(userId)) return NOT_FOUND; // do not reveal that an admin area exists
    return { ok: true as const, userId };
}
