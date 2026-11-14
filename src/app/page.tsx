import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Star,
  Store,
  Users,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { StorefrontPreview } from "@/components/marketing/storefront-preview";
import { EarningsCalculator } from "@/components/marketing/earnings-calculator";
import { LinkClaimer } from "@/components/marketing/link-claimer";
import { ComparisonTable } from "@/components/marketing/comparison-table";
import { FeatureTabs } from "@/components/marketing/feature-tabs";
import { FaqAccordion } from "@/components/marketing/faq-accordion";

export const metadata = {
  title: "LinkStore – The Professional Store Link for Nigerian Social Commerce",
  description:
    "Turn your WhatsApp, Instagram and TikTok followers into paying customers. Instant Paystack bank transfers, automated fake alert protection, live delivery tracking and a 24/7 store assistant.",
};

const STEPS = [
  {
    n: "01",
    title: "Claim your store link & bank account",
    body: "Choose linkstore.app/yourbrand. Connect your Nigerian bank account once via Paystack so your earnings settle automatically.",
    badge: "Under 2 Minutes",
  },
  {
    n: "02",
    title: "Upload products from your phone",
    body: "Snap photos, set prices in naira, add size variants and delivery fees. Your catalogue updates immediately without writing code.",
    badge: "Zero Tech Skills",
  },
  {
    n: "03",
    title: "Share your link & receive verified orders",
    body: "Put it in your Instagram bio, TikTok profile or WhatsApp catalogue. Customers pick, pay and track; you just dispatch.",
    badge: "100% Scam-Proof",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Before LinkStore, I spent 3 hours every evening matching bank statements with DM screenshots to catch fake alerts. Now, every single order is already paid and verified by Paystack before I pack it.",
    author: "Amaka O.",
    brand: "Amaka Wears",
    category: "Fashion Boutique",
    location: "Ikeja, Lagos",
    rating: 5,
  },
  {
    quote:
      "Customers love that they can pay with a direct bank transfer and track their dispatch rider without texting me every 10 minutes. It made my small brand look 10x more trustworthy.",
    author: "Tunde B.",
    brand: "Kicks & Tech Hub",
    category: "Sneakers & Accessories",
    location: "Wuse II, Abuja",
    rating: 5,
  },
  {
    quote:
      "The AI shopping assistant literally answered midnight questions about my skincare products and closed 14 sales while I was asleep last weekend. Best tool I have used as a vendor.",
    author: "Blessing E.",
    brand: "Glow Organics",
    category: "Natural Skincare",
    location: "Port Harcourt",
    rating: 5,
  },
];

