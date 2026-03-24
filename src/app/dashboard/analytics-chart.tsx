"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { formatPrice } from "@/lib/utils";

interface AnalyticsChartProps {
    data: { date: string; revenue: number; orders: number }[];
}

export default function AnalyticsChart({ data }: AnalyticsChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex h-64 w-full flex-col items-center justify-center rounded-[32px] border border-dashed border-indigo-100 bg-indigo-50/20">
                <p className="text-sm font-bold text-foreground/40">No sales data available for this period.</p>
            </div>
        );
    }

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#4f46e6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#9ca3af", fontWeight: 600 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#9ca3af", fontWeight: 600 }}
                        tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }}
                        labelStyle={{ fontWeight: "bold", color: "#374151", marginBottom: '4px' }}
                        itemStyle={{ fontWeight: "bold", color: "#4f46e6" }}
                        formatter={(value: unknown, name: unknown) => {
                            const val = Array.isArray(value) ? value[0] : value;
                            const nameStr = String(name || "");
                            if (nameStr === "revenue") return [formatPrice(Number(val) || 0), "Revenue"];
                            return [val as string | number, nameStr || "Value"];
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#4f46e6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        activeDot={{ r: 6, strokeWidth: 0, fill: "#4f46e6" }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
