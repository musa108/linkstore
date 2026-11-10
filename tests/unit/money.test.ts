import { describe, expect, it } from "vitest";
import { computeSplit, formatNaira, fromKobo, percentToBps, toKobo } from "@/domain/money";

describe("toKobo / fromKobo", () => {
    it("converts exactly with no float error", () => {
        expect(toKobo("0.1")).toBe(10);
        expect(toKobo(19.99)).toBe(1999);
        expect(toKobo("1234.50")).toBe(123450);
        expect(toKobo(0.1 + 0.2)).toBe(30); // 0.30000000000000004 must not leak
        expect(fromKobo(123450)).toBe("1234.50");
        expect(fromKobo(5)).toBe("0.05");
    });
    it("rounds half-up beyond 2dp", () => {
        expect(toKobo("10.005")).toBe(1001);
        expect(toKobo("10.004")).toBe(1000);
    });
    it("accepts Prisma-Decimal-like objects", () => { expect(toKobo({ toString: () => "2500.00000000000000000000000000000" })).toBe(250000); });
    it("rejects garbage", () => {
        for (const bad of ["abc", "", "1e5", "1,000", "NaN"]) expect(() => toKobo(bad)).toThrow();
    });
    it("round-trips", () => { for (const k of [1, 99, 100, 101, 999_999_99]) expect(toKobo(fromKobo(k))).toBe(k); });
    it("formats naira", () => { expect(formatNaira(150000)).toContain("1,500"); });
});

describe("commission", () => {
    it("5% of ₦11,500 is exactly ₦575", () => {
        const s = computeSplit(1_150_000, 500);
        expect(s).toMatchObject({ commissionKobo: 57_500, merchantShareKobo: 1_092_500 });
    });
    it("rounds half-up and merchant gets the exact remainder", () => {
        const s = computeSplit(1005, 500); // 50.25 → 50
        expect(s.commissionKobo).toBe(50);
        expect(s.commissionKobo + s.merchantShareKobo).toBe(1005);
        expect(computeSplit(110, 500).commissionKobo).toBe(6); // 5.5 → 6
    });
    it("commission + merchant == amount for many amounts and rates", () => {
        for (let a = 1; a < 5000; a += 37) for (const bps of [0, 1, 250, 500, 750, 10_000]) {
            const s = computeSplit(a, bps); expect(s.commissionKobo + s.merchantShareKobo).toBe(a); expect(s.merchantShareKobo).toBeGreaterThanOrEqual(0);
        }
    });
    it("validates inputs", () => {
        expect(() => computeSplit(0, 500)).toThrow(); expect(() => computeSplit(10.5, 500)).toThrow(); expect(() => computeSplit(100, -1)).toThrow();
    });
    it("percent → bps with clamping/default", () => {
        expect(percentToBps("5.0")).toBe(500); expect(percentToBps(2.5)).toBe(250); expect(percentToBps(null)).toBe(500); expect(percentToBps(900)).toBe(5000); expect(percentToBps(-3)).toBe(0);
    });
});
