import { beforeEach, describe, expect, it, vi } from "vitest";
import { hasDb, seedMerchant, testDb } from "../helpers";
import { requestRefund, decideRefund } from "@/server/payments/refunds";
import { compareSettlements, reconcileLedger } from "@/server/reconciliation";
import { isAdminUserId } from "@/server/auth";
import { finalizePayment } from "@/server/payments/finalize";
import { handlePaystackWebhook } from "@/server/payments/webhook";
import { createHmac } from "node:crypto";

const d = describe.skipIf(!hasDb);
const SECRET = "sk_test_unit_secret";

async function paidOrder(over: { orderTotal?: string; amountKobo?: number } = {}) {
    const m = await seedMerchant(); const db = testDb();
    const order = await db.order.create({ data: { storeId: m.store.id, customerName: "C", customerEmail: "c@c.com", customerPhone: "08011112222", address: "x y z addr", deliveryArea: "MAINLAND", deliveryFee: "1500", subtotal: "10000", total: over.orderTotal ?? "11500", status: "PENDING", items: { create: { productId: m.product.id, variantId: m.variant.id, quantity: 1, priceAtPurchase: "10000" } } } });
    const amountKobo = over.amountKobo ?? 1_150_000;
    const payment = await db.payment.create({ data: { orderId: order.id, reference: `r_${order.id}`, amountKobo, commissionBps: 500, commissionKobo: Math.round(amountKobo * 0.05), merchantShareKobo: amountKobo - Math.round(amountKobo * 0.05) } });
    await finalizePayment(payment.reference, "callback", { db, verify: async (ref: string) => ({ ok: true as const, data: { id: 9, status: "success", reference: ref, amount: amountKobo, currency: "NGN" } }) });
    return { ...m, order, payment };
}
const okRefund = (status = "pending") => async () => ({ ok: true as const, data: { id: 4242, status } });

beforeEach(() => { vi.spyOn(console, "log").mockImplementation(() => undefined); vi.spyOn(console, "warn").mockImplementation(() => undefined); vi.spyOn(console, "error").mockImplementation(() => undefined); });

