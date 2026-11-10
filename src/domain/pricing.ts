import { MAX_ORDER_KOBO, toKobo, type Kobo } from "./money";

export const MAX_LINE_QTY = 20;
export const MAX_LINES = 30;

export interface RequestedLine { productId: string; variantId?: string | null; quantity: number }

export interface CatalogVariant { id: string; name: string; price: unknown | null; stockCount: number }
export interface CatalogProduct {
    id: string; storeId: string; name: string; price: unknown; inStock: boolean; variants: CatalogVariant[];
}

export interface PricedLine {
    productId: string; variantId: string | null; name: string; variantName: string | null;
    quantity: number; unitKobo: Kobo; lineKobo: Kobo;
}

export type PricingResult =
    | { ok: true; lines: PricedLine[]; subtotalKobo: Kobo; deliveryKobo: Kobo; totalKobo: Kobo }
    | { ok: false; error: string };

/**
 * Pure, trusted pricing. Prices, stock and delivery fee come from DB rows the
 * caller loaded – NEVER from the client. The client only supplies ids + quantities.
 */
export function priceOrder(args: {
    storeId: string;
    requested: RequestedLine[];
    catalog: CatalogProduct[];
    deliveryFeeKobo: Kobo;
}): PricingResult {
    const { storeId, requested, catalog, deliveryFeeKobo } = args;
    if (requested.length === 0) return { ok: false, error: "Your cart is empty." };
    if (requested.length > MAX_LINES) return { ok: false, error: "Too many items in cart." };

    const byId = new Map(catalog.map((p) => [p.id, p]));
    const lines: PricedLine[] = [];
    const wanted = new Map<string, number>(); // stock key → total qty (handles split lines of same item)

    for (const r of requested) {
        if (!Number.isInteger(r.quantity) || r.quantity < 1 || r.quantity > MAX_LINE_QTY) {
            return { ok: false, error: `Quantity must be between 1 and ${MAX_LINE_QTY}.` };
        }
        const product = byId.get(r.productId);
        if (!product || product.storeId !== storeId) return { ok: false, error: "An item in your cart is no longer available." };
        if (!product.inStock) return { ok: false, error: `${product.name} is out of stock.` };

        let variant: CatalogVariant | undefined;
        if (product.variants.length > 0) {
            if (!r.variantId) return { ok: false, error: `Please choose an option for ${product.name}.` };
            variant = product.variants.find((v) => v.id === r.variantId);
            if (!variant) return { ok: false, error: `That option for ${product.name} is no longer available.` };
            const key = `v:${variant.id}`;
            const total = (wanted.get(key) ?? 0) + r.quantity;
            wanted.set(key, total);
            if (variant.stockCount < total) {
                return { ok: false, error: variant.stockCount <= 0 ? `${product.name} (${variant.name}) is out of stock.` : `Only ${variant.stockCount} of ${product.name} (${variant.name}) left.` };
            }
        } else if (r.variantId) {
            return { ok: false, error: "Invalid product option." };
        }

        const unitKobo = toKobo((variant?.price ?? product.price) as string | number);
        if (unitKobo <= 0) return { ok: false, error: `${product.name} has no valid price.` };
        lines.push({
            productId: product.id, variantId: variant?.id ?? null, name: product.name, variantName: variant?.name ?? null,
            quantity: r.quantity, unitKobo, lineKobo: unitKobo * r.quantity,
        });
    }

    const subtotalKobo = lines.reduce((s, l) => s + l.lineKobo, 0);
    const totalKobo = subtotalKobo + deliveryFeeKobo;
    if (totalKobo > MAX_ORDER_KOBO) return { ok: false, error: "Order total exceeds the maximum allowed." };
    return { ok: true, lines, subtotalKobo, deliveryKobo: deliveryFeeKobo, totalKobo };
}
