import { createHmac } from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { hasDb, seedMerchant, testDb } from "../helpers";
import { startCheckout } from "@/server/checkout";
import { finalizePayment } from "@/server/payments/finalize";
import { handlePaystackWebhook } from "@/server/payments/webhook";
import type { VerifiedTransaction } from "@/lib/paystack";

const d = describe.skipIf(!hasDb);
const SECRET = "sk_test_unit_secret";
const init = async (a: { reference: string }) => ({ ok: true as const, data: { authorization_url: `https://pay.test/${a.reference}`, access_code: "x", reference: a.reference } });
const verifyOk = (amount: number, over: Partial<VerifiedTransaction> = {}) => async (reference: string) => ({ ok: true as const, data: { id: 987, status: "success", reference, amount, currency: "NGN", ...over } });
const key = () => `idem_${Math.random().toString(36).slice(2, 12)}_${Date.now()}`;

async function checkout(slug: string, items: { productId: string; variantId?: string; quantity: number }[], extra: object = {}, idem = key()) {
    const r = await startCheckout({ storeSlug: slug, idempotencyKey: idem, customerName: "Ada Obi", customerEmail: "ada@example.com", customerPhone: "08012345678", address: "12 Admiralty Way, Lekki", deliveryArea: "MAINLAND", items, ...extra }, { db: testDb(), baseUrl: "https://app.test", initialize: init as never });
    return { r, idem };
}

d("checkout – server-side pricing", () => {
    it("ignores any client-supplied prices/totals and charges the DB price + delivery", async () => {
        const { store, product, variant } = await seedMerchant();
        const { r } = await checkout(store.slug, [{ productId: product.id, variantId: variant.id, quantity: 2 }], { total: 1, subtotal: 1, deliveryFee: 0, items: [{ productId: product.id, variantId: variant.id, quantity: 2, price: 1 }] });
        expect("orderId" in r).toBe(true);
        if (!("orderId" in r)) return;
        const order = await testDb().order.findUniqueOrThrow({ where: { id: r.orderId }, include: { payments: true, items: true } });
        expect(Number(order.subtotal)).toBe(20000); expect(Number(order.total)).toBe(21500); expect(Number(order.items[0]!.priceAtPurchase)).toBe(10000);
        expect(order.payments[0]).toMatchObject({ amountKobo: 2_150_000, commissionKobo: 107_500, merchantShareKobo: 2_042_500, status: "INITIALIZED", currency: "NGN" });
    });
    it("rejects another store's product, out-of-stock quantity and stores without payout setup", async () => {
        const a = await seedMerchant(); const b = await seedMerchant(); const noPayout = await seedMerchant({ subaccount: false });
        expect(((await checkout(a.store.slug, [{ productId: b.product.id, variantId: b.variant.id, quantity: 1 }])).r as { error: string }).error).toMatch(/no longer available/);
        expect(((await checkout(a.store.slug, [{ productId: a.product.id, variantId: a.variant.id, quantity: 6 }])).r as { error: string }).error).toMatch(/Only 5/);
        expect(((await checkout(noPayout.store.slug, [{ productId: noPayout.product.id, variantId: noPayout.variant.id, quantity: 1 }])).r as { error: string }).error).toMatch(/payments/);
    });
    it("is idempotent: retrying with the same key reuses ONE order and supersedes the old attempt", async () => {
        const { store, product, variant } = await seedMerchant();
        const items = [{ productId: product.id, variantId: variant.id, quantity: 1 }];
        const k = key();
        const one = await checkout(store.slug, items, {}, k); const two = await checkout(store.slug, items, {}, k);
        expect((one.r as { orderId: string }).orderId).toBe((two.r as { orderId: string }).orderId);
        const payments = await testDb().payment.findMany({ where: { orderId: (one.r as { orderId: string }).orderId }, orderBy: { createdAt: "asc" } });
        expect(payments.map((p) => p.status)).toEqual(["ABANDONED", "INITIALIZED"]);
        expect(await testDb().order.count({ where: { idempotencyKey: k } })).toBe(1);
    });
    it("does not leave a live payment when the provider definitively refuses", async () => {
        const { store, product, variant } = await seedMerchant();
        const bad = async () => ({ ok: false as const, error: "Invalid key", ambiguous: false });
        const r = await startCheckout({ storeSlug: store.slug, idempotencyKey: key(), customerName: "Ada Obi", customerEmail: "a@b.com", customerPhone: "08012345678", address: "12 Admiralty Way", deliveryArea: "ISLAND", items: [{ productId: product.id, variantId: variant.id, quantity: 1 }] }, { db: testDb(), baseUrl: "https://app.test", initialize: bad as never });
        expect(r).toHaveProperty("error");
        expect(await testDb().payment.count({ where: { order: { storeId: store.id }, status: "INITIALIZED" } })).toBe(0);
    });
});

