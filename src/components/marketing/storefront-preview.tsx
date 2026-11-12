"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  MessageCircle,
  Truck,
} from "lucide-react";

export function StorefrontPreview() {
  const [showCheckoutToast] = useState<boolean>(true);

  return (
    <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[390px] select-none">
      {/* Outer Phone Shell */}
      <div className="relative rounded-[2.85rem] border-[3px] border-[#22252a] bg-[#121417] p-3 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.35)] ring-1 ring-black/5">
        {/* Dynamic Island / Speaker Notch */}
        <div className="absolute left-1/2 top-4 h-4 w-28 -translate-x-1/2 rounded-full bg-black/90 flex items-center justify-center gap-2 z-20">
          <div className="h-2 w-2 rounded-full bg-[#2a2d33]" />
          <div className="h-1.5 w-10 rounded-full bg-[#2a2d33]" />
        </div>

        {/* Screen Frame displaying the real storefront screenshot */}
        <div className="relative overflow-hidden rounded-[2.35rem] bg-[#f9f9fa] border border-black/10">
          <div className="relative w-full aspect-[430/720] max-h-[580px] overflow-hidden">
            <Image
              src="/storefront-hero.jpg"
              alt="Zaheer Storefront Preview on LinkStore"
              fill
              priority
              sizes="(max-width: 640px) 340px, 390px"
              className="object-cover object-top"
            />
          </div>
        </div>
      </div>

      {/* Floating Trust Pills */}

      {/* 1. Verified Merchant Settlement Pill */}
      {showCheckoutToast && (
        <div className="absolute -left-6 top-16 hidden sm:flex items-center gap-3 rounded-2xl border border-border bg-white/95 backdrop-blur-md px-3.5 py-2.5 shadow-elevated animate-fade-up">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="text-[11px] font-bold text-foreground">₦850,000 Paid &amp; Verified</p>
            <p className="text-[10px] text-foreground/60">Direct settlement via Paystack</p>
          </div>
        </div>
      )}

      {/* 2. Dispatch / Rider Tracking Pill */}
      <div className="absolute -right-6 top-1/2 hidden sm:flex items-center gap-3 rounded-2xl border border-border bg-white/95 backdrop-blur-md px-3.5 py-2.5 shadow-elevated">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
          <Truck className="h-5 w-5" />
        </div>
        <div className="text-left">
          <p className="text-[11px] font-bold text-foreground">Order #1042 Dispatched</p>
          <p className="text-[10px] text-foreground/60">iPhone 15 Pro Max to Lekki</p>
        </div>
      </div>

      {/* 3. 24/7 Store Assistant Pill */}
      <div className="absolute -left-4 bottom-12 hidden sm:flex items-center gap-2.5 rounded-2xl border border-border bg-white/95 backdrop-blur-md px-3.5 py-2.5 shadow-elevated">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
          <MessageCircle className="h-4 w-4" />
        </div>
        <div className="text-left">
          <p className="text-[11px] font-bold text-foreground">AI Store Assistant</p>
          <p className="text-[10px] text-foreground/60">&ldquo;Natural Titanium 256GB is in stock!&rdquo;</p>
        </div>
      </div>
    </div>
  );
}
