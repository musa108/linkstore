/**
 * Order FULFILMENT lifecycle. Payment state lives separately on Payment.status.
 * An order can only become PAID through verified payment evidence
 * (src/server/payments/finalize.ts) – never through updateOrderStatus().
 */
export const ORDER_STATUSES = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAID_STATUSES: readonly OrderStatus[] = ["PAID", "SHIPPED", "DELIVERED"];

const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
    PENDING: ["PAID", "CANCELLED"],
    PAID: ["SHIPPED", "REFUNDED"],
    SHIPPED: ["DELIVERED", "REFUNDED"],
    DELIVERED: ["REFUNDED"],
    CANCELLED: ["PAID"], // only via verified late payment (finalize.ts); merchants cannot set this
    REFUNDED: [],
};

/** Transitions a MERCHANT may request manually. PAID/CANCELLED/REFUNDED are system-driven. */
export const MERCHANT_SETTABLE: readonly OrderStatus[] = ["SHIPPED"];

export function isOrderStatus(v: string): v is OrderStatus {
    return (ORDER_STATUSES as readonly string[]).includes(v);
}

export function canTransition(from: string, to: string): boolean {
    if (!isOrderStatus(from) || !isOrderStatus(to)) return false;
    return TRANSITIONS[from].includes(to);
}

export type PaymentStatus = "INITIALIZED" | "SUCCESS" | "FAILED" | "ABANDONED" | "REFUNDED";