d("finalizePayment – verified payment is the only way to PAID", () => {
    async function pending() {
        const m = await seedMerchant();
        const { r } = await checkout(m.store.slug, [{ productId: m.product.id, variantId: m.variant.id, quantity: 2 }]);
        const orderId = (r as { orderId: string }).orderId;
        const payment = await testDb().payment.findFirstOrThrow({ where: { orderId } });
        return { ...m, orderId, payment };
    }
    it("marks PAID on matching amount, decrements stock once", async () => {
        const { orderId, payment, variant } = await pending();
        const out = await finalizePayment(payment.reference, "callback", { db: testDb(), verify: verifyOk(payment.amountKobo) });
        expect(out).toMatchObject({ status: "success", alreadyApplied: false });
        expect((await testDb().order.findUniqueOrThrow({ where: { id: orderId } })).status).toBe("PAID");
        expect((await testDb().variant.findUniqueOrThrow({ where: { id: variant.id } })).stockCount).toBe(3);
    });
    it("REFUSES to mark paid when the paid amount is lower (underpayment attack)", async () => {
        const { orderId, payment } = await pending();
        const out = await finalizePayment(payment.reference, "callback", { db: testDb(), verify: verifyOk(100) });
        expect(out.status).toBe("mismatch");
        expect((await testDb().order.findUniqueOrThrow({ where: { id: orderId } })).status).toBe("PENDING");
        expect((await testDb().payment.findUniqueOrThrow({ where: { id: payment.id } })).failureReason).toBe("AMOUNT_OR_CURRENCY_MISMATCH");
    });
    it("refuses wrong currency and failed/abandoned/pending provider states", async () => {
        const { orderId, payment } = await pending();
        expect((await finalizePayment(payment.reference, "callback", { db: testDb(), verify: verifyOk(payment.amountKobo, { currency: "USD" }) })).status).toBe("mismatch");
        for (const status of ["failed", "abandoned", "ongoing"]) {
            const p = await pending();
            const o = await finalizePayment(p.payment.reference, "callback", { db: testDb(), verify: verifyOk(p.payment.amountKobo, { status }) });
            expect(o.status).toBe(status === "ongoing" ? "pending" : "failed");
            expect((await testDb().order.findUniqueOrThrow({ where: { id: p.orderId } })).status).toBe("PENDING");
        }
        expect((await testDb().order.findUniqueOrThrow({ where: { id: orderId } })).status).toBe("PENDING");
    });
    it("unknown reference → not_found; provider outage → retryable error, nothing changes", async () => {
        expect((await finalizePayment("nope", "webhook", { db: testDb(), verify: verifyOk(1) })).status).toBe("not_found");
        const { orderId, payment } = await pending();
        const down = async () => ({ ok: false as const, error: "timeout", ambiguous: true });
        expect(await finalizePayment(payment.reference, "webhook", { db: testDb(), verify: down as never })).toEqual({ status: "error", retryable: true });
        expect((await testDb().order.findUniqueOrThrow({ where: { id: orderId } })).status).toBe("PENDING");
    });
    it("is idempotent under 10 concurrent callers: stock decremented exactly once", async () => {
        const { orderId, payment, variant } = await pending();
        const deps = { db: testDb(), verify: verifyOk(payment.amountKobo) };
        const results = await Promise.all(Array.from({ length: 10 }, () => finalizePayment(payment.reference, "webhook", deps)));
        expect(results.every((r) => r.status === "success")).toBe(true);
        expect(results.filter((r) => r.status === "success" && !r.alreadyApplied)).toHaveLength(1);
        expect((await testDb().variant.findUniqueOrThrow({ where: { id: variant.id } })).stockCount).toBe(3);
        expect((await testDb().order.findUniqueOrThrow({ where: { id: orderId } })).status).toBe("PAID");
    });
    it("a late payment revives an expired (CANCELLED) order", async () => {
        const { orderId, payment } = await pending();
        await testDb().order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
        await finalizePayment(payment.reference, "reconcile", { db: testDb(), verify: verifyOk(payment.amountKobo) });
        expect((await testDb().order.findUniqueOrThrow({ where: { id: orderId } })).status).toBe("PAID");
    });
    it("records a stock conflict (but still keeps the money state correct) when stock vanished", async () => {
        const { orderId, payment, variant } = await pending();
        await testDb().variant.update({ where: { id: variant.id }, data: { stockCount: 0 } });
        await finalizePayment(payment.reference, "callback", { db: testDb(), verify: verifyOk(payment.amountKobo) });
        expect((await testDb().order.findUniqueOrThrow({ where: { id: orderId } })).status).toBe("PAID");
        expect((await testDb().variant.findUniqueOrThrow({ where: { id: variant.id } })).stockCount).toBe(0);
        expect(await testDb().paymentEvent.count({ where: { reference: payment.reference, type: "stock.conflict" } })).toBe(1);
    });
});

