"use client";

import { useEffect } from "react";
import { useCart } from "@/hooks/use-cart";

/** Mounted on the payment-success page: empties this store's items so the paid order can't be bought twice. */
export default function ClearCart({ storeId }: { storeId: string }) {
    useEffect(() => {
        const { items, removeItem } = useCart.getState();
        items.filter((i) => i.storeId === storeId || !i.storeId).forEach((i) => removeItem(i.id, i.variantId));
    }, [storeId]);
    return null;
}
