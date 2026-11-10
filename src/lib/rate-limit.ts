import prisma from "@/lib/prisma";
import { logger, errorInfo } from "@/lib/logger";

/**
 * Global fixed-window rate limiter.
 *
 * State lives in PostgreSQL (`RateLimitBucket`), so the limit holds across every server instance /
 * serverless invocation with no extra infrastructure. One atomic UPSERT per check.
 * If the database is unreachable the limiter FAILS OPEN to a per-instance in-memory window
 * (availability over strictness) and logs a warning.
 */
export interface RateResult { allowed: boolean; remaining: number; retryAfterSec: number }

interface Bucket { count: number; resetAt: number }
const memory = new Map<string, Bucket>();
let lastSweep = 0;

/** Pure in-memory window – used as the fallback and directly in unit tests. */
export function memoryRateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateResult {
    if (now - lastSweep > 60_000) {
        lastSweep = now;
        for (const [k, b] of memory) if (b.resetAt <= now) memory.delete(k);
    }
    let b = memory.get(key);
    if (!b || b.resetAt <= now) { b = { count: 0, resetAt: now + windowMs }; memory.set(key, b); }
    b.count += 1;
    return { allowed: b.count <= limit, remaining: Math.max(0, limit - b.count), retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
}

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateResult> {
    const k = key.slice(0, 200);
    try {
        const rows = await prisma.$queryRaw<{ count: number; reset_in: number }[]>`
            INSERT INTO "RateLimitBucket" ("key", "count", "resetAt")
            VALUES (${k}, 1, now() + (${windowMs}::double precision * interval '1 millisecond'))
            ON CONFLICT ("key") DO UPDATE SET
              "count"   = CASE WHEN "RateLimitBucket"."resetAt" <= now() THEN 1 ELSE "RateLimitBucket"."count" + 1 END,
              "resetAt" = CASE WHEN "RateLimitBucket"."resetAt" <= now() THEN now() + (${windowMs}::double precision * interval '1 millisecond') ELSE "RateLimitBucket"."resetAt" END
            RETURNING "count", EXTRACT(EPOCH FROM ("resetAt" - now()))::float8 AS reset_in`;
        const row = rows[0]!;
        return { allowed: row.count <= limit, remaining: Math.max(0, limit - row.count), retryAfterSec: Math.min(Math.ceil(windowMs / 1000), Math.max(1, Math.ceil(row.reset_in))) };
    } catch (err) {
        logger.warn("ratelimit.db_unavailable_fallback", errorInfo(err));
        return memoryRateLimit(k, limit, windowMs);
    }
}

export function clientIp(headers: { get(name: string): string | null }): string {
    const fwd = headers.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0]!.trim().slice(0, 64);
    return headers.get("x-real-ip")?.slice(0, 64) ?? "unknown";
}

export async function purgeExpiredBuckets(): Promise<number> {
    return prisma.$executeRaw`DELETE FROM "RateLimitBucket" WHERE "resetAt" < now() - interval '1 hour'`;
}

export async function _resetRateLimitsForTests() {
    memory.clear();
    if (process.env.DATABASE_URL) await prisma.$executeRaw`DELETE FROM "RateLimitBucket"`.catch(() => undefined);
}