d("refund workflow", () => {
    it("merchant requests → admin approves → provider called with exact kobo → webhook completes → payment+order REFUNDED", async () => {
        const { order, payment } = await paidOrder(); const db = testDb();
        const req = await requestRefund({ orderId: order.id, requestedBy: "merchant_1", reason: "Customer returned item" }, { db });
        expect(req.ok).toBe(true); if (!req.ok) return;
        const create = vi.fn(okRefund("pending"));
        const dec = await decideRefund({ refundId: req.refundId, adminId: "admin_1", approve: true }, { db, createRefund: create as never });
        expect(dec).toEqual({ ok: true, status: "PROCESSING" });
        expect(create).toHaveBeenCalledWith({ reference: payment.reference, amountKobo: 1_150_000 });
        expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PAID"); // not refunded until provider confirms

        const body = JSON.stringify({ event: "refund.processed", data: { id: 4242, transaction_reference: payment.reference, amount: 1_150_000 } });
        const sig = createHmac("sha512", SECRET).update(body).digest("hex");
        expect((await handlePaystackWebhook(body, sig, SECRET, { db })).httpStatus).toBe(200);
        expect((await db.refund.findUniqueOrThrow({ where: { id: req.refundId } })).status).toBe("PROCESSED");
        expect((await db.payment.findUniqueOrThrow({ where: { id: payment.id } })).status).toBe("REFUNDED");
        expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("REFUNDED");
        // duplicate delivery is a no-op
        expect((await handlePaystackWebhook(body, sig, SECRET, { db })).body.note).toBe("duplicate");
    });
    it("partial refund leaves order paid; cannot exceed what remains; only one open request at a time", async () => {
        const { order, payment } = await paidOrder(); const db = testDb();
        expect((await requestRefund({ orderId: order.id, requestedBy: "m", reason: "Too much", amountKobo: 2_000_000 }, { db }))).toMatchObject({ ok: false });
        const a = await requestRefund({ orderId: order.id, requestedBy: "m", reason: "Damaged item", amountKobo: 300_000 }, { db });
        expect(await requestRefund({ orderId: order.id, requestedBy: "m", reason: "Second request" }, { db })).toMatchObject({ ok: false, error: expect.stringMatching(/already in progress/) });
        if (!a.ok) throw new Error("setup");
        await decideRefund({ refundId: a.refundId, adminId: "admin", approve: true }, { db, createRefund: okRefund("processed") as never });
        expect((await db.refund.findUniqueOrThrow({ where: { id: a.refundId } })).status).toBe("PROCESSED");
        expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PAID");
        expect((await db.payment.findUniqueOrThrow({ where: { id: payment.id } })).status).toBe("SUCCESS");
        expect(await requestRefund({ orderId: order.id, requestedBy: "m", reason: "Remaining part", amountKobo: 900_000 }, { db })).toMatchObject({ ok: false }); // only 850,000 left
        expect(await requestRefund({ orderId: order.id, requestedBy: "m", reason: "Remaining part", amountKobo: 850_000 }, { db })).toMatchObject({ ok: true });
    });
    it("rejects unpaid orders; concurrent approvals call the provider exactly once", async () => {
        const m = await seedMerchant(); const db = testDb();
        const unpaid = await db.order.create({ data: { storeId: m.store.id, customerName: "C", customerEmail: "c@c.com", customerPhone: "08011112222", address: "x y z addr", deliveryArea: "MAINLAND", deliveryFee: "1", subtotal: "1", total: "2", status: "PENDING" } });
        expect(await requestRefund({ orderId: unpaid.id, requestedBy: "m", reason: "Nothing paid" }, { db })).toMatchObject({ ok: false });

        const { order } = await paidOrder();
        const r = await requestRefund({ orderId: order.id, requestedBy: "m", reason: "Customer changed mind" }, { db }); if (!r.ok) throw new Error("setup");
        const create = vi.fn(okRefund("pending"));
        const results = await Promise.all([1, 2, 3, 4].map((i) => decideRefund({ refundId: r.refundId, adminId: `admin_${i}`, approve: true }, { db, createRefund: create as never })));
        expect(create).toHaveBeenCalledTimes(1);
        expect(results.filter((x) => x.ok)).toHaveLength(1);
    });
    it("definite provider refusal → FAILED; timeout → stays APPROVED with a 'verify before retrying' warning; reject works", async () => {
        const { order } = await paidOrder(); const db = testDb();
        const r1 = await requestRefund({ orderId: order.id, requestedBy: "m", reason: "Customer changed mind" }, { db }); if (!r1.ok) throw new Error();
        await decideRefund({ refundId: r1.refundId, adminId: "a", approve: true }, { db, createRefund: (async () => ({ ok: false, error: "insufficient balance", ambiguous: false })) as never });
        expect((await db.refund.findUniqueOrThrow({ where: { id: r1.refundId } })).status).toBe("FAILED");

        const r2 = await requestRefund({ orderId: order.id, requestedBy: "m", reason: "Try again please" }, { db }); if (!r2.ok) throw new Error();
        await decideRefund({ refundId: r2.refundId, adminId: "a", approve: true }, { db, createRefund: (async () => ({ ok: false, error: "timeout", ambiguous: true })) as never });
        const amb = await db.refund.findUniqueOrThrow({ where: { id: r2.refundId } });
        expect(amb.status).toBe("APPROVED"); expect(amb.failureReason).toMatch(/BEFORE retrying/);

        const { order: o2 } = await paidOrder();
        const r3 = await requestRefund({ orderId: o2.id, requestedBy: "m", reason: "Not needed now" }, { db }); if (!r3.ok) throw new Error();
        expect(await decideRefund({ refundId: r3.refundId, adminId: "a", approve: false }, { db })).toEqual({ ok: true, status: "REJECTED" });
        expect(await decideRefund({ refundId: r3.refundId, adminId: "a", approve: true }, { db, createRefund: okRefund() as never })).toMatchObject({ ok: false });
    });
    it("admin gate: only ids in ADMIN_USER_IDS; empty list ⇒ nobody", () => {
        expect(isAdminUserId("u1", "u1, u2")).toBe(true); expect(isAdminUserId("u3", "u1,u2")).toBe(false);
        expect(isAdminUserId("u1", "")).toBe(false); expect(isAdminUserId("u1", undefined)).toBe(false); expect(isAdminUserId(null, "u1")).toBe(false);
    });
});

