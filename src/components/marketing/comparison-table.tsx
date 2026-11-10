import React from "react";
import { Check, X } from "lucide-react";

const COMPARISON_ROWS = [
  {
    feature: "Pricing Transparency",
    dmChaos: "Typing 'DM for price' and losing 60% of interested buyers who refuse to text.",
    linkStore: "Clear, instant product catalogue with prices, sizes, and stock availability live 24/7.",
  },
  {
    feature: "Payment Proof & Security",
    dmChaos: "Chasing blurry screenshots, delayed bank alerts, and falling for Photoshop transfer scams.",
    linkStore: "100% automated Paystack verification. Orders only confirm when money settles.",
  },
  {
    feature: "Late Night Sales",
    dmChaos: "Customers inquiring at midnight get ignored until morning and buy elsewhere.",
    linkStore: "Built-in AI shopping assistant answers questions about stock & shipping while you sleep.",
  },
  {
    feature: "Delivery & Tracking",
    dmChaos: "Buyers texting 'Where is my order?' every 30 minutes; endless WhatsApp friction.",
    linkStore: "Every buyer receives an automated live tracking link with rider dispatch updates.",
  },
  {
    feature: "Sales Bookkeeping",
    dmChaos: "Flipping through paper notebooks and manual bank statements to calculate monthly profit.",
    linkStore: "Clean phone dashboard showing gross volume, top sellers, and repeat customers.",
  },
];

export function ComparisonTable() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-elevated">
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
        {/* Left Column: The DM Struggle */}
        <div className="bg-rose-50/25 p-6 sm:p-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800">
            <X className="h-3.5 w-3.5" />
            <span>The Traditional DM Struggle</span>
          </div>
          <h3 className="mt-3 text-xl font-bold text-foreground">
            Selling through screenshots and voice notes
          </h3>
          <p className="mt-1 text-xs text-foreground/60">
            High stress, lost customers, and hours spent answering the same inquiries manually.
          </p>

          <div className="mt-6 space-y-5">
            {COMPARISON_ROWS.map((row) => (
              <div key={row.feature} className="flex items-start gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 mt-0.5">
                  <X className="h-3.5 w-3.5 stroke-[2.5]" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-foreground/50">
                    {row.feature}
                  </p>
                  <p className="mt-0.5 text-sm text-foreground/75 leading-relaxed">
                    {row.dmChaos}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: The LinkStore Way */}
        <div className="bg-emerald-50/30 p-6 sm:p-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
            <Check className="h-3.5 w-3.5" />
            <span>The LinkStore Standard</span>
          </div>
          <h3 className="mt-3 text-xl font-bold text-foreground">
            A frictionless, automated social storefront
          </h3>
          <p className="mt-1 text-xs text-foreground/60">
            Fast mobile checkout, verified Paystack payments, and peace of mind.
          </p>

          <div className="mt-6 space-y-5">
            {COMPARISON_ROWS.map((row) => (
              <div key={row.feature} className="flex items-start gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mt-0.5">
                  <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-800/80">
                    {row.feature}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-foreground leading-relaxed">
                    {row.linkStore}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
