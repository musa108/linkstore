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
    ArrowDownRight
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
                staggerChildren: 0.1
            }
        }
    };

    const item: Variants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    const overallConversion = storeStats.visits > 0 
        ? ((storeStats.conversionClicks / storeStats.visits) * 100).toFixed(1) 
        : "0";

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-10"
        >
            {/* Top Level Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <motion.div variants={item} className="bento-card p-8 group">
                    <div className="flex justify-between items-start">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-110">
                            <Users className="h-6 w-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                            +12% vs last week
                        </span>
                    </div>
                    <div className="mt-6">
                        <p className="text-4xl font-black tracking-tighter text-foreground">{storeStats.visits.toLocaleString()}</p>
                        <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest mt-1">Total Store Visits</p>
                    </div>
                </motion.div>

                <motion.div variants={item} className="bento-card p-8 group">
                    <div className="flex justify-between items-start">
                        <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 transition-transform group-hover:scale-110">
                            <Zap className="h-6 w-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                            Action Rate
                        </span>
                    </div>
                    <div className="mt-6">
                        <p className="text-4xl font-black tracking-tighter text-foreground">{overallConversion}%</p>
                        <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest mt-1">Visit-to-Click Rate</p>
                    </div>
                </motion.div>

                <motion.div variants={item} className="bento-card p-8 group overflow-hidden relative">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                        </div>
                        <div className="mt-6">
                            <p className="text-4xl font-black tracking-tighter text-foreground">₦{totalRevenue.toLocaleString()}</p>
                            <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest mt-1">Total Verified Revenue</p>
                        </div>
                    </div>
                    <div className="absolute -right-4 -bottom-4 h-32 w-32 bg-emerald-50/50 rounded-full blur-2xl" />
                </motion.div>
            </div>

            {/* Product Performance Table */}
            <motion.div variants={item} className="bento-card overflow-hidden">
                <div className="p-8 border-b border-border/50 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black text-foreground tracking-tight">Product Performance</h3>
                        <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest mt-1">Detailed breakdown of product-level metrics.</p>
                    </div>
                    <div className="h-10 px-4 rounded-xl bg-secondary flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-foreground/40 border border-border/50">
                        Sorted by Revenue
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-secondary/50 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 border-b border-border/50">
                                <th className="px-8 py-5">Product</th>
                                <th className="px-8 py-5">Views</th>
                                <th className="px-8 py-5">Sales</th>
                                <th className="px-8 py-5">Revenue</th>
                                <th className="px-8 py-5 text-right">Conversion</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {productPerformance.map((product) => (
                                <tr key={product.id} className="group hover:bg-secondary/50 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 relative rounded-xl overflow-hidden bg-secondary border border-border/50 group-hover:scale-105 transition-transform">
                                                {product.imageUrl ? (
                                                    <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center text-gray-300">
                                                        <Package className="h-5 w-5" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <span className="block font-black text-foreground group-hover:text-indigo-600 transition-colors line-clamp-1">{product.name}</span>
                                                <span className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest">ID: {product.id.slice(-6).toUpperCase()}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-foreground/60 font-bold">
                                        <div className="flex items-center gap-2">
                                            <Eye className="h-3 w-3 text-indigo-400" />
                                            {product.views.toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-foreground/60 font-bold">
                                        <div className="flex items-center gap-2">
                                            <ShoppingBag className="h-3 w-3 text-emerald-400" />
                                            {product.unitsSold.toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-foreground font-black">
                                        ₦{product.revenue.toLocaleString()}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <span className={`inline-flex items-center gap-1 text-xs font-black ${product.conversionRate > 5 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            {product.conversionRate}%
                                            {product.conversionRate > 5 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Conversion Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div variants={item} className="bento-card p-8">
                    <h3 className="text-xl font-black text-foreground tracking-tight mb-8">Sales Funnel</h3>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-foreground/40">
                                <span>Store Visits</span>
                                <span>100%</span>
                            </div>
                            <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-600 transition-all" style={{ width: '100%' }} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-foreground/40">
                                <span>Click-to-Buy Intent</span>
                                <span>{overallConversion}% of visits</span>
                            </div>
                            <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 transition-all" style={{ width: `${overallConversion}%` }} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            {(() => {
                                const paidOrdersCount = data.recentOrders.length; // Approximate
                                const checkoutToPaid = storeStats.conversionClicks > 0 
                                    ? ((paidOrdersCount / storeStats.conversionClicks) * 100).toFixed(1)
                                    : "0";
                                return (
                                    <>
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-foreground/40">
                                            <span>Payment Confirmed</span>
                                            <span>{checkoutToPaid}% of clicks</span>
                                        </div>
                                        <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${checkoutToPaid}%` }} />
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </motion.div>

                <motion.div variants={item} className="bento-card p-8 bg-indigo-900 text-white shadow-indigo-100">
                    <h3 className="text-xl font-black tracking-tight mb-4 italic">Pro Tip: Boost Conversions</h3>
                    <p className="text-indigo-100 text-sm font-medium leading-relaxed">
                         Your products with higher view counts but low conversion might need better descriptions or more media. Consider adding a video or positive customer reviews to these items!
                    </p>
                    <div className="mt-8 p-4 rounded-2xl bg-card/10 border border-white/10">
                        <p className="text-[10px] font-black uppercase tracking-widest mb-2">Most viewed product</p>
                        {productPerformance.length > 0 ? (
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 relative rounded-lg bg-card/20">
                                    {productPerformance.find(p => p.views === Math.max(...productPerformance.map(i => i.views)))?.imageUrl && (
                                        <Image src={productPerformance.find(p => p.views === Math.max(...productPerformance.map(i => i.views)))!.imageUrl!} alt="Top" fill className="object-cover rounded-lg" />
                                    )}
                                </div>
                                <span className="font-bold text-sm truncate">{productPerformance.find(p => p.views === Math.max(...productPerformance.map(i => i.views)))?.name}</span>
                            </div>
                        ) : (
                            <span className="text-xs opacity-50">No data yet</span>
                        )}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
