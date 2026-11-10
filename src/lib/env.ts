import { z } from "zod";

/**
 * Validated, typed server environment. Call getEnv() (not process.env) in server code.
 * Validation is lazy so `next build` does not require production secrets.
 */
const schema = z.object({
    DATABASE_URL: z.string().min(1),
    CLERK_SECRET_KEY: z.string().min(1),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    PAYSTACK_SECRET_KEY: z.string().min(1),
    OPENAI_API_KEY: z.string().optional(), // chatbot degrades gracefully when absent
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    CRON_SECRET: z.string().min(16).optional(),
    ADMIN_USER_IDS: z.string().optional(), // comma-separated Clerk user ids allowed to approve refunds / view reconciliation
    ALLOW_CHECKOUT_WITHOUT_PAYOUT: z.enum(["true", "false"]).default("false"),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof schema>;
let cached: Env | undefined;

export function getEnv(): Env {
    if (cached) return cached;
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
        const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
        throw new Error(`Invalid environment configuration. Problem keys: ${missing}`);
    }
    cached = parsed.data;
    return cached;
}

/** Non-throwing check used by /api/health. Returns the names (never values) of problems. */
export function envProblems(): string[] {
    const parsed = schema.safeParse(process.env);
    return parsed.success ? [] : parsed.error.issues.map((i) => i.path.join("."));
}
