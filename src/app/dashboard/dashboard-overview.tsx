"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Circle,
  ExternalLink,
  Share2,
  Sparkles,
  Store,
} from "lucide-react";
import AnalyticsChart from "./analytics-chart";
import { formatPrice } from "@/lib/utils";

export interface OverviewData {
  store: { name: string; slug: string; visits: number; conversionClicks: number; hasPayout: boolean };
  chart: { date: string; revenue: number; orders: number }[];
  revenue7d: number;
  productCount: number;
  toShip: number;
  recent: { id: string; customerName: string; total: number; status: string; createdAt: string }[];
  lowStock: { id: string; label: string; stock: number }[];
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-900 border-amber-200",
  PAID: "bg-emerald-50 text-emerald-900 border-emerald-200",
  SHIPPED: "bg-[#1e2024] text-white border-transparent",
  DELIVERED: "bg-emerald-50 text-emerald-900 border-emerald-200",
  CANCELLED: "bg-rose-50 text-rose-900 border-rose-200",
  REFUNDED: "bg-rose-50 text-rose-900 border-rose-200",
};

export const STATUS_LABEL: Record<string, string> = {
  PENDING: "Awaiting payment",
  PAID: "Paid – ready to ship",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export default function DashboardOverview({ data }: { data: OverviewData }) {
  const { store } = data;
  const [copied, setCopied] = useState(false);
  const link = typeof window === "undefined" ? `/${store.slug}` : `${window.location.origin}/${store.slug}`;

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: store.name, url: link });
        return;
      }
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* user cancelled */
    }
  }

  const conversion = store.visits > 0 ? ((store.conversionClicks / store.visits) * 100).toFixed(1) : "0.0";
  const steps = [
    { done: data.productCount > 0, label: "Add your first product", href: "/dashboard/products/new" },
    { done: store.hasPayout, label: "Add payout details so you can get paid", href: "/dashboard/settings" },
    { done: store.visits > 0, label: "Share your store link", href: "#share" },
  ];
  const remaining = steps.filter((s) => !s.done).length;

  return (
    <div className="space-y-8">
      {/* Title & Store Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#eb5a28]">
            Merchant Overview
          </span>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            {store.name}
          </h1>
          <p className="mt-0.5 text-xs text-foreground/60">
            Real-time sales, live catalogue performance, and store management.
          </p>
        </div>

        <Link
          href={`/${store.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full border border-border bg-white px-3.5 py-1.5 text-xs font-semibold text-foreground/80 shadow-xs hover:border-[#eb5a28] hover:text-[#eb5a28] transition"
        >
          <Store className="h-3.5 w-3.5 text-[#eb5a28]" />
          <span>Live Customer View</span>
          <ArrowUpRight className="h-3 w-3 opacity-60" />
        </Link>
      </div>

      {/* Architectural Store Link Banner (Charcoal + Orange Accent) */}
      <section
        id="share"
        className="relative overflow-hidden rounded-2xl border border-border bg-[#1e2024] p-6 text-white shadow-elevated"
        aria-label="Your store link"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#eb5a28]" />
              <p className="text-xs font-bold uppercase tracking-widest text-white/60">
                Your Public Store Link
              </p>
            </div>
            <p className="mt-1.5 truncate text-lg sm:text-xl font-bold tracking-tight text-white font-mono">
              {link.replace(/^https?:\/\//, "")}
            </p>
            <p className="mt-1 text-xs text-white/50">
              Share in your Instagram bio, TikTok bio, or WhatsApp status.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={share}
              className="btn btn-primary h-11 px-6 text-sm font-bold shadow-sm"
            >
              {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              <span>{copied ? "Link Copied" : "Share Store"}</span>
            </button>
            <Link
              href={`/${store.slug}`}
              target="_blank"
              className="btn h-11 border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white hover:bg-white/20"
            >
              Preview Store
            </Link>
          </div>
        </div>
      </section>

      {/* Setup checklist */}
      {remaining > 0 && (
        <section
          className="rounded-2xl border border-border bg-white p-6 shadow-subtle"
          aria-label="Setup checklist"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-wide text-foreground uppercase">
              Store Launch Checklist
            </h2>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-foreground/70">
              {3 - remaining} of 3 completed
            </span>
          </div>

          <ul className="mt-4 grid gap-2.5 sm:grid-cols-3">
            {steps.map((s) => (
              <li key={s.label}>
                <Link
                  href={s.href}
                  className={`flex min-h-[48px] items-center gap-3 rounded-xl border p-3.5 text-xs font-medium transition-all ${
                    s.done
                      ? "border-border/60 bg-canvas/60 text-foreground/50 line-through"
                      : "border-border bg-white hover:border-[#eb5a28] hover:shadow-xs text-foreground"
                  }`}
                >
                  {s.done ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-[#eb5a28] shrink-0" />
                  )}
                  <span className="truncate">{s.label}</span>
                  {!s.done && <ArrowRight className="ml-auto h-3.5 w-3.5 text-[#eb5a28]" />}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Architectural KPI Cards */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Key numbers">
        {[
          {
            label: "Revenue (7 Days)",
            value: formatPrice(data.revenue7d),
            hint: "Paid & confirmed orders",
            highlight: true,
          },
          {
            label: "Orders to Ship",
            value: String(data.toShip),
            hint: data.toShip > 0 ? "Awaiting your dispatch" : "All caught up",
            href: "/dashboard/orders",
          },
          {
            label: "Store Visits",
            value: data.store.visits.toLocaleString(),
            hint: "Unique shopper sessions",
          },
          {
            label: "Cart Conversion",
            value: `${conversion}%`,
            hint: "Visitors who added items",
          },
        ].map((k) => (
          <div
            key={k.label}
            className={`rounded-2xl border p-5 transition hover:shadow-subtle ${
              k.highlight
                ? "border-[#eb5a28]/20 bg-gradient-to-b from-white to-[#fff8f5]"
                : "border-border bg-white"
            }`}
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-foreground/55">
              {k.label}
            </p>
            <p className="tabular mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {k.value}
            </p>
            <p className="mt-1 text-[11px] text-foreground/50">{k.hint}</p>
            {k.href && (
              <Link
                href={k.href}
                className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#eb5a28] hover:underline"
              >
                <span>View orders</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        ))}
      </section>

      {/* Low stock warning */}
      {data.lowStock.length > 0 && (
        <section
          className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5"
          aria-label="Low stock"
        >
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
              <AlertTriangle className="h-4 w-4" />
              <span>Low Inventory Alert</span>
            </h2>
            <Link
              href="/dashboard/products"
              className="text-xs font-bold text-amber-900 hover:underline"
            >
              Manage stock →
            </Link>
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {data.lowStock.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between rounded-xl border border-amber-200/80 bg-white px-3.5 py-2 text-xs text-amber-950 font-medium"
              >
                <span className="truncate">{v.label}</span>
                <span className="tabular font-bold text-amber-700">{v.stock} units left</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Sales Chart & Recent Orders */}
      <div className="grid gap-6 lg:grid-cols-5">
        <section
          className="rounded-2xl border border-border bg-white p-6 shadow-subtle lg:col-span-3"
          aria-label="Sales chart"
        >
          <div className="flex items-center justify-between border-b border-border/80 pb-4">
            <div>
              <h2 className="text-sm font-bold text-foreground">Sales Performance</h2>
              <p className="text-xs text-foreground/50">Daily revenue over the last 7 days</p>
            </div>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-foreground/70">
              Last 7 Days
            </span>
          </div>
          <div className="mt-6">
            <AnalyticsChart data={data.chart} />
          </div>
        </section>

        <section
          className="rounded-2xl border border-border bg-white p-6 shadow-subtle lg:col-span-2"
          aria-label="Recent orders"
        >
          <div className="flex items-center justify-between border-b border-border/80 pb-4">
            <div>
              <h2 className="text-sm font-bold text-foreground">Recent Orders</h2>
              <p className="text-xs text-foreground/50">Latest customer checkouts</p>
            </div>
            <Link
              href="/dashboard/orders"
              className="text-xs font-bold text-[#eb5a28] hover:underline"
            >
              View all
            </Link>
          </div>

          {data.recent.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-border bg-canvas/60 p-6 text-center">
              <p className="text-xs font-semibold text-foreground/60">No orders yet</p>
              <p className="mt-1 text-[11px] text-foreground/45">
                Share your store link on WhatsApp or Instagram to make your first sale.
              </p>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-border/60">
              {data.recent.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-foreground">{o.customerName}</p>
                    <span
                      className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                        STATUS_STYLE[o.status] ?? ""
                      }`}
                    >
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </div>
                  <p className="tabular text-xs font-bold text-foreground">
                    {formatPrice(o.total)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
