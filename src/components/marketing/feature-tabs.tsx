"use client";

import React, { useState } from "react";
import {
  BarChart3,
  Bot,
  CheckCircle2,
  CreditCard,
  PackageCheck,
  ShieldCheck,
  Smartphone,
  Star,
  Truck,
  Zap,
} from "lucide-react";

interface FeaturePillar {
  id: string;
  icon: any;
  label: string;
  badge: string;
  title: string;
  description: string;
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
    highlights: [
      "Zero manual screenshot checking",
      "Instant automated customer receipts",
      "Direct settlement to any Nigerian bank",
      "Reconciliation retry for delayed bank networks",
    ],
    mockCard: {
      title: "Bank Transfer Verified",
      subtitle: "Paystack Reference: ref_941088241",
      meta: "₦38,500.00 Settled",
      details: [
        { label: "Payer Bank", val: "GTBank Nigeria" },
        { label: "Settlement Account", val: "Access Bank (•••• 4920)" },
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
    highlights: [
      "Real-time dispatch timeline updates",
      "Two-sided confirmation protects buyer & vendor",
      "One-click dispute resolution if issues arise",
      "Works on any mobile browser without downloading apps",
    ],
    mockCard: {
      title: "Order #2048 Timeline",
      subtitle: "Customer: Chidinma O. (Ikeja)",
      meta: "Status: With Dispatch Rider",
      details: [
        { label: "Dispatch Service", val: "Kwik / GIG Logistics" },
        { label: "Estimated Dropoff", val: "Today, 3:30 PM" },
        { label: "Recipient Phone", val: "+234 803 •••• 192" },
      ],
    },
  },
  {
    id: "assistant",
    icon: Bot,
    label: "24/7 Store Assistant",
    badge: "AI Powered",
    title: "Turn late-night window shoppers into buyers.",
    description:
      "A smart shopping assistant built into your storefront that understands your products, prices, and shipping rules. It answers questions and adds items directly to the buyer's cart.",
    highlights: [
      "Knows your live stock counts and size variants",
      "Explains delivery timelines and return policies",
      "Strictly speaks from your inventory (no hallucinations)",
      "Helps customers build their cart at 2:00 AM",
    ],
    mockCard: {
      title: "Storefront Assistant",
      subtitle: "Shopper: 'Is the XL gown available in blue?'",
      meta: "Response generated in 0.4s",
      details: [
        { label: "Inventory Lookup", val: "2 units available in Lagos" },
        { label: "Action Taken", val: "Added to Cart for Buyer" },
        { label: "Delivery Note", val: "Eligible for Next-Day Delivery" },
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
    highlights: [
      "Daily and weekly gross volume breakdown",
      "Top-performing products and low-stock alerts",
      "Verified customer review metrics",
      "Exportable transaction history for tax and records",
    ],
    mockCard: {
      title: "Today's Business Summary",
      subtitle: "Boutique Performance (Past 7 Days)",
      meta: "₦418,000 Total Sales",
      details: [
        { label: "Completed Orders", val: "18 Paid Orders" },
        { label: "Top Product", val: "Ankara Wrap Maxi (₦24.5k)" },
        { label: "Conversion Rate", val: "4.8% of Store Visits" },
      ],
    },
  },
];

export function FeatureTabs() {
  const [activeTab, setActiveTab] = useState<string>("payments");
  const current = PILLARS.find((p) => p.id === activeTab) || PILLARS[0];

  return (
    <div className="space-y-8">
      {/* Tab Selector Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {PILLARS.map((pillar) => {
          const isActive = pillar.id === activeTab;
          const Icon = pillar.icon;
          return (
            <button
              key={pillar.id}
              type="button"
              onClick={() => setActiveTab(pillar.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                isActive
                  ? "bg-primary text-white shadow-sm ring-2 ring-primary/20"
                  : "bg-white text-foreground/75 border border-border hover:bg-canvas hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{pillar.label}</span>
            </button>
          );
        })}
      </div>

      {/* Feature Content Display */}
      <div className="rounded-3xl border border-border bg-white p-6 sm:p-10 shadow-elevated">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          {/* Left Text */}
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
              <Zap className="h-3.5 w-3.5" />
              <span>{current.badge}</span>
            </span>

            <h3 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {current.title}
            </h3>

            <p className="mt-3 text-base text-foreground/75 leading-relaxed">
              {current.description}
            </p>

            <ul className="mt-6 space-y-3">
              {current.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2.5 text-sm text-foreground/80 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Simulated Card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-border/90 bg-canvas/70 p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-border/80 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  {current.mockCard.title}
                </span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  Live
                </span>
              </div>

              <div className="mt-4">
                <p className="text-xs text-foreground/60">{current.mockCard.subtitle}</p>
                <p className="mt-1 text-xl font-extrabold text-foreground tabular">
                  {current.mockCard.meta}
                </p>
              </div>

              <div className="mt-5 space-y-2.5 border-t border-border/80 pt-4">
                {current.mockCard.details.map((d) => (
                  <div key={d.label} className="flex items-center justify-between text-xs">
                    <span className="text-foreground/60">{d.label}</span>
                    <span className="font-semibold text-foreground">{d.val}</span>
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
