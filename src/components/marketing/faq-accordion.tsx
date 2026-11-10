"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
  category?: string;
}

const FAQS: FAQItem[] = [
  {
    q: "Do I need a registered CAC company or can I use my personal bank account?",
    a: "You can start immediately with your personal Nigerian bank account! LinkStore works directly with Paystack, allowing individual vendors as well as registered businesses to receive direct payouts into GTBank, Access, Zenith, Kuda, OPAY, or any commercial bank.",
    category: "Banking & Setup",
  },
  {
    q: "How and when do I get my money after a sale?",
    a: "Payments are processed securely via Paystack. Your share (95% of each order) settles straight into the Nigerian bank account you save in your Settings. Settlement follows standard Paystack next-business-day payout schedules.",
    category: "Payouts",
  },
  {
    q: "What if a buyer claims they transferred money but the bank is experiencing network delays?",
    a: "LinkStore eliminates screenshot anxiety. An order is ONLY marked as 'Paid' once Paystack's real-time banking webhook verifies that the exact naira amount has cleared. If a bank network is sluggish, LinkStore automatically re-polls Paystack so your order updates the second the funds land.",
    category: "Security",
  },
  {
    q: "How does delivery work? Do you provide the dispatch riders?",
    a: "You retain full control over your logistics. You set your custom delivery rates by location (e.g., Lagos Island, Lagos Mainland, Abuja, Interstate). When an order is ready, you ship with your preferred dispatch rider and update the order with one tap so your buyer gets real-time tracking.",
    category: "Logistics",
  },
  {
    q: "Is there any monthly subscription if I don't make sales this month?",
    a: "None at all. There are zero monthly charges, zero store listing fees, and zero software subscriptions. You only contribute the 5% platform fee on orders that actually get successfully paid.",
    category: "Pricing",
  },
  {
    q: "How does the AI shopping assistant work for my store?",
    a: "The assistant reads strictly from your live store inventory, sizes, prices, and shipping policies. When late-night shoppers ask questions like 'Do you have size 10 in stock?' or 'How much is delivery to Ikeja?', it answers accurately and helps them add items directly into their cart.",
    category: "Features",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="divide-y divide-border rounded-3xl border border-border bg-white shadow-elevated overflow-hidden">
      {FAQS.map((faq, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div key={faq.q} className="transition-colors hover:bg-canvas/50">
            <button
              type="button"
              onClick={() => toggle(idx)}
              className="flex w-full items-center justify-between gap-4 p-6 text-left"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-800">
                  {idx + 1}
                </span>
                <span className="text-base sm:text-lg font-semibold text-foreground">
                  {faq.q}
                </span>
              </div>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-foreground/50 transition-transform duration-200 ${
                  isOpen ? "rotate-180 text-primary" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div className="px-6 pb-6 pt-1 text-sm sm:text-base leading-relaxed text-foreground/75 pl-16">
                {faq.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
