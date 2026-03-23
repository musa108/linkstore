"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct } from "@/lib/actions/product";
import { CldUploadButton, CloudinaryUploadWidgetResults } from "next-cloudinary";
import { ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import Image from "next/image";
import { Product } from "@/types";
import { motion, Variants } from "framer-motion";

interface ProductFormProps {
    storeId: string;
    initialData?: Product;
}

interface VariantInput {
    id?: string;
    name: string;
    sku?: string;
    price?: string | number;
    stockCount: number;
    lowStockThreshold?: number;
}

export default function ProductForm({ storeId, initialData }: ProductFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");
    const [variants, setVariants] = useState<VariantInput[]>(() => {
        if (!initialData?.variants) return [];
        return initialData.variants.map((v) => ({
            id: v.id,
            name: v.name,
            sku: v.sku || "",
            price: v.price?.toString() || "",
            stockCount: Number(v.stockCount),
            lowStockThreshold: v.lowStockThreshold || undefined
        }));
    });
    const [error, setError] = useState("");

    const addVariant = () => {
        setVariants([...variants, { id: undefined, name: "", sku: "", price: "", stockCount: 0 }]);
    };

    const updateVariant = (index: number, field: keyof VariantInput, value: string | number | undefined) => {
        const newVariants = [...variants];
        newVariants[index] = { ...newVariants[index], [field]: value };
        setVariants(newVariants);
    };

    const removeVariant = (index: number) => {
        setVariants(variants.filter((_, i) => i !== index));
    };

    async function onSubmit(formData: FormData) {
        setLoading(true);
        setError("");

        // Append custom fields
        formData.append("imageUrl", imageUrl);
        formData.append("variants", JSON.stringify(variants));

        try {
            let result;
            if (initialData) {
                result = await updateProduct(initialData.id, formData);
            } else {
                result = await createProduct(storeId, formData);
            }

            if (result.error) {
                setError(result.error);
            } else {
                router.push("/dashboard/products");
                router.refresh();
            }
        } catch (err) {
            console.error(err);
            setError("Something went wrong.");
        } finally {
            setLoading(false);
        }
    }

    const container: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08
            }
        }
    };

    const item: Variants = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
    };

    return (
        <motion.form
            variants={container}
            initial="hidden"
            animate="show"
            action={onSubmit}
            className="space-y-10"
        >
            {error && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600 border border-red-100"
                >
                    {error}
                </motion.div>
            )}

            <div className="space-y-8">
                {/* Image Upload Section */}
                <motion.div variants={item} className="space-y-4">
                    <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Product Media</label>

                    {/* Hidden input to ensure imageUrl is sent with the form */}
                    <input type="hidden" name="imageUrl" value={imageUrl} />

                    <div className="flex flex-wrap gap-6">
                        {imageUrl ? (
                            <div className="group relative h-48 w-48 overflow-hidden rounded-[32px] border-4 border-white bg-gray-50 shadow-immersive transition-all hover:scale-[1.02]">
                                <Image src={imageUrl} alt="Upload" fill className="object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        type="button"
                                        onClick={() => setImageUrl("")}
                                        className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-red-500 transition-all active:scale-95"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <CldUploadButton
                                onSuccess={(result: CloudinaryUploadWidgetResults) => {
                                    if (result.info && typeof result.info !== "string") {
                                        setImageUrl(result.info.secure_url);
                                    }
                                }}
                                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "linkstore"}
                                className="flex h-48 w-48 flex-col items-center justify-center gap-3 rounded-[32px] border-2 border-dashed border-gray-200 bg-gray-50/50 text-gray-400 transition-all hover:border-indigo-400 hover:bg-indigo-50/30 hover:text-indigo-600 group"
                            >
                                <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover:shadow-indigo-100 transition-all">
                                    <ImagePlus className="h-6 w-6" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest">Add Photo</span>
                            </CldUploadButton>
                        )}
                    </div>
                </motion.div>

                <motion.div variants={item} className="grid gap-8 md:grid-cols-2">
                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Product Name</label>
                        <input
                            name="name"
                            defaultValue={initialData?.name}
                            required
                            className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 p-4 text-sm font-bold text-gray-900 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none shadow-sm"
                            placeholder="e.g. Signature Leather Tote"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Price (₦)</label>
                        <div className="relative">
                            <input
                                name="price"
                                type="number"
                                defaultValue={initialData?.price ? Number(initialData.price) : ""}
                                required
                                className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 p-4 pl-10 text-sm font-black text-gray-900 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none shadow-sm"
                                placeholder="0.00"
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                                ₦
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div variants={item} className="grid gap-8 md:grid-cols-2">
                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Low Stock Threshold</label>
                        <input
                            name="lowStockThreshold"
                            type="number"
                            defaultValue={initialData?.lowStockThreshold || ""}
                            className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 p-4 text-sm font-bold text-gray-900 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none shadow-sm"
                            placeholder="Default follows store settings"
                        />
                    </div>
                </motion.div>

                <motion.div variants={item} className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Description</label>
                    <textarea
                        name="description"
                        defaultValue={initialData?.description || ""}
                        className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 p-4 text-sm font-bold text-gray-900 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none h-40 resize-none shadow-sm"
                        placeholder="Describe the unique features and details of this product..."
                    />
                </motion.div>

                <motion.div variants={item} className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Product Variants (Optional)</label>
                        <button
                            type="button"
                            onClick={addVariant}
                            className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full"
                        >
                            <Plus className="h-4 w-4" /> Add Option
                        </button>
                    </div>

                    {variants.length > 0 && (
                        <div className="space-y-4">
                            {variants.map((variant, index) => (
                                <div key={index} className="flex flex-col md:flex-row gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
                                    <div className="flex-1 space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Variant Name</label>
                                        <input
                                            value={variant.name}
                                            onChange={(e) => updateVariant(index, "name", e.target.value)}
                                            placeholder="e.g. Size L, Red"
                                            className="w-full rounded-xl border border-gray-100 bg-white p-3 text-xs font-bold shadow-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10"
                                            required
                                        />
                                    </div>
                                    <div className="w-full md:w-32 space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">SKU</label>
                                        <input
                                            value={variant.sku}
                                            onChange={(e) => updateVariant(index, "sku", e.target.value)}
                                            placeholder="SKU-123"
                                            className="w-full rounded-xl border border-gray-100 bg-white p-3 text-xs font-bold shadow-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10"
                                        />
                                    </div>
                                    <div className="w-full md:w-32 space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Price Override</label>
                                        <input
                                            type="number"
                                            value={variant.price || ""}
                                            onChange={(e) => updateVariant(index, "price", e.target.value)}
                                            placeholder="Base Price"
                                            className="w-full rounded-xl border border-gray-100 bg-white p-3 text-xs font-bold shadow-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10"
                                        />
                                    </div>
                                    <div className="w-full md:w-24 space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Stock</label>
                                        <input
                                            type="number"
                                            value={variant.stockCount}
                                            onChange={(e) => updateVariant(index, "stockCount", parseInt(e.target.value) || 0)}
                                            placeholder="0"
                                            className="w-full rounded-xl border border-gray-100 bg-white p-3 text-xs font-bold shadow-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10"
                                            required
                                        />
                                    </div>
                                    <div className="w-full md:w-24 space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Threshold</label>
                                        <input
                                            type="number"
                                            value={variant.lowStockThreshold || ""}
                                            onChange={(e) => updateVariant(index, "lowStockThreshold", parseInt(e.target.value) || undefined)}
                                            placeholder="Auto"
                                            className="w-full rounded-xl border border-gray-100 bg-white p-3 text-xs font-bold shadow-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10"
                                        />
                                    </div>
                                    <div className="flex items-end pb-1">
                                        <button
                                            type="button"
                                            onClick={() => removeVariant(index)}
                                            className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                <motion.div variants={item} className="flex items-center gap-4 p-6 rounded-3xl bg-indigo-50/30 border border-indigo-100">
                    <div className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            id="inStock"
                            name="inStock"
                            defaultChecked={initialData ? initialData.inStock : true}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </div>
                    <label htmlFor="inStock" className="text-sm font-bold text-gray-700 cursor-pointer">
                        Mark as Active & Available in Store
                    </label>
                </motion.div>
            </div>

            <motion.div variants={item} className="pt-6 flex flex-col md:flex-row gap-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 group relative flex h-14 items-center justify-center overflow-hidden rounded-2xl bg-gray-900 text-sm font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-black active:scale-[0.98] disabled:opacity-50 shadow-xl"
                >
                    <span className={`transition-all duration-300 ${loading ? "opacity-0 scale-50" : "opacity-100 scale-100"}`}>
                        {initialData ? "Save Changes" : "Create Product"}
                    </span>
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    )}
                </button>
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="h-14 px-8 rounded-2xl border border-gray-200 bg-white text-xs font-black uppercase tracking-[0.2em] text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all active:scale-[0.98]"
                >
                    Cancel
                </button>
            </motion.div>
        </motion.form>
    );
}
