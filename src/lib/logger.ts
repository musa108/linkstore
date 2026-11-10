import { randomUUID } from "node:crypto";

type Level = "debug" | "info" | "warn" | "error";
const REDACT = /(secret|token|password|authorization|cookie|signature|api[_-]?key|accountnumber|card)/i;

function redact(value: unknown, depth = 0): unknown {
    if (depth > 4 || value === null || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
    return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, REDACT.test(k) ? "[redacted]" : redact(v, depth + 1)]),
    );
}

/** Structured JSON logs. Never pass raw request bodies, PII or secrets; keys that look sensitive are redacted. */
export function log(level: Level, event: string, fields: Record<string, unknown> = {}) {
    const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...(redact(fields) as object) });
    (level === "error" ? console.error : level === "warn" ? console.warn : console.log)(line);
}

export const logger = {
    debug: (e: string, f?: Record<string, unknown>) => log("debug", e, f),
    info: (e: string, f?: Record<string, unknown>) => log("info", e, f),
    warn: (e: string, f?: Record<string, unknown>) => log("warn", e, f),
    error: (e: string, f?: Record<string, unknown>) => log("error", e, f),
};

export function newRequestId(): string {
    return randomUUID().slice(0, 12);
}

export function errorInfo(err: unknown): { name: string; message: string } {
    if (err instanceof Error) return { name: err.name, message: err.message.slice(0, 300) };
    if (typeof err === "object" && err !== null) {
        const obj = err as Record<string, unknown>;
        const msg = (obj.message as string) ||
                    ((obj.error as Record<string, unknown>)?.message as string) ||
                    JSON.stringify(err);
        return { name: (obj.name as string) || (obj.code as string) || "UnknownError", message: String(msg).slice(0, 300) };
    }
    return { name: "UnknownError", message: String(err).slice(0, 300) };
}
