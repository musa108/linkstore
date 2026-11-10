import { createHmac, timingSafeEqual } from "node:crypto";
import { logger, errorInfo } from "@/lib/logger";

const BASE = "https://api.paystack.co";
const TIMEOUT_MS = 12_000;

function authHeaders(extra: Record<string, string> = {}) {
    return { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY ?? ""}`, "Content-Type": "application/json", ...extra };
}

type PsResult<T> = { ok: true; data: T } | { ok: false; error: string; /** true when the outcome is unknown (timeout/network): caller must NOT assume failure */ ambiguous: boolean; httpStatus?: number };

async function psFetch<T>(path: string, init: RequestInit & { next?: { revalidate: number } } = {}): Promise<PsResult<T>> {
    try {
        const res = await fetch(`${BASE}${path}`, { ...init, headers: authHeaders(), signal: AbortSignal.timeout(TIMEOUT_MS) });
        const json = (await res.json().catch(() => null)) as { status?: boolean; message?: string; data?: T } | null;
        if (!res.ok || !json?.status) {
            return { ok: false, error: json?.message ?? `Paystack returned ${res.status}`, ambiguous: res.status >= 500, httpStatus: res.status };
        }
        return { ok: true, data: json.data as T };
    } catch (err) {
        logger.warn("paystack.request_failed", { path, ...errorInfo(err) });
        return { ok: false, error: "Could not reach the payment provider.", ambiguous: true };
    }
}

export interface InitializeInput {
    email: string; amountKobo: number; reference: string; callbackUrl: string; subaccount?: string; metadata?: Record<string, unknown>;
}

/** amountKobo is sent verbatim – it is already an integer in minor units. */
export async function initializePaystackTransaction(i: InitializeInput) {
    return psFetch<{ authorization_url: string; access_code: string; reference: string }>("/transaction/initialize", {
        method: "POST",
        body: JSON.stringify({
            email: i.email, amount: i.amountKobo, currency: "NGN", reference: i.reference,
            callback_url: i.callbackUrl, subaccount: i.subaccount, metadata: i.metadata,
        }),
    });
}

export interface VerifiedTransaction {
    id: number | string; status: string; reference: string; amount: number; currency: string; paid_at?: string | null; gateway_response?: string;
}

/** Authoritative server-to-server verification. Caller must compare amount/currency to the stored Payment. */
export async function verifyPaystackTransaction(reference: string) {
    return psFetch<VerifiedTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`, { method: "GET" });
}

export interface PaystackRefund { id: number | string; status: string; amount?: number; transaction?: unknown }

/**
 * POST /refund {transaction, amount?}. `transaction` = reference or id; omitting `amount` = full refund;
 * amount (kobo) may not exceed the original transaction (official docs: paystack.com/docs/payments/refunds).
 */
export async function createPaystackRefund(input: { reference: string; amountKobo: number }) {
    return psFetch<PaystackRefund>("/refund", { method: "POST", body: JSON.stringify({ transaction: input.reference, amount: input.amountKobo }) });
}

export interface PaystackSettlement { id?: number | string; status?: string; total_amount?: number; total_processed?: number; settlement_date?: string; subaccount?: unknown }

/**
 * GET /settlement?from&to&subaccount. UNVERIFIED against the live API in this repo (no network/credentials
 * during development): parsing is deliberately tolerant and the reconciliation report labels results as
 * informational. Verify field names against your Paystack account before relying on it.
 */
export async function listPaystackSettlements(q: { from: string; to: string; subaccount?: string }) {
    const params = new URLSearchParams({ from: q.from, to: q.to, perPage: "100" });
    if (q.subaccount) params.set("subaccount", q.subaccount);
    return psFetch<PaystackSettlement[]>(`/settlement?${params.toString()}`, { method: "GET" });
}

export async function createPaystackSubaccount(businessName: string, settlementBank: string, accountNumber: string, percentageCharge: number) {
    return psFetch<{ subaccount_code: string }>("/subaccount", {
        method: "POST",
        body: JSON.stringify({ business_name: businessName, settlement_bank: settlementBank, account_number: accountNumber, percentage_charge: percentageCharge }),
    });
}

export const FALLBACK_BANKS = [
    { name: "Access Bank", code: "044" }, { name: "First Bank", code: "011" }, { name: "GTBank", code: "058" },
    { name: "United Bank For Africa", code: "033" }, { name: "Zenith Bank", code: "057" }, { name: "Opay", code: "999992" },
    { name: "Kuda Bank", code: "090267" }, { name: "Moniepoint", code: "50515" }, { name: "PalmPay", code: "999991" },
];

export async function getPaystackBanks(): Promise<{ status: boolean; data: { name: string; code: string }[] }> {
    const r = await psFetch<{ name: string; code: string }[]>("/bank?country=nigeria&perPage=100", { method: "GET", next: { revalidate: 3600 } });
    return r.ok ? { status: true, data: r.data } : { status: true, data: FALLBACK_BANKS };
}

/** Paystack signs the RAW request body with HMAC-SHA512 using the secret key (x-paystack-signature). */
export function verifyWebhookSignature(rawBody: string, signature: string | null, secret: string | undefined): boolean {
    if (!signature || !secret) return false;
    const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
}
