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
    return JSON.parse(JSON.stringify(data, (key, value) => {
        // If it's a Prisma Decimal or something with a toString (like Date)
        // But JSON.stringify already handles Dates well. 
        // Decimal objects from Prisma have a d, e, s, c structure or similar.
        if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'Decimal') {
            return Number(value);
        }
        return value;
    }));
}
