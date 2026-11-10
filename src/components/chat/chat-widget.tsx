"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, X, Send, Bot, RotateCcw, Square, AlertCircle } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/utils";

interface ChatWidgetProps { storeId: string; storeName: string; primaryColor: string }

const SUGGESTIONS = ["What do you sell?", "What are your delivery fees?", "Show me items under ₦10,000", "I want to check my order"];

function sessionId(): string {
    try {
        const k = "ls-chat-session";
        let v = sessionStorage.getItem(k);
        if (!v) { v = crypto.randomUUID(); sessionStorage.setItem(k, v); }
        return v;
    } catch { return crypto.randomUUID(); }
}

const textOf = (m: UIMessage) => m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
const usedTool = (m: UIMessage) => m.parts.some((p) => p.type.startsWith("tool-"));

interface ChatProduct { id: string; name: string; priceNaira: number; imageUrl: string | null; options: { id: string; name: string; priceNaira: number; available: boolean; lowStock: boolean }[] }
function productsOf(m: UIMessage): ChatProduct[] {
    return m.parts.flatMap((p) => {
        if (p.type !== "tool-search_products" || !("state" in p) || p.state !== "output-available") return [];
        return (p as { output?: { products?: ChatProduct[] } }).output?.products ?? [];
    });
}
function checkoutOf(m: UIMessage): string | null {
    for (const p of m.parts) if (p.type === "tool-checkout_link" && "state" in p && p.state === "output-available") return (p as { output?: { checkoutUrl?: string } }).output?.checkoutUrl ?? null;
    return null;
}

