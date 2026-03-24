"use client";

import { useCart } from "@/hooks/use-cart";
import { useState, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, ShieldCheck, Truck } from "lucide-react";
import { createOrder } from "@/lib/actions/order";
import { Store } from "@/types";

interface CreateOrderResponse {
    order?: unknown;
    authorizationUrl?: string;
    error?: string;
}

interface CheckoutFormProps {
    store: Store;
}

const emptySubscribe = () => () => { };

export default function CheckoutForm({ store }: CheckoutFormProps) {
    const cart = useCart();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [deliveryArea, setDeliveryArea] = useState<"MAINLAND" | "ISLAND">("MAINLAND");

    const isMounted = useSyncExternalStore(
        emptySubscribe,
        () => true,
        () => false
    );

    useEffect(() => {
        if (isMounted && cart.items.length === 0) {
            router.push(`/${store.slug}`);
        }
    }, [isMounted, cart.items.length, router, store.slug]);

    if (!isMounted || cart.items.length === 0) return null;

    const subtotal = cart.getTotalPrice();
    const deliveryFee = deliveryArea === "MAINLAND"
        ? Number(store.mainlandDeliveryFee)
        : Number(store.islandDeliveryFee);
    const total = subtotal + deliveryFee;

    async function onSubmit(formData: FormData) {
        setLoading(true);

        // Add cart data and delivery info to formData
        formData.append("storeId", store.id);
        formData.append("deliveryArea", deliveryArea);
        formData.append("deliveryFee", deliveryFee.toString());
        formData.append("subtotal", subtotal.toString());
        formData.append("total", total.toString());
        formData.append("items", JSON.stringify(cart.items));
        formData.append("origin", window.location.origin);
        formData.append("storeSlug", store.slug);

        try {
            const result = await createOrder(formData) as CreateOrderResponse;

            if (result.error) {
                alert(result.error);
                setLoading(false);
                return;
            }

            if (!result.authorizationUrl) {
                alert("Payment creation failed. Please try again.");
                setLoading(false);
                return;
            }

            // Paystack redirect
            window.location.href = result.authorizationUrl;
        } catch (err) {
            console.error(err);
            alert("Something went wrong. Please try again.");
            setLoading(false);
        }
    }

    return (
        <div className="grid gap-12 lg:grid-cols-2">
            <div className="space-y-8">
        <form action={onSubmit} className="space-y-6 rounded-3xl border bg-card p-6 md:p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-foreground">Delivery Details</h2>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Full Name</label>
                            <input name="customerName" required className="w-full rounded-xl border p-3 text-sm" placeholder="John Doe" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Phone Number</label>
                            <input name="customerPhone" required className="w-full rounded-xl border p-3 text-sm" placeholder="08012345678" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email Address</label>
                        <input name="customerEmail" type="email" required className="w-full rounded-xl border p-3 text-sm" placeholder="john@example.com" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Delivery Address</label>
                        <textarea name="address" required className="w-full rounded-xl border p-3 text-sm h-24" placeholder="House number, Street, Area..." />
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Truck className="h-4 w-4 text-indigo-600" />
                            Select Delivery Area
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setDeliveryArea("MAINLAND")}
                                className={`flex flex-col items-center justify-center rounded-2xl border-2 p-4 transition-all ${deliveryArea === "MAINLAND" ? "border-indigo-600 bg-indigo-50" : "border-border/50 hover:border-border"
                                    }`}
                            >
                                <span className="font-bold">Mainland</span>
                                <span className="text-xs text-foreground/50 font-medium">₦{Number(store.mainlandDeliveryFee).toLocaleString()}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setDeliveryArea("ISLAND")}
                                className={`flex flex-col items-center justify-center rounded-2xl border-2 p-4 transition-all ${deliveryArea === "ISLAND" ? "border-indigo-600 bg-indigo-50" : "border-border/50 hover:border-border"
                                    }`}
                            >
                                <span className="font-bold">Island</span>
                                <span className="text-xs text-foreground/50 font-medium">₦{Number(store.islandDeliveryFee).toLocaleString()}</span>
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 p-4 text-lg font-bold text-white transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Pay Now"}
                    </button>

                    <p className="text-center text-xs text-foreground/40 flex items-center justify-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        Secure payment powered by Paystack
                    </p>
                </form>
            </div>

            <div className="space-y-6">
                <div className="rounded-3xl border bg-card p-6 md:p-8 shadow-sm space-y-6">
                    <h2 className="text-xl font-bold text-foreground text-center">Order Summary</h2>
                    <div className="space-y-4">
                        {cart.items.map((item) => (
                            <div key={`${item.id}-${item.variantId || 'default'}`} className="flex items-center gap-4">
                                <div className="relative h-16 w-16 overflow-hidden rounded-xl border bg-secondary">
                                    {item.imageUrl && <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-foreground">{item.name}</p>
                                    {item.variantName && (
                                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Option: {item.variantName}</p>
                                    )}
                                    <p className="text-sm text-foreground/50">Qty: {item.quantity}</p>
                                </div>
                                <p className="font-bold text-foreground sans">₦{(Number(item.price) * item.quantity).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>

                    <hr className="border-border/50" />

                    <div className="space-y-2">
                        <div className="flex justify-between text-foreground/50">
                            <span className="font-medium">Subtotal</span>
                            <span className="font-bold">₦{subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-foreground/50">
                            <span className="font-medium">Delivery Fee ({deliveryArea})</span>
                            <span className="font-bold">₦{deliveryFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pt-4">
                            <span className="text-xl font-black text-foreground">Total</span>
                            <span className="text-2xl font-black text-indigo-600 sans">₦{total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
