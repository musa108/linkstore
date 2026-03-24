"use client";

import { useState } from "react";
import { TrendingUp, Zap, ShoppingCart, Share2, Check } from "lucide-react";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import AnalyticsChart from "./analytics-chart";

import { Store } from "@prisma/client";

interface DashboardOverviewProps {
    store: Store & { _count?: { products: number; orders: number }, visits: number, conversionClicks: number };
    chartData?: { date: string; revenue: number; orders: number }[];
    totalRevenue?: number;
}

export default function DashboardOverview({ store, chartData = [], totalRevenue = 0 }: DashboardOverviewProps) {
    const [copied, setCopied] = useState(false);

    const onShare = async () => {
        const url = `${window.location.origin}/${store.slug}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: store.name,
                    text: `Check out my store on LinkStore: ${store.name}`,
                    url: url,
                });
            } catch (err) {
                // Ignore abortions
                if ((err as Error).name !== 'AbortError') {
                    console.error(err);
                }
            }
        } else {
            try {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error("FAILED_TO_COPY", err);
            }
        }
    };

    const container: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const item: Variants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-10"
        >
            <motion.div variants={item}>
                <h2 className="text-4xl font-black text-foreground tracking-tight">Welcome back, {store.name}</h2>
                <p className="text-sm font-bold text-foreground/40 uppercase tracking-widest mt-1">Here is what is happening with your store today.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-8 auto-rows-fr">
                {/* Main Stat - Large */}
                <motion.div
                    variants={item}
                    className="md:col-span-2 md:row-span-2 bento-card p-6 md:p-10 group min-h-[400px] border-indigo-100 overflow-hidden"
                >
                    <div className="flex flex-col h-full">
                        <div className="flex justify-between items-start text-left">
                            <div className="space-y-4">
                                <div className="h-16 w-16 rounded-[28px] bg-indigo-50 flex items-center justify-center text-indigo-600 transition-all group-hover:scale-110 group-hover:rotate-3 shadow-sm group-hover:shadow-indigo-100">
                                    <TrendingUp className="h-9 w-9" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/40">Total Visits</h3>
                                    <p className="text-6xl md:text-8xl font-black tracking-tighter text-foreground mt-4 leading-none">{store.visits}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 border border-emerald-100">
                                    +12% this week
                                </span>
                            </div>
                        </div>
                        <div className="mt-auto pt-8 h-64 w-full">
                            <AnalyticsChart data={chartData} />
                        </div>
                    </div>
                </motion.div>

                {/* Conversion Stat - Wide */}
                <motion.div
                    variants={item}
                    className="md:col-span-2 bento-card p-10 flex items-center justify-between group border-amber-100/50"
                >
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/40">Conversion Rate</h3>
                        <p className="text-6xl font-black tracking-tighter text-foreground leading-none">
                            {store.visits > 0 ? ((store.conversionClicks / store.visits) * 100).toFixed(1) : 0}%
                        </p>
                    </div>
                    <div className="h-16 w-16 rounded-[24px] bg-amber-50 flex items-center justify-center text-amber-600 transition-all group-hover:scale-110 group-hover:-rotate-3 shadow-sm group-hover:shadow-amber-100 border border-amber-100">
                        <Zap className="h-8 w-8" />
                    </div>
                </motion.div>

                {/* Small Stats */}
                <motion.div
                    variants={item}
                    className="bento-card p-8 flex flex-col justify-between group border-emerald-100/50"
                >
                    <div className="h-14 w-14 rounded-[22px] bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                        <ShoppingCart className="h-6 w-6" />
                    </div>
                    <div className="mt-6">
                        <p className="text-3xl font-black tracking-tighter text-foreground leading-none mb-2">{store._count?.orders || 0}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Total Orders</p>
                    </div>
                </motion.div>

                <motion.div
                    variants={item}
                    className="bento-card p-8 flex flex-col justify-between group border-blue-100/50"
                >
                    <div className="h-14 w-14 rounded-[22px] bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                    <div className="mt-6">
                        <p className="text-3xl font-black tracking-tighter text-foreground leading-none mb-2">₦{totalRevenue.toLocaleString()}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Total Sales</p>
                    </div>
                </motion.div>
            </div>

            {/* Empty State / Activity Section */}
            <motion.div
                variants={item}
                className="mt-12 bento-card border-dashed bg-card/40 p-10 md:p-20 text-center relative overflow-hidden group shadow-immersive"
            >
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 h-96 w-96 bg-indigo-50/50 rounded-full blur-3xl p-40"
                    style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.1) 0%, rgba(255,255,255,0) 70%)' }}
                />

                <div className="relative z-10">
                    <div className="mx-auto mb-8 h-24 w-24 rounded-[32px] bg-card relative overflow-hidden shadow-bento group-hover:scale-110 group-hover:rotate-6 transition-all border border-border/50 p-4">
                        <Image src="/logo.png" alt="LinkStore" fill className="object-contain p-4" />
                    </div>
                    <h3 className="text-3xl font-black text-foreground tracking-tight">Your Business Journey</h3>
                    <p className="mt-4 text-foreground/50 max-w-sm mx-auto font-bold uppercase tracking-widest text-[10px] leading-relaxed">
                        LinkStore is tracking every visitor and click. <br />Scale your social media sales with ease.
                    </p>
                    <button
                        onClick={onShare}
                        className="mt-10 group relative flex h-14 w-full md:w-64 items-center justify-center overflow-hidden rounded-2xl bg-gray-900 text-xs font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-black active:scale-[0.98] shadow-xl"
                    >
                        <span className={`flex items-center gap-2 transition-all duration-300 ${copied ? "opacity-0 scale-50" : "opacity-100 scale-100"}`}>
                            <Share2 className="h-4 w-4" />
                            Share My Store
                        </span>
                        {copied && (
                            <div className="absolute inset-0 flex items-center justify-center gap-2 text-emerald-400 bg-gray-900">
                                <Check className="h-4 w-4" />
                                Link Copied
                            </div>
                        )}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
