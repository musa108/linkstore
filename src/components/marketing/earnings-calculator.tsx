"use client";

import React, { useState } from "react";
import { ArrowRight, BadgeCheck, Check, DollarSign, Landmark, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";

export function EarningsCalculator({ ctaHref = "/sign-up" }: { ctaHref?: string }) {
  const [salesVolume, setSalesVolume] = useState<number>(350000);

  const feeRate = 0.05;
  const platformFee = Math.round(salesVolume * feeRate);
  const netEarnings = salesVolume - platformFee;

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="rounded-3xl border border-border bg-white p-6 sm:p-10 shadow-elevated">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
        {/* Left: Interactive Slider */}
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Interactive Payout Calculator</span>
          </div>

          <h3 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            See exactly what enters your bank account.
          </h3>
          <p className="mt-2 text-sm text-foreground/70">
            Zero setup fees. Zero monthly software charges. If you don&apos;t make sales, you pay ₦0.
          </p>

          <div className="mt-8 rounded-2xl border border-border/80 bg-canvas p-5 sm:p-6">
            <div className="flex items-baseline justify-between">
              <label htmlFor="sales-slider" className="text-xs font-bold uppercase tracking-wider text-foreground/60">
                Estimated Monthly Sales
              </label>
              <span className="tabular text-2xl sm:text-3xl font-extrabold text-foreground">
                {formatNaira(salesVolume)}
              </span>
            </div>

            <div className="mt-4">
              <input
                id="sales-slider"
                type="range"
                min={50000}
                max={3000000}
                step={25000}
                value={salesVolume}
                onChange={(e) => setSalesVolume(Number(e.target.value))}
                className="h-2.5 w-full cursor-pointer appearance-none rounded-lg bg-border accent-primary"
              />
              <div className="mt-2 flex justify-between text-[11px] font-semibold text-foreground/50">
                <span>₦50,000</span>
                <span>₦1,000,000</span>
                <span>₦2,000,000</span>
                <span>₦3,000,000</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-foreground/65">
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-primary" /> Automatic daily Paystack settlement
            </span>
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-primary" /> Supported across all Nigerian banks
            </span>
          </div>
        </div>

        {/* Right: Net Breakdown Card */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border-2 border-primary/20 bg-emerald-50/40 p-6 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              Your Net Payout (95%)
            </p>
            <div className="mt-2">
              <p className="tabular text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {formatNaira(netEarnings)}
              </p>
              <p className="mt-0.5 text-xs text-foreground/60">Directly settled to your account</p>
            </div>

            <div className="my-6 space-y-3 border-y border-border/80 py-4 text-xs">
              <div className="flex justify-between text-foreground/80">
                <span>Gross sales</span>
                <span className="tabular font-semibold">{formatNaira(salesVolume)}</span>
              </div>
              <div className="flex justify-between text-foreground/80">
                <span>LinkStore platform fee (5%)</span>
                <span className="tabular font-semibold text-foreground">-{formatNaira(platformFee)}</span>
              </div>
              <div className="flex justify-between text-foreground/80">
                <span>Monthly subscription</span>
                <span className="font-bold text-emerald-700">₦0.00 / free</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-foreground/70 mb-5">
              <Landmark className="h-4 w-4 text-foreground/50 shrink-0" />
              <span>Paid into GTB, Access, Zenith, Kuda, OPAY or any Nigerian bank.</span>
            </div>

            <Link
              href={ctaHref}
              className="btn btn-primary h-12 w-full text-center text-sm font-bold shadow-sm"
            >
              Start Selling With 0 Setup Fee
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
