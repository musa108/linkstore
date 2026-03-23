"use client";

import { deleteProduct } from "@/lib/actions/product";
import { Pencil, Trash, Package, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Product } from "@/types";
import { motion, Variants } from "framer-motion";

interface ProductListProps {
    products: Product[];
    defaultThreshold?: number;
}

export default function ProductList({ products, defaultThreshold = 5 }: ProductListProps) {
    const [loading, setLoading] = useState<string | null>(null);

    async function onDelete(id: string) {
        if (!confirm("Are you sure you want to delete this product?")) return;

        setLoading(id);
        try {
            const result = await deleteProduct(id);
            if (result.error) alert(result.error);
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

    if (products.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bento-card border-dashed bg-white/40 p-20 text-center"
            >
                <div className="mx-auto mb-6 h-20 w-20 rounded-[28px] bg-card flex items-center justify-center shadow-bento">
                    <Package className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">No products yet</h3>
                <p className="mt-2 text-gray-500 max-w-sm mx-auto">
                    Add your first product to start selling on your LinkStore.
                </p>
                <Link
                    href="/dashboard/products/new"
                    className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-indigo-700 active:scale-95"
                >
                    <Plus className="h-4 w-4" />
                    Create My First Product
                </Link>
            </motion.div>
        );
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="bento-card overflow-hidden bg-white"
        >
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b bg-gray-50/50">
                            <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-gray-400">Product</th>
                            <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-gray-400">Price</th>
                            <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-gray-400">Inventory</th>
                            <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-gray-400">Added Date</th>
                            <th className="px-6 py-5 text-right text-xs font-bold uppercase tracking-widest text-gray-400">Actions</th>
                        </tr>
                    </thead>
                    <motion.tbody variants={container} className="divide-y divide-gray-100">
                        {products.map((product) => (
                            <motion.tr
                                key={product.id}
                                variants={item}
                                className="group hover:bg-indigo-50/30 transition-colors"
                            >
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 relative rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 group-hover:scale-105 transition-transform">
                                            {product.imageUrl ? (
                                                <Image
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-gray-300">
                                                    <Package className="h-6 w-6" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <span className="block font-bold text-gray-900 leading-none mb-1">{product.name}</span>
                                            <span className="text-xs text-gray-400 font-medium">ID: {product.id.slice(-6).toUpperCase()}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="font-black text-gray-900">₦{Number(product.price).toLocaleString()}</span>
                                </td>
                                <td className="px-6 py-5">
                                    {(() => {
                                        const totalStock = product.variants?.reduce((acc, v) => acc + (v.stockCount || 0), 0) ?? 0;
                                        const threshold = product.lowStockThreshold ?? defaultThreshold;
                                        const isLowStock = totalStock > 0 && totalStock <= threshold;
                                        const isOutOfStock = totalStock === 0 || !product.inStock;

                                        if (isOutOfStock) {
                                            return (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-red-50 text-red-700 border-red-100">
                                                    Out of Stock
                                                </span>
                                            );
                                        }

                                        if (isLowStock) {
                                            return (
                                                <div className="space-y-1">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-amber-50 text-amber-700 border-amber-100">
                                                        Low Stock
                                                    </span>
                                                    <span className="block text-[10px] text-amber-600 font-bold ml-1">{totalStock} remaining</span>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div className="space-y-1">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-emerald-50 text-emerald-700 border-emerald-100">
                                                    Active
                                                </span>
                                                <span className="block text-[10px] text-emerald-600 font-bold ml-1">{totalStock} in stock</span>
                                            </div>
                                        );
                                    })()}
                                </td>
                                <td className="px-6 py-5 text-gray-500 font-medium">
                                    {new Date(product.createdAt).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <div className="flex justify-end gap-3">
                                        <Link
                                            href={`/dashboard/products/${product.id}`}
                                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-90"
                                            title="Edit Product"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Link>
                                        <button
                                            onClick={() => onDelete(product.id)}
                                            disabled={loading === product.id}
                                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all active:scale-90 disabled:opacity-50"
                                            title="Delete Product"
                                        >
                                            <Trash className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </motion.tbody>
                </table>
            </div>
        </motion.div>
    );
}
