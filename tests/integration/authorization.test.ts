import { beforeEach, describe, expect, it, vi } from "vitest";
import { hasDb, seedMerchant, testDb } from "../helpers";

const session = vi.hoisted(() => ({ userId: null as string | null }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: session.userId }) }));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": `10.0.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}` }) }));

const d = describe.skipIf(!hasDb);

d("Merchant A cannot read or modify Merchant B's resources", () => {
    beforeEach(() => { vi.spyOn(console, "error").mockImplementation(() => undefined); vi.spyOn(console, "log").mockImplementation(() => undefined); });

    async function world() {
        const a = await seedMerchant(); const b = await seedMerchant();
        const order = await testDb().order.create({ data: { storeId: b.store.id, customerName: "C", customerEmail: "c@c.com", customerPhone: "08011112222", address: "x y z addr", deliveryArea: "MAINLAND", deliveryFee: "1500", subtotal: "10000", total: "11500", status: "PAID", items: { create: { productId: b.product.id, quantity: 1, priceAtPurchase: "10000" } } } });
        return { a, b, order };
    }
    const asUser = (id: string | null) => { session.userId = id; };
    const form = (o: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.set(k, v); return f; };
    const productForm = (name = "Hacked") => form({ name, price: "1", inStock: "on", variants: "[]", media: "[]" });

    it("cannot update or delete another merchant's product", async () => {
        const { a, b } = await world(); asUser(a.store.vendorId);
        const { updateProduct, deleteProduct } = await import("@/lib/actions/product");
        expect(await updateProduct(b.product.id, productForm())).toEqual({ error: "Not found" });
        expect(await deleteProduct(b.product.id)).toEqual({ error: "Not found" });
        const still = await testDb().product.findUniqueOrThrow({ where: { id: b.product.id } });
        expect(still.name).toBe("Ankara Dress"); expect(Number(still.price)).toBe(10000);
    });
    it("cannot create products inside another merchant's store", async () => {
        const { a, b } = await world(); asUser(a.store.vendorId);
        const { createProduct } = await import("@/lib/actions/product");
        expect(await createProduct(b.store.id, productForm())).toEqual({ error: "Not found" });
        expect(await testDb().product.count({ where: { storeId: b.store.id, name: "Hacked" } })).toBe(0);
    });
    it("cannot read another merchant's revenue/analytics", async () => {
        const { a, b } = await world(); asUser(a.store.vendorId);
        const { getSalesData, getAnalyticsData } = await import("@/lib/actions/dashboard");
        await expect(getSalesData(b.store.id)).rejects.toThrow("Unauthorized");
        await expect(getAnalyticsData(b.store.id)).rejects.toThrow("Unauthorized");
    });
    it("cannot change settings of, or update orders in, another merchant's store", async () => {
        const { a, b, order } = await world(); asUser(a.store.vendorId);
        const { updateStore } = await import("@/lib/actions/store");
        const { updateOrderStatus } = await import("@/lib/actions/order");
        expect(await updateStore(b.store.id, form({ name: "Pwned", primaryColor: "#000000", mainlandDeliveryFee: "0", islandDeliveryFee: "0" }))).toEqual({ error: "Not found" });
        expect(await updateOrderStatus(order.id, "SHIPPED")).toEqual({ error: "Not found" });
        expect((await testDb().store.findUniqueOrThrow({ where: { id: b.store.id } })).name).toBe(b.store.name);
        expect((await testDb().order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PAID");
    });
    it("unauthenticated callers are rejected everywhere", async () => {
        const { b, order } = await world(); asUser(null);
        const { deleteProduct } = await import("@/lib/actions/product"); const { updateOrderStatus } = await import("@/lib/actions/order");
        expect(await deleteProduct(b.product.id)).toEqual({ error: "Unauthorized" });
        expect(await updateOrderStatus(order.id, "SHIPPED")).toEqual({ error: "Unauthorized" });
    });
    it("owner can ship a PAID order, but cannot force PAID/DELIVERED or skip states (payment bypass closed)", async () => {
        const { b, order } = await world(); asUser(b.store.vendorId);
        const { updateOrderStatus } = await import("@/lib/actions/order");
        const pending = await testDb().order.create({ data: { storeId: b.store.id, customerName: "C", customerEmail: "c@c.com", customerPhone: "08011112222", address: "x y z addr", deliveryArea: "MAINLAND", deliveryFee: "1", subtotal: "1", total: "2", status: "PENDING" } });
        expect(await updateOrderStatus(pending.id, "PAID")).toHaveProperty("error");
        expect(await updateOrderStatus(pending.id, "SHIPPED")).toHaveProperty("error");
        expect(await updateOrderStatus(order.id, "DELIVERED")).toHaveProperty("error");
        expect((await testDb().order.findUniqueOrThrow({ where: { id: pending.id } })).status).toBe("PENDING");
        expect(await updateOrderStatus(order.id, "SHIPPED")).toHaveProperty("order");
    });
    it("delivery confirmation derives role server-side: client cannot impersonate the vendor", async () => {
        const { a, b, order } = await world();
        await testDb().order.update({ where: { id: order.id }, data: { status: "SHIPPED" } });
        const { confirmOrderDelivery } = await import("@/lib/actions/order");
        asUser(a.store.vendorId); // another merchant is NOT this order's vendor → treated as customer
        await confirmOrderDelivery(order.id);
        let o = await testDb().order.findUniqueOrThrow({ where: { id: order.id } });
        expect(o).toMatchObject({ vendorConfirmedDelivery: false, customerConfirmedDelivery: true, status: "SHIPPED" });
        asUser(b.store.vendorId); await confirmOrderDelivery(order.id);
        o = await testDb().order.findUniqueOrThrow({ where: { id: order.id } });
        expect(o).toMatchObject({ vendorConfirmedDelivery: true, customerConfirmedDelivery: true, status: "DELIVERED" });
    });
    it("disputes only apply to paid orders, once; reviews only for delivered orders containing the product", async () => {
        const { b, order } = await world();
        const { reportDispute } = await import("@/lib/actions/order"); const { submitReview } = await import("@/lib/actions/review");
        const unpaid = await testDb().order.create({ data: { storeId: b.store.id, customerName: "C", customerEmail: "c@c.com", customerPhone: "08011112222", address: "x y z addr", deliveryArea: "MAINLAND", deliveryFee: "1", subtotal: "1", total: "2", status: "PENDING" } });
        expect(await reportDispute(unpaid.id, "fake")).toHaveProperty("error");
        expect(await reportDispute(order.id, "Item never arrived")).toEqual({ success: true });
        expect(await reportDispute(order.id, "again")).toHaveProperty("error");
        expect(await submitReview(form({ orderId: order.id, productId: b.product.id, rating: "5" }))).toHaveProperty("error"); // PAID, not DELIVERED
        await testDb().order.update({ where: { id: order.id }, data: { status: "DELIVERED" } });
        expect(await submitReview(form({ orderId: order.id, productId: "someoneelsesproduct1", rating: "5" }))).toHaveProperty("error");
        expect(await submitReview(form({ orderId: order.id, productId: b.product.id, rating: "9" }))).toHaveProperty("error");
        expect(await submitReview(form({ orderId: order.id, productId: b.product.id, rating: "5", comment: "Great" }))).toHaveProperty("success");
        expect(await submitReview(form({ orderId: order.id, productId: b.product.id, rating: "1" }))).toHaveProperty("error"); // duplicate
    });
    it("reserved slugs are refused", async () => {
        asUser("user_new_reserved");
        const { createStore } = await import("@/lib/actions/store");
        expect(await createStore(form({ name: "My Shop", slug: "dashboard" }))).toHaveProperty("error");
        expect(await createStore(form({ name: "My Shop", slug: "API" }))).toHaveProperty("error");
    });
});
