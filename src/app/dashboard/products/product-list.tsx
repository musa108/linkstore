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
        staggerChildren: 0.05,
      },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  if (products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-dashed border-border bg-white p-16 text-center shadow-subtle"
      >
        <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center text-foreground/40">
          <Package className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-foreground">No products in catalogue</h3>
        <p className="mt-1 text-xs text-foreground/50 max-w-sm mx-auto">
          Add your first product to display on your LinkStore storefront.
        </p>
        <Link
          href="/dashboard/products/new"
          className="btn btn-primary mt-6 text-xs font-bold"
        >
          <Plus className="h-4 w-4" />
          Add First Product
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="overflow-hidden rounded-2xl border border-border bg-white shadow-subtle"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-canvas/70">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-foreground/45">
                Product
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-foreground/45">
                Price
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-foreground/45">
                Stock Status
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-foreground/45">
                Date Added
              </th>
              <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-foreground/45">
                Actions
              </th>
            </tr>
          </thead>
          <motion.tbody variants={container} className="divide-y divide-border/60">
            {products.map((product) => (
              <motion.tr
                key={product.id}
                variants={item}
                className="group hover:bg-[#fff9f6]/40 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 relative rounded-xl overflow-hidden bg-secondary border border-border/60 shrink-0">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-foreground/30">
                          <Package className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="block font-bold text-foreground text-xs truncate">
                        {product.name}
                      </span>
                      <span className="text-[10px] text-foreground/40 font-mono">
                        #{product.id.slice(-6).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-extrabold text-foreground tabular">
                    ₦{Number(product.price).toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {(() => {
                    const totalStock =
                      product.variants?.reduce((acc, v) => acc + (v.stockCount || 0), 0) ?? 0;
                    const threshold = product.lowStockThreshold ?? defaultThreshold;
                    const isLowStock = totalStock > 0 && totalStock <= threshold;
                    const isOutOfStock = totalStock === 0 || !product.inStock;

                    if (isOutOfStock) {
                      return (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                          Out of Stock
                        </span>
                      );
                    }

                    if (isLowStock) {
                      return (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                            Low Stock
                          </span>
                          <span className="block text-[10px] text-amber-700 font-semibold tabular">
                            {totalStock} left
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Active
                        </span>
                        <span className="block text-[10px] text-emerald-700 font-semibold tabular">
                          {totalStock} in stock
                        </span>
                      </div>
                    );
                  })()}
                </td>
                <td className="px-6 py-4 text-foreground/50 text-[11px] font-medium" suppressHydrationWarning>
                  {new Date(product.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/dashboard/products/${product.id}`}
                      className="h-8 w-8 flex items-center justify-center rounded-lg bg-secondary text-foreground/60 hover:bg-[#fff4ed] hover:text-[#eb5a28] hover:border hover:border-[#eb5a28]/30 transition-all active:scale-95"
                      title="Edit Product"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      onClick={() => onDelete(product.id)}
                      disabled={loading === product.id}
                      className="h-8 w-8 flex items-center justify-center rounded-lg bg-secondary text-foreground/60 hover:bg-rose-50 hover:text-rose-600 hover:border hover:border-rose-200 transition-all active:scale-95 disabled:opacity-50"
                      title="Delete Product"
                    >
                      <Trash className="h-3.5 w-3.5" />
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
