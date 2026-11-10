import { describe, expect, it } from "vitest";
import { canTransition, MERCHANT_SETTABLE } from "@/domain/order-state";

describe("order state machine", () => {
    it("allows the happy path", () => {
        expect(canTransition("PENDING", "PAID")).toBe(true);
        expect(canTransition("PAID", "SHIPPED")).toBe(true);
        expect(canTransition("SHIPPED", "DELIVERED")).toBe(true);
    });
    it("blocks invalid jumps and regressions", () => {
        for (const [a, b] of [["PENDING", "SHIPPED"], ["PENDING", "DELIVERED"], ["PAID", "PENDING"], ["SHIPPED", "PAID"], ["DELIVERED", "SHIPPED"], ["REFUNDED", "PAID"], ["PAID", "DELIVERED"]]) expect(canTransition(a!, b!)).toBe(false);
    });
    it("rejects unknown statuses", () => { expect(canTransition("PAID", "HACKED")).toBe(false); expect(canTransition("X", "PAID")).toBe(false); });
    it("merchants can only mark shipped", () => { expect([...MERCHANT_SETTABLE]).toEqual(["SHIPPED"]); });
});
