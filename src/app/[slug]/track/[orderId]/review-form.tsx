"use client";

import { useState } from "react";
import { confirmOrderDelivery } from "@/lib/actions/order";
import { submitReview } from "@/lib/actions/review";
import { 
    Star, 
    CheckCircle2, 
    MessageSquare, 
    ChevronRight, 
    Loader2, 
    ThumbsUp 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ReviewFormProps {
    orderId: string;
    role: "CUSTOMER_RECEIPT" | "PRODUCT_REVIEW";
    orderItems?: { productId: string; name: string }[];
    customerName?: string;
}

export default function ReviewForm({ orderId, role, orderItems, customerName }: ReviewFormProps) {
    const [loading, setLoading] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(orderItems?.[0]?.productId || "");
    const [success, setSuccess] = useState(false);

    async function handleConfirmReceipt() {
        setLoading(true);
        try {
            const res = await confirmOrderDelivery(orderId, "CUSTOMER");
            if (res.error) {
                alert(res.error);
            } else {
                setSuccess(true);
                setTimeout(() => window.location.reload(), 2000);
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmitReview(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("orderId", orderId);
            formData.append("productId", selectedProduct);
            formData.append("customerName", customerName || "Customer");
            formData.append("rating", rating.toString());
            formData.append("comment", comment);

            const res = await submitReview(formData);
            if (res.error) {
                alert(res.error);
            } else {
                setSuccess(true);
                setComment("");
                // Reload after a delay to show updated storefront
                setTimeout(() => setSuccess(false), 3000);
            }
        } finally {
            setLoading(false);
        }
    }

    if (role === "CUSTOMER_RECEIPT") {
        return (
            <AnimatePresence mode="wait">
                {success ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 text-emerald-300 font-bold"
                    >
                        <CheckCircle2 className="h-5 w-5" />
                        Receipt Confirmed! Page reloading...
                    </motion.div>
                ) : (
                    <motion.button
                        layout
                        onClick={handleConfirmReceipt}
                        disabled={loading}
                        className="w-full h-15 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-gray-50 transition-all active:scale-95 shadow-xl shadow-indigo-700/20"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                        Confirm Package Received
                    </motion.button>
                )}
            </AnimatePresence>
        );
    }

    return (
        <form onSubmit={handleSubmitReview} className="space-y-8">
            {success ? (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-12 rounded-[32px] bg-emerald-50 border border-emerald-100 text-center space-y-4"
                >
                    <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto shadow-sm">
                        <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <h4 className="text-xl font-black text-emerald-900">Thank You!</h4>
                    <p className="text-emerald-700/60 font-medium leading-tight">Your review has been verified and published.</p>
                </motion.div>
            ) : (
                <>
                    {/* Product Selector if multiple */}
                    {orderItems && orderItems.length > 1 && (
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Select Product to Review</label>
                            <div className="flex flex-wrap gap-2">
                                {orderItems.map((p) => (
                                    <button
                                        key={p.productId}
                                        type="button"
                                        onClick={() => setSelectedProduct(p.productId)}
                                        className={`px-6 py-3 rounded-2xl text-xs font-bold transition-all border ${
                                            selectedProduct === p.productId 
                                                ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100" 
                                                : "bg-secondary border-transparent text-foreground/40 hover:bg-gray-100 hover:text-foreground"
                                        }`}
                                    >
                                        {p.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Star Rating */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Your Rating</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="p-1 transition-transform active:scale-75 hover:scale-110"
                                >
                                    <Star 
                                        className={`h-12 w-12 ${
                                            star <= rating 
                                                ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]" 
                                                : "text-secondary fill-secondary"
                                        }`} 
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Comment Area */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 text-center block">Detailed Feedback</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your thoughts on the quality, delivery speed, and service..."
                            className="w-full min-h-[160px] p-8 rounded-[32px] border-border/50 bg-secondary focus:bg-white focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all font-medium text-foreground resize-none"
                            required
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-18 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-100 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ChevronRight className="h-5 w-5" />}
                        Submit Verified Review
                    </button>
                </>
            )}
        </form>
    );
}
