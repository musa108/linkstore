"use client";

import { useCart } from "@/hooks/use-cart";
import { useState, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Lock, Truck } from "lucide-react";
import { createOrder } from "@/lib/actions/order";
import { Store } from "@/types";

interface CreateOrderResponse {
  orderId?: string;
  authorizationUrl?: string;
  error?: string;
}

interface CheckoutFormProps {
  store: Store;
}

const emptySubscribe = () => () => {};

export default function CheckoutForm({ store }: CheckoutFormProps) {
  const cartAll = useCart();
  const cart = {
    items: cartAll.items.filter((i) => i.storeId === store.id),
    getTotalPrice: () =>
      cartAll.items
        .filter((i) => i.storeId === store.id)
        .reduce((t, i) => t + i.price * i.quantity, 0),
    clearCart: cartAll.clearCart,
  };
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
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
  const deliveryFee =
    deliveryArea === "MAINLAND"
      ? Number(store.mainlandDeliveryFee)
      : Number(store.islandDeliveryFee);
  const total = subtotal + deliveryFee;

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setFormError(null);

    try {
      const result = (await createOrder({
        storeSlug: store.slug,
        idempotencyKey,
        customerName: String(formData.get("customerName") ?? ""),
        customerEmail: String(formData.get("customerEmail") ?? ""),
        customerPhone: String(formData.get("customerPhone") ?? ""),
        address: String(formData.get("address") ?? ""),
        deliveryArea,
        items: cart.items.map((i) => ({
          productId: i.id,
          variantId: i.variantId ?? null,
          quantity: i.quantity,
        })),
      })) as CreateOrderResponse;

      if (result.error || !result.authorizationUrl) {
        setFormError(result.error ?? "Payment initialization failed. Please try again.");
        setLoading(false);
        return;
      }

      window.location.href = result.authorizationUrl;
    } catch (err) {
      console.error(err);
      setFormError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-12 text-foreground">
      {/* Left: Delivery Details Form */}
      <div className="lg:col-span-7">
        <form
          action={onSubmit}
          className="space-y-6 rounded-3xl border border-border bg-white p-6 md:p-8 shadow-subtle"
        >
          <div className="border-b border-border/80 pb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#eb5a28]">
              Step 1 of 2
            </span>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-foreground">
              Delivery Information
            </h2>
            <p className="mt-0.5 text-xs text-foreground/50">
              Where should the merchant dispatch your package?
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Full Name</label>
              <input
                name="customerName"
                required
                className="w-full rounded-xl border border-border bg-canvas/60 p-3 text-xs font-medium outline-none transition focus:border-[#eb5a28] focus:bg-white"
                placeholder="e.g. Zainab Alabi"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Phone Number</label>
              <input
                name="customerPhone"
                required
                className="w-full rounded-xl border border-border bg-canvas/60 p-3 text-xs font-medium outline-none transition focus:border-[#eb5a28] focus:bg-white"
                placeholder="080 1234 5678"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Email Address</label>
            <input
              name="customerEmail"
              type="email"
              required
              className="w-full rounded-xl border border-border bg-canvas/60 p-3 text-xs font-medium outline-none transition focus:border-[#eb5a28] focus:bg-white"
              placeholder="zainab@example.com (for Paystack receipt)"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Delivery Address</label>
            <textarea
              name="address"
              required
              className="w-full rounded-xl border border-border bg-canvas/60 p-3 text-xs font-medium h-20 outline-none transition focus:border-[#eb5a28] focus:bg-white"
              placeholder="House number, Street name, Estate, Area..."
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground/50 flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-[#eb5a28]" />
              <span>Select Delivery Zone</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeliveryArea("MAINLAND")}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 p-3.5 text-center transition-all ${
                  deliveryArea === "MAINLAND"
                    ? "border-[#eb5a28] bg-[#fff4ed] shadow-xs"
                    : "border-border bg-white hover:border-foreground/30"
                }`}
              >
                <span className="text-xs font-bold text-foreground">Mainland</span>
                <span className="tabular text-xs font-extrabold text-[#eb5a28] mt-0.5">
                  ₦{Number(store.mainlandDeliveryFee).toLocaleString()}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryArea("ISLAND")}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 p-3.5 text-center transition-all ${
                  deliveryArea === "ISLAND"
                    ? "border-[#eb5a28] bg-[#fff4ed] shadow-xs"
                    : "border-border bg-white hover:border-foreground/30"
                }`}
              >
                <span className="text-xs font-bold text-foreground">Island</span>
                <span className="tabular text-xs font-extrabold text-[#eb5a28] mt-0.5">
                  ₦{Number(store.islandDeliveryFee).toLocaleString()}
                </span>
              </button>
            </div>
          </div>

          {formError && (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-800"
            >
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#eb5a28] hover:bg-[#d94e1f] p-3.5 text-sm font-extrabold text-white transition-all shadow-md active:scale-98 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span>Proceed to Paystack ₦{total.toLocaleString()}</span>
            )}
          </button>

          <div className="text-center text-[11px] text-foreground/50 flex items-center justify-center gap-1.5 pt-1">
            <Lock className="h-3 w-3 text-emerald-600" />
            <span>256-Bit SSL Encrypted Paystack Banking Settlement</span>
          </div>
        </form>
      </div>

      {/* Right: Order Summary */}
      <div className="lg:col-span-5">
        <div className="rounded-3xl border border-border bg-white p-6 md:p-8 shadow-subtle space-y-6">
          <div className="border-b border-border/80 pb-4">
            <h2 className="text-base font-bold text-foreground">Order Summary</h2>
            <p className="text-xs text-foreground/50">{store.name}</p>
          </div>

          <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
            {cart.items.map((item) => (
              <div
                key={`${item.id}-${item.variantId || "default"}`}
                className="flex items-center gap-3 rounded-xl border border-border/60 p-2.5 bg-canvas/40"
              >
                <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-border/60 bg-[#f4f4f6] shrink-0">
                  {item.imageUrl && (
                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs font-bold text-foreground">{item.name}</p>
                  {item.variantName && (
                    <p className="text-[10px] font-semibold text-[#eb5a28]">
                      Option: {item.variantName}
                    </p>
                  )}
                  <p className="text-[11px] text-foreground/50">Qty: {item.quantity}</p>
                </div>
                <p className="tabular text-xs font-bold text-foreground">
                  ₦{(Number(item.price) * item.quantity).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t border-border pt-4 text-xs">
            <div className="flex justify-between text-foreground/60">
              <span>Items Subtotal</span>
              <span className="tabular font-semibold text-foreground">₦{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-foreground/60">
              <span>Delivery Fee ({deliveryArea})</span>
              <span className="tabular font-semibold text-foreground">₦{deliveryFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-border/80 pt-3">
              <span className="text-sm font-extrabold text-foreground">Total to Pay</span>
              <span className="tabular text-lg font-black text-[#eb5a28]">
                ₦{total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
