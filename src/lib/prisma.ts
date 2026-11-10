import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const createClient = () => {
    const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not set");
    // `sslmode=require` → `verify-full` keeps today's guarantees as `pg` tightens semantics.
    const normalised = connectionString.includes("sslmode=require")
        ? connectionString.replace("sslmode=require", "sslmode=verify-full")
        : connectionString;
    const pool = new Pool({ connectionString: normalised, max: Number(process.env.DB_POOL_MAX ?? 10), connectionTimeoutMillis: 10_000 });
    return new PrismaClient({ adapter: new PrismaPg(pool) });
};

declare global {
    var prisma: PrismaClient | undefined;
}

// Lazy proxy: importing this module never connects (keeps `next build` and unit tests DB-free).
let instance: PrismaClient | undefined;
function get(): PrismaClient {
    if (!instance) {
        instance = globalThis.prisma ?? createClient();
        if (process.env.NODE_ENV !== "production") globalThis.prisma = instance;
    }
    return instance;
}

const prisma = new Proxy({} as PrismaClient, {
    get(_t, prop) {
        const c = get();
        const v = Reflect.get(c, prop, c);
        return typeof v === "function" ? v.bind(c) : v;
    },
});

export default prisma;
