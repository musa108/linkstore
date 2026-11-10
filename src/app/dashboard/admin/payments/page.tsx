import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/server/auth";
import { reconcileLedger } from "@/server/reconciliation";
import { formatPrice } from "@/lib/utils";
import { RefundDecision, SettlementReport } from "./admin-actions";

export const dynamic = "force-dynamic";
const STATUSES = ["ALL", "INITIALIZED", "SUCCESS", "FAILED", "ABANDONED", "REFUNDED"];

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
    const admin = await requireAdmin();
    if (!admin.ok) notFound(); // admin area is invisible to everyone else

    const { status = "ALL" } = await searchParams;
    const filter = STATUSES.includes(status) && status !== "ALL" ? { status } : {};

    const [findings, refunds, payments] = await Promise.all([
        reconcileLedger(),
        prisma.refund.findMany({ where: { status: { in: ["REQUESTED", "APPROVED", "PROCESSING", "FAILED"] } }, orderBy: { createdAt: "asc" }, take: 50, include: { payment: { select: { reference: true, amountKobo: true, order: { select: { id: true, customerName: true, store: { select: { name: true } } } } } } } }),
        prisma.payment.findMany({ where: filter, orderBy: { createdAt: "desc" }, take: 50, include: { order: { select: { id: true, store: { select: { name: true } } } } } }),
    ]);
    const ICON = { critical: AlertTriangle, warning: AlertTriangle, info: Info } as const;

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Payments &amp; reconciliation</h1>
                <p className="mt-1 text-foreground/70">Platform-admin view. Everything here is derived from the payment ledger and provider events.</p>
            </div>

            <section aria-label="Reconciliation findings" className="space-y-3">
                <h2 className="text-lg font-semibold">Ledger check</h2>
                {findings.length === 0 ? (
                    <p className="flex items-center gap-2 rounded-[20px] border border-emerald-200 bg-emerald-50 p-4 font-medium text-emerald-900"><CheckCircle2 className="h-5 w-5" aria-hidden />No problems found. Orders, payments and refunds agree.</p>
                ) : (
                    <ul className="space-y-2">
                        {findings.map((f, i) => { const Icon = ICON[f.severity]; return (
                            <li key={i} className={`flex gap-3 rounded-[16px] border p-4 text-sm ${f.severity === "critical" ? "border-red-200 bg-red-50 text-red-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
                                <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                                <div><p className="font-semibold">{f.code.replaceAll("_", " ").toLowerCase()}</p><p>{f.message}</p>
                                    {(f.reference || f.orderId) && <p className="mt-1 font-mono text-xs opacity-80">{f.reference ?? ""} {f.orderId ? `· order ${f.orderId}` : ""}</p>}</div>
                            </li>); })}
                    </ul>
                )}
            </section>

            <section aria-label="Refund queue" className="space-y-3">
                <h2 className="text-lg font-semibold">Refund queue</h2>
                {refunds.length === 0 ? <p className="rounded-[20px] border border-border bg-white p-4 text-foreground/70">No refunds waiting.</p> : (
                    <ul className="space-y-3">
                        {refunds.map((r) => (
                            <li key={r.id} className="rounded-[20px] border border-border bg-white p-4 sm:p-5">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="font-semibold">{formatPrice(r.amountKobo / 100)} <span className="font-normal text-foreground/70">of {formatPrice(r.payment.amountKobo / 100)} · {r.payment.order.store.name} · {r.payment.order.customerName}</span></p>
                                        <p className="mt-1 text-sm text-foreground/80">“{r.reason}”</p>
                                        <p className="mt-1 text-xs text-foreground/60">Status: <strong>{r.status}</strong> · ref {r.payment.reference}</p>
                                        {r.failureReason && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">{r.failureReason}</p>}
                                    </div>
                                    {(r.status === "REQUESTED" || (r.status === "APPROVED" && r.failureReason)) && <RefundDecision refundId={r.id} retry={r.status === "APPROVED"} />}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section aria-label="Settlement comparison" className="space-y-3">
                <h2 className="text-lg font-semibold">Settlement comparison</h2>
                <SettlementReport />
            </section>

            <section aria-label="Recent payments" className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold">Recent payments</h2>
                    <nav aria-label="Filter payments" className="flex flex-wrap gap-2">
                        {STATUSES.map((s) => <Link key={s} href={`/dashboard/admin/payments?status=${s}`} className={`chip ${status === s ? "border-primary bg-primary text-white" : ""}`}>{s.toLowerCase()}</Link>)}
                    </nav>
                </div>
                <div className="overflow-x-auto rounded-[20px] border border-border bg-white">
                    <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="border-b border-border bg-secondary text-xs uppercase tracking-wide text-foreground/70"><tr><th className="p-3">When</th><th className="p-3">Store</th><th className="p-3">Reference</th><th className="p-3 text-right">Amount</th><th className="p-3 text-right">Platform fee</th><th className="p-3">Status</th></tr></thead>
                        <tbody className="divide-y divide-border">
                            {payments.map((p) => (
                                <tr key={p.id}>
                                    <td className="p-3 whitespace-nowrap">{p.createdAt.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</td>
                                    <td className="p-3">{p.order.store.name}</td>
                                    <td className="p-3 font-mono text-xs">{p.reference}</td>
                                    <td className="tabular p-3 text-right">{formatPrice(p.amountKobo / 100)}</td>
                                    <td className="tabular p-3 text-right">{formatPrice(p.commissionKobo / 100)} <span className="text-xs text-foreground/60">({p.commissionBps / 100}%)</span></td>
                                    <td className="p-3"><span className="chip">{p.status.toLowerCase()}</span>{p.failureReason && <span className="ml-2 text-xs text-foreground/60">{p.failureReason}</span>}</td>
                                </tr>
                            ))}
                            {payments.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-foreground/70">No payments.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
