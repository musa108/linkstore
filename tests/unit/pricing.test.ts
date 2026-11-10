import { describe, expect, it } from "vitest";
import { priceOrder, type CatalogProduct } from "@/domain/pricing";

const catalog: CatalogProduct[] = [
    { id: "p1", storeId: "s1", name: "Dress", price: "10000.00", inStock: true, variants: [{ id: "v1", name: "M", price: null, stockCount: 3 }, { id: "v2", name: "L", price: "12000.00", stockCount: 0 }] },
    { id: "p2", storeId: "s1", name: "Bag", price: "5500.50", inStock: true, variants: [] },
    { id: "p3", storeId: "s1", name: "Sold out", price: "100", inStock: false, variants: [] },
    { id: "px", storeId: "OTHER", name: "Other store item", price: "1", inStock: true, variants: [] },
];
const base = { storeId: "s1", catalog, deliveryFeeKobo: 150_000 };

describe("priceOrder (trusted server pricing)", () => {
    it("computes totals from catalog rows only", () => {
        const r = priceOrder({ ...base, requested: [{ productId: "p1", variantId: "v1", quantity: 2 }, { productId: "p2", quantity: 1 }] });
        expect(r).toMatchObject({ ok: true, subtotalKobo: 2_000_000 + 550_050, totalKobo: 2_550_050 + 150_000 });
    });
    it("uses variant price override", () => { /* v2 is out of stock → see below; v1 inherits product price */
        const r = priceOrder({ ...base, requested: [{ productId: "p1", variantId: "v1", quantity: 1 }] });
        expect(r.ok && r.lines[0]!.unitKobo).toBe(1_000_000);
    });
    it("rejects products from another store (cross-store cart)", () => { expect(priceOrder({ ...base, requested: [{ productId: "px", quantity: 1 }] }).ok).toBe(false); });
    it("rejects out-of-stock, insufficient variant stock, missing variant and bad quantities", () => {
        expect(priceOrder({ ...base, requested: [{ productId: "p3", quantity: 1 }] })).toMatchObject({ ok: false });
        expect(priceOrder({ ...base, requested: [{ productId: "p1", variantId: "v2", quantity: 1 }] })).toMatchObject({ ok: false });
        expect(priceOrder({ ...base, requested: [{ productId: "p1", variantId: "v1", quantity: 4 }] })).toMatchObject({ ok: false });
        expect(priceOrder({ ...base, requested: [{ productId: "p1", quantity: 1 }] })).toMatchObject({ ok: false });
        for (const q of [0, -1, 1.5, 21]) expect(priceOrder({ ...base, requested: [{ productId: "p2", quantity: q }] }).ok).toBe(false);
    });
    it("counts split lines of the same variant against stock together", () => {
        expect(priceOrder({ ...base, requested: [{ productId: "p1", variantId: "v1", quantity: 2 }, { productId: "p1", variantId: "v1", quantity: 2 }] }).ok).toBe(false);
    });
    it("rejects empty carts and unknown ids", () => {
        expect(priceOrder({ ...base, requested: [] }).ok).toBe(false);
        expect(priceOrder({ ...base, requested: [{ productId: "nope", quantity: 1 }] }).ok).toBe(false);
    });
});
