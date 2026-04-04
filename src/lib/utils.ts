import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatPrice(price: number | string | { toString(): string }) {
    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
    }).format(Number(price.toString()));
}

/**
 * Deeply serializes Prisma objects to make them safe for Client Components.
 * Specifically converts Decimal objects to numbers or strings.
 */
export function serializePrisma<T>(data: T): T {
    if (!data) return data;
    try {
        const serialized = JSON.stringify(data, (key, value) => {
            if (value && typeof value === 'object') {
                const constructorName = value?.constructor?.name;
                if (constructorName === 'Decimal' || constructorName === 'd') {
                    return Number(value);
                }
                if (value instanceof Date) {
                    return value.toISOString();
                }
            }
            if (typeof value === 'bigint') {
                return value.toString();
            }
            return value;
        });
        return JSON.parse(serialized);
    } catch (error) {
        console.error("SERIALIZE_PRISMA_FATAL_ERROR (Returning fallback to prevent crash):", error);
        // CRITICAL: Never return the raw 'data' here, as it will crash Next.js with a Digest error.
        // Return an empty array if the input was an array, otherwise an empty object.
        return (Array.isArray(data) ? [] : {}) as T;
    }
}
