"use client";

import { motion } from "framer-motion";
import { 
    CheckCircle2, 
    Circle, 
    CreditCard, 
    Package, 
    Truck, 
    Home, 
    Clock
} from "lucide-react";

interface TimelineStepProps {
    status: string;
    label: string;
    date?: string | Date;
    isActive: boolean;
    isCompleted: boolean;
    isLast?: boolean;
    icon: any;
}

function TimelineStep({ label, date, isActive, isCompleted, isLast, icon: Icon }: TimelineStepProps) {
    return (
        <div className="flex-1 relative flex flex-col items-center">
            {/* Connection Line */}
            {!isLast && (
                <div className="absolute top-6 left-1/2 w-full h-[2px] bg-border/30 overflow-hidden">
                    {isCompleted && (
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 1, ease: "easeInOut" }}
                            className="h-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.5)]"
                        />
                    )}
                </div>
            )}

            {/* Step Icon */}
            <motion.div 
                initial={false}
                animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center z-10 border-2 transition-all duration-500 shadow-sm ${
                    isCompleted 
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-indigo-100" 
                        : isActive 
                            ? "bg-card border-indigo-600 text-indigo-600 shadow-indigo-50" 
                            : "bg-card border-border/40 text-foreground/20"
                }`}
            >
                <Icon className="h-5 w-5" />
            </motion.div>

            {/* Label */}
            <div className="mt-4 text-center">
                <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${
                    isActive || isCompleted ? "text-foreground" : "text-foreground/30"
                }`}>
                    {label}
                </p>
                {date && (
                    <p className="text-[10px] font-bold text-foreground/40 font-mono">
                        {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                )}
            </div>
        </div>
    );
}

export default function TrackingTimeline({ order }: { order: any }) {
    const status = order.status;
    
    // Status Logic for rendering
    const steps = [
        { 
            id: 'PENDING', 
            label: 'Order Placed', 
            icon: Clock, 
            date: order.createdAt 
        },
        { 
            id: 'PAID', 
            label: 'Payment Verified', 
            icon: CreditCard, 
            date: order.status === 'PAID' || order.status === 'SHIPPED' || order.status === 'DELIVERED' ? order.updatedAt : undefined 
        },
        { 
            id: 'SHIPPED', 
            label: 'Shipped Out', 
            icon: Truck, 
            date: order.shippedAt 
        },
        { 
            id: 'DELIVERED', 
            label: 'Delivered', 
            icon: Home, 
            date: order.deliveredAt 
        },
    ];

    const getStatusIndex = (s: string) => {
        if (s === 'PENDING') return 0;
        if (s === 'PAID') return 1;
        if (s === 'SHIPPED') return 2;
        if (s === 'DELIVERED') return 3;
        return 0;
    };

    const currentIndex = getStatusIndex(status);

    return (
        <div className="flex items-start justify-between w-full">
            {steps.map((step, idx) => (
                <TimelineStep 
                    key={step.id}
                    status={step.id}
                    label={step.label}
                    date={step.date}
                    icon={step.icon}
                    isActive={idx === currentIndex}
                    isCompleted={idx <= currentIndex}
                    isLast={idx === steps.length - 1}
                />
            ))}
        </div>
    );
}
