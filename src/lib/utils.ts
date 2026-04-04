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
    
    // Seen set to handle circular references
    const seen = new WeakSet();

    function recursiveClone(obj: any): any {
        // Handle primitives and null
        if (obj === null || typeof obj !== 'object') {
            if (typeof obj === 'bigint') return obj.toString();
            return obj;
        }

        // Handle Dates
        if (obj instanceof Date) return obj.toISOString();

        // Handle Prisma Decimals
        const constructorName = obj?.constructor?.name;
        if (constructorName === 'Decimal' || constructorName === 'd') {
            return Number(obj);
        }

        // Handle circular references
        if (seen.has(obj)) return undefined; // Skip circular links to prevent crash
        seen.add(obj);

        // Handle Arrays
        if (Array.isArray(obj)) {
            return obj.map(item => recursiveClone(item));
        }

        // Handle Objects
        const clone: any = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                clone[key] = recursiveClone(obj[key]);
            }
        }
        return clone;
    }

    try {
        return recursiveClone(data);
    } catch (error) {
        console.error("SERIALIZE_PRISMA_FATAL_ERROR (Returning fallback to prevent crash):", error);
        return (Array.isArray(data) ? [] : {}) as T;
    }
}
