"use client";

import { motion } from "framer-motion";
import { CreditCard, Truck, Home, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface TimelineStepProps {
  status: string;
  label: string;
  date?: string | Date | null;
  isActive: boolean;
  isCompleted: boolean;
  isLast?: boolean;
  icon: LucideIcon;
}

function TimelineStep({
  label,
  date,
  isActive,
  isCompleted,
  isLast,
  icon: Icon,
}: TimelineStepProps) {
  return (
    <div className="flex-1 relative flex flex-col items-center">
      {/* Connection Line */}
      {!isLast && (
        <div className="absolute top-5 left-1/2 w-full h-[2px] bg-border overflow-hidden">
          {isCompleted && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="h-full bg-[#eb5a28]"
            />
          )}
        </div>
      )}

      {/* Step Icon */}
      <motion.div
        initial={false}
        animate={isActive ? { scale: 1.08 } : { scale: 1 }}
        className={`w-10 h-10 rounded-xl flex items-center justify-center z-10 border transition-all duration-300 shadow-xs ${
          isCompleted
            ? "bg-[#eb5a28] border-[#eb5a28] text-white"
            : isActive
            ? "bg-white border-[#eb5a28] text-[#eb5a28] ring-4 ring-[#eb5a28]/10"
            : "bg-white border-border text-foreground/30"
        }`}
      >
        <Icon className="h-4 w-4" />
      </motion.div>

      {/* Label */}
      <div className="mt-3 text-center">
        <p
          className={`text-[10px] font-bold uppercase tracking-wider leading-none mb-1 ${
            isActive || isCompleted ? "text-foreground" : "text-foreground/40"
          }`}
        >
          {label}
        </p>
        {date && (
          <p className="text-[10px] font-semibold text-foreground/45 font-mono" suppressHydrationWarning>
            {new Date(date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            })}
          </p>
        )}
      </div>
    </div>
  );
}

export interface TimelineOrder {
  status: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  shippedAt?: string | Date | null;
  deliveredAt?: string | Date | null;
}

export default function TrackingTimeline({ order }: { order: TimelineOrder }) {
  const status = order.status;

  const steps = [
    {
      id: "PENDING",
      label: "Order Placed",
      icon: Clock,
      date: order.createdAt,
    },
    {
      id: "PAID",
      label: "Payment Verified",
      icon: CreditCard,
      date:
        order.status === "PAID" || order.status === "SHIPPED" || order.status === "DELIVERED"
          ? order.updatedAt
          : undefined,
    },
    {
      id: "SHIPPED",
      label: "Dispatched",
      icon: Truck,
      date: order.shippedAt,
    },
    {
      id: "DELIVERED",
      label: "Delivered",
      icon: Home,
      date: order.deliveredAt,
    },
  ];

  const getStatusIndex = (s: string) => {
    if (s === "PENDING") return 0;
    if (s === "PAID") return 1;
    if (s === "SHIPPED") return 2;
    if (s === "DELIVERED") return 3;
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
