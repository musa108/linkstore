import { describe, expect, it } from "vitest";
import { hasDb, seedMerchant, testDb } from "../helpers";
import { runMaintenance } from "@/server/maintenance";
import { vi } from "vitest";

const d = describe.skipIf(!hasDb);
d("maintenance job", () => {
    it("reconciles missed webhooks, expires stale attempts, cancels orders, prunes old chats", async () => {
        vi.spyOn(console, "log").mockImplementation(() => undefined);
        const m = await seedMerchant(); const db = testDb();
        const mk = async (ageMin: number) => {
            const o = await db.order.create({ data: { storeId: m.store.id, customerName: "C", customerEmail: "c@c.com", customerPhone: "08011112222", address: "x y z addr", deliveryArea: "MAINLAND", deliveryFee: "1", subtotal: "1", total: "1500", status: "PENDING", createdAt: new Date(Date.now() - ageMin * 60_000), items: { create: { productId: m.product.id, variantId: m.variant.id, quantity: 1, priceAtPurchase: "1500" } } } });
            const p = await db.payment.create({ data: { orderId: o.id, reference: `r_${o.id}`, amountKobo: 150000, commissionBps: 500, commissionKobo: 7500, merchantShareKobo: 142500, createdAt: new Date(Date.now() - ageMin * 60_000) } });
            return { o, p };
        };
        const missedWebhook = await mk(30); const stale = await mk(25 * 60); const fresh = await mk(2);
        const verify = async (ref: string) => ref === missedWebhook.p.reference
            ? { ok: true as const, data: { id: 1, status: "success", reference: ref, amount: 150000, currency: "NGN" } }
            : { ok: false as const, error: "Transaction reference not found", ambiguous: false };
        const oldChat = await db.chatConversation.create({ data: { storeId: m.store.id, sessionId: "old-session-1", updatedAt: new Date(Date.now() - 40 * 86_400_000) } });
        await db.$executeRaw`UPDATE "ChatConversation" SET "updatedAt" = now() - interval '40 days' WHERE id = ${oldChat.id}`;

        const res = await runMaintenance({ db, verify: verify as never });
        expect(res.reconciled).toBe(1);
        expect((await db.order.findUniqueOrThrow({ where: { id: missedWebhook.o.id } })).status).toBe("PAID");
        expect((await db.payment.findUniqueOrThrow({ where: { id: stale.p.id } })).status).toBe("ABANDONED");
        expect((await db.order.findUniqueOrThrow({ where: { id: stale.o.id } })).status).toBe("CANCELLED");
        expect((await db.order.findUniqueOrThrow({ where: { id: fresh.o.id } })).status).toBe("PENDING");
        expect(await db.chatConversation.findUnique({ where: { id: oldChat.id } })).toBeNull();
    });
});
