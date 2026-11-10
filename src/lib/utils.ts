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

const isDecimalLike = (o: object): o is { toString(): string } => {
    const ctor = (o as { constructor?: { name?: string } }).constructor?.name;
    return ctor === "Decimal" || ctor === "d" || ctor === "Decimal2" ||
        (typeof (o as { toNumber?: unknown }).toNumber === "function" && "d" in o && "e" in o && "s" in o);
};

/**
 * Deeply serializes Prisma objects so they can cross the server→client boundary:
 * Date → ISO string, Decimal → number, bigint → string. The static type is kept as `T`
 * (the client-side interfaces in `@/types` describe the *logical* shape).
 */
export function serializePrisma<T>(data: T): T {
    if (!data) return data;
    const seen = new WeakSet<object>();

    function clone(value: unknown, depth = 0): unknown {
        if (depth > 10) return undefined;
        if (value === null || typeof value !== "object") return typeof value === "bigint" ? value.toString() : value;
        if (value instanceof Date) return value.toISOString();
        if (isDecimalLike(value)) return Number(value.toString());
        if (seen.has(value)) return undefined;
        seen.add(value);
        if (Array.isArray(value)) return (value as unknown[]).map((v) => clone(v, depth + 1));
        const out: Record<string, unknown> = {};
        for (const key of Object.keys(value)) out[key] = clone((value as Record<string, unknown>)[key], depth + 1);
        return out;
    }

    try {
        return clone(data) as T;
    } catch (error) {
        console.error("SERIALIZE_PRISMA_FATAL_ERROR:", error);
        return (Array.isArray(data) ? [] : {}) as T;
    }
}
