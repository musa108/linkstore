"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  ChevronDown,
  Loader2,
  MapPin,
  Phone,
  ShieldAlert,
  Truck,
  Undo2,
} from "lucide-react";
import { confirmOrderDelivery, updateOrderStatus } from "@/lib/actions/order";
import { requestOrderRefund } from "@/lib/actions/payments-admin";
import { formatPrice } from "@/lib/utils";

export interface OrderRow {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  deliveryArea: string;
  total: number;
  deliveryFee: number;
  status: string;
  isDisputed: boolean;
  disputeReason: string | null;
  vendorConfirmedDelivery: boolean;
  customerConfirmedDelivery: boolean;
  createdAt: string;
  items: {
    id: string;
    quantity: number;
    priceAtPurchase: number;
    product: { name: string; imageUrl: string | null };
    variant: { name: string } | null;
  }[];
  payments: {
    id: string;
    amountKobo: number;
    status: string;
    refunds: {
      id: string;
      status: string;
      amountKobo: number;
      reason: string;
      failureReason: string | null;
    }[];
  }[];
}

const STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Awaiting payment", cls: "bg-amber-50 text-amber-900 border-amber-200" },
  PAID: { label: "Paid – ready to ship", cls: "bg-emerald-50 text-emerald-900 border-emerald-200" },
  SHIPPED: { label: "Shipped", cls: "bg-[#1e2024] text-white border-transparent" },
  DELIVERED: { label: "Delivered", cls: "bg-emerald-50 text-emerald-900 border-emerald-200" },
  CANCELLED: { label: "Cancelled", cls: "bg-rose-50 text-rose-900 border-rose-200" },
  REFUNDED: { label: "Refunded", cls: "bg-rose-50 text-rose-900 border-rose-200" },
};

const FILTERS = [
  { id: "ALL", label: "All" },
  { id: "PAID", label: "To ship" },
  { id: "SHIPPED", label: "Shipped" },
  { id: "DELIVERED", label: "Delivered" },
  { id: "PENDING", label: "Awaiting payment" },
  { id: "ISSUES", label: "Issues" },
];

const REFUNDABLE = ["PAID", "SHIPPED", "DELIVERED"];

