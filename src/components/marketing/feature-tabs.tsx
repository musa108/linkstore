"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  BarChart3,
  Bot,
  CheckCircle2,
  PackageCheck,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface FeaturePillar {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge: string;
  title: string;
  description: string;
  image: string;
  highlights: string[];
  mockCard: {
    title: string;
    subtitle: string;
    meta: string;
    details: { label: string; val: string }[];
  };
}

const PILLARS: FeaturePillar[] = [
  {
    id: "payments",
    icon: ShieldCheck,
    label: "Scam-Proof Checkout",
    badge: "Paystack Powered",
    title: "Never fall for a fake transfer alert again.",
    description:
      "Your store link accepts direct Nigerian bank transfers, cards, and USSD via Paystack. Orders only mark as paid when the money is safely confirmed by the bank.",
    image: "/screenshots/orders-management.png",
    highlights: [
      "Zero manual screenshot checking",
      "Instant automated customer receipts",
      "Direct settlement to any Nigerian bank",
      "Reconciliation retry for delayed bank networks",
    ],
    mockCard: {
      title: "Bank Transfer Verified",
      subtitle: "Paystack Reference: ref_941088241",
      meta: "₦485,000.00 Settled",
      details: [
        { label: "Payer Bank", val: "GTBank / Access" },
        { label: "Settlement Account", val: "Direct Paystack Ledger" },
        { label: "Status", val: "Verified & Cleared" },
      ],
    },
  },
  {
    id: "tracking",
    icon: PackageCheck,
    label: "Live Order Tracking",
    badge: "Buyer & Seller Trust",
    title: "Cut 90% of 'Where is my order?' WhatsApp messages.",
    description:
      "Every buyer receives a personal tracking link via SMS or WhatsApp. Both seller and customer confirm delivery, with dispute resolution built in.",
    image: "/screenshots/storefront-live.jpg",
    highlights: [
      "Real-time dispatch timeline updates",
      "Two-sided confirmation protects buyer & vendor",
      "One-click dispute resolution if issues arise",
      "Works on any mobile browser without downloading apps",
    ],
    mockCard: {
      title: "Customer Storefront",
      subtitle: "Store: zaheer (Verified Social Storefront)",
      meta: "Live Shopper Catalogue",
      details: [
        { label: "Products Live", val: "5 iPhones & Gadgets" },
        { label: "Checkout Support", val: "Instant Paystack Transfer" },
        { label: "Vendor Contact", val: "Direct WhatsApp Button" },
      ],
    },
  },
  {
    id: "assistant",
    icon: Bot,
    label: "24/7 Store Assistant",
    badge: "Gemini Powered AI",
    title: "Turn late-night window shoppers into buyers.",
    description:
      "A smart shopping assistant built into your storefront that understands your products, prices, and shipping rules. It answers questions and adds items directly to the buyer's cart.",
    image: "/screenshots/dashboard-overview.png",
    highlights: [
      "Knows your live stock counts and size variants",
      "Explains delivery timelines and return policies",
      "Strictly speaks from your inventory (no hallucinations)",
      "Helps customers build their cart at 2:00 AM",
    ],
    mockCard: {
      title: "Merchant Overview",
      subtitle: "Automated Operations Assistant",
      meta: "₦485,000.00 (7-Day Volume)",
      details: [
        { label: "Store Link", val: "linkstore.ng/zaheerstore" },
        { label: "Active Orders", val: "5 Awaiting Dispatch" },
        { label: "Conversion Rate", val: "12.0% Cart Intent" },
      ],
    },
  },
  {
    id: "analytics",
    icon: BarChart3,
    label: "No-Spreadsheet Numbers",
    badge: "Mobile Business Intel",
    title: "Know your daily revenue and bestselling items at a glance.",
    description:
      "Throw away the paper jotter. See daily sales trends, page views, conversion rates, and repeat customers directly from your phone screen.",
    image: "/screenshots/analytics-insights.png",
    highlights: [
      "Daily and weekly gross volume breakdown",
      "Top-performing products and low-stock alerts",
      "Verified customer review metrics",
      "Downloadable financial reports for bank loans",
    ],
    mockCard: {
      title: "Store Performance",
      subtitle: "Business Intelligence Funnel",
      meta: "₦2,835,500.00 Gross Settled",
      details: [
        { label: "Unique Visitors", val: "125 Shopper Sessions" },
        { label: "Top Product", val: "iPhone 16 (₦1,100,000)" },
        { label: "Conversion Rate", val: "100% SKU Velocity" },
      ],
    },
  },
];

export function FeatureTabs() {
  const [active, setActive] = useState<string>("payments");
  const current = PILLARS.find((p) => p.id === active) ?? PILLARS[0]!;

  return (
    <div className="space-y-8">
      {/* Tab Switcher Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {PILLARS.map((p) => {
          const Icon = p.icon;
          const isSelected = p.id === active;
          return (
            <button
              key={p.id}
              onClick={() => setActive(p.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#1e2024] text-white shadow-elevated scale-[1.02]"
                  : "bg-white text-foreground/70 border border-border/80 hover:border-[#eb5a28]/40 hover:text-foreground"
              }`}
            >
              <Icon className={`h-4 w-4 ${isSelected ? "text-[#eb5a28]" : "text-foreground/50"}`} />
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Feature Content Display */}
      <div className="rounded-3xl border border-border/80 bg-white p-6 sm:p-10 shadow-elevated">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          {/* Left Text */}
          <div className="lg:col-span-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eb5a28]/10 px-3 py-1 text-xs font-bold text-[#eb5a28]">
              <Zap className="h-3.5 w-3.5" />
              <span>{current.badge}</span>
            </span>

            <h3 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {current.title}
            </h3>

            <p className="mt-3 text-sm sm:text-base text-foreground/75 leading-relaxed">
              {current.description}
            </p>

            <ul className="mt-6 space-y-3">
              {current.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/80 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-[#eb5a28] shrink-0 mt-0.5" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Live Screenshot Card Preview */}
          <div className="lg:col-span-6">
            <div className="overflow-hidden rounded-2xl border border-border/80 bg-[#1e2024] shadow-elevated">
              {/* Card Header Chrome */}
              <div className="flex items-center justify-between border-b border-border/40 bg-white/5 px-4 py-2.5 text-xs text-white/80">
                <span className="font-bold text-[11px] uppercase tracking-wider text-[#eb5a28]">
                  {current.mockCard.title}
                </span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  Live View
                </span>
              </div>

              {/* Real Image */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                <Image
                  src={current.image}
                  alt={current.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 550px"
                  className="object-cover object-top hover:scale-[1.02] transition-transform duration-300"
                />
              </div>

              {/* Data Strip */}
              <div className="grid grid-cols-3 divide-x divide-white/10 bg-[#1e2024] p-3 text-center text-white">
                {current.mockCard.details.map((d, i) => (
                  <div key={i} className="px-2">
                    <p className="text-[10px] text-white/50 truncate">{d.label}</p>
                    <p className="text-xs font-bold truncate text-white mt-0.5">{d.val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
