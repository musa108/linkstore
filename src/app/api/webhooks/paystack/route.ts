import { NextResponse } from "next/server";
import { handlePaystackWebhook } from "@/server/payments/webhook";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // needs node:crypto + raw body

export async function POST(req: Request) {
    const raw = await req.text(); // signature is computed over the RAW body – do not re-serialise
    const result = await handlePaystackWebhook(raw, req.headers.get("x-paystack-signature"), process.env.PAYSTACK_SECRET_KEY);
    return NextResponse.json(result.body, { status: result.httpStatus });
}