/** Real purchase action: adds to the shopper's actual cart (price is re-computed server-side at checkout). */
function ProductCard({ product, storeId }: { product: ChatProduct; storeId: string }) {
    const cart = useCart();
    const [optionId, setOptionId] = useState<string | null>(product.options.length === 1 && product.options[0]!.available ? product.options[0]!.id : null);
    const [added, setAdded] = useState(false);
    const option = product.options.find((o) => o.id === optionId);
    const price = option?.priceNaira ?? product.priceNaira;
    const needsOption = product.options.length > 0 && !option;
    const soldOut = product.options.length > 0 && product.options.every((o) => !o.available);
    return (
        <div className="mt-2 flex gap-3 rounded-xl border border-border bg-white p-2.5">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary">
                {product.imageUrl && <Image src={product.imageUrl} alt="" fill sizes="64px" unoptimized className="object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{product.name}</p>
                <p className="tabular text-sm font-bold text-primary">{formatPrice(price)}</p>
                {product.options.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1" role="group" aria-label={`Options for ${product.name}`}>
                        {product.options.map((o) => (
                            <button key={o.id} type="button" disabled={!o.available} onClick={() => setOptionId(o.id)} aria-pressed={o.id === optionId}
                                className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${o.id === optionId ? "border-primary bg-primary text-white" : "border-border bg-white"} disabled:opacity-40 disabled:line-through`}>{o.name}</button>
                        ))}
                    </div>
                )}
                <button type="button" disabled={needsOption || soldOut || added}
                    onClick={() => { cart.addItem({ id: product.id, variantId: option?.id, variantName: option?.name, name: product.name, price, imageUrl: product.imageUrl, quantity: 1, storeId }); setAdded(true); setTimeout(() => setAdded(false), 2500); }}
                    className="mt-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                    {soldOut ? "Sold out" : added ? "Added ✓" : needsOption ? "Choose an option" : "Add to cart"}
                </button>
            </div>
        </div>
    );
}

export default function ChatWidget({ storeId, storeName, primaryColor }: ChatWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const endRef = useRef<HTMLDivElement>(null);
    const reduce = useReducedMotion();
    const sid = useMemo(() => (typeof window === "undefined" ? "ssr-placeholder" : sessionId()), []);

    const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat", body: { storeId, sessionId: sid } }), [storeId, sid]);
    const { messages, sendMessage, status, stop, error, regenerate, setMessages } = useChat({ transport });
    const busy = status === "submitted" || status === "streaming";
    const lastMsg = messages[messages.length - 1];
    const awaitingText = busy && (!lastMsg || lastMsg.role === "user" || !textOf(lastMsg));

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); }, [messages, isOpen, status, reduce]);
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsOpen(false); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isOpen]);

    const submit = (text: string) => {
        const t = text.trim();
        if (!t || busy) return;
        setInput("");
        void sendMessage({ text: t });
    };

    return (
        <div className="fixed bottom-24 right-4 z-40 sm:bottom-5 sm:right-5">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        role="dialog" aria-label={`${storeName} shopping assistant`}
                        initial={reduce ? false : { opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
                        transition={{ duration: 0.18 }}
                        className="absolute bottom-16 right-0 mb-3 flex w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-white text-sm shadow-xl"
                        style={{ height: "min(560px, calc(100dvh - 7rem))" }}
                    >
                        <div className="flex shrink-0 items-center justify-between p-4 text-white" style={{ backgroundColor: primaryColor }}>
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20"><Bot className="h-5 w-5" aria-hidden /></div>
                                <div className="leading-tight">
                                    <p className="font-bold">{storeName} Assistant</p>
                                    <p className="text-[11px] text-white/85">Answers use this store&apos;s live catalogue</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setMessages([])} aria-label="Start a new chat" title="New chat" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/20"><RotateCcw className="h-4 w-4" /></button>
                                <button onClick={() => setIsOpen(false)} aria-label="Close chat" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/20"><X className="h-4 w-4" /></button>
                            </div>
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto bg-[#fffdf8] p-4" aria-live="polite">
                            <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-border bg-white px-4 py-2.5 leading-relaxed text-foreground">
                                Hi! I&apos;m the assistant for {storeName}. Ask me about products, prices, delivery, or an order you placed.
                            </div>
                            {messages.length === 0 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {SUGGESTIONS.map((s) => (
                                        <button key={s} onClick={() => submit(s)} className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground hover:border-foreground/30">{s}</button>
                                    ))}
                                </div>
                            )}
                            {messages.map((m) => {
                                const t = textOf(m);
                                const cards = m.role === "assistant" ? productsOf(m) : [];
                                const checkout = m.role === "assistant" ? checkoutOf(m) : null;
                                if (!t && cards.length === 0 && !checkout && !(m.role === "assistant" && usedTool(m))) return null;
                                const mine = m.role === "user";
                                return (
                                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                                        {/* Model output is rendered as plain text – never as HTML. */}
                                        <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 leading-relaxed ${mine ? "rounded-br-sm text-white" : "rounded-bl-sm border border-border bg-white text-foreground"}`} style={mine ? { backgroundColor: primaryColor } : undefined}>
                                            {t || (cards.length || checkout ? "" : "Checking the store…")}
                                            {cards.map((p) => <ProductCard key={p.id} product={p} storeId={storeId} />)}
                                            {checkout && <Link href={checkout} className="mt-2 inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white">Go to checkout</Link>}
                                        </div>
                                    </div>
                                );
                            })}
                            {awaitingText && (
                                <div className="flex justify-start" role="status" aria-label="Assistant is typing">
                                    <div className="flex h-10 items-center gap-1.5 rounded-2xl rounded-bl-sm border border-border bg-white px-5">
                                        {[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/40 motion-reduce:animate-none" style={{ animationDelay: `${i * 0.15}s` }} />)}
                                    </div>
                                </div>
                            )}
                            {error && (
                                <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                                    <div className="flex-1">
                                        <p>Sorry, I couldn&apos;t answer that. Please try again.</p>
                                        <button onClick={() => void regenerate()} className="mt-1 font-semibold underline">Retry</button>
                                    </div>
                                </div>
                            )}
                            <div ref={endRef} />
                        </div>

                        <div className="shrink-0 border-t border-border bg-white p-3">
                            <form onSubmit={(e) => { e.preventDefault(); submit(input); }} className="flex items-center gap-2 rounded-full border border-border bg-[#fffdf8] p-1 pl-4 focus-within:border-foreground/40">
                                <label htmlFor="chat-input" className="sr-only">Your message</label>
                                <input id="chat-input" value={input} onChange={(e) => setInput(e.target.value)} maxLength={1000} enterKeyHint="send" autoComplete="off" placeholder="Ask about products, delivery, orders…" className="flex-1 bg-transparent text-base outline-none placeholder:text-foreground/40 sm:text-sm" />
                                {busy ? (
                                    <button type="button" onClick={() => void stop()} aria-label="Stop" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-white text-foreground"><Square className="h-4 w-4" /></button>
                                ) : (
                                    <button type="submit" disabled={!input.trim()} aria-label="Send message" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-40" style={{ backgroundColor: primaryColor }}><Send className="ml-0.5 h-4 w-4" /></button>
                                )}
                            </form>
                            <p className="mt-2 text-center text-[11px] text-foreground/50">AI assistant · check prices at checkout</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button onClick={() => setIsOpen((o) => !o)} aria-label={isOpen ? "Close chat" : "Open shopping assistant"} aria-expanded={isOpen}
                className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform active:scale-95" style={{ backgroundColor: primaryColor }}>
                {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
            </button>
        </div>
    );
}
