"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  ShoppingBag,
  PackageCheck,
  BarChart3,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

interface ShowcaseTab {
  id: string;
  name: string;
  shortLabel: string;
  category: "MERCHANT" | "CUSTOMER";
  icon: React.ComponentType<{ className?: string }>;
  image: string;
  url: string;
  badge: string;
  headline: string;
  subheadline: string;
  statBadge: {
    label: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
  };
  features: string[];
}

const TABS: ShowcaseTab[] = [
  {
    id: "dashboard",
    name: "Merchant Command Center",
    shortLabel: "Merchant Console",
    category: "MERCHANT",
    icon: LayoutDashboard,
    image: "/screenshots/dashboard-overview.png",
    url: "https://linkstore.ng/dashboard",
    badge: "Real Merchant View",
    headline: "Everything you need to run your social brand in one clean hub.",
    subheadline:
      "Monitor incoming revenue in real-time, get low-stock alerts before items sell out, and share your personal branded link anywhere in one tap.",
    statBadge: {
      label: "Weekly Verified Sales",
      value: "₦485,000.00",
      icon: TrendingUp,
      accent: "#eb5a28",
    },
    features: [
      "One-click link copy for your Instagram bio & WhatsApp status",
      "Real-time 7-day revenue & order velocity metrics",
      "Automated low-inventory warning triggers",
      "Instant switch between merchant console and live shopper view",
    ],
  },
  {
    id: "storefront",
    name: "Customer Storefront Experience",
    shortLabel: "Customer Storefront",
    category: "CUSTOMER",
    icon: ShoppingBag,
    image: "/screenshots/storefront-live.jpg",
    url: "https://linkstore.ng/zaheerstore",
    badge: "Live Shopper View",
    headline: "Fast, elegant social storefront that builds immediate trust.",
    subheadline:
      "Your buyers can search products, choose size and color variants, pay instantly via Paystack transfer, and chat directly with you without app installs.",
    statBadge: {
      label: "Shopper Conversion",
      value: "Instant Paystack",
      icon: ShieldCheck,
      accent: "#10b981",
    },
    features: [
      "Clean studio gallery layout optimized for smartphones",
      "Instant Paystack checkout with bank transfer & card support",
      "Direct WhatsApp vendor chat for quick buyer inquiries",
      "Automated announcement banners for sales & shipping discounts",
    ],
  },
  {
    id: "orders",
    name: "Orders & Dispatch Management",
    shortLabel: "Orders & Shipping",
    category: "MERCHANT",
    icon: PackageCheck,
    image: "/screenshots/orders-management.png",
    url: "https://linkstore.ng/dashboard/orders",
    badge: "Dispute-Free Fulfillment",
    headline: "Ship with certainty. No more fake alerts or lost packages.",
    subheadline:
      "Filter orders by status ('To ship', 'Shipped', 'Delivered'). Each customer gets their own live tracking page, protecting both buyer and seller.",
    statBadge: {
      label: "Fulfillment Velocity",
      value: "100% Verified",
      icon: CheckCircle2,
      accent: "#3b82f6",
    },
    features: [
      "Instant filter tabs: 'To Ship', 'Shipped', 'Delivered', 'Issues'",
      "Automated tracking timeline sent directly to the customer",
      "Two-sided delivery confirmation stops delivery fraud",
      "Customer reviews only unlock after confirmed receipt",
    ],
  },
  {
    id: "analytics",
    name: "Business Intelligence & Insights",
    shortLabel: "Store Analytics",
    category: "MERCHANT",
    icon: BarChart3,
    image: "/screenshots/analytics-insights.png",
    url: "https://linkstore.ng/dashboard/analytics",
    badge: "Revenue Growth",
    headline: "Understand exactly which products generate your profits.",
    subheadline:
      "Track total shopper visits, visit-to-click conversion rates, and gross revenue broken down by individual product SKU.",
    statBadge: {
      label: "Gross Settled Revenue",
      value: "₦2,835,500.00",
      icon: Sparkles,
      accent: "#8b5cf6",
    },
    features: [
      "Total store visits and conversion intent tracking",
      "SKU-level performance breakdown with unit sales and gross margin",
      "Direct bank settlement records powered by Paystack ledger",
      "Zero hidden fees — clear transparency on every payout",
    ],
  },
];

