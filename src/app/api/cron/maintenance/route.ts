import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { runMaintenance } from "@/server/maintenance";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorised(req: Request): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret) return false; // fail closed when not configured
    const given = req.headers.get("authorization") ?? "";
    const expected = `Bearer ${secret}`;
    return given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

export async function GET(req: Request) {
    if (!authorised(req)) return NextResponse.json({ ok: false }, { status: 401 });
    const result = await runMaintenance();
    return NextResponse.json({ ok: true, ...result });
}
