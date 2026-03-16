import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
    id: string; // product id
    variantId?: string;
    variantName?: string;
    name: string;
    price: number;
    imageUrl: string | null;
    quantity: number;
}

interface CartStore {
    items: CartItem[];
    addItem: (product: CartItem) => void;
    removeItem: (id: string, variantId?: string) => void;
    updateQuantity: (id: string, quantity: number, variantId?: string) => void;
    clearCart: () => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
}

export const useCart = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (product: CartItem) => {
                const currentItems = get().items;
                const existingItem = currentItems.find(
                    (item) => item.id === product.id && item.variantId === product.variantId
                );

                if (existingItem) {
                    return set({
                        items: currentItems.map((item) =>
                            item.id === product.id && item.variantId === product.variantId
                                ? { ...item, quantity: item.quantity + product.quantity }
                                : item
                        ),
                    });
                }

                set({ items: [...currentItems, product] });
            },
            removeItem: (id: string, variantId?: string) => {
                set({
                    items: get().items.filter(
                        (item) => !(item.id === id && item.variantId === variantId)
                    )
                });
            },
            updateQuantity: (id: string, quantity: number, variantId?: string) => {
                if (quantity < 1) return;
                set({
                    items: get().items.map((item) =>
                        item.id === id && item.variantId === variantId ? { ...item, quantity } : item
                    ),
                });
            },
            clearCart: () => set({ items: [] }),
            getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
            getTotalPrice: () => get().items.reduce((total, item) => total + (Number(item.price) * item.quantity), 0),
        }),
        {
            name: "cart-storage",
            storage: createJSONStorage(() => localStorage),
        }
    )
);
