"use client";

import { TrendingUp, Zap, ShoppingCart } from "lucide-react";
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
                <h2 className="text-4xl font-black text-gray-900 tracking-tight">Welcome back, {store.name}</h2>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Here is what is happening with your store today.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-8 auto-rows-fr">
                {/* Main Stat - Large */}
                <motion.div
                    variants={item}
                    className="md:col-span-2 md:row-span-2 bento-card p-10 flex flex-col justify-between group h-[400px] border-indigo-100"
                >
                    <div className="flex justify-between items-start">
                        <div className="space-y-4">
                            <div className="h-16 w-16 rounded-[28px] bg-indigo-50 flex items-center justify-center text-indigo-600 transition-all group-hover:scale-110 group-hover:rotate-3 shadow-sm group-hover:shadow-indigo-100">
                                <TrendingUp className="h-9 w-9" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Total Visits</h3>
                                <p className="text-8xl font-black tracking-tighter text-gray-900 mt-4 leading-none">{store.visits}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 border border-emerald-100">
                                +12% this week
                            </span>
                        </div>
                    </div>
                    <div className="mt-8 -mx-6 -mb-6 h-64">
                        <AnalyticsChart data={chartData} />
                    </div>
                </motion.div>

                {/* Conversion Stat - Wide */}
                <motion.div
                    variants={item}
                    className="md:col-span-2 bento-card p-10 flex items-center justify-between group border-amber-100/50"
                >
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Conversion Rate</h3>
                        <p className="text-6xl font-black tracking-tighter text-gray-900 leading-none">
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
                        <p className="text-3xl font-black tracking-tighter text-gray-900 leading-none mb-2">{store._count?.orders || 0}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Orders</p>
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
                        <p className="text-3xl font-black tracking-tighter text-gray-900 leading-none mb-2">₦{totalRevenue.toLocaleString()}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Sales</p>
                    </div>
                </motion.div>
            </div>

            {/* Empty State / Activity Section */}
            <motion.div
                variants={item}
                className="mt-12 bento-card border-dashed bg-white/40 p-20 text-center relative overflow-hidden group shadow-immersive"
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
                    <div className="mx-auto mb-8 h-24 w-24 rounded-[32px] bg-white relative overflow-hidden shadow-bento group-hover:scale-110 group-hover:rotate-6 transition-all border border-gray-100 p-4">
                        <Image src="/logo.png" alt="LinkStore" fill className="object-contain p-4" />
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tight">Your Business Journey</h3>
                    <p className="mt-4 text-gray-500 max-w-sm mx-auto font-bold uppercase tracking-widest text-[10px] leading-relaxed">
                        LinkStore is tracking every visitor and click. <br />Scale your social media sales with ease.
                    </p>
                    <button className="mt-10 px-10 py-5 bg-gray-900 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95 hover:bg-black hover:shadow-2xl shadow-gray-200">
                        Share My Store
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
