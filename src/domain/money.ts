/**
 * Money rules (see Architecture_essential.md):
 *  - All arithmetic is done in INTEGER KOBO (1 NGN = 100 kobo). Never floats.
 *  - Database `Decimal` columns are exact; they are converted at the boundary
 *    with toKobo()/fromKobo() and never added/multiplied as JS numbers.
 *  - Commission is expressed in basis points (500 bps = 5.00%) and rounded
 *    half-up to the nearest kobo. The merchant receives the remainder, so
 *    commission + merchant share ALWAYS equals the amount exactly.
 */
export const CURRENCY = "NGN" as const;
export const MAX_ORDER_KOBO = 1_000_000_000; // ₦10,000,000 – sanity ceiling, fits Postgres INTEGER

export type Kobo = number;

type DecimalLike = { toString(): string };

/** Convert a NGN amount (number | numeric string | Prisma Decimal) to integer kobo. Throws on invalid input. */
export function toKobo(value: number | string | DecimalLike): Kobo {
    const str = typeof value === "number" ? value.toString() : value.toString().trim();
    if (!/^-?\d+(\.\d+)?$/.test(str)) throw new Error(`Invalid money value: ${str}`);
    const negative = str.startsWith("-");
    const [whole, frac = ""] = str.replace("-", "").split(".");
    // Half-up on the third decimal digit onward (exact string arithmetic – no float error)
    const frac3 = (frac + "000").slice(0, 3);
    let kobo = Number(whole) * 100 + Number(frac3.slice(0, 2));
    if (Number(frac3[2]) >= 5) kobo += 1;
    if (!Number.isSafeInteger(kobo)) throw new Error("Money value out of range");
    return negative ? -kobo : kobo;
}

/** Integer kobo → decimal string with 2dp, safe to hand to Prisma Decimal columns. */
export function fromKobo(kobo: Kobo): string {
    if (!Number.isInteger(kobo)) throw new Error("fromKobo expects an integer");
    const negative = kobo < 0;
    const abs = Math.abs(kobo);
    const s = `${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
    return negative ? `-${s}` : s;
}

export function formatNaira(kobo: Kobo): string {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: CURRENCY }).format(kobo / 100);
}

/** Commission percentage (e.g. 5 or "5.0" or Decimal) → basis points. Clamped to 0–5000 (50%). */
export function percentToBps(percent: number | string | DecimalLike | null | undefined): number {
    if (percent === null || percent === undefined) return 500;
    const n = Number(percent.toString());
    if (!Number.isFinite(n)) return 500;
    return Math.min(5000, Math.max(0, Math.round(n * 100)));
}

export interface Split {
    amountKobo: Kobo;
    commissionBps: number;
    commissionKobo: Kobo;
    merchantShareKobo: Kobo;
}

/** Platform commission rounded half-up; merchant share is the exact remainder. */
export function computeSplit(amountKobo: Kobo, commissionBps: number): Split {
    if (!Number.isInteger(amountKobo) || amountKobo <= 0) throw new Error("Amount must be a positive integer (kobo)");
    if (!Number.isInteger(commissionBps) || commissionBps < 0 || commissionBps > 10_000) throw new Error("Invalid commission bps");
    const commissionKobo = Math.floor((amountKobo * commissionBps + 5_000) / 10_000);
    return { amountKobo, commissionBps, commissionKobo, merchantShareKobo: amountKobo - commissionKobo };
}
