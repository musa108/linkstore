"use client";

import React, { useState } from "react";
import { BadgeCheck, CheckCircle2, ChevronRight, MessageCircle, Package, Search, ShoppingBag, Sparkles, Store, Truck } from "lucide-react";

interface ProductItem {
  id: string;
  name: string;
  category: string;
  price: string;
  color: string;
  badge?: string;
}

const SAMPLE_PRODUCTS: ProductItem[] = [
  {
    id: "1",
    name: "Ankara Silk Wrap Maxi",
    category: "Fashion",
    price: "₦24,500",
    color: "from-amber-100 to-amber-200",
    badge: "Bestseller",
  },
  {
    id: "2",
    name: "Whipped Shea Butter (250g)",
    category: "Skincare",
    price: "₦6,800",
    color: "from-emerald-100 to-emerald-200",
    badge: "100% Organic",
  },
  {
    id: "3",
    name: "Handcrafted Leather Slides",
    category: "Footwear",
    price: "₦14,200",
    color: "from-orange-100 to-orange-200",
  },
  {
    id: "4",
    name: "Lagos Everyday Canvas Tote",
    category: "Accessories",
    price: "₦11,500",
    color: "from-sky-100 to-sky-200",
  },
];

export function StorefrontPreview() {
  const [selectedProduct, setSelectedProduct] = useState<string>("1");
  const [cartCount, setCartCount] = useState<number>(2);
  const [showCheckoutToast, setShowCheckoutToast] = useState<boolean>(true);

  return (
    <div className="relative mx-auto w-full max-w-[380px] lg:max-w-[420px] select-none">
      {/* Outer Phone Shell */}
      <div className="relative rounded-[2.75rem] border-[3px] border-[#e2ddd3] bg-white p-3.5 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.12)]">
        {/* Speaker Ear Piece & Camera */}
        <div className="absolute left-1/2 top-5 h-4 w-28 -translate-x-1/2 rounded-full bg-[#e8e3d8]/80 flex items-center justify-center gap-2 z-20">
          <div className="h-2 w-2 rounded-full bg-[#cfc8bc]" />
          <div className="h-1.5 w-10 rounded-full bg-[#cfc8bc]" />
        </div>

        {/* Screen Frame */}
        <div className="relative overflow-hidden rounded-[2.25rem] border border-[#e8e2d5] bg-canvas text-left">
          {/* Top Announcement Bar */}
          <div className="bg-primary px-4 pb-2 pt-6 text-[10px] font-semibold tracking-wide text-white flex items-center justify-between">
            <span>Free delivery on orders over ₦40,000</span>
            <span className="opacity-90">Lagos · Abuja</span>
          </div>

          {/* Storefront Header */}
          <div className="border-b border-border/80 bg-white px-4 py-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                  ZC
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-foreground">Zainab&apos;s Closet</h3>
                    <BadgeCheck className="h-3.5 w-3.5 text-primary" aria-label="Verified Store" />
                  </div>
                  <p className="text-[10px] text-foreground/60">Yaba, Lagos · 4.9 ★ (182 reviews)</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCartCount((prev) => prev + 1)}
                className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-primary-hover active:scale-95"
              >
                <ShoppingBag className="h-3 w-3" />
                <span>Cart · {cartCount}</span>
              </button>
            </div>

            {/* Quick search & category pills */}
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-border bg-canvas/60 px-2.5 py-1.5 text-[11px] text-foreground/50">
                <Search className="h-3 w-3 text-foreground/40" />
                <span>Search collection...</span>
              </div>
              <div className="flex gap-1 text-[10px] font-medium text-foreground/70">
                <span className="rounded-md bg-secondary px-2 py-1 text-primary font-semibold">All</span>
                <span className="rounded-md bg-canvas px-2 py-1">New</span>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="p-3">
            <div className="grid grid-cols-2 gap-2.5">
              {SAMPLE_PRODUCTS.map((prod) => {
                const isSelected = selectedProduct === prod.id;
                return (
                  <div
                    key={prod.id}
                    onClick={() => setSelectedProduct(prod.id)}
                    className={`group cursor-pointer overflow-hidden rounded-xl border transition-all ${
                      isSelected
                        ? "border-primary bg-white shadow-sm ring-1 ring-primary/20"
                        : "border-border/80 bg-white hover:border-border"
                    }`}
                  >
                    {/* Visual Product Box */}
                    <div className={`relative aspect-[4/3] w-full bg-gradient-to-br ${prod.color} p-2 flex flex-col justify-between`}>
                      {prod.badge ? (
                        <span className="self-start rounded bg-white/90 px-1.5 py-0.5 text-[9px] font-bold text-foreground/80 shadow-xs backdrop-blur-xs">
                          {prod.badge}
                        </span>
                      ) : <span />}
                      <span className="self-end text-[10px] text-foreground/30 font-mono">#0{prod.id}</span>
                    </div>

                    <div className="p-2">
                      <p className="truncate text-[11px] font-semibold text-foreground group-hover:text-primary">
                        {prod.name}
                      </p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-primary tabular">{prod.price}</span>
                        <span className="text-[9px] font-medium text-foreground/50">{prod.category}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Instant Paystack Transfer Prompt Mock */}
            <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-2.5">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  <span>Instant Paystack Bank Transfer</span>
                </div>
                <span className="text-[10px] font-bold text-primary">Zero Fees</span>
              </div>
              <p className="mt-0.5 text-[10px] text-foreground/70">
                Payment verified in real time. No screenshots required.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Real-World Trust Badges */}

      {/* 1. Verified Merchant Settlement Pill */}
      {showCheckoutToast && (
        <div className="absolute -left-6 top-16 hidden sm:flex items-center gap-3 rounded-2xl border border-border bg-white px-3.5 py-2.5 shadow-elevated animate-fade-in">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="text-[11px] font-bold text-foreground">₦24,500 Paid &amp; Verified</p>
            <p className="text-[10px] text-foreground/60">Direct settlement via Paystack</p>
          </div>
        </div>
      )}

      {/* 2. Dispatch / Rider Tracking Pill */}
      <div className="absolute -right-6 top-1/2 hidden sm:flex items-center gap-3 rounded-2xl border border-border bg-white px-3.5 py-2.5 shadow-elevated">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
          <Truck className="h-5 w-5" />
        </div>
        <div className="text-left">
          <p className="text-[11px] font-bold text-foreground">Order #1042 Dispatched</p>
          <p className="text-[10px] text-foreground/60">Rider on route to Lekki Phase 1</p>
        </div>
      </div>

      {/* 3. 24/7 Store Assistant Pill */}
      <div className="absolute -left-4 bottom-12 hidden sm:flex items-center gap-2.5 rounded-2xl border border-border bg-white px-3.5 py-2.5 shadow-elevated">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
          <MessageCircle className="h-4 w-4" />
        </div>
        <div className="text-left">
          <p className="text-[11px] font-bold text-foreground">AI Store Assistant</p>
          <p className="text-[10px] text-foreground/60">&ldquo;Size 12 in Ankara is in stock!&rdquo;</p>
        </div>
      </div>
    </div>
  );
}
