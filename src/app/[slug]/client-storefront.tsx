"use client";

import { useCart } from "@/hooks/use-cart";
import { ShoppingBag, X, Plus, Minus, ArrowRight, Package, Search, Star, MessageSquare } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { trackConversion } from "@/lib/actions/store";
import { trackProductView } from "@/lib/actions/product";
import { Store, Product, Variant } from "@/types";
import { motion, AnimatePresence, Variants } from "framer-motion";
import ChatWidget from "@/components/chat/chat-widget";

interface ClientStorefrontProps {
    store: Store;
    products: Product[];
}

export default function ClientStorefront({ store, products }: ClientStorefrontProps) {
    const cart = useCart();
    const [isOpen, setIsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showAnnouncement, setShowAnnouncement] = useState(true);
    const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({}); // productId -> variantId
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [activeMediaIndex, setActiveMediaIndex] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => setIsMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    const filteredProducts = useMemo(() => {
        return products.filter(product =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [products, searchQuery]);

    const handleBuyNow = async (product: Product) => {
        const hasVariants = product.variants && product.variants.length > 0;
        const selectedVariantId = selectedVariants[product.id];

        if (hasVariants && !selectedVariantId) {
            const defaultVariant = product.variants![0];
            addItemToCart(product as Product, defaultVariant);
        } else if (hasVariants && selectedVariantId) {
            const variant = (product.variants as Variant[])!.find(v => v.id === selectedVariantId);
            if (variant) {
                addItemToCart(product as Product, variant);
            }
        } else {
            addItemToCart(product as Product);
        }

        setIsOpen(true);
        await trackConversion(store.id);
    };

    const openProductModal = async (product: Product) => {
        setSelectedProduct(product);
        setActiveMediaIndex(0);
        await trackProductView(product.id).catch(err => console.error("TRACK_P_VIEW_ERR", err));
    };

    const addItemToCart = (product: Product, variant?: Variant) => {
        cart.addItem({
            id: product.id,
            variantId: variant?.id,
            variantName: variant?.name,
            name: product.name,
            price: variant?.price ? Number(variant.price) : Number(product.price),
            imageUrl: product.imageUrl,
            quantity: 1,
        });
    };

    if (!isMounted) return null;

    const container: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3
            }
        }
    };

    const item: Variants = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
    };

    const primaryColor = store.primaryColor || "#4f46e6";

    return (
        <div className="bg-canvas min-h-screen selection:bg-indigo-100 selection:text-indigo-700">
            {/* Announcement Bar */}
            <AnimatePresence>
                {store.announcement && showAnnouncement && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="relative z-[60] overflow-hidden"
                        style={{ backgroundColor: primaryColor }}
                    >
                        <div className="mx-auto max-w-7xl px-4 md:px-8 py-3 flex items-center justify-center text-center">
                            <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white leading-relaxed px-6">
                                {store.announcement}
                            </p>
                            <button
                                onClick={() => setShowAnnouncement(false)}
                                className="absolute right-3 md:right-6 p-1 text-white/60 hover:text-white transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Minimalist Header */}
            <header className="sticky top-0 z-50 bg-canvas/80 backdrop-blur-md border-b border-border/50 py-4 md:py-6 px-4 md:px-8">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <Link href={`/${store.slug}`} className="flex items-center gap-3 md:gap-4 group">
                        {store.logoUrl ? (
                            <div className="h-8 w-8 md:h-10 md:w-10 relative overflow-hidden rounded-lg md:rounded-xl border-2 border-white shadow-md">
                                <Image src={store.logoUrl} alt={store.name} fill className="object-cover" />
                            </div>
                        ) : (
                            <div
                                className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform"
                                style={{ backgroundColor: primaryColor }}
                            >
                                <div className="relative h-4 w-4 md:h-5 md:w-5">
                                    <Image src="/logo.png" alt="L" fill className="object-cover" />
                                </div>
                            </div>
                        )}
                        <span className="text-xl md:text-2xl font-black tracking-tighter text-foreground uppercase italic group-hover:opacity-70 transition-opacity truncate max-w-[150px] md:max-w-none">{store.name}</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40 group-focus-within:text-foreground transition-colors" />
                            <input
                                type="text"
                                placeholder="Search catalog..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-12 w-64 rounded-2xl bg-secondary/50 border border-border/50 pl-11 pr-4 text-sm font-bold placeholder:text-foreground/40 focus:bg-card focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none"
                            />
                        </div>
                        <button
                            onClick={() => setIsOpen(true)}
                            className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-card border border-border shadow-bento text-foreground hover:shadow-immersive hover:-translate-y-0.5 transition-all active:scale-95"
                        >
                            <ShoppingBag className="h-5 w-5" />
                            {cart.items.length > 0 && (
                                <span
                                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black text-white shadow-lg"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    {cart.getTotalItems()}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <motion.main
                variants={container}
                initial="hidden"
                animate="show"
                className="mx-auto max-w-7xl px-4 md:px-8 py-12 md:py-24 lg:py-32"
            >
                {/* Search Bar Mobile */}
                <motion.div variants={item} className="md:hidden mb-12">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                        <input
                            type="text"
                            placeholder="Find products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-14 w-full rounded-2xl bg-card border border-border/50 pl-11 pr-4 text-base font-bold shadow-sm focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 outline-none"
                        />
                    </div>
                </motion.div>

                {/* Immersive Hero */}
                <motion.div variants={item} className="mb-32">
                    <div
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-sm mb-12"
                        style={{ color: primaryColor }}
                    >
                        <div className="relative h-3 w-3">
                            <Image src="/logo.png" alt="L" fill className="object-cover" />
                        </div>
                        Official Storefront
                    </div>
                    <h1 className="text-5xl md:text-8xl lg:text-9xl font-black tracking-tighter text-foreground leading-[0.9] mb-8">
                        Elevate your <br />
                        <span style={{ color: primaryColor }}>lifestyle.</span>
                    </h1>
                    <p className="max-w-xl text-xl font-medium text-foreground/50/80 leading-relaxed">
                        {store.description || `Welcome to ${store.name}. We provide high-quality products curated for those who value excellence.`}
                    </p>
                </motion.div>

                {/* Product Grid */}
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence mode="popLayout">
                        {filteredProducts.map((product) => (
                            <motion.div
                                key={product.id}
                                layout
                                variants={item}
                                initial="hidden"
                                animate="show"
                                exit={{ opacity: 0, scale: 0.9 }}
                                whileHover={{ y: -8 }}
                                onClick={() => openProductModal(product)}
                                className="bento-card p-6 flex flex-col group h-full cursor-pointer"
                            >
                                <div className="aspect-square relative mb-8 w-full overflow-hidden rounded-2xl bg-canvas border border-border/50">
                                    {product.imageUrl ? (
                                        <Image
                                            src={product.imageUrl}
                                            alt={product.name}
                                            fill
                                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-gray-200">
                                            <Package className="h-16 w-16" />
                                        </div>
                                    )}
                                    <div className="absolute right-4 top-4 rounded-full bg-card/95 px-4 py-1.5 text-[10px] font-bold tracking-widest uppercase shadow-sm border border-border/50 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                                        In Stock
                                    </div>
                                </div>

                                <div className="space-y-4 flex flex-1 flex-col">
                                    <div>
                                        <h3
                                            className="text-2xl font-black tracking-tight text-foreground transition-colors"
                                            style={{ color: "inherit" }}
                                        >
                                            {product.name}
                                        </h3>
                                        <p className="mt-1 text-sm font-medium text-foreground/40 line-clamp-2 leading-relaxed">
                                            {product.description}
                                        </p>
                                    </div>

                                    {/* Star Rating on Card */}
                                    {product.reviews && product.reviews.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            <div className="flex text-amber-400">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <Star key={s} className={`h-3 w-3 ${s <= Math.round(product.reviews!.reduce((acc, r) => acc + r.rating, 0) / product.reviews!.length) ? 'fill-current' : 'text-gray-200'}`} />
                                                ))}
                                            </div>
                                            <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">({product.reviews.length})</span>
                                        </div>
                                    )}

                                    {/* Variant Selector */}
                                    {product.variants && product.variants.length > 0 && (
                                        <div className="pt-2">
                                            <div className="flex flex-wrap gap-2">
                                                {product.variants.map((v) => (
                                                    <button
                                                        key={v.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedVariants({ ...selectedVariants, [product.id]: v.id });
                                                        }}
                                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${selectedVariants[product.id] === v.id
                                                            ? "bg-foreground text-card border-foreground"
                                                            : "bg-card text-foreground/40 border-border/50 hover:border-border/80"
                                                            }`}
                                                    >
                                                        {v.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-auto pt-6 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold uppercase tracking-widest text-foreground/40">Price</span>
                                            <span className="text-3xl font-black tracking-tighter text-foreground">
                                                ₦{Number(product.price).toLocaleString()}
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleBuyNow(product);
                                            }}
                                            className="h-14 w-14 rounded-2xl bg-foreground text-card flex items-center justify-center shadow-lg shadow-gray-200 hover:shadow-xl hover:-rotate-12 hover:scale-110 active:scale-95 transition-all"
                                            style={{ "--hover-bg": primaryColor } as React.CSSProperties}
                                        >
                                            <Plus className="h-6 w-6" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredProducts.length === 0 && (
                    <motion.div variants={item} className="py-40 text-center bento-card border-dashed bg-card/30">
                        <ShoppingBag className="h-20 w-20 mx-auto text-gray-200 mb-6" />
                        <h3 className="text-2xl font-black text-foreground">No items found</h3>
                        <p className="mt-3 text-foreground/40 max-w-xs mx-auto font-medium">We couldn&apos;t find anything matching &quot;{searchQuery}&quot;. Try a different term.</p>
                    </motion.div>
                )}
            </motion.main>

            {/* Product Detail Modal */}
            <AnimatePresence>
                {selectedProduct && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10"
                    >
                        <div
                            className="absolute inset-0 bg-gray-900/40 backdrop-blur-md"
                            onClick={() => setSelectedProduct(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-4xl bg-card rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
                        >
                            <button
                                onClick={() => setSelectedProduct(null)}
                                className="absolute right-6 top-6 z-20 p-3 rounded-2xl bg-card/80 backdrop-blur-md text-foreground hover:bg-gray-900 hover:text-white transition-all shadow-sm border border-border/50"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            {/* Media Section (Carousel) */}
                            <div className="w-full md:w-1/2 h-96 md:h-auto relative bg-canvas overflow-hidden group/modal">
                                {selectedProduct.media && selectedProduct.media.length > 0 ? (
                                    <>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <AnimatePresence mode="wait">
                                                {selectedProduct.media[activeMediaIndex] && (
                                                    <motion.div
                                                        key={activeMediaIndex}
                                                        initial={{ opacity: 0, x: 20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -20 }}
                                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                        className="relative h-full w-full"
                                                    >
                                                        {selectedProduct.media[activeMediaIndex].type === "VIDEO" ? (
                                                            <video
                                                                src={selectedProduct.media[activeMediaIndex].url}
                                                                controls
                                                                autoPlay
                                                                muted
                                                                loop
                                                                className="h-full w-full object-cover"
                                                                playsInline
                                                            />
                                                        ) : (
                                                            <Image
                                                                src={selectedProduct.media[activeMediaIndex].url}
                                                                alt={selectedProduct.name}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Navigation Arrows */}
                                        {selectedProduct.media.length > 1 && (
                                            <>
                                                <button
                                                    onClick={() => setActiveMediaIndex((prev) => (prev > 0 ? prev - 1 : selectedProduct.media!.length - 1))}
                                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 backdrop-blur-md text-white opacity-0 group-hover/modal:opacity-100 transition-opacity hover:bg-white/20"
                                                >
                                                    <Plus className="h-5 w-5 rotate-45" />
                                                </button>
                                                <button
                                                    onClick={() => setActiveMediaIndex((prev) => (prev < selectedProduct.media!.length - 1 ? prev + 1 : 0))}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 backdrop-blur-md text-white opacity-0 group-hover/modal:opacity-100 transition-opacity hover:bg-white/20"
                                                >
                                                    <Plus className="h-5 w-5" />
                                                </button>
                                            </>
                                        )}

                                        {/* Dots */}
                                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-2 rounded-full bg-black/20 backdrop-blur-md">
                                            {selectedProduct.media.map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`h-1.5 w-1.5 rounded-full transition-all ${i === activeMediaIndex ? "bg-white w-4" : "bg-white/40"}`}
                                                />
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {selectedProduct.imageUrl ? (
                                            <Image
                                                src={selectedProduct.imageUrl}
                                                alt={selectedProduct.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-gray-200">
                                                <Package className="h-24 w-24" />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Info Section */}
                            <div className="flex-1 p-8 md:p-12 overflow-y-auto flex flex-col">
                                <div className="mb-auto">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-6">
                                        In Stock
                                    </div>
                                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground mb-4">{selectedProduct.name}</h2>
                                    <p className="text-foreground/50 font-medium leading-relaxed mb-10 text-lg">
                                        {selectedProduct.description || "No description available for this product."}
                                    </p>

                                    {/* Modal Variant Selector */}
                                    {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                                        <div className="space-y-4 mb-10">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Choose Option</p>
                                            <div className="flex flex-wrap gap-3">
                                                {selectedProduct.variants.map((v) => (
                                                    <button
                                                        key={v.id}
                                                        onClick={() => setSelectedVariants({ ...selectedVariants, [selectedProduct.id]: v.id })}
                                                        className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 ${selectedVariants[selectedProduct.id] === v.id
                                                            ? "bg-foreground text-card border-foreground shadow-lg"
                                                            : "bg-card text-foreground/40 border-border/50 hover:border-border/80"
                                                            }`}
                                                    >
                                                        {v.name}
                                                        {v.price && (
                                                            <span className="ml-2 opacity-60">
                                                                ₦{Number(v.price).toLocaleString()}
                                                            </span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Modal Reviews Section */}
                                <div className="mt-12 space-y-6">
                                    <div className="flex items-center justify-between border-b border-border/50 pb-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Verified Reviews</p>
                                        <div className="flex items-center gap-2">
                                            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                                            <span className="text-sm font-black">
                                                {selectedProduct.reviews && selectedProduct.reviews.length > 0
                                                    ? (selectedProduct.reviews.reduce((acc, r: any) => acc + r.rating, 0) / selectedProduct.reviews.length).toFixed(1)
                                                    : "5.0"
                                                }
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-6 max-h-64 overflow-y-auto pr-4 custom-scrollbar">
                                        {selectedProduct.reviews && (selectedProduct.reviews as any[]).length > 0 ? (
                                            (selectedProduct.reviews as any[]).map((rev) => (
                                                <div key={rev.id} className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-xs font-black text-foreground">{rev.customerName}</p>
                                                        <div className="flex text-amber-400">
                                                            {[1, 2, 3, 4, 5].map((s) => (
                                                                <Star key={s} className={`h-2.5 w-2.5 ${s <= rev.rating ? 'fill-current' : 'text-gray-200'}`} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-medium text-foreground/60 leading-relaxed italic">
                                                        &ldquo;{rev.comment}&rdquo;
                                                    </p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-8 text-center bg-secondary/50 rounded-3xl border border-dashed border-border/50">
                                                <p className="text-xs font-bold text-foreground/30 uppercase tracking-widest">No reviews yet</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-12 pt-10 border-t border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Current Price</p>
                                        <p className="text-4xl font-black tracking-tighter text-foreground">
                                            ₦{Number(selectedProduct.price).toLocaleString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            handleBuyNow(selectedProduct);
                                            setSelectedProduct(null);
                                        }}
                                        className="h-16 px-10 rounded-3xl bg-foreground text-card text-sm font-black uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        Add to Bag
                                        <ArrowRight className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cart Drawer Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex justify-end"
                    >
                        <div
                            className="absolute inset-0 bg-gray-900/10 backdrop-blur-sm transition-opacity"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative flex h-full w-full sm:max-w-md flex-col bg-card shadow-2xl sm:border-l border-border"
                        >
                            <div className="flex items-center justify-between px-6 md:px-10 py-8 md:py-12">
                                <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-foreground">
                                    Bag
                                    <span className="ml-3 text-sm font-bold tracking-normal text-foreground/40">({cart.getTotalItems()} ITEMS)</span>
                                </h2>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="group rounded-xl md:rounded-2xl bg-canvas p-2.5 md:p-3 text-foreground transition-all hover:bg-foreground hover:text-card"
                                >
                                    <X className="h-4 w-4 md:h-5 md:w-5 transition-transform group-hover:rotate-90" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-10">
                                {cart.items.length === 0 ? (
                                    <div className="flex flex-col h-full items-center justify-center text-center space-y-6">
                                        <div className="h-32 w-32 bg-canvas rounded-[40px] flex items-center justify-center shadow-inner border border-border/50">
                                            <ShoppingBag className="h-12 w-12 text-gray-200" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-xl font-black text-foreground">Waiting for items</p>
                                            <p className="text-foreground/40 font-medium tracking-tight">Your shopping bag is currently empty.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-10">
                                        <AnimatePresence initial={false}>
                                            {cart.items.map((item) => (
                                                <motion.div
                                                    layout
                                                    key={item.id}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    className="flex gap-6 items-center group"
                                                >
                                                    <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-canvas border border-border">
                                                        {item.imageUrl && (
                                                            <Image src={item.imageUrl} alt={item.name} fill className="object-cover transition-transform group-hover:scale-110" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-1 flex-col justify-center gap-1">
                                                        <div className="flex justify-between items-start">
                                                            <div className="space-y-0.5">
                                                                <h3 className="text-lg font-black text-foreground leading-tight pr-4">{item.name}</h3>
                                                                {item.variantName && (
                                                                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
                                                                        Option: {item.variantName}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="text-lg font-black" style={{ color: primaryColor }}>
                                                            ₦{Number(item.price).toLocaleString()}
                                                        </p>
                                                        <div className="flex items-center gap-4 pt-4">
                                                            <div className="flex items-center gap-1 bg-canvas rounded-xl p-1 border border-border">
                                                                <button
                                                                    onClick={() => cart.updateQuantity(item.id, item.quantity - 1, item.variantId)}
                                                                    className="rounded-lg bg-card p-2 text-foreground/40 shadow-sm transition-all hover:scale-110 focus:text-indigo-600"
                                                                >
                                                                    <Minus className="h-3 w-3" />
                                                                </button>
                                                                <span className="min-w-[34px] text-center text-sm font-black text-foreground">{item.quantity}</span>
                                                                <button
                                                                    onClick={() => cart.updateQuantity(item.id, item.quantity + 1, item.variantId)}
                                                                    className="rounded-lg bg-card p-2 text-foreground/40 shadow-sm transition-all hover:scale-110 focus:text-indigo-600"
                                                                >
                                                                    <Plus className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                            <button
                                                                onClick={() => cart.removeItem(item.id, item.variantId)}
                                                                className="text-[10px] font-black uppercase tracking-widest text-foreground/40 hover:text-red-500 transition-colors"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>

                            {cart.items.length > 0 && (
                                <div className="bg-canvas/50 backdrop-blur-md px-6 md:px-10 py-8 md:py-12 space-y-6 md:space-y-8 border-t border-border">
                                    <div className="flex items-end justify-between">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Grand Total</span>
                                            <p className="text-3xl md:text-4xl font-black tracking-tighter text-foreground">
                                                ₦{cart.getTotalPrice().toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-black pb-1 flex items-center justify-end gap-1.5 uppercase tracking-wider" style={{ color: primaryColor }}>
                                                <div className="relative h-3 w-3">
                                                    <Image src="/logo.png" alt="L" fill className="object-cover" />
                                                </div>
                                                Checkout
                                            </div>
                                        </div>
                                    </div>
                                    <Link
                                        href={`/${store.slug}/checkout`}
                                        className="flex w-full items-center justify-center gap-3 rounded-[24px] p-5 md:p-6 text-lg md:text-xl font-black text-card shadow-2xl transition-all hover:shadow-xl active:scale-[0.98] active:translate-y-1"
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        Purchase Now
                                        <ArrowRight className="h-5 w-5 md:h-6 md:w-6" />
                                    </Link>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <footer className="bg-card px-8 py-24 text-center border-t border-border mt-32">
                <div className="mx-auto max-w-7xl space-y-6">
                    <div className="flex justify-center">
                        <div className="h-10 w-10 rounded-xl bg-canvas border border-border flex items-center justify-center shadow-sm">
                            <div className="relative h-5 w-5 opacity-40 grayscale">
                                <Image src="/logo.png" alt="L" fill className="object-cover" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-black uppercase tracking-[0.4em] text-foreground">© {store.name}</p>
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                            Powered by <span style={{ color: primaryColor }}>LinkStore</span>
                        </p>
                    </div>
                </div>
            </footer>

            <ChatWidget storeId={store.id} storeName={store.name} primaryColor={primaryColor} />
        </div>
    );
}
