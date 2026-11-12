"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Check, Send, Sparkles, Square, X } from "lucide-react";
import { updateOrderStatus } from "@/lib/actions/order";

const SUGGESTIONS = ["How were sales this week?", "Which orders are waiting to ship?", "What's running low on stock?"];
const textOf = (m: UIMessage) => m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");

interface Proposal { action: "MARK_SHIPPED"; orderId: string; ref: string; label: string }
function proposalsOf(m: UIMessage): Proposal[] {
    return m.parts.flatMap((p) => {
        if (p.type !== "tool-propose_mark_shipped" || !("state" in p) || p.state !== "output-available") return [];
        const out = (p as { output?: { proposal?: Proposal } }).output;
        return out?.proposal ? [out.proposal] : [];
    });
}

/** The model only PROPOSES; this button is the explicit confirmation that triggers the real, authorised server action. */
function ProposalCard({ proposal }: { proposal: Proposal }) {
    const [state, setState] = useState<"idle" | "busy" | "done" | string>("idle");
    async function confirm() {
        setState("busy");
        const res = await updateOrderStatus(proposal.orderId, "SHIPPED");
        setState("error" in res && res.error ? res.error : "done");
    }
    return (
        <div className="mt-2 rounded-xl border border-border bg-white p-3">
            <p className="text-sm font-medium">{proposal.label}</p>
            {state === "done" ? <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-700"><Check className="h-4 w-4" aria-hidden />Marked as shipped</p> : (
                <>
                    <button onClick={confirm} disabled={state === "busy"} className="btn btn-primary mt-2 min-h-10 text-sm">{state === "busy" ? "Updating…" : "Confirm: mark as shipped"}</button>
                    {state !== "idle" && state !== "busy" && <p role="alert" className="mt-2 text-sm text-red-700">{state}</p>}
                </>
            )}
        </div>
    );
}

export default function MerchantAssistant() {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const endRef = useRef<HTMLDivElement>(null);
    const transport = useMemo(() => new DefaultChatTransport({ api: "/api/merchant-chat" }), []);
    const { messages, sendMessage, status, stop, error, regenerate } = useChat({ transport });
    const busy = status === "submitted" || status === "streaming";

    useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [messages, status, open]);
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
        window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    const send = (t: string) => { const v = t.trim(); if (!v || busy) return; setInput(""); void sendMessage({ text: v }); };

    return (
        <div className="fixed bottom-20 right-4 z-[60] lg:bottom-6 lg:right-6">
            {open && (
                <div role="dialog" aria-label="Store assistant" className="absolute bottom-16 right-0 flex h-[min(540px,calc(100dvh-9rem))] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-xl">
                    <div className="flex items-center justify-between bg-primary p-4 text-white">
                        <div className="flex items-center gap-2"><Bot className="h-5 w-5" aria-hidden /><p className="font-semibold">Store assistant</p></div>
                        <button onClick={() => setOpen(false)} aria-label="Close assistant" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/20"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="flex-1 space-y-3 overflow-y-auto bg-canvas p-4 text-sm" aria-live="polite">
                        <p className="rounded-2xl rounded-bl-sm border border-border bg-white p-3">Ask me about your sales, orders or stock. I read your live store data and can suggest actions – you always confirm them.</p>
                        {messages.length === 0 && <div className="flex flex-wrap gap-2">{SUGGESTIONS.map((s) => <button key={s} onClick={() => send(s)} className="chip hover:border-primary">{s}</button>)}</div>}
                        {messages.map((m) => {
                            const t = textOf(m); const props = proposalsOf(m);
                            if (!t && props.length === 0) return null;
                            const mine = m.role === "user";
                            return (
                                <div key={m.id} className={mine ? "flex justify-end" : ""}>
                                    <div className={`max-w-[88%] whitespace-pre-wrap rounded-2xl p-3 leading-relaxed ${mine ? "rounded-br-sm bg-primary text-white" : "rounded-bl-sm border border-border bg-white"}`}>
                                        {t}{props.map((p) => <ProposalCard key={p.orderId} proposal={p} />)}
                                    </div>
                                </div>
                            );
                        })}
                        {busy && <p role="status" className="text-foreground/60">Checking your store…</p>}
                        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">Something went wrong. <button className="font-semibold underline" onClick={() => void regenerate()}>Retry</button></p>}
                        <div ref={endRef} />
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2 border-t border-border bg-white p-3">
                        <label htmlFor="merchant-chat-input" className="sr-only">Ask about your store</label>
                        <input id="merchant-chat-input" value={input} onChange={(e) => setInput(e.target.value)} maxLength={1000} placeholder="Ask about sales, orders, stock…" autoComplete="off" className="min-h-11 flex-1 rounded-full border border-border bg-canvas px-4 text-base outline-none focus:border-primary sm:text-sm" />
                        {busy ? <button type="button" onClick={() => void stop()} aria-label="Stop" className="btn btn-quiet h-11 w-11 p-0"><Square className="h-4 w-4" /></button>
                            : <button type="submit" disabled={!input.trim()} aria-label="Send" className="btn btn-primary h-11 w-11 p-0 disabled:opacity-40"><Send className="h-4 w-4" /></button>}
                    </form>
                </div>
            )}
            <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? "Close store assistant" : "Open store assistant"} className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:bg-primary-hover active:scale-95"><Sparkles className="h-6 w-6 shrink-0" /></button>
        </div>
    );
}
