"use client";

import { useState } from "react";
import { AlertCircle, X, ShieldAlert, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { reportDispute } from "@/lib/actions/order";
import { toast } from "react-hot-toast";

interface DisputeButtonProps {
    orderId: string;
}

const DISPUTE_REASONS = [
    "Vendor refused delivery",
    "Item never received",
    "Incorrect items delivered",
    "Damaged or poor quality item",
    "Counterfeit product",
    "Other/Fraudulent activity"
];

export default function DisputeButton({ orderId }: DisputeButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedReason, setSelectedReason] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (!selectedReason) return;
        
        setIsSubmitting(true);
        try {
            const result = await reportDispute(orderId, selectedReason);
            if (result.success) {
                setIsSubmitted(true);
                toast.success("Issue reported successfully.");
            } else {
                toast.error(result.error || "Failed to report issue.");
            }
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500/15 active:scale-[0.98] transition-all font-bold text-sm"
            >
                <AlertCircle className="h-4 w-4" />
                Report an Issue with this Order
            </button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !isSubmitting && setIsOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-card border border-border rounded-[32px] overflow-hidden shadow-2xl"
                        >
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="h-12 w-12 bg-red-500/10 rounded-2xl flex items-center justify-center">
                                        <ShieldAlert className="h-6 w-6 text-red-600" />
                                    </div>
                                    <button 
                                        onClick={() => setIsOpen(false)}
                                        disabled={isSubmitting}
                                        className="h-10 w-10 bg-secondary rounded-full flex items-center justify-center text-foreground/40 hover:text-foreground transition-colors"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                {!isSubmitted ? (
                                    <>
                                        <h2 className="text-2xl font-black text-foreground mb-2">Report an Issue</h2>
                                        <p className="text-foreground/50 text-sm mb-8">
                                            Is there a problem with your order? Reporting it will alert LinkStore administration to investigate.
                                        </p>

                                        <div className="space-y-3 mb-8">
                                            {DISPUTE_REASONS.map((reason) => (
                                                <button
                                                    key={reason}
                                                    onClick={() => setSelectedReason(reason)}
                                                    className={`w-full text-left p-4 rounded-2xl border transition-all text-sm font-bold ${
                                                        selectedReason === reason 
                                                            ? "bg-primary/5 border-primary text-primary shadow-sm" 
                                                            : "bg-canvas border-border/50 text-foreground/60 hover:border-border hover:bg-secondary"
                                                    }`}
                                                >
                                                    {reason}
                                                </button>
                                            ))}
                                        </div>

                                        <button
                                            onClick={handleSubmit}
                                            disabled={!selectedReason || isSubmitting}
                                            className="w-full h-14 bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-600/20 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                "Submit Report"
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <ShieldAlert className="h-8 w-8 text-green-600" />
                                        </div>
                                        <h2 className="text-2xl font-black text-foreground mb-2">Report Submitted</h2>
                                        <p className="text-foreground/50 text-sm mb-8 leading-relaxed">
                                            We have received your report. LinkStore administration has been alerted and will investigate this transaction within 24 hours.
                                        </p>
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            className="w-full h-14 bg-secondary text-foreground rounded-2xl font-black active:scale-95 transition-all"
                                        >
                                            Close
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
