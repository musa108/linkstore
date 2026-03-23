import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight, Globe, LayoutDashboard, ShieldCheck, ShoppingBag, Zap, Instagram, Twitter, Facebook } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function LandingPage() {
    const { userId } = await auth();

    return (
        <div className="min-h-screen bg-canvas text-foreground selection:bg-indigo-500/30 selection:text-indigo-900 overflow-x-hidden relative font-sans">
            {/* Ambient Background */}
            <div className="fixed inset-0 -z-10 bg-canvas pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
            </div>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-[100] bg-canvas/60 backdrop-blur-xl border-b border-border/50 py-4 px-6 md:px-12">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="h-10 w-10 relative overflow-hidden rounded-xl shadow-lg border border-white/20 transition-transform group-hover:scale-110 group-hover:rotate-3">
                            <Image src="/logo.png" alt="LinkStore" fill className="object-cover" />
                        </div>
                        <span className="text-2xl font-black italic tracking-tighter text-foreground uppercase">LinkStore</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-8">
                        {["Features", "Enterprise", "Pricing"].map((item) => (
                            <Link key={item} href="#" className="text-sm font-black uppercase tracking-widest text-foreground/40 hover:text-indigo-500 transition-colors">
                                {item}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-4">
                        {userId ? (
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-black text-white shadow-xl shadow-indigo-500/10 transition-all hover:bg-indigo-700 active:scale-95"
                            >
                                Dashboard
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        ) : (
                            <>
                                <div className="hidden sm:block">
                                    <SignInButton mode="modal">
                                        <button className="text-sm font-black uppercase tracking-widest text-foreground/50 hover:text-foreground transition-colors">
                                            Log In
                                        </button>
                                    </SignInButton>
                                </div>
                                <SignUpButton mode="modal">
                                    <button className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-black text-white shadow-xl shadow-indigo-500/10 transition-all hover:bg-indigo-700 active:scale-95">
                                        Start Free
                                    </button>
                                </SignUpButton>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="pt-32 md:pt-48 pb-24 md:pb-40 px-6 relative">
                <div className="max-w-7xl mx-auto text-center space-y-12">
                    <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        <Zap className="h-3 w-3 fill-indigo-500" />
                        Built for Nigerian Merchants
                    </div>

                    <h1 className="text-6xl md:text-9xl font-black tracking-tighter text-foreground leading-[0.85] max-w-5xl mx-auto italic animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                        Sell more on <br />
                        <span className="text-indigo-500">Social Media.</span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-xl md:text-2xl font-medium text-foreground/60 leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                        Turn your Instagram, WhatsApp, and TikTok bio into a professional storefront. One Link, countless sales.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
                        <SignUpButton mode="modal">
                            <button className="w-full sm:w-auto flex items-center justify-center gap-3 rounded-2xl bg-foreground text-canvas px-10 py-5 text-lg font-black transition-all hover:scale-105 active:scale-95 group shadow-2xl">
                                Create Your Store
                                <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
                            </button>
                        </SignUpButton>
                        <Link
                            href="/dashboard"
                            className="w-full sm:w-auto text-sm font-black uppercase tracking-[0.2em] text-foreground/40 hover:text-indigo-500 transition-colors py-4"
                        >
                            View Samples
                        </Link>
                    </div>

                    {/* App Mockup */}
                    <div className="relative pt-24 animate-in fade-in zoom-in duration-1000 delay-500">
                        <div className="absolute inset-0 bg-indigo-500/5 blur-3xl rounded-full -z-10 scale-75" />
                        <div className="relative mx-auto max-w-5xl aspect-video rounded-3xl md:rounded-[48px] overflow-hidden border-[8px] md:border-[16px] border-card shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] group">
                            <Image 
                                src="/mockup.png" 
                                alt="LinkStore Dashboard" 
                                fill 
                                className="object-cover transition-transform duration-700 group-hover:scale-105" 
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* Features Bento */}
            <section className="py-32 px-6 relative overflow-hidden">
                <div className="max-w-7xl mx-auto space-y-16">
                    <div className="text-center md:text-left space-y-4">
                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground italic">
                            Everything you need to <br />
                            <span className="text-indigo-500">scale.</span>
                        </h2>
                    </div>

                    <div className="grid gap-8 md:grid-cols-6 md:grid-rows-2">
                        <div className="md:col-span-3 bento-card p-10 space-y-6 group border-indigo-500/10">
                            <div className="h-16 w-16 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-transform">
                                <ShoppingBag className="h-8 w-8" />
                            </div>
                            <h3 className="text-3xl font-black tracking-tight">One-Click Storefronts</h3>
                            <p className="text-foreground/50 font-medium leading-relaxed">
                                Upload your products once and get a beautiful, lightning-fast store URL for your bio. No coding required.
                            </p>
                        </div>

                        <div className="md:col-span-3 bento-card p-10 space-y-6 group border-amber-500/10">
                            <div className="h-16 w-16 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg group-hover:-rotate-6 transition-transform">
                                <Zap className="h-8 w-8" />
                            </div>
                            <h3 className="text-3xl font-black tracking-tight">Automated Payouts</h3>
                            <p className="text-foreground/50 font-medium leading-relaxed">
                                Integrated with Paystack Split Payments. The system automatically handles payouts so you can focus on selling.
                            </p>
                        </div>

                        <div className="md:col-span-2 bento-card p-10 space-y-4 group">
                            <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center text-foreground/60 group-hover:scale-110 transition-transform">
                                <LayoutDashboard className="h-6 w-6" />
                            </div>
                            <h4 className="text-xl font-black">Mobile-First</h4>
                            <p className="text-sm font-medium text-foreground/40 leading-relaxed">
                                Manage orders and see analytics directly from your smartphone.
                            </p>
                        </div>

                        <div className="md:col-span-2 bento-card p-10 space-y-4 group border-emerald-500/10">
                            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <h4 className="text-xl font-black">Secure Checkout</h4>
                            <p className="text-sm font-medium text-foreground/40 leading-relaxed">
                                Enterprise-grade security for every transaction through Paystack.
                            </p>
                        </div>

                        <div className="md:col-span-2 bento-card p-10 space-y-4 group border-blue-500/10">
                            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                <Globe className="h-6 w-6" />
                            </div>
                            <h4 className="text-xl font-black">Custom Branding</h4>
                            <p className="text-sm font-medium text-foreground/40 leading-relaxed">
                                Your logo, your colors, your brand. Our technology.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="relative overflow-hidden rounded-[48px] bg-foreground px-8 py-24 md:py-32 text-center text-canvas shadow-3xl">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2)_0%,transparent_50%)]" />
                        <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none italic">
                                Ready to join the <span className="text-indigo-500">future</span> of commerce?
                            </h2>
                            <p className="text-xl text-canvas/60 font-medium max-w-xl mx-auto">
                                Join 500+ merchants who have built their social media empire with LinkStore.
                            </p>
                            <SignUpButton mode="modal">
                                <button className="inline-flex items-center gap-3 rounded-2xl bg-canvas px-12 py-5 text-xl font-black text-foreground transition-all hover:scale-105 active:scale-95 group shadow-xl">
                                    Get Started For Free
                                    <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
                                </button>
                            </SignUpButton>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-24 px-6 border-t border-border/50 bg-canvas relative overflow-hidden">
                <div className="max-w-7xl mx-auto grid gap-12 md:grid-cols-4">
                    <div className="md:col-span-2 space-y-6">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="h-10 w-10 relative overflow-hidden rounded-xl shadow-lg border border-white/20">
                                <Image src="/logo.png" alt="LinkStore" fill className="object-cover" />
                            </div>
                            <span className="text-2xl font-black italic tracking-tighter uppercase">LinkStore</span>
                        </Link>
                        <p className="text-foreground/40 font-medium max-w-xs leading-relaxed">
                            Helping Nigerian entrepreneurs bridge the gap between social media and professional commerce.
                        </p>
                        <div className="flex gap-4">
                            {[Instagram, Twitter, Facebook].map((Icon, i) => (
                                <Link key={i} href="#" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-foreground/40 hover:text-indigo-500 transition-all hover:scale-110">
                                    <Icon className="h-5 w-5" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {[
                        { title: "Platform", links: ["Features", "Dashboard", "Marketplace", "API"] },
                        { title: "Company", links: ["About", "Success Stories", "Blog", "Contact"] },
                    ].map((col) => (
                        <div key={col.title} className="space-y-6">
                            <h4 className="text-sm font-black uppercase tracking-widest text-foreground">{col.title}</h4>
                            <ul className="space-y-4">
                                {col.links.map((link) => (
                                    <li key={link}>
                                        <Link href="#" className="text-sm font-bold text-foreground/40 hover:text-indigo-500 transition-colors">
                                            {link}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div className="max-w-7xl mx-auto pt-24 mt-24 border-t border-border/10 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/20">
                        © 2026 LinkStore. Build with excellence.
                    </p>
                </div>
            </footer>
        </div>
    );
}