d("ledger reconciliation", () => {
    it("is clean for a healthy paid order", async () => {
        const { order } = await paidOrder();
        const f = await reconcileLedger(testDb());
        expect(f.filter((x) => x.orderId === order.id)).toEqual([]);
    });
    it("flags order/payment total mismatch, paid-without-payment, double payments and success-but-unpaid", async () => {
        const db = testDb();
        const mismatch = await paidOrder({ orderTotal: "9999" });                       // order total ≠ payment amount
        const m = await seedMerchant();
        const orphan = await db.order.create({ data: { storeId: m.store.id, customerName: "C", customerEmail: "c@c.com", customerPhone: "08011112222", address: "x y z addr", deliveryArea: "MAINLAND", deliveryFee: "1", subtotal: "1", total: "2", status: "PAID" } });
        const double = await paidOrder();
        await db.payment.create({ data: { orderId: double.order.id, reference: `dup_${double.order.id}`, amountKobo: 1_150_000, commissionBps: 500, commissionKobo: 57_500, merchantShareKobo: 1_092_500, status: "SUCCESS", paidAt: new Date() } });
        const unpaid = await paidOrder(); await db.order.update({ where: { id: unpaid.order.id }, data: { status: "PENDING" } });
        const f = await reconcileLedger(db); const codes = (id: string) => f.filter((x) => x.orderId === id).map((x) => x.code);
        expect(codes(mismatch.order.id)).toContain("TOTAL_MISMATCH");
        expect(codes(orphan.id)).toContain("ORDER_PAID_WITHOUT_PAYMENT");
        expect(codes(double.order.id)).toContain("MULTIPLE_SUCCESSFUL_PAYMENTS");
        expect(codes(unpaid.order.id)).toContain("PAYMENT_SUCCESS_ORDER_NOT_PAID");
    });
});

d("settlement comparison (provider adapter mocked – live field names unverified)", () => {
    it("computes expected merchant share (net of refunds), compares with provider totals, and degrades to UNAVAILABLE", async () => {
        const { store, payment } = await paidOrder(); const db = testDb();
        const win = { from: new Date(Date.now() - 86_400_000), to: new Date(Date.now() + 86_400_000) };
        const expected = payment.merchantShareKobo;
        const matched = await compareSettlements(win, { db, list: async () => ({ ok: true, data: [{ status: "success", total_processed: expected }] }) });
        expect(matched.find((r) => r.storeId === store.id)).toMatchObject({ expectedKobo: expected, settledKobo: expected, deltaKobo: 0, status: "MATCHED" });
        const delta = await compareSettlements(win, { db, list: async () => ({ ok: true, data: [{ status: "success", total_processed: expected - 50_000 }, { status: "pending", total_processed: 1 }] }) });
        expect(delta.find((r) => r.storeId === store.id)).toMatchObject({ deltaKobo: -50_000, status: "DELTA", note: expect.stringMatching(/not yet settled/) });
        const down = await compareSettlements(win, { db, list: async () => ({ ok: false, error: "network" }) });
        expect(down.find((r) => r.storeId === store.id)?.status).toBe("UNAVAILABLE");
    });
});
