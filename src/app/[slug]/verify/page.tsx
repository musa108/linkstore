import prisma from "@/lib/prisma";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { redirect } from "next/navigation";
import { XCircle } from "lucide-react";
import Link from "next/link";

export default async function VerifyPaymentPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ reference: string }>;
}) {
    const { slug } = await params;
    const { reference } = await searchParams;

    if (!reference) {
        redirect(`/${slug}/checkout`);
    }

    const verification = await verifyPaystackTransaction(reference);

    if (verification.success && verification.data.status === "success") {
        // Update order status to paid
        await prisma.order.update({
            where: { id: reference },
            data: { status: "PAID" },
        });

        redirect(`/${slug}/success?orderId=${reference}`);
    }

    // Handle failure
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md w-full space-y-8 bg-white p-12 rounded-3xl shadow-xl border border-gray-100 animate-in zoom-in duration-500">
                <div className="flex justify-center">
                    <div className="rounded-full bg-red-50 p-6">
                        <XCircle className="h-16 w-16 text-red-500" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-3xl font-black text-gray-900 leading-tight">Payment Failed</h1>
                    <p className="text-gray-500 text-lg leading-relaxed">
                        We couldn&apos;t verify your payment. Your order has not been completed.
                    </p>
                    {verification.error && (
                        <p className="text-sm text-red-500 font-medium">
                            Reason: {verification.error}
                        </p>
                    )}
                </div>

                <div className="pt-8">
                    <Link
                        href={`/${slug}/checkout`}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 p-5 text-lg font-bold text-white shadow-xl hover:bg-gray-800 transition-all active:scale-95"
                    >
                        Try Again
                    </Link>
                </div>
            </div>
        </div>
    );
}