function RefundBox({ order, onError }: { order: OrderRow; onError: (m: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const refunds = order.payments.flatMap((p) => p.refunds);
  const active = refunds.find((r) => ["REQUESTED", "APPROVED", "PROCESSING"].includes(r.status));

  if (active)
    return (
      <p className="rounded-xl bg-secondary p-3 text-xs text-foreground/80">
        Refund of {formatPrice(active.amountKobo / 100)} is <strong>{active.status.toLowerCase()}</strong>
        {active.status === "REQUESTED" ? " – waiting for platform approval." : "."}
      </p>
    );

  if (!REFUNDABLE.includes(order.status) || order.payments.length === 0) {
    const done = refunds.find((r) => r.status === "PROCESSED");
    return done ? (
      <p className="rounded-xl bg-secondary p-3 text-xs text-foreground/80">
        Refunded {formatPrice(done.amountKobo / 100)}.
      </p>
    ) : null;
  }

  if (sent)
    return (
      <p className="rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-900">
        Refund request sent for approval.
      </p>
    );

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="btn btn-quiet min-h-9 text-xs">
        <Undo2 className="h-3.5 w-3.5" aria-hidden />
        <span>Request refund</span>
      </button>
    );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    onError(null);
    const res = await requestOrderRefund(order.id, reason, amount);
    setBusy(false);
    if ("error" in res && res.error) onError(res.error);
    else setSent(true);
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-white p-4">
      <label className="block text-xs font-semibold text-foreground">
        Reason for refund
        <textarea
          required
          minLength={5}
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-1 w-full rounded-xl border border-border p-2.5 text-xs outline-none focus:border-[#eb5a28]"
          rows={2}
        />
      </label>
      <label className="block text-xs font-semibold text-foreground">
        Amount in ₦{" "}
        <span className="font-normal text-foreground/50">(leave empty to refund the full order)</span>
        <input
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={String((order.payments[0]?.amountKobo ?? 0) / 100)}
          className="mt-1 min-h-9 w-full rounded-xl border border-border px-3 text-xs outline-none focus:border-[#eb5a28]"
        />
      </label>
      <div className="flex gap-2">
        <button disabled={busy} className="btn btn-primary min-h-9 text-xs">
          {busy ? "Sending…" : "Send for approval"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-quiet min-h-9 text-xs">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function OrderList({ orders }: { orders: OrderRow[] }) {
  const [filter, setFilter] = useState("ALL");
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const shown = useMemo(
    () =>
      orders.filter((o) =>
        filter === "ALL"
          ? true
          : filter === "ISSUES"
          ? o.isDisputed || ["REFUNDED", "CANCELLED"].includes(o.status)
          : o.status === filter
      ),
    [orders, filter]
  );

  const counts = (f: string) =>
    orders.filter((o) =>
      f === "ALL"
        ? true
        : f === "ISSUES"
        ? o.isDisputed || ["REFUNDED", "CANCELLED"].includes(o.status)
        : o.status === f
    ).length;

  async function run(id: string, fn: () => Promise<{ error?: string } | object>) {
    setBusyId(id);
    setError(null);
    try {
      const r = await fn();
      if ("error" in r && typeof r.error === "string") setError(r.error);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div
        role="tablist"
        aria-label="Filter orders"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
      >
        {FILTERS.map((f) => {
          const isSelected = filter === f.id;
          return (
            <button
              key={f.id}
              role="tab"
              aria-selected={isSelected}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
                isSelected
                  ? "border-[#1e2024] bg-[#1e2024] text-white shadow-xs"
                  : "border-border bg-white text-foreground/70 hover:bg-secondary"
              }`}
            >
              <span>{f.label}</span>
              <span
                className={`ml-1.5 tabular text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? "bg-[#eb5a28] text-white" : "bg-secondary text-foreground/60"
                }`}
              >
                {counts(f.id)}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-800"
        >
          {error}
        </p>
      )}

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center shadow-subtle">
          <p className="text-sm font-bold text-foreground">
            {orders.length === 0 ? "No orders yet" : "No orders found in this filter"}
          </p>
          <p className="mt-1 text-xs text-foreground/50">
            {orders.length === 0
              ? "Share your store link on WhatsApp or Instagram to start receiving orders."
              : "Try switching to another filter."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((o) => {
            const st = STATUS[o.status] ?? { label: o.status, cls: "" };
            const open = openId === o.id;
            const busy = busyId === o.id;
            return (
              <li
                key={o.id}
                className="overflow-hidden rounded-2xl border border-border bg-white shadow-subtle transition hover:border-[#eb5a28]/30"
              >
                <button
                  onClick={() => setOpenId(open ? null : o.id)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-3 p-4 text-left sm:p-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-foreground">{o.customerName}</p>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${st.cls}`}
                      >
                        {st.label}
                      </span>
                      {o.isDisputed && (
                        <span className="flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                          <ShieldAlert className="h-3 w-3" />
                          <span>Disputed</span>
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-xs text-foreground/60 font-mono">
                      #{o.id.slice(-6).toUpperCase()} ·{" "}
                      {new Date(o.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      · {o.items.map((i) => `${i.quantity}× ${i.product.name}`).join(", ")}
                    </p>
                  </div>
                  <p className="tabular text-sm font-extrabold text-foreground">{formatPrice(o.total)}</p>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-foreground/40 transition-transform ${
                      open ? "rotate-180 text-[#eb5a28]" : ""
                    }`}
                  />
                </button>

                {open && (
                  <div className="space-y-4 border-t border-border bg-canvas/60 p-4 sm:p-6 text-xs">
                    <ul className="space-y-2.5">
                      {o.items.map((i) => (
                        <li key={i.id} className="flex items-center gap-3">
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-secondary border border-border/60">
                            {i.product.imageUrl && (
                              <Image
                                src={i.product.imageUrl}
                                alt=""
                                fill
                                sizes="44px"
                                unoptimized
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-foreground">
                              {i.product.name}
                              {i.variant ? ` – ${i.variant.name}` : ""}
                            </p>
                            <p className="text-[11px] text-foreground/50">
                              {i.quantity} × {formatPrice(i.priceAtPurchase)}
                            </p>
                          </div>
                          <p className="tabular font-bold text-foreground">
                            {formatPrice(i.priceAtPurchase * i.quantity)}
                          </p>
                        </li>
                      ))}
                      <li className="flex justify-between border-t border-border pt-2.5 text-xs text-foreground/70">
                        <span>Delivery fee ({o.deliveryArea.toLowerCase()})</span>
                        <span className="tabular font-semibold text-foreground">{formatPrice(o.deliveryFee)}</span>
                      </li>
                    </ul>

                    <div className="grid gap-2 border-t border-border pt-3 text-xs sm:grid-cols-2">
                      <p className="flex items-start gap-2 text-foreground/70">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground/45" />
                        <span>{o.address}</span>
                      </p>
                      <a
                        href={`tel:${o.customerPhone}`}
                        className="flex items-center gap-2 font-bold text-[#eb5a28] hover:underline"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span>{o.customerPhone}</span>
                      </a>
                    </div>

                    {o.isDisputed && o.disputeReason && (
                      <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
                        <strong>Customer dispute reason:</strong> {o.disputeReason}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2.5 border-t border-border pt-4">
                      {o.status === "PAID" && (
                        <button
                          disabled={busy}
                          onClick={() => run(o.id, () => updateOrderStatus(o.id, "SHIPPED"))}
                          className="btn btn-primary min-h-9 text-xs"
                        >
                          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Truck className="h-3.5 w-3.5" />}
                          <span>Mark Order as Shipped</span>
                        </button>
                      )}
                      {o.status === "SHIPPED" && !o.vendorConfirmedDelivery && (
                        <button
                          disabled={busy}
                          onClick={() => run(o.id, () => confirmOrderDelivery(o.id))}
                          className="btn btn-primary min-h-9 text-xs"
                        >
                          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          <span>Confirm Delivered</span>
                        </button>
                      )}
                      {o.status === "SHIPPED" && (
                        <span className="text-[11px] text-foreground/60">
                          Vendor: {o.vendorConfirmedDelivery ? "Confirmed ✓" : "Pending"} · Buyer:{" "}
                          {o.customerConfirmedDelivery ? "Confirmed ✓" : "Pending"}
                        </span>
                      )}
                      {o.status === "PENDING" && (
                        <span className="text-xs text-foreground/60 italic">
                          Awaiting customer payment confirmation from Paystack.
                        </span>
                      )}
                    </div>
                    <RefundBox order={o} onError={setError} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
