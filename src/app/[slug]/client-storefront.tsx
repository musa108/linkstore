"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Megaphone,
  MessageCircle,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { trackConversion, trackVisit } from "@/lib/actions/store";
import { trackProductView } from "@/lib/actions/product";
import { formatPrice } from "@/lib/utils";
import type { Product, Store, Variant } from "@/types";
import ChatWidget from "@/components/chat/chat-widget";

const num = (v: unknown) => Number(String(v ?? 0));
const unitPrice = (p: Product, v?: Variant | null) =>
  v?.price != null ? num(v.price) : num(p.price);
const avgRating = (p: Product) =>
  p.reviews?.length ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length : 0;
const available = (v: Variant) => v.stockCount > 0;
const inStockProduct = (p: Product) => !p.variants?.length || p.variants.some(available);

function Stars({ value, count }: { value: number; count: number }) {
  if (!count) return null;
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold text-foreground/60"
      aria-label={`Rated ${value.toFixed(1)} out of 5 from ${count} reviews`}
    >
      <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
      <span>{value.toFixed(1)}</span>
      <span className="text-foreground/40">({count})</span>
    </span>
  );
}

export default function ClientStorefront({
  store,
  products,
}: {
  store: Store;
  products: Product[];
}) {
  const cart = useCart();
  const brand = store.primaryColor && store.primaryColor !== "#4f46e5" ? store.primaryColor : "#eb5a28";
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [announce, setAnnounce] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Carts are per store: drop anything added on another store
  useEffect(() => {
    const foreign = useCart.getState().items.filter((i) => i.storeId !== store.id);
    foreign.forEach((i) => useCart.getState().removeItem(i.id, i.variantId));
  }, [store.id]);

  useEffect(() => {
    try {
      const k = `ls-visit-${store.id}`;
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, "1");
    } catch {
      /* blocked */
    }
    void trackVisit(store.id);
  }, [store.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.description ?? "").toLowerCase().includes(q)
        )
      : products;
  }, [products, query]);

  const items = mounted ? cart.items.filter((i) => i.storeId === store.id) : [];
  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  function add(p: Product, v?: Variant | null) {
    cart.addItem({
      id: p.id,
      variantId: v?.id,
      variantName: v?.name,
      name: p.name,
      price: unitPrice(p, v),
      imageUrl: p.imageUrl,
      quantity: 1,
      storeId: store.id,
    });
    setCartOpen(true);
    void trackConversion(store.id);
  }

  function open(p: Product) {
    setSelected(p);
    void trackProductView(p.id);
  }

  return (
    <div className="min-h-screen bg-canvas pb-24 sm:pb-0 text-foreground">
      {/* Top Architectural Announcement */}
      {store.announcement && announce && (
        <div className="relative bg-[#1e2024] text-white">
          <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-10 py-2.5 text-center text-xs font-semibold tracking-wide">
            <span className="h-1.5 w-1.5 rounded-full bg-[#eb5a28]" />
            <Megaphone className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
            <span>{store.announcement}</span>
          </div>
          <button
            onClick={() => setAnnounce(false)}
            aria-label="Dismiss announcement"
            className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Architectural Sticky Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-8">
          {/* Store Brand / Logo */}
          <div className="flex min-w-0 items-center gap-3">
            {store.logoUrl ? (
              <Image
                src={store.logoUrl}
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 rounded-xl object-cover border border-border"
              />
            ) : (
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white shadow-xs"
                style={{ backgroundColor: brand }}
                aria-hidden
              >
                {store.name.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm sm:text-base font-bold text-foreground">
                  {store.name}
                </p>
                <BadgeCheck className="h-3.5 w-3.5 text-[#eb5a28]" aria-label="Verified Store" />
              </div>
            </div>
          </div>

          {/* Minimalist Centered Search Bar */}
          <div className="relative ml-auto hidden max-w-sm flex-1 sm:block">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40"
              aria-hidden
            />
            <label htmlFor="search-d" className="sr-only">
              Search catalogue
            </label>
            <input
              id="search-d"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="min-h-10 w-full rounded-full border border-border bg-canvas/70 pl-10 pr-4 text-xs font-medium text-foreground outline-none transition focus:border-[#eb5a28] focus:bg-white"
            />
          </div>

          {/* Cart Trigger */}
          <button
            onClick={() => setCartOpen(true)}
            className="btn btn-quiet relative ml-auto sm:ml-0 h-11 px-4 text-xs sm:text-sm font-bold shadow-xs hover:border-[#eb5a28]/40 flex items-center gap-2"
            aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
          >
            <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden />
            <span className="font-bold">Bag</span>
            {count > 0 && (
              <span
                className="tabular flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-extrabold text-white"
                style={{ backgroundColor: brand }}
              >
                {count}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Search Bar */}
        <div className="px-4 pb-3 sm:hidden">
          <label htmlFor="search-m" className="sr-only">
            Search products
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40"
              aria-hidden
            />
            <input
              id="search-m"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="min-h-10 w-full rounded-full border border-border bg-canvas/70 pl-10 pr-4 text-xs outline-none focus:border-[#eb5a28] focus:bg-white"
            />
          </div>
        </div>
      </header>

      {/* Main Storefront Area */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
        {/* Architectural Storefront Header Card */}
        <section className="mb-10 rounded-3xl border border-border bg-white p-6 sm:p-10 shadow-subtle">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[11px] font-bold tracking-wider uppercase text-foreground/70">
                <StoreIcon />
                <span>Verified Social Storefront</span>
              </div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl text-foreground">
                {store.name}
              </h1>
              {store.description && (
                <p className="mt-3 text-sm sm:text-base leading-relaxed text-foreground/75">
                  {store.description}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-foreground/60">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#eb5a28]" />
                  <span>Instant Paystack Checkout</span>
                </span>
                <span>•</span>
                <span>{products.length} product{products.length === 1 ? "" : "s"} live</span>
                <span>•</span>
                <span>Direct Delivery Tracking</span>
              </div>
            </div>

            {store.phoneNumber && (
              <a
                href={`https://wa.me/${store.phoneNumber.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-quiet min-h-10 shrink-0 text-xs font-bold hover:border-emerald-500 hover:text-emerald-700"
              >
                <MessageCircle className="h-4 w-4 text-emerald-600" aria-hidden />
                <span>Chat with Vendor</span>
              </a>
            )}
          </div>
        </section>

        {/* Product Catalogue Grid */}
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-white p-14 text-center shadow-subtle">
            <p className="text-base font-bold text-foreground">
              {products.length === 0 ? "No products in store yet" : `No products match “${query}”`}
            </p>
            <p className="mt-1 text-xs text-foreground/50">
              {products.length === 0
                ? "This vendor is currently restocking. Please check back shortly."
                : "Try a different search keyword or clear the search bar."}
            </p>
            {query && (
              <button onClick={() => setQuery("")} className="btn btn-quiet mt-5 text-xs font-bold">
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {filtered.map((p, idx) => {
              const sold = !inStockProduct(p);
              const r = avgRating(p);
              const from = p.variants?.length
                ? Math.min(...p.variants.map((v) => unitPrice(p, v)))
                : unitPrice(p);

              return (
                <li
                  key={p.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-white shadow-subtle transition-all duration-200 hover:-translate-y-1 hover:border-[#eb5a28]/40 hover:shadow-elevated"
                >
                  <button
                    onClick={() => open(p)}
                    className="block w-full text-left"
                    aria-label={`View ${p.name}`}
                  >
                    {/* Architectural Product Frame */}
                    <div className="relative aspect-[4/5] w-full bg-[#f4f4f6] overflow-hidden">
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl}
                          alt={p.name}
                          fill
                          sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
                          priority={idx < 4}
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-foreground/30">
                          <ShoppingBag className="h-8 w-8" aria-hidden />
                        </div>
                      )}
                      {sold && (
                        <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground shadow-xs backdrop-blur-xs">
                          Sold Out
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 p-3.5 sm:p-4">
                      <p className="line-clamp-2 min-h-[42px] text-sm sm:text-base font-bold text-foreground leading-snug group-hover:text-[#eb5a28] transition-colors">
                        {p.name}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <p className="tabular text-sm sm:text-base font-extrabold text-foreground">
                          {p.variants?.length &&
                          new Set(p.variants.map((v) => unitPrice(p, v))).size > 1
                            ? "From "
                            : ""}
                          {formatPrice(from)}
                        </p>
                        <Stars value={r} count={p.reviews?.length ?? 0} />
                      </div>
                    </div>
                  </button>

                  <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4 pt-1">
                    {p.variants?.length ? (
                      <button
                        onClick={() => open(p)}
                        disabled={sold}
                        className="btn btn-quiet w-full h-10 text-xs sm:text-sm font-bold hover:border-[#eb5a28] hover:text-[#eb5a28]"
                      >
                        {sold ? "Sold Out" : "Choose Options"}
                      </button>
                    ) : (
                      <button
                        onClick={() => add(p)}
                        disabled={sold}
                        className="btn w-full h-10 text-xs sm:text-sm font-bold text-white shadow-xs disabled:opacity-40"
                        style={{ backgroundColor: brand }}
                      >
                        {sold ? "Out of Stock" : "Add to Bag"}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      {/* Product Detail Modal */}
      {selected && (
        <ProductSheet
          product={selected}
          brand={brand}
          onClose={() => setSelected(null)}
          onAdd={(v) => {
            add(selected, v);
            setSelected(null);
          }}
        />
      )}

      {/* Slide-Over Cart Drawer */}
      {cartOpen && (
        <CartDrawer
          storeSlug={store.slug}
          storeId={store.id}
          brand={brand}
          items={items}
          subtotal={subtotal}
          onClose={() => setCartOpen(false)}
        />
      )}

      {/* Mobile Floating Sticky Cart Bar */}
      {count > 0 && !cartOpen && (
        <div
          className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white/95 p-3 backdrop-blur-md sm:hidden"
          style={{ paddingBottom: "max(.75rem, env(safe-area-inset-bottom))" }}
        >
          <button
            onClick={() => setCartOpen(true)}
            className="btn w-full text-xs font-bold text-white shadow-md flex items-center justify-between px-5"
            style={{ backgroundColor: brand }}
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span>View Bag ({count})</span>
            </div>
            <span className="tabular font-extrabold">{formatPrice(subtotal)}</span>
          </button>
        </div>
      )}

      <ChatWidget storeId={store.id} storeName={store.name} primaryColor={brand} />
    </div>
  );
}

function StoreIcon() {
  return (
    <svg className="h-3 w-3 text-[#eb5a28]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 7v2h20V7L12 2zm-8 8v10h16V10H4zm2 2h12v6H6v-6z" />
    </svg>
  );
}

function useDialog(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && ref.current) {
        const f = [
          ...ref.current.querySelectorAll<HTMLElement>(
            'button, a[href], input, [tabindex]:not([tabindex="-1"])'
          ),
        ].filter((x) => !x.hasAttribute("disabled"));
        if (!f.length) return;
        const first = f[0]!,
          last = f[f.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      prev?.focus();
    };
  }, [onClose]);
  return ref;
}

function ProductSheet({
  product,
  brand,
  onClose,
  onAdd,
}: {
  product: Product;
  brand: string;
  onClose: () => void;
  onAdd: (v?: Variant) => void;
}) {
  const ref = useDialog(onClose);
  const variants = product.variants ?? [];
  const [variantId, setVariantId] = useState<string | null>(
    variants.length === 1 && available(variants[0]!) ? variants[0]!.id : null
  );
  const [mediaIdx, setMediaIdx] = useState(0);
  const variant = variants.find((v) => v.id === variantId);
  const images = [
    product.imageUrl,
    ...(product.media ?? []).filter((m) => m.type === "IMAGE").map((m) => m.url),
  ].filter((u, i, a): u is string => Boolean(u) && a.indexOf(u) === i);
  const needs = variants.length > 0 && !variant;
  const r = avgRating(product);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[28px] border border-border bg-white shadow-2xl sm:max-h-[88dvh] sm:flex-row sm:rounded-3xl"
      >
        {/* Left: Product Images */}
        <div className="relative aspect-square shrink-0 bg-[#f4f4f6] sm:aspect-auto sm:w-1/2">
          {images[mediaIdx] ? (
            <Image
              src={images[mediaIdx]!}
              alt={product.name}
              fill
              sizes="(max-width:640px) 100vw, 480px"
              className="object-cover"
            />
          ) : null}
          {images.length > 1 && (
            <div
              className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5"
              role="tablist"
              aria-label="Product photos"
            >
              {images.map((_, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={i === mediaIdx}
                  aria-label={`Photo ${i + 1}`}
                  onClick={() => setMediaIdx(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === mediaIdx ? "w-6 bg-white shadow-xs" : "w-2 bg-white/60"
                  }`}
                />
              ))}
            </div>
          )}
          <button
            data-autofocus
            onClick={onClose}
            aria-label="Close"
            className="btn btn-quiet absolute right-3 top-3 h-9 w-9 rounded-full p-0 shadow-sm"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Right: Product Details */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto p-6 sm:p-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold leading-tight text-foreground">
                {product.name}
              </h2>
              <div className="mt-1.5">
                <Stars value={r} count={product.reviews?.length ?? 0} />
              </div>
            </div>

            <p className="tabular text-2xl sm:text-3xl font-extrabold text-foreground">
              {formatPrice(unitPrice(product, variant))}
            </p>

            {product.description && (
              <p className="whitespace-pre-line text-xs sm:text-sm leading-relaxed text-foreground/75">
                {product.description}
              </p>
            )}

            {variants.length > 0 && (
              <fieldset>
                <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-foreground/50">
                  Select Option
                </legend>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => {
                    const isSelected = v.id === variantId;
                    return (
                      <button
                        key={v.id}
                        disabled={!available(v)}
                        aria-pressed={isSelected}
                        onClick={() => setVariantId(v.id)}
                        className={`min-h-10 rounded-xl border px-3.5 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through ${
                          isSelected
                            ? "border-transparent text-white shadow-xs"
                            : "border-border bg-white text-foreground hover:border-foreground/40"
                        }`}
                        style={
                          isSelected
                            ? { backgroundColor: brand }
                            : undefined
                        }
                      >
                        {v.name}
                      </button>
                    );
                  })}
                </div>
                {variant && variant.stockCount <= 5 && (
                  <p className="mt-2 text-xs font-bold text-amber-700">
                    Only {variant.stockCount} left in stock
                  </p>
                )}
              </fieldset>
            )}

            {(product.reviews?.length ?? 0) > 0 && (
              <div className="border-t border-border pt-4">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-foreground/50">
                  Verified Customer Reviews
                </h3>
                <ul className="space-y-2.5">
                  {product.reviews!.slice(0, 3).map((rv) => (
                    <li key={rv.id} className="text-xs">
                      <p className="font-bold text-foreground">
                        {rv.customerName.split(" ")[0]}{" "}
                        <span className="text-amber-500">{"★".repeat(rv.rating)}</span>
                      </p>
                      {rv.comment && (
                        <p className="mt-0.5 text-foreground/70">{rv.comment}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div
            className="border-t border-border p-4 sm:p-6"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            <button
              disabled={needs}
              onClick={() => onAdd(variant)}
              className="btn h-12 w-full text-sm sm:text-base font-bold text-white shadow-sm disabled:opacity-40"
              style={{ backgroundColor: brand }}
            >
              {needs ? "Select an Option to Continue" : "Add to Shopping Bag"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartDrawer({
  storeSlug,
  storeId,
  brand,
  items,
  subtotal,
  onClose,
}: {
  storeSlug: string;
  storeId: string;
  brand: string;
  items: ReturnType<typeof useCart.getState>["items"];
  subtotal: number;
  onClose: () => void;
}) {
  const ref = useDialog(onClose);
  const cart = useCart();

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        className="flex h-full w-full max-w-md flex-col border-l border-border bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="text-base font-bold text-foreground">Your Shopping Bag</h2>
            <p className="text-[11px] text-foreground/50">Verified Paystack Checkout</p>
          </div>
          <button
            data-autofocus
            onClick={onClose}
            aria-label="Close cart"
            className="btn btn-quiet h-9 w-9 p-0 rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-foreground/40">
              <ShoppingBag className="h-7 w-7" aria-hidden />
            </div>
            <p className="text-sm font-bold text-foreground">Your bag is empty</p>
            <p className="text-xs text-foreground/50">Discover items from this store catalogue</p>
            <button onClick={onClose} className="btn btn-quiet mt-2 text-xs font-bold">
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-3.5 overflow-y-auto p-5">
              {items.map((i) => (
                <li
                  key={`${i.id}-${i.variantId ?? ""}`}
                  className="flex gap-3 rounded-xl border border-border/70 p-3 bg-canvas/40"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary border border-border/60">
                    {i.imageUrl && (
                      <Image
                        src={i.imageUrl}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-foreground">{i.name}</p>
                    {i.variantName && (
                      <p className="text-[10px] text-foreground/60">{i.variantName}</p>
                    )}
                    <p className="tabular text-xs font-extrabold mt-0.5 text-foreground">
                      {formatPrice(i.price)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => cart.updateQuantity(i.id, i.quantity - 1, i.variantId)}
                        disabled={i.quantity <= 1}
                        aria-label="Decrease quantity"
                        className="btn btn-quiet h-7 min-h-7 w-7 p-0 rounded-md disabled:opacity-40"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="tabular w-5 text-center text-xs font-bold" aria-live="polite">
                        {i.quantity}
                      </span>
                      <button
                        onClick={() =>
                          cart.updateQuantity(i.id, Math.min(20, i.quantity + 1), i.variantId)
                        }
                        disabled={i.quantity >= 20}
                        aria-label="Increase quantity"
                        className="btn btn-quiet h-7 min-h-7 w-7 p-0 rounded-md disabled:opacity-40"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => cart.removeItem(i.id, i.variantId)}
                        aria-label={`Remove ${i.name}`}
                        className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-foreground/40 hover:bg-rose-50 hover:text-rose-600 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div
              className="space-y-3.5 border-t border-border p-5 bg-white"
              style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
            >
              <div className="flex justify-between text-base font-extrabold text-foreground">
                <span>Subtotal</span>
                <span className="tabular">{formatPrice(subtotal)}</span>
              </div>
              <p className="flex items-start gap-2 text-xs text-foreground/65">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#eb5a28]" aria-hidden />
                <span>Delivery fees added at checkout. Verified instant Paystack transfer.</span>
              </p>
              <Link
                href={`/${storeSlug}/checkout`}
                onClick={() => void trackConversion(storeId)}
                className="btn h-11 w-full text-xs font-bold text-white shadow-sm flex items-center justify-center gap-2"
                style={{ backgroundColor: brand }}
              >
                <span>Proceed to Paystack Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
