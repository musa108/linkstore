import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { envProblems } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Liveness + dependency readiness. Reveals only booleans / key NAMES, never values or error details. */
export async function GET() {
    let database = false;
    try { await prisma.$queryRaw`SELECT 1`; database = true; } catch { /* reported below */ }
    const missingEnv = envProblems();
    const ok = database && missingEnv.length === 0;
    return NextResponse.json({ ok, database, env: missingEnv.length === 0 ? "ok" : missingEnv, openai: Boolean(process.env.OPENAI_API_KEY) }, { status: ok ? 200 : 503 });
}
