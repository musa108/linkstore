import { describe, expect, it } from "vitest";
import { hasDb, seedMerchant, testDb } from "../helpers";
import { createMerchantTools } from "@/server/chat/merchant-tools";

const d = describe.skipIf(!hasDb);
type Exec = (a: unknown, o: { toolCallId: string; messages: [] }) => Promise<Record<string, unknown>>;
const run = (tool: unknown, args: unknown) => (tool as { execute: Exec }).execute(args, { toolCallId: "t", messages: [] });

d("merchant assistant tools – scoping, PII minimisation, propose-don't-act", () => {
    async function setup() {
        const a = await seedMerchant(); const b = await seedMerchant(); const db = testDb();
        const mk = (storeId: string, productId: string, status: string, name = "Bola Adeyemi") => db.order.create({ data: { storeId, customerName: name, customerEmail: "bola@example.com", customerPhone: "08099998888", address: "Private address 12", deliveryArea: "MAINLAND", deliveryFee: "1500", subtotal: "10000", total: "11500", status, items: { create: { productId, quantity: 2, priceAtPurchase: "10000" } } } });
        const paidA = await mk(a.store.id, a.product.id, "PAID"); await mk(a.store.id, a.product.id, "PENDING");
        const paidB = await mk(b.store.id, b.product.id, "PAID", "Competitor Customer");
        const toolsA = createMerchantTools({ db, store: { id: a.store.id, slug: a.store.slug, lowStockThreshold: 5 } });
        return { a, b, paidA, paidB, toolsA };
    }

    it("sales_summary counts only this store's paid-type orders", async () => {
        const { toolsA } = await setup();
        const r = await run(toolsA.sales_summary, { days: 7 }) as { orders: number; revenueNaira: number; topProducts: { name: string; unitsSold: number }[] };
        expect(r.orders).toBe(1); expect(r.revenueNaira).toBe(11500); expect(r.topProducts[0]).toEqual({ name: "Ankara Dress", unitsSold: 2 });
    });
    it("list_orders never leaks other stores' orders or customer PII", async () => {
        const { toolsA, paidB } = await setup();
        const r = await run(toolsA.list_orders, { limit: 10 }) as { orders: { orderId: string }[] };
        const s = JSON.stringify(r);
        expect(r.orders.map((o) => o.orderId)).not.toContain(paidB.id);
        for (const secret of ["Competitor", "Private address", "08099998888", "bola@example.com", "Adeyemi"]) expect(s).not.toContain(secret);
        expect(s).toContain("Bola"); // first name only
    });
    it("low_stock and find_products are scoped", async () => {
        const { toolsA, b } = await setup();
        await testDb().product.update({ where: { id: b.product.id }, data: { name: "Other store secret" } });
        expect(JSON.stringify(await run(toolsA.find_products, { query: "secret" }))).not.toContain("Other store");
        const low = await run(toolsA.low_stock, {}) as { items: unknown[] };
        expect(Array.isArray(low.items)).toBe(true);
    });
    it("propose_mark_shipped only PROPOSES (no DB change), only for this store's PAID orders", async () => {
        const { toolsA, paidA, paidB } = await setup();
        const ok = await run(toolsA.propose_mark_shipped, { orderId: paidA.id }) as { proposal?: { action: string; orderId: string } };
        expect(ok.proposal).toMatchObject({ action: "MARK_SHIPPED", orderId: paidA.id });
        expect((await testDb().order.findUniqueOrThrow({ where: { id: paidA.id } })).status).toBe("PAID"); // untouched
        expect(await run(toolsA.propose_mark_shipped, { orderId: paidB.id })).toHaveProperty("error"); // other merchant's order
        const pending = await testDb().order.findFirstOrThrow({ where: { storeId: paidA.storeId, status: "PENDING" } });
        expect(await run(toolsA.propose_mark_shipped, { orderId: pending.id })).toHaveProperty("error");
    });
    it("exposes no mutating tool", async () => {
        const { toolsA } = await setup();
        expect(Object.keys(toolsA).sort()).toEqual(["find_products", "list_orders", "low_stock", "propose_mark_shipped", "sales_summary"]);
    });
});
