import type { UIMessage } from "ai";
import { z } from "zod";

export const MAX_HISTORY = 12;
export const MAX_CHARS = 1000;

const incoming = z.object({
    storeId: z.string().min(1).max(40),
    sessionId: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/),
    messages: z.array(z.object({ role: z.string(), parts: z.array(z.object({ type: z.string(), text: z.string().optional() }).passthrough()).optional() }).passthrough()).min(1).max(100),
});

/**
 * Rebuilds the conversation from CLIENT input keeping ONLY plain user/assistant text.
 * Drops `system`/`tool` roles, tool-call/result parts and any other part types, so a client
 * cannot inject instructions or fabricate tool results. History is truncated and length-capped.
 */
export function sanitizeConversation(body: unknown): { storeId: string; sessionId: string; messages: UIMessage[] } | null {
    const p = incoming.safeParse(body);
    if (!p.success) return null;
    const cleaned: UIMessage[] = [];
    for (const [i, m] of p.data.messages.entries()) {
        if (m.role !== "user" && m.role !== "assistant") continue;
        const text = (m.parts ?? []).filter((x) => x.type === "text" && typeof x.text === "string").map((x) => x.text as string).join("\n").trim().slice(0, MAX_CHARS);
        if (!text) continue;
        cleaned.push({ id: `m${i}`, role: m.role, parts: [{ type: "text", text }] });
    }
    const recent = cleaned.slice(-MAX_HISTORY);
    if (recent.length === 0 || recent[recent.length - 1]!.role !== "user") return null;
    return { storeId: p.data.storeId, sessionId: p.data.sessionId, messages: recent };
}

/** Same hardening for endpoints without a store/session (merchant assistant). */
export function sanitizeMessages(messages: unknown): UIMessage[] | null {
    const p = z.array(incoming.shape.messages.element).min(1).max(100).safeParse(messages);
    if (!p.success) return null;
    const out = p.data.flatMap((m, i): UIMessage[] => {
        if (m.role !== "user" && m.role !== "assistant") return [];
        const text = (m.parts ?? []).filter((x) => x.type === "text" && typeof x.text === "string").map((x) => x.text as string).join("\n").trim().slice(0, MAX_CHARS);
        return text ? [{ id: `m${i}`, role: m.role, parts: [{ type: "text", text }] }] : [];
    }).slice(-MAX_HISTORY);
    return out.length > 0 && out[out.length - 1]!.role === "user" ? out : null;
}

export function lastUserText(messages: UIMessage[]): string {
    const last = [...messages].reverse().find((m) => m.role === "user");
    return (last?.parts ?? []).map((p) => (p.type === "text" ? p.text : "")).join("");
}
