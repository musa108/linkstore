import prisma from "@/lib/prisma";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function SuccessPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ orderId: string }>;
}) {
    const { slug } = await params;
    const { orderId } = await searchParams;

    const store = await prisma.store.findUnique({
        where: { slug },
    });

    if (!store) notFound();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md w-full space-y-8 bg-white p-12 rounded-3xl shadow-xl border border-gray-100 animate-in zoom-in duration-500">
                <div className="flex justify-center">
                    <div className="rounded-full bg-green-50 p-6 animate-pulse">
                        <CheckCircle2 className="h-16 w-16 text-green-500" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-black text-gray-900 leading-tight">Order Received!</h1>
                    <p className="text-gray-500 text-lg leading-relaxed">
                        Thank you for shopping with <span className="font-bold text-gray-900">{store.name}</span>.
                        We&apos;ve received your order and will contact you shortly via phone/WhatsApp.
                    </p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6 text-left border border-gray-100">
                    <p className="text-xs uppercase font-bold text-gray-400 tracking-widest mb-1">Order Reference</p>
                    <p className="text-lg font-mono font-bold text-gray-900">#{orderId?.slice(-6).toUpperCase()}</p>
                </div>

                <div className="pt-4 space-y-4">
                    <Link
                        href={`/${store.slug}`}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 p-5 text-lg font-bold text-white shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-95"
                    >
                        Continue Shopping
                    </Link>
                    <p className="text-sm text-gray-400 flex items-center justify-center gap-2">
                        <ShoppingBag className="h-4 w-4" />
                        Order confirmation sent to your email
                    </p>
                </div>
            </div>
        </div>
    );
}
