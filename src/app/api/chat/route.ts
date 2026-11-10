import { convertToModelMessages, stepCountIs, streamText } from "ai";
import prisma from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { logger, newRequestId, errorInfo } from "@/lib/logger";
import { createShopperTools } from "@/server/chat/tools";
import { lastUserText, sanitizeConversation } from "@/server/chat/messages";
import { buildSystemPrompt } from "@/server/chat/prompt";
import { getChatModel, isAiConfigured } from "@/server/chat/model";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

const json = (body: object, status: number, extra: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...extra } });

export async function POST(req: Request) {
    const requestId = newRequestId();
    if (!isAiConfigured()) return json({ error: "The assistant is unavailable right now." }, 503);

    const ip = clientIp(req.headers);
    const rl = (await rateLimit(`chat:${ip}`, 20, 10 * 60_000));
    if (!rl.allowed) return json({ error: "You're sending messages too quickly. Please wait a moment." }, 429, { "Retry-After": String(rl.retryAfterSec) });

    let body: unknown;
    try { body = await req.json(); } catch { return json({ error: "Invalid request." }, 400); }
    const convo = sanitizeConversation(body);
    if (!convo) return json({ error: "Invalid request." }, 400);

    // Shopper context = the PUBLIC store being viewed, loaded server-side. The model never picks a store.
    const store = await prisma.store.findUnique({ where: { id: convo.storeId }, select: { id: true, slug: true, name: true, announcement: true } });
    if (!store) return json({ error: "Store not found." }, 404);

    try {
        // Persist (retention enforced by /api/cron/maintenance). Conversation is bound to store + anonymous session.
        let conversation = await prisma.chatConversation.findFirst({ where: { storeId: store.id, sessionId: convo.sessionId }, select: { id: true } });
        if (!conversation) conversation = await prisma.chatConversation.create({ data: { storeId: store.id, sessionId: convo.sessionId }, select: { id: true } });
        const conversationId = conversation.id;
        await prisma.chatMessage.create({ data: { conversationId, role: "user", content: lastUserText(convo.messages) } });

        const result = streamText({
            model: getChatModel(),
            system: buildSystemPrompt(store.name, store.announcement),
            messages: await convertToModelMessages(convo.messages),
            tools: createShopperTools({ db: prisma, store, clientKey: ip }),
            stopWhen: stepCountIs(4),
            maxOutputTokens: 500,
            temperature: 0.3,
            maxRetries: 1,
            abortSignal: AbortSignal.any([req.signal, AbortSignal.timeout(25_000)]),
            onFinish: async ({ text, usage }) => {
                logger.info("chat.completed", { requestId, storeId: store.id, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens });
                if (text.trim()) await prisma.chatMessage.create({ data: { conversationId, role: "assistant", content: text.slice(0, 4000) } }).catch(() => undefined);
            },
            onError: ({ error }) => logger.error("chat.stream_error", { requestId, storeId: store.id, ...errorInfo(error) }),
        });
        return result.toUIMessageStreamResponse({ onError: () => "Sorry, something went wrong. Please try again." });
    } catch (err) {
        logger.error("chat.failed", { requestId, ...errorInfo(err) });
        return json({ error: "Sorry, something went wrong. Please try again." }, 500);
    }
}
