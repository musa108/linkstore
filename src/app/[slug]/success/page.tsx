import prisma from "@/lib/prisma";
import { CheckCircle2, ShoppingBag, MessageCircle } from "lucide-react";
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

    const [store, order] = await Promise.all([
        prisma.store.findUnique({
            where: { slug },
        }),
        prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        })
    ]);

    if (!store || !order) notFound();

    const orderRef = orderId?.slice(-6).toUpperCase();
    const whatsappMessage = encodeURIComponent(
        `Hi ${store.name}, I just placed an order!\n\n` +
        `📝 Order: #${orderRef}\n` +
        `👤 Name: ${order.customerName}\n` +
        `💰 Total: ₦${Number(order.total).toLocaleString()}\n\n` +
        `Please confirm my payment. Thanks!`
    );
    const whatsappUrl = store.phoneNumber 
        ? `https://wa.me/${store.phoneNumber.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`
        : null;

    return (
        <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md w-full space-y-8 bg-card p-12 rounded-3xl shadow-xl border border-border/50 animate-in zoom-in duration-500">
                <div className="flex justify-center">
                    <div className="rounded-full bg-green-50 p-6 animate-pulse">
                        <CheckCircle2 className="h-16 w-16 text-green-500" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-black text-foreground leading-tight">Order Received!</h1>
                    <p className="text-foreground/50 text-lg leading-relaxed">
                        Thank you for shopping with <span className="font-bold text-foreground">{store.name}</span>.
                        We&apos;ve received your order and will contact you shortly via phone/WhatsApp.
                    </p>
                </div>

                <div className="bg-secondary rounded-2xl p-6 text-left border border-border/50">
                    <p className="text-xs uppercase font-bold text-foreground/40 tracking-widest mb-1">Order Reference</p>
                    <p className="text-lg font-mono font-bold text-foreground">#{orderId?.slice(-6).toUpperCase()}</p>
                </div>

                <div className="pt-4 space-y-4">
                    {whatsappUrl && (
                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] p-5 text-lg font-bold text-white shadow-xl shadow-green-100 transition-all hover:bg-[#22c35e] active:scale-95"
                        >
                            <MessageCircle className="h-6 w-6" />
                            Notify Vendor on WhatsApp
                        </a>
                    )}
                    <Link
                        href={`/${store.slug}`}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 p-5 text-lg font-bold text-white shadow-xl shadow-gray-100 transition-all hover:bg-black active:scale-[0.98]"
                    >
                        Continue Shopping
                    </Link>
                    <p className="text-sm text-foreground/40 flex items-center justify-center gap-2">
                        <ShoppingBag className="h-4 w-4" />
                        Order confirmation sent to your email
                    </p>
                </div>
            </div>
        </div>
    );
}