d("paystack webhook", () => {
    const sign = (body: string) => createHmac("sha512", SECRET).update(body).digest("hex");
    async function pending() {
        const m = await seedMerchant();
        const { r } = await checkout(m.store.slug, [{ productId: m.product.id, variantId: m.variant.id, quantity: 1 }]);
        const orderId = (r as { orderId: string }).orderId;
        return { ...m, orderId, payment: await testDb().payment.findFirstOrThrow({ where: { orderId } }) };
    }
    const evt = (event: string, reference: string, id = 111) => JSON.stringify({ event, data: { id, reference, status: "success" } });

    it("rejects forged/unsigned requests with 401 and changes nothing", async () => {
        const { orderId, payment } = await pending();
        const body = evt("charge.success", payment.reference);
        expect((await handlePaystackWebhook(body, "deadbeef", SECRET, { db: testDb(), verify: verifyOk(payment.amountKobo) })).httpStatus).toBe(401);
        expect((await handlePaystackWebhook(body, null, SECRET, { db: testDb() })).httpStatus).toBe(401);
        expect((await testDb().order.findUniqueOrThrow({ where: { id: orderId } })).status).toBe("PENDING");
    });
    it("processes charge.success once; duplicate deliveries are acknowledged without re-applying", async () => {
        const { orderId, payment, variant } = await pending();
        const body = evt("charge.success", payment.reference, 222); const deps = { db: testDb(), verify: verifyOk(payment.amountKobo) };
        expect((await handlePaystackWebhook(body, sign(body), SECRET, deps)).body.note).toBeUndefined();
        const dup = await handlePaystackWebhook(body, sign(body), SECRET, deps);
        expect(dup).toMatchObject({ httpStatus: 200, body: { note: "duplicate" } });
        expect((await testDb().variant.findUniqueOrThrow({ where: { id: variant.id } })).stockCount).toBe(4);
        expect((await testDb().order.findUniqueOrThrow({ where: { id: orderId } })).status).toBe("PAID");
        expect(await testDb().paymentEvent.count({ where: { eventKey: `charge.success:222:${payment.reference}` } })).toBe(1);
    });
    it("does not trust the payload: webhook claiming success is re-verified (underpaid → not paid)", async () => {
        const { orderId, payment } = await pending();
        const body = evt("charge.success", payment.reference, 333);
        await handlePaystackWebhook(body, sign(body), SECRET, { db: testDb(), verify: verifyOk(1) });
        expect((await testDb().order.findUniqueOrThrow({ where: { id: orderId } })).status).toBe("PENDING");
    });
    it("returns 500 (so Paystack retries) on provider outage, then recovers on redelivery", async () => {
        const { orderId, payment } = await pending();
        const body = evt("charge.success", payment.reference, 444);
        const down = async () => ({ ok: false as const, error: "boom", ambiguous: true });
        expect((await handlePaystackWebhook(body, sign(body), SECRET, { db: testDb(), verify: down as never })).httpStatus).toBe(500);
        expect((await handlePaystackWebhook(body, sign(body), SECRET, { db: testDb(), verify: verifyOk(payment.amountKobo) })).httpStatus).toBe(200);
        expect((await testDb().order.findUniqueOrThrow({ where: { id: orderId } })).status).toBe("PAID");
    });
    it("refund.processed → payment REFUNDED and order REFUNDED; unknown events are ignored", async () => {
        const { orderId, payment } = await pending();
        await finalizePayment(payment.reference, "callback", { db: testDb(), verify: verifyOk(payment.amountKobo) });
        const body = evt("refund.processed", payment.reference, 555);
        expect((await handlePaystackWebhook(body, sign(body), SECRET, { db: testDb() })).httpStatus).toBe(200);
        expect((await testDb().payment.findUniqueOrThrow({ where: { id: payment.id } })).status).toBe("REFUNDED");
        expect((await testDb().order.findUniqueOrThrow({ where: { id: orderId } })).status).toBe("REFUNDED");
        const other = JSON.stringify({ event: "transfer.success", data: { id: 1, reference: "zz" } });
        expect((await handlePaystackWebhook(other, sign(other), SECRET, { db: testDb() })).httpStatus).toBe(200);
    });
    it("malformed but correctly-signed payloads are acknowledged (no retry storm)", async () => {
        const body = "not json"; expect((await handlePaystackWebhook(body, sign(body), SECRET, { db: testDb() })).httpStatus).toBe(200);
    });
});

beforeAll(() => { vi.spyOn(console, "log").mockImplementation(() => undefined); vi.spyOn(console, "warn").mockImplementation(() => undefined); vi.spyOn(console, "error").mockImplementation(() => undefined); });