export default async function LandingPage() {
  const { userId } = await auth();
  const cta = userId
    ? { href: "/dashboard", label: "Open Dashboard" }
    : { href: "/sign-up", label: "Create Your Store" };

  return (
    <div className="min-h-screen bg-canvas text-foreground selection:bg-emerald-100 selection:text-emerald-900">
    
      {/* 1. Sticky Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />

          <nav aria-label="Main" className="hidden items-center gap-7 text-sm font-semibold text-foreground/75 md:flex">
            <a href="#how" className="transition hover:text-primary">How It Works</a>
            <a href="#comparison" className="transition hover:text-primary">Why LinkStore</a>
            <a href="#features" className="transition hover:text-primary">Features</a>
            <a href="#calculator" className="transition hover:text-primary">Calculator</a>
            <a href="#pricing" className="transition hover:text-primary">Pricing</a>
            <a href="#faq" className="transition hover:text-primary">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">

            {!userId && (
              <Link href="/sign-in" className="btn btn-quiet hidden sm:inline-flex text-xs sm:text-sm font-semibold">
                Sign In
              </Link>
            )}
            <Link href={cta.href} className="btn btn-primary text-xs sm:text-sm">
              {cta.label}
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* 2. Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h1 className="reveal reveal-1 mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl text-foreground">
                Stop losing sales to <span className="text-primary underline decoration-primary/30 decoration-wavy underline-offset-8">&ldquo;DM for price&rdquo;</span> and fake bank alerts.
              </h1>

              <p className="reveal reveal-2 mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-foreground/75">
                Give your customers a clean storefront with instant Paystack bank transfer, live order tracking, and a 24/7 store assistant that takes orders while you sleep.
              </p>

              <div className="reveal reveal-3 mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href={cta.href} className="btn btn-primary h-12 px-7 text-base font-bold shadow-md">
                  {cta.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#how" className="btn btn-quiet h-12 px-6 text-base font-semibold">
                  See How It Works
                </a>
              </div>

              {/* Micro-Trust Signals */}
              <div className="reveal reveal-3 mt-8 border-t border-border/80 pt-6">
                <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-foreground/70">
                  <li className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-primary" />
                    <span>Zero monthly subscription</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-primary" />
                    <span>Instant Paystack verification</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-primary" />
                    <span>Works on any smartphone</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right: High-Fidelity Interactive Storefront Preview */}
            <div className="reveal reveal-2 flex justify-center">
              <StorefrontPreview />
            </div>
          </div>
        </section>

        {/* 3. Proof & Trust Ecosystem */}
        <section className="border-y border-border bg-white py-10">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="text-center text-xs font-bold uppercase tracking-wider text-foreground/50">
              Trusted by social media merchants across Nigeria
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
              <div className="rounded-2xl border border-border/60 bg-canvas/60 p-4">
                <p className="tabular text-2xl font-extrabold text-foreground">₦0 / mo</p>
                <p className="mt-0.5 text-xs text-foreground/65">No monthly subscription fee</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-canvas/60 p-4">
                <p className="tabular text-2xl font-extrabold text-primary">100%</p>
                <p className="mt-0.5 text-xs text-foreground/65">Verified payment guarantee</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-canvas/60 p-4">
                <p className="tabular text-2xl font-extrabold text-foreground">20+ Banks</p>
                <p className="mt-0.5 text-xs text-foreground/65">Direct Paystack bank settlement</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-canvas/60 p-4">
                <p className="tabular text-2xl font-extrabold text-primary">24 / 7</p>
                <p className="mt-0.5 text-xs text-foreground/65">Automated catalogue assistant</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Comparison Section: The DM Struggle vs. LinkStore */}
        <section id="comparison" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="eyebrow">
              <Users className="h-3.5 w-3.5" />
              <span>THE OLD WAY VS. THE LINKSTORE WAY</span>
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
              Why Nigerian social vendors are ditching the DM scramble
            </h2>
            <p className="mt-3 text-base text-foreground/75 leading-relaxed">
              Selling through screenshots and manual chats costs you valuable hours every day and invites fake alert scams. Here is how LinkStore transforms your day.
            </p>
          </div>

          <div className="mt-12">
            <ComparisonTable />
          </div>
        </section>

        {/* 5. How It Works (3 Steps) */}
        <section id="how" className="border-y border-border bg-white py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <span className="eyebrow">
                <Zap className="h-3.5 w-3.5" />
                <span>HOW IT WORKS</span>
              </span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
                From zero to taking paid orders in three simple steps
              </h2>
              <p className="mt-2 text-base text-foreground/70">
                You do not need to hire a developer or own a computer. Everything is managed directly from your phone.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {STEPS.map((s) => (
                <div key={s.n} className="flex flex-col justify-between rounded-3xl border border-border bg-canvas p-8 shadow-subtle transition hover:border-primary/40">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-base font-extrabold text-white shadow-xs">
                        {s.n}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-foreground/70 border border-border">
                        {s.badge}
                      </span>
                    </div>
                    <h3 className="mt-6 text-xl font-bold text-foreground">{s.title}</h3>
                    <p className="mt-3 text-sm text-foreground/70 leading-relaxed">{s.body}</p>
                  </div>
                  <div className="mt-8 border-t border-border/80 pt-4 flex items-center gap-2 text-xs font-semibold text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Quick mobile setup</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Five Operational Pillars (Interactive Feature Showcase) */}
        <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="eyebrow">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>EVERYTHING YOU NEED TO SELL SAFELY</span>
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
              Built specifically for modern social retail
            </h2>
            <p className="mt-3 text-base text-foreground/75">
              Every tool in LinkStore is designed to protect your profits, automate repetitive inquiries, and build lasting customer trust.
            </p>
          </div>

          <div className="mt-12">
            <FeatureTabs />
          </div>
        </section>

        {/* 7. Interactive Earnings Calculator & Pricing */}
        <section id="calculator" className="border-y border-border bg-white py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="eyebrow">
                <Store className="h-3.5 w-3.5" />
                <span>NO SUBSCRIPTION · NO TRICKS</span>
              </span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
                You only pay when your customer pays
              </h2>
              <p className="mt-3 text-base text-foreground/75">
                We believe in simple, aligned pricing. LinkStore charges a flat 5% platform fee per paid order. If you make no sales, you pay nothing.
              </p>
            </div>

            <EarningsCalculator ctaHref={cta.href} />
          </div>
        </section>

        {/* 8. Merchant Testimonials */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="eyebrow">
              <Star className="h-3.5 w-3.5" />
              <span>AUTHENTIC VENDOR STORIES</span>
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
              Loved by Nigerian sellers who value their time
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.author} className="flex flex-col justify-between rounded-3xl border border-border bg-white p-7 shadow-elevated">
                <div>
                  <div className="flex gap-1 text-amber-500">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-500" />
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-foreground/80 leading-relaxed italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>

                <div className="mt-6 border-t border-border/80 pt-4">
                  <p className="text-sm font-bold text-foreground">{t.author}</p>
                  <p className="text-xs font-semibold text-primary">{t.brand} · {t.category}</p>
                  <p className="text-[11px] text-foreground/50">{t.location}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 9. FAQ Accordion */}
        <section id="faq" className="border-y border-border bg-canvas py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="text-center mb-10">
              <span className="eyebrow">
                <BadgeCheck className="h-3.5 w-3.5" />
                <span>FREQUENT QUESTIONS</span>
              </span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
                Everything you need to know before starting
              </h2>
            </div>

            <FaqAccordion />
          </div>
        </section>

        {/* 10. High-Impact Link Claimer Final Call to Action */}
        <section className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-5xl rounded-[2.5rem] border border-white/10 bg-[#1e2024] px-6 py-16 text-center text-white sm:px-12 shadow-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-white/80 backdrop-blur-sm">
              <Store className="h-3.5 w-3.5" />
              <span>Claim Your Brand URL Today</span>
            </div>

            <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-5xl">
              Your next verified sale is one link away.
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-base text-white/80 leading-relaxed">
              Reserve your custom store name before another vendor takes it. Set up takes less than 3 minutes directly from your phone.
            </p>

            <div className="mt-8">
              <LinkClaimer baseHref={cta.href} />
            </div>
          </div>
        </section>
      </main>

      {/* 11. Refined Professional Footer */}
      <footer className="border-t border-border bg-white text-xs text-foreground/70">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-border/80 pb-8">
            <div className="flex items-center gap-3">
              <Logo size={32} />
              <div>
                <p className="font-bold text-foreground">LinkStore Nigeria</p>
                <p className="text-[11px] text-foreground/60">Social commerce infrastructure for modern African vendors</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 font-semibold">
              <a href="#how" className="hover:text-primary">How It Works</a>
              <a href="#features" className="hover:text-primary">Features</a>
              <a href="#pricing" className="hover:text-primary">Pricing</a>
              <a href="#calculator" className="hover:text-primary">Calculator</a>
              <a href="#faq" className="hover:text-primary">FAQ</a>
              <Link href={cta.href} className="text-primary font-bold hover:underline">
                {cta.label}
              </Link>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-foreground/55">
            <div className="flex items-center gap-4">
              <span>© {new Date().getFullYear()} LinkStore Technologies. All rights reserved.</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <Lock className="h-3 w-3" /> NDPR &amp; Paystack Security Compliant
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>Built for Nigerian Instagram, TikTok &amp; WhatsApp sellers</span>
              <span>🇳🇬</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