export function LiveShowcase() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const tab = TABS.find((t) => t.id === activeTab) ?? TABS[0]!;
  const StatIcon = tab.statBadge.icon;

  return (
    <section className="relative overflow-hidden py-20 bg-canvas/40 border-y border-border/80">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3.5 py-1.5 text-xs font-bold text-foreground/80 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-[#eb5a28] animate-pulse" />
            <span className="tracking-wider uppercase text-[11px]">Real Live Platform Preview</span>
          </div>

          <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.12]">
            Take a look inside the modern Nigerian commerce machine.
          </h2>

          <p className="mt-4 text-base sm:text-lg text-foreground/75 leading-relaxed">
            Real screens from verified LinkStore merchants. Built with architectural clarity, zero fluff, and frictionless mobile performance.
          </p>
        </div>

        {/* Tab Navigation Controls */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isSelected = t.id === activeTab;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`group inline-flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-[#1e2024] text-white shadow-elevated scale-[1.02]"
                    : "bg-white text-foreground/75 border border-border/80 hover:border-[#eb5a28]/40 hover:text-foreground hover:bg-canvas"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-lg transition-colors ${
                    isSelected
                      ? "bg-[#eb5a28] text-white"
                      : "bg-secondary text-foreground/60 group-hover:bg-[#eb5a28]/10 group-hover:text-[#eb5a28]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span>{t.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Screen Showcase Container with Architectural Browser Chrome */}
        <div className="mt-8 rounded-3xl border border-border/80 bg-white p-3 sm:p-5 shadow-elevated">
          {/* Browser Chrome Header */}
          <div className="flex items-center justify-between border-b border-border/60 pb-3.5 px-2">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-400" />
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="h-3 w-3 rounded-full bg-emerald-400" />
            </div>

            {/* Simulated Address Bar */}
            <div className="flex items-center gap-2 rounded-full border border-border/70 bg-canvas px-4 py-1.5 text-xs font-mono font-medium text-foreground/60 max-w-sm w-full justify-center">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{tab.url}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-[10px] font-bold text-foreground/70 uppercase tracking-wider">
                {tab.badge}
              </span>
            </div>
          </div>

          {/* Screenshot Display Frame */}
          <div className="relative mt-3 overflow-hidden rounded-2xl border border-border/60 bg-[#1e2024]">
            <div className="relative aspect-[16/9] w-full max-h-[580px] overflow-hidden">
              <Image
                src={tab.image}
                alt={tab.name}
                fill
                sizes="(max-width: 1200px) 100vw, 1100px"
                className="object-cover object-top transition-transform duration-500 hover:scale-[1.01]"
                priority
              />
            </div>

            {/* Floating Glassmorphic Stat Tag */}
            <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 rounded-2xl border border-white/20 bg-white/90 p-3 sm:p-4 backdrop-blur-md shadow-elevated max-w-xs">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-xs"
                  style={{ backgroundColor: tab.statBadge.accent }}
                >
                  <StatIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">
                    {tab.statBadge.label}
                  </p>
                  <p className="tabular text-base sm:text-lg font-extrabold text-foreground">
                    {tab.statBadge.value}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contextual Description & Highlights Grid */}
          <div className="mt-8 grid gap-6 rounded-2xl border border-border/60 bg-canvas/40 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr] items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#eb5a28]/10 px-3 py-1 text-[11px] font-bold text-[#eb5a28] uppercase tracking-wider">
                <span>Feature Focus</span>
              </div>
              <h3 className="mt-2.5 text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {tab.headline}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/75">
                {tab.subheadline}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/sign-up"
                  className="btn btn-primary text-xs font-bold px-5 h-10"
                >
                  <span>Launch Your Store Free</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/zaheerstore"
                  target="_blank"
                  className="btn btn-quiet text-xs font-bold px-4 h-10 gap-1.5"
                >
                  <span>View Sample Store</span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                </Link>
              </div>
            </div>

            {/* Bullet Highlights */}
            <ul className="space-y-3 border-t border-border/60 pt-5 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
              {tab.features.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm font-medium text-foreground/80">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#eb5a28] mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
