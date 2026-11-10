import { redirect } from "next/navigation";
import Link from "next/link";
import { XCircle, Clock } from "lucide-react";
import prisma from "@/lib/prisma";
import { finalizePayment } from "@/server/payments/finalize";

export const dynamic = "force-dynamic";

/**
 * Paystack redirects the browser here. The redirect is INFORMATIONAL: this page asks Paystack
 * (server-to-server) and compares amount/currency before anything is marked paid. The webhook
 * is the backstop if the customer never lands here.
 */
export default async function VerifyPaymentPage({ params, searchParams }: {
    params: Promise<{ slug: string }>; searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
    const { slug } = await params;
    const sp = await searchParams;
    const reference = sp.reference ?? sp.trxref;
    if (!reference) redirect(`/${slug}/checkout`);

    const outcome = await finalizePayment(reference, "callback");
    if (outcome.status === "success") {
        const order = await prisma.order.findUnique({ where: { id: outcome.orderId }, select: { id: true, store: { select: { slug: true } } } });
        if (!order || order.store.slug !== slug) redirect(`/${slug}`);
        redirect(`/${slug}/success?orderId=${order.id}`);
    }

    const pending = outcome.status === "pending" || outcome.status === "error";
    const Icon = pending ? Clock : XCircle;
    return (
        <main className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="max-w-md w-full space-y-6 bg-card p-10 rounded-2xl border border-border text-center">
                <div className={`mx-auto h-14 w-14 rounded-full flex items-center justify-center ${pending ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"}`}>
                    <Icon className="h-7 w-7" aria-hidden />
                </div>
                <h1 className="text-2xl font-bold text-foreground">{pending ? "We're confirming your payment" : "Payment not completed"}</h1>
                <p className="text-foreground/70 leading-relaxed">
                    {pending
                        ? "Your bank hasn't confirmed this payment yet. Please don't pay again — refresh this page in a minute. If you were charged, your order will be confirmed automatically."
                        : "We couldn't confirm a successful payment, so no order was placed. You have not been charged for a completed order."}
                </p>
                <div className="flex flex-col gap-3 pt-2">
                    {pending && <Link href={`/${slug}/verify?reference=${encodeURIComponent(reference)}`} className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground">Check again</Link>}
                    <Link href={`/${slug}/checkout`} className="rounded-xl border border-border px-5 py-3 font-semibold text-foreground">{pending ? "Back to checkout" : "Try again"}</Link>
                </div>
            </div>
        </main>
    );
}
