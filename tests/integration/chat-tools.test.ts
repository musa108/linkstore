import { beforeEach, describe, expect, it } from "vitest";
import { hasDb, seedMerchant, testDb } from "../helpers";
import { createShopperTools } from "@/server/chat/tools";
import { _resetRateLimitsForTests } from "@/lib/rate-limit";

const d = describe.skipIf(!hasDb);
type Exec = (a: unknown, o: { toolCallId: string; messages: [] }) => Promise<Record<string, unknown>>;
const run = (tool: unknown, args: unknown) => (tool as { execute: Exec }).execute(args, { toolCallId: "t", messages: [] });

d("chatbot tools – tenant isolation & order privacy (eval suite)", () => {
    beforeEach(async () => { await _resetRateLimitsForTests(); });
    async function setup() {
        const a = await seedMerchant(); const b = await seedMerchant();
        await testDb().product.update({ where: { id: b.product.id }, data: { name: "Secret Competitor Gown" } });
        const order = await testDb().order.create({ data: { storeId: b.store.id, customerName: "Bola", customerEmail: "bola@example.com", customerPhone: "+2348099998888", address: "Private address 1", deliveryArea: "ISLAND", deliveryFee: "2500", subtotal: "10000", total: "12500", status: "PAID", items: { create: { productId: b.product.id, quantity: 1, priceAtPurchase: "10000" } } } });
        const toolsA = createShopperTools({ db: testDb(), store: a.store, clientKey: "ip-a" });
        const toolsB = createShopperTools({ db: testDb(), store: b.store, clientKey: "ip-b" });
        return { a, b, order, toolsA, toolsB };
    }

    it("product search is scoped to the active store only", async () => {
        const { toolsA, toolsB } = await setup();
        const fromA = await run(toolsA.search_products, { query: "Gown", limit: 6 }) as { count: number };
        expect(fromA.count).toBe(0);
        const fromB = await run(toolsB.search_products, { query: "Gown", limit: 6 }) as { count: number; products: { name: string }[] };
        expect(fromB.products[0]!.name).toBe("Secret Competitor Gown");
    });
    it("search hides out-of-stock products, honours max price, reports per-option availability (no raw stock)", async () => {
        const { a, toolsA } = await setup();
        await testDb().product.create({ data: { storeId: a.store.id, name: "Gone Bag", price: "500", inStock: false } });
        const cheap = await run(toolsA.search_products, { maxPriceNaira: 9000, limit: 6 }) as { products: unknown[] };
        expect(cheap.products).toHaveLength(0);
        const all = await run(toolsA.search_products, { limit: 6 }) as { products: { name: string; options: Record<string, unknown>[] }[] };
        expect(all.products.map((p) => p.name)).toEqual(["Ankara Dress"]);
        expect(all.products[0]!.options[0]).toMatchObject({ available: true }); expect(JSON.stringify(all)).not.toContain("stockCount");
    });
    it("cannot look up another store's order even with the right id + email", async () => {
        const { order, toolsA } = await setup();
        const r = await run(toolsA.get_order_status, { orderId: order.id, verification: "bola@example.com" });
        expect(r).toHaveProperty("error"); expect(JSON.stringify(r)).not.toContain("Private address");
    });
    it("order lookup needs the right verification; failure is identical for 'not found' and 'wrong details'", async () => {
        const { order, toolsB } = await setup();
        const wrong = await run(toolsB.get_order_status, { orderId: order.id, verification: "attacker@evil.com" });
        const missing = await run(toolsB.get_order_status, { orderId: "doesnotexist123", verification: "bola@example.com" });
        expect(wrong).toEqual(missing);
        for (const bad of ["....", "     ", "0809"]) expect(await run(toolsB.get_order_status, { orderId: order.id, verification: bad })).toHaveProperty("error");
    });
    it("correct id + email OR phone returns minimal data (no address/phone/email)", async () => {
        const { order, toolsB } = await setup();
        for (const v of ["BOLA@example.com", "08099998888"]) {
            const r = await run(toolsB.get_order_status, { orderId: order.id, verification: v }) as { status: string; isPaid: boolean };
            expect(r).toMatchObject({ status: "PAID", isPaid: true });
            const s = JSON.stringify(r); expect(s).not.toContain("Private address"); expect(s).not.toContain("8099998888"); expect(s).not.toContain("bola@");
        }
    });
    it("brute-forcing verification is rate limited per order", async () => {
        const { order, toolsB } = await setup(); let blocked = false;
        for (let i = 0; i < 7; i++) {
            const r = await run(toolsB.get_order_status, { orderId: order.id, verification: `guess${i}@x.com` }) as { error?: string };
            if (r.error?.includes("Too many")) blocked = true;
        }
        expect(blocked).toBe(true);
        // …and even the correct answer is now refused until the window passes
        expect(await run(toolsB.get_order_status, { orderId: order.id, verification: "bola@example.com" })).toHaveProperty("error");
    });
    it("store info exposes only public fields", async () => {
        const { toolsA } = await setup();
        const s = JSON.stringify(await run(toolsA.get_store_info, {}));
        for (const secret of ["vendorId", "accountNumber", "subaccount", "ACCT_", "commission"]) expect(s).not.toContain(secret);
    });
    it("tools are read-only: no tool can mutate orders, stock or prices", async () => {
        const { order, b, toolsB } = await setup();
        const before = await testDb().variant.findUniqueOrThrow({ where: { id: b.variant.id } });
        await run(toolsB.search_products, { query: "'; DROP TABLE \"Order\"; --", limit: 6 });
        await run(toolsB.get_order_status, { orderId: order.id, verification: "bola@example.com" });
        expect(await testDb().order.count()).toBeGreaterThan(0);
        expect((await testDb().variant.findUniqueOrThrow({ where: { id: b.variant.id } })).stockCount).toBe(before.stockCount);
        expect(Object.keys(toolsB).sort()).toEqual(["checkout_link", "get_order_status", "get_store_info", "search_products"]);
    });
});

d("global (database-backed) rate limiter", () => {
    it("is shared state: limit holds across 'instances', and recovers after the window", async () => {
        const { rateLimit } = await import("@/lib/rate-limit");
        await _resetRateLimitsForTests();
        const results = await Promise.all(Array.from({ length: 12 }, () => rateLimit("global-test", 5, 60_000)));
        expect(results.filter((r) => r.allowed)).toHaveLength(5);   // exactly 5 allowed under concurrency
        expect(results.every((r) => r.retryAfterSec >= 1 && r.retryAfterSec <= 60)).toBe(true);
        // Prove the DATABASE path was used (not the silent in-memory fallback):
        const row = await testDb().rateLimitBucket.findUnique({ where: { key: "global-test" } });
        expect(row?.count).toBe(12);
        await testDb().$executeRaw`UPDATE "RateLimitBucket" SET "resetAt" = now() - interval '1 second' WHERE key = 'global-test'`;
        expect((await rateLimit("global-test", 5, 60_000)).allowed).toBe(true);
    });
});

d("checkout handoff tool", () => {
    it("only links to this store's checkout and never claims to take payment", async () => {
        const { toolsA, a } = await (async () => { const a = await seedMerchant(); return { a, toolsA: createShopperTools({ db: testDb(), store: a.store, clientKey: "ip-x" }) }; })();
        const r = await run(toolsA.checkout_link, {}) as { checkoutUrl: string; note: string };
        expect(r.checkoutUrl).toBe(`/${a.store.slug}/checkout`);
        expect(r.note).toMatch(/Payment happens on Paystack/);
    });
});
