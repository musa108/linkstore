"use client";

import { motion, Variants } from "framer-motion";
import {
  Users,
  Zap,
  ArrowUpRight,
  Eye,
  ShoppingBag,
  TrendingUp,
  Package,
  ArrowDownRight,
  Sparkles,
} from "lucide-react";
import Image from "next/image";

interface AnalyticsDashboardProps {
  data: {
    storeStats: {
      visits: number;
      conversionClicks: number;
    };
    productPerformance: {
      id: string;
      name: string;
      imageUrl: string | null;
      views: number;
      unitsSold: number;
      revenue: number;
      conversionRate: number;
    }[];
    totalRevenue: number;
    recentOrders: {
      total: number | string;
      createdAt: Date | string;
    }[];
  };
}

export default function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const { storeStats, productPerformance, totalRevenue } = data;

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 },
  };

  const overallConversion =
    storeStats.visits > 0
      ? ((storeStats.conversionClicks / storeStats.visits) * 100).toFixed(1)
      : "0";

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 text-foreground">
      {/* Title */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#eb5a28]">
          Business Intelligence
        </span>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
          Store Analytics
        </h1>
        <p className="mt-0.5 text-xs text-foreground/60">
          Conversion funnels, revenue breakdown, and item performance.
        </p>
      </div>

      {/* Top Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={item} className="rounded-2xl border border-border bg-white p-6 shadow-subtle group">
          <div className="flex justify-between items-start">
            <div className="h-11 w-11 rounded-xl bg-secondary flex items-center justify-center text-foreground/70 transition-transform group-hover:scale-105">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
              Active Store
            </span>
          </div>
          <div className="mt-5">
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground tabular">
              {storeStats.visits.toLocaleString()}
            </p>
            <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider mt-1">
              Total Shopper Visits
            </p>
          </div>
        </motion.div>

        <motion.div variants={item} className="rounded-2xl border border-border bg-white p-6 shadow-subtle group">
          <div className="flex justify-between items-start">
            <div className="h-11 w-11 rounded-xl bg-[#fff4ed] flex items-center justify-center text-[#eb5a28] transition-transform group-hover:scale-105">
              <Zap className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#eb5a28] bg-[#fff4ed] px-2.5 py-0.5 rounded-full border border-[#eb5a28]/20">
              Intent
            </span>
          </div>
          <div className="mt-5">
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground tabular">
              {overallConversion}%
            </p>
            <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider mt-1">
              Visit-to-Click Rate
            </p>
          </div>
        </motion.div>

        <motion.div variants={item} className="rounded-2xl border border-border bg-white p-6 shadow-subtle group">
          <div className="flex justify-between items-start">
            <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-105">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
              Settled
            </span>
          </div>
          <div className="mt-5">
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground tabular">
              ₦{totalRevenue.toLocaleString()}
            </p>
            <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider mt-1">
              Verified Revenue
            </p>
          </div>
        </motion.div>
      </div>

      {/* Product Performance Table */}
      <motion.div variants={item} className="rounded-2xl border border-border bg-white shadow-subtle overflow-hidden">
        <div className="p-6 border-b border-border/80 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
              Product Performance
            </h3>
            <p className="text-xs text-foreground/50">Breakdown of views, units sold, and conversion rates.</p>
          </div>
          <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground/60">
            Sorted by Revenue
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-canvas/70 text-[10px] font-bold uppercase tracking-wider text-foreground/45 border-b border-border">
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Views</th>
                <th className="px-6 py-4">Units Sold</th>
                <th className="px-6 py-4">Gross Revenue</th>
                <th className="px-6 py-4 text-right">Conversion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {productPerformance.map((product) => (
                <tr key={product.id} className="group hover:bg-[#fff9f6]/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3.5">
                      <div className="h-11 w-11 relative rounded-xl overflow-hidden bg-secondary border border-border/60 shrink-0">
                        {product.imageUrl ? (
                          <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-foreground/30">
                            <Package className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="block font-bold text-foreground text-xs truncate">
                          {product.name}
                        </span>
                        <span className="text-[10px] text-foreground/40 font-mono">
                          #{product.id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-foreground/60 font-semibold tabular">
                    <div className="flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 text-foreground/40" />
                      <span>{product.views.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-foreground/60 font-semibold tabular">
                    <div className="flex items-center gap-1.5">
                      <ShoppingBag className="h-3.5 w-3.5 text-foreground/40" />
                      <span>{product.unitsSold.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-foreground font-extrabold tabular">
                    ₦{product.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`inline-flex items-center gap-0.5 text-xs font-bold tabular ${
                        product.conversionRate > 5 ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {product.conversionRate}%
                      {product.conversionRate > 5 ? (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5" />
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Conversion Insights & Architectural Pro Tip Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div variants={item} className="rounded-2xl border border-border bg-white p-6 shadow-subtle">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide mb-6">
            Conversion Funnel
          </h3>
          <div className="space-y-5 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-foreground/60 uppercase text-[10px]">
                <span>Store Visits</span>
                <span className="tabular">100%</span>
              </div>
              <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-[#1e2024] transition-all" style={{ width: "100%" }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-foreground/60 uppercase text-[10px]">
                <span>Click-to-Buy Intent</span>
                <span className="tabular">{overallConversion}% of visits</span>
              </div>
              <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-[#eb5a28] transition-all" style={{ width: `${overallConversion}%` }} />
              </div>
            </div>

            <div className="space-y-1.5">
              {(() => {
                const paidOrdersCount = data.recentOrders.length;
                const checkoutToPaid =
                  storeStats.conversionClicks > 0
                    ? ((paidOrdersCount / storeStats.conversionClicks) * 100).toFixed(1)
                    : "0";
                return (
                  <>
                    <div className="flex justify-between font-bold text-foreground/60 uppercase text-[10px]">
                      <span>Payments Confirmed</span>
                      <span className="tabular">{checkoutToPaid}% of clicks</span>
                    </div>
                    <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 transition-all" style={{ width: `${checkoutToPaid}%` }} />
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </motion.div>

        {/* Architectural Charcoal Pro Tip Card */}
        <motion.div
          variants={item}
          className="rounded-2xl border border-border bg-[#1e2024] p-6 text-white shadow-elevated flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#eb5a28]" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">
                Merchant Conversion Tip
              </h3>
            </div>
            <p className="mt-3 text-xs sm:text-sm text-white/80 leading-relaxed">
              Items with high views but lower sales usually convert faster when you add size guides, clearer photos in natural lighting, or customer reviews.
            </p>
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#eb5a28] mb-2">
              Most Viewed Product
            </p>
            {productPerformance.length > 0 ? (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 relative rounded-lg bg-white/10 overflow-hidden shrink-0">
                  {productPerformance.find(
                    (p) => p.views === Math.max(...productPerformance.map((i) => i.views))
                  )?.imageUrl && (
                    <Image
                      src={
                        productPerformance.find(
                          (p) => p.views === Math.max(...productPerformance.map((i) => i.views))
                        )!.imageUrl!
                      }
                      alt="Top"
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <span className="font-bold text-xs truncate text-white">
                  {
                    productPerformance.find(
                      (p) => p.views === Math.max(...productPerformance.map((i) => i.views))
                    )?.name
                  }
                </span>
              </div>
            ) : (
              <span className="text-xs text-white/40">No views recorded yet</span>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
