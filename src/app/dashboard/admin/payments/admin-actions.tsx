"use client";

import { useState } from "react";
import { decideRefundAction, runSettlementReport } from "@/lib/actions/payments-admin";
import { formatPrice } from "@/lib/utils";
import type { SettlementRow } from "@/server/reconciliation";

export function RefundDecision({ refundId, retry }: { refundId: string; retry: boolean }) {
    const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
    const [msg, setMsg] = useState<string | null>(null);
    async function decide(approve: boolean) {
        if (approve && !window.confirm(retry ? "Only retry after confirming on Paystack that this refund was NOT created. Continue?" : "Approve this refund? Money will be returned to the customer via Paystack.")) return;
        setBusy(approve ? "approve" : "reject"); setMsg(null);
        const r = await decideRefundAction(refundId, approve);
        setBusy(null);
        setMsg("error" in r && r.error ? r.error : approve ? "Submitted to Paystack." : "Rejected.");
    }
    return (
        <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
                <button disabled={busy !== null} onClick={() => decide(true)} className="btn btn-primary min-h-10 text-sm">{busy === "approve" ? "Working…" : retry ? "Retry refund" : "Approve"}</button>
                {!retry && <button disabled={busy !== null} onClick={() => decide(false)} className="btn btn-quiet min-h-10 text-sm">{busy === "reject" ? "Working…" : "Reject"}</button>}
            </div>
            {msg && <p role="status" className="text-xs text-foreground/80">{msg}</p>}
        </div>
    );
}

export function SettlementReport() {
    const [days, setDays] = useState(7);
    const [rows, setRows] = useState<SettlementRow[] | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    async function run() {
        setBusy(true); setErr(null);
        const r = await runSettlementReport(days);
        setBusy(false);
        if ("error" in r) setErr(r.error); else setRows(r.rows);
    }
    return (
        <div className="space-y-3 rounded-[20px] border border-border bg-white p-4 sm:p-5">
            <p className="text-sm text-foreground/75">Compares what each store should receive (its share of successful payments, net of refunds) with Paystack&apos;s settlement totals. <strong>Informational:</strong> settlements lag by about a business day and the provider field mapping is not verified against a live account.</p>
            <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm font-medium">Last <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="mx-1 min-h-10 rounded-lg border border-border bg-white px-2">{[7, 14, 30, 90].map((d) => <option key={d} value={d}>{d}</option>)}</select> days</label>
                <button onClick={run} disabled={busy} className="btn btn-primary min-h-10 text-sm">{busy ? "Comparing…" : "Run comparison"}</button>
            </div>
            {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
            {rows && (rows.length === 0 ? <p className="text-sm text-foreground/70">No stores with payout accounts.</p> : (
                <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="text-xs uppercase text-foreground/70"><tr><th className="py-2">Store</th><th className="py-2 text-right">Expected</th><th className="py-2 text-right">Paystack settled</th><th className="py-2 text-right">Difference</th><th className="py-2 pl-4">Result</th></tr></thead>
                    <tbody className="divide-y divide-border">{rows.map((r) => (
                        <tr key={r.storeId}><td className="py-2">{r.storeName}</td><td className="tabular py-2 text-right">{formatPrice(r.expectedKobo / 100)}</td>
                            <td className="tabular py-2 text-right">{r.settledKobo === null ? "–" : formatPrice(r.settledKobo / 100)}</td><td className="tabular py-2 text-right">{r.deltaKobo === null ? "–" : formatPrice(r.deltaKobo / 100)}</td>
                            <td className="py-2 pl-4"><span className="chip">{r.status.toLowerCase()}</span>{r.note && <span className="ml-2 text-xs text-foreground/60">{r.note}</span>}</td></tr>))}</tbody>
                </table></div>
            ))}
        </div>
    );
}
