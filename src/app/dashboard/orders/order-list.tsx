"use client";

import { updateOrderStatus, confirmOrderDelivery } from "@/lib/actions/order";
import { Eye, Mail, Phone, MapPin, Package, ShoppingCart, X, ShieldAlert, CheckCircle2, Truck, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { OrderWithItems } from "@/types";
import { motion, AnimatePresence, Variants } from "framer-motion";

interface OrderListProps {
    orders: OrderWithItems[];
    storeSlug: string;
}

export default function OrderList({ orders, storeSlug }: OrderListProps) {
    const [loading, setLoading] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);

    async function onStatusChange(id: string, status: string) {
        setLoading(id);
        try {
            await updateOrderStatus(id, status);
        } finally {
            setLoading(null);
        }
    }

    async function onConfirmDelivery(id: string) {
        setLoading(id);
        try {
            await confirmOrderDelivery(id, "VENDOR");
        } finally {
            setLoading(null);
        }
    }

    const container: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const item: Variants = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    if (!orders || orders.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bento-card border-dashed bg-card/40 p-20 text-center"
            >
                <div className="mx-auto mb-6 h-20 w-20 rounded-[28px] bg-card flex items-center justify-center shadow-bento">
                    <ShoppingCart className="h-10 w-10 text-foreground/40" />
                </div>
                <h3 className="text-xl font-bold text-foreground">No orders yet</h3>
                <p className="mt-2 text-foreground/50 max-w-sm mx-auto">
                    Your sales will appear here once customers start placing orders from your store link.
                </p>
            </motion.div>
        );
    }

    return (
        <div className="space-y-6">
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="bento-card overflow-hidden bg-card"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b bg-secondary/50">
                                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-foreground/40">Order ID</th>
                                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-foreground/40">Customer</th>
                                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-foreground/40">Details</th>
                                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-foreground/40">Amount</th>
                                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-foreground/40">Status</th>
                                <th className="px-6 py-5 text-right text-xs font-bold uppercase tracking-widest text-foreground/40">Actions</th>
                            </tr>
                        </thead>
                        <motion.tbody variants={container} className="divide-y divide-gray-100">
                            {orders.map((order) => (
                                <motion.tr
                                    variants={item}
                                    key={order.id}
                                    className="group hover:bg-indigo-50/30 transition-colors"
                                >
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="font-mono font-black text-foreground">#{order.id.slice(-6).toUpperCase()}</span>
                                            <span className="text-[10px] text-foreground/40 font-bold uppercase tracking-tight">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-foreground">{order.customerName}</span>
                                            <span className="text-xs text-foreground/40 font-medium">{order.customerEmail}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 text-foreground/50 font-medium">
                                            <Package className="h-4 w-4 text-indigo-400" />
                                            <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="font-black text-foreground">₦{Number(order.total).toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-2">
                                            <div className="relative inline-block">
                                                {order.isDisputed ? (
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                                                        <ShieldAlert className="h-3 w-3" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">DISPUTED</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            disabled={loading === order.id}
                                                            defaultValue={order.status}
                                                            onChange={(e) => onStatusChange(order.id, e.target.value)}
                                                            className={`appearance-none text-[10px] font-black uppercase tracking-widest rounded-full px-4 py-1.5 border-0 focus:ring-0 cursor-pointer ${order.status === "PAID"
                                                                ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                                                : order.status === "SHIPPED"
                                                                    ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                                                    : order.status === "DELIVERED"
                                                                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                                                        : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                                                }`}
                                                        >
                                                            <option value="PENDING">PENDING</option>
                                                            <option value="PAID">PAID</option>
                                                            <option value="SHIPPED">SHIPPED</option>
                                                            <option value="DELIVERED">DELIVERED</option>
                                                        </select>
                                                        {(order.status === "SHIPPED" || order.status === "DELIVERED") && (
                                                            <div className="flex gap-1">
                                                                <div title="Vendor Confirmed" className={`h-5 w-5 rounded-full flex items-center justify-center border ${order.vendorConfirmedDelivery ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-transparent border-gray-200 text-gray-300'}`}>
                                                                    <CheckCircle2 className="h-3 w-3" />
                                                                </div>
                                                                <div title="Customer Confirmed" className={`h-5 w-5 rounded-full flex items-center justify-center border ${order.customerConfirmedDelivery ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-transparent border-gray-200 text-gray-300'}`}>
                                                                    <CheckCircle2 className="h-3 w-3" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {order.status === "SHIPPED" && !order.vendorConfirmedDelivery && (
                                                <button
                                                    onClick={() => onConfirmDelivery(order.id)}
                                                    disabled={loading === order.id}
                                                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
                                                >
                                                    {loading === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                                                    Confirm Delivery
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right flex items-center justify-end gap-2">
                                        {order.status === "SHIPPED" && (
                                            <Link 
                                                href={`/${storeSlug}/track/${order.id}`} 
                                                target="_blank"
                                                className="h-10 w-10 inline-flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-600 transition-all active:scale-90"
                                                title="View Tracking Page"
                                            >
                                                <Truck className="h-4 w-4" />
                                            </Link>
                                        )}
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="h-10 w-10 inline-flex items-center justify-center rounded-xl bg-secondary text-foreground/40 hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-90"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </motion.tbody>
                    </table>
                </div>
            </motion.div>

            {/* Order Detail Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-3xl rounded-[32px] bg-card p-0 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            <div className="p-8 border-b flex items-center justify-between bg-secondary/50">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                        <ShoppingCart className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-foreground tracking-tight">Order Details</h3>
                                        <p className="text-sm font-mono text-foreground/40 font-bold uppercase tracking-widest">ID: #{selectedOrder.id.toUpperCase()}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="h-12 w-12 rounded-2xl bg-card border border-border/50 flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-secondary transition-all shadow-sm"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                                <div className="grid gap-10 md:grid-cols-5">
                                    <div className="md:col-span-3 space-y-10">
                                        {/* Items List */}
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 mb-6">Line Items ({selectedOrder.items.length})</h4>
                                            <div className="space-y-4">
                                                {selectedOrder.items.map((item) => (
                                                    <div key={item.id} className="flex gap-5 items-center p-4 rounded-3xl border border-gray-50 hover:border-border/50 transition-colors bg-card shadow-sm">
                                                        <div className="h-16 w-16 bg-secondary rounded-2xl shrink-0 overflow-hidden relative border border-border/50">
                                                            {item.product.imageUrl && (
                                                                <Image src={item.product.imageUrl} alt={item.product.name} fill className="object-cover" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-base font-bold text-foreground leading-tight mb-1">{item.product.name}</p>
                                                            {item.variant && (
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">
                                                                    Option: {item.variant.name}
                                                                </p>
                                                            )}
                                                            <p className="text-xs text-foreground/40 font-bold uppercase tracking-wider">Qty: {item.quantity} · ₦{Number(item.priceAtPurchase).toLocaleString()}</p>
                                                        </div>
                                                        <p className="text-lg font-black text-foreground sans">
                                                            ₦{(item.quantity * Number(item.priceAtPurchase)).toLocaleString()}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Order Summary Table */}
                                        <div className="rounded-[32px] bg-secondary/50 p-8 border border-border/50 space-y-4">
                                            <div className="flex justify-between text-sm font-bold text-foreground/50">
                                                <span>Subtotal</span>
                                                <span className="text-foreground">₦{Number(selectedOrder.subtotal).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-sm font-bold text-foreground/50">
                                                <span>Delivery Fee ({selectedOrder.deliveryArea})</span>
                                                <span className="text-foreground">₦{Number(selectedOrder.deliveryFee).toLocaleString()}</span>
                                            </div>
                                            <div className="pt-4 border-t border-border flex justify-between items-center">
                                                <span className="text-base font-black text-foreground uppercase tracking-widest">Total Paid</span>
                                                <span className="text-3xl font-black text-indigo-600 bg-card px-5 py-2 rounded-2xl shadow-sm border border-indigo-50">
                                                    ₦{Number(selectedOrder.total).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 space-y-10">
                                        {/* Customer & Shipping */}
                                        <div className="space-y-10">
                                            <div>
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 mb-6">Customer Profile</h4>
                                                <div className="space-y-4 p-6 rounded-3xl bg-card border border-border/50 shadow-sm">
                                                    <div className="flex flex-col">
                                                        <span className="text-lg font-black text-foreground leading-none mb-1">{selectedOrder.customerName}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">{selectedOrder.status}</span>
                                                            {selectedOrder.isDisputed && (
                                                                <span className="text-[10px] font-black text-red-600 uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-md border border-red-100">DISPUTED</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {selectedOrder.isDisputed && (
                                                        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 mt-2">
                                                            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1.5">Dispute Reason</p>
                                                            <p className="text-sm font-bold text-red-700 leading-snug">{selectedOrder.disputeReason}</p>
                                                        </div>
                                                    )}
                                                    <div className="space-y-3 pt-2">
                                                        <a href={`mailto:${selectedOrder.customerEmail}`} className="flex items-center gap-3 text-sm font-bold text-foreground/60 hover:text-indigo-600 transition-colors">
                                                            <div className="h-8 w-8 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                                                                <Mail className="h-4 w-4" />
                                                            </div>
                                                            {selectedOrder.customerEmail}
                                                        </a>
                                                        <a href={`tel:${selectedOrder.customerPhone}`} className="flex items-center gap-3 text-sm font-bold text-foreground/60 hover:text-indigo-600 transition-colors">
                                                            <div className="h-8 w-8 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                                                                <Phone className="h-4 w-4" />
                                                            </div>
                                                            {selectedOrder.customerPhone}
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 mb-6">Shipping Address</h4>
                                                <div className="p-6 rounded-3xl bg-indigo-50/30 border border-indigo-100 shadow-sm flex gap-4">
                                                    <div className="h-10 w-10 rounded-2xl bg-card border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-500 shadow-sm">
                                                        <MapPin className="h-5 w-5" />
                                                    </div>
                                                    <p className="text-sm font-bold text-foreground/80 leading-relaxed pt-1">
                                                        {selectedOrder.address}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-secondary/50 border-t flex gap-4">
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="flex-1 h-14 rounded-2xl bg-gray-900 p-4 text-xs font-black uppercase tracking-[0.2em] text-white hover:bg-black transition-all shadow-lg active:scale-95"
                                >
                                    Close View
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
