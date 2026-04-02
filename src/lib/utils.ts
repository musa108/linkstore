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
        return JSON.parse(JSON.stringify(data, (key, value) => {
            // Handle Prisma Decimal objects safely
            if (value && typeof value === 'object') {
                // Safely check constructor name without risking access on null/proto-less objects
                const constructorName = value?.constructor?.name;
                if (constructorName === 'Decimal' || constructorName === 'd') {
                    return Number(value);
                }
                // Handle Dates (though stringify usually does this, better to be explicit if needed)
                if (value instanceof Date) {
                    return value.toISOString();
                }
            }
            // Handle BigInt which JSON.stringify doesn't support by default
            if (typeof value === 'bigint') {
                return value.toString();
            }
            return value;
        }));
    } catch (error) {
        console.error("SERIALIZE_PRISMA_ERROR:", error);
        return data; // Fallback to raw data if serialization fails
    }
}
