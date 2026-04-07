import prisma from "@/lib/prisma";
import { CheckCircle2, MessageCircle, ArrowLeft, Store as StoreIcon, ShoppingBag, ShieldAlert, Truck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { serializePrisma } from "@/lib/utils";
import PrintButton from "./print-button";
import DisputeButton from "./dispute-button";
import { OrderWithItems } from "@/types";

export const dynamic = "force-dynamic";

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
                        product: true,
                        variant: true,
                    }
                }
            }
        })
    ]);

    if (!store || !order) notFound();

    const safeStore = serializePrisma(store);
    const safeOrder = serializePrisma(order);

    if (!safeStore || !safeStore.name || !safeOrder || !safeOrder.id) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-secondary">
                <div className="text-center p-8 bg-card rounded-3xl border border-border shadow-soft animate-in fade-in zoom-in">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h2 className="text-xl font-black mb-2">Order Confirmed!</h2>
                    <p className="text-foreground/50 text-sm mb-6">Your payment was successful. We&apos;re generating your receipt...</p>
                    <Link href="/" className="px-6 py-3 bg-primary text-white rounded-2xl font-bold text-sm">Return Home</Link>
                </div>
            </div>
        );
    }

    const orderRef = orderId?.slice(-6).toUpperCase();
    const whatsappMessage = encodeURIComponent(
        `Hi ${safeStore.name}, I just paid for an order!\n\n` +
        `📝 Receipt: #${orderRef}\n` +
        `👤 Name: ${safeOrder.customerName}\n` +
        `💰 Total: ₦${Number(safeOrder.total).toLocaleString()}\n\n` +
        `Please confirm my payment. Thanks!`
    );
    const whatsappUrl = safeStore.phoneNumber 
        ? `https://wa.me/${safeStore.phoneNumber.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`
        : null;

    const formatDate = (date: Date | string) => {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat('en-NG', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(dateObj);
    };

    return (
        <div className="min-h-screen bg-secondary flex flex-col items-center py-12 px-4 print:bg-white print:py-0">
            {/* Action Bar (Hidden when printing) */}
            <div className="w-full max-w-2xl mb-6 flex items-center justify-between print:hidden animate-in fade-in slide-in-from-top-4">
                <Link 
                    href={`/${safeStore.slug}`}
                    className="flex items-center gap-2 text-sm font-bold text-foreground/60 hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Store
                </Link>
                {whatsappUrl && (
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-[#22c35e] transition-all"
                    >
                        <MessageCircle className="h-4 w-4" />
                        Notify Vendor
                    </a>
                )}
            </div>

            {/* Receipt Card */}
            <div className="w-full max-w-2xl bg-card rounded-[32px] shadow-xl border border-border/50 overflow-hidden animate-in zoom-in-95 duration-500 print:shadow-none print:border-none print:rounded-none">
                
                {/* Header Profile */}
                <div className="bg-canvas p-8 md:p-12 text-center border-b border-border/50">
                    <div className="mx-auto w-20 h-20 mb-6 bg-secondary rounded-2xl flex items-center justify-center overflow-hidden border border-border shadow-sm">
                        {safeStore.logoUrl ? (
                            <Image src={safeStore.logoUrl} alt={safeStore.name} width={80} height={80} className="object-cover w-full h-full" />
                        ) : (
                            <StoreIcon className="h-10 w-10 text-foreground/40" />
                        )}
                    </div>
                    
                    <div className="inline-flex items-center justify-center gap-2 mb-4 bg-green-500/10 text-green-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-green-500/20">
                        <CheckCircle2 className="h-4 w-4" />
                        Payment Successful
                    </div>
                    
                    <h1 className="text-3xl font-black text-foreground mb-2">₦{Number(safeOrder.total).toLocaleString()}</h1>
                    <p className="text-foreground/50 font-medium">Paid to {safeStore.name}</p>
                </div>

                {/* Receipt Details */}
                <div className="p-8 md:p-12 space-y-8">
                    
                    {/* Meta Data */}
                    <div className="grid grid-cols-2 gap-y-6 text-sm">
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Receipt No.</p>
                            <p className="font-mono font-bold text-foreground">#{orderRef}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Date Paid</p>
                            <p className="font-medium text-foreground">{formatDate(safeOrder.createdAt)}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Billed To</p>
                            <p className="font-medium text-foreground truncate">{safeOrder.customerName}</p>
                            <p className="text-xs text-foreground/50 truncate">{safeOrder.customerEmail}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Delivery Area</p>
                            <p className="font-medium text-foreground truncate">{safeOrder.deliveryArea}</p>
                            <p className="text-xs text-foreground/50 truncate">{safeOrder.address}</p>
                        </div>
                    </div>

                    <div className="h-px bg-border/50 w-full" />

                    {/* Itemized Order */}
                    <div className="space-y-4">
                        <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-4">Itemized Bill</p>
                        
                        {safeOrder.items && Array.isArray(safeOrder.items) ? (
                            safeOrder.items.map((item: any) => (
                                <div key={item.id} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-4 flex-1 overflow-hidden">
                                        <div className="h-12 w-12 rounded-xl bg-secondary flex-shrink-0 flex items-center justify-center overflow-hidden border border-border/50">
                                            {item.product.imageUrl ? (
                                                <Image src={item.product.imageUrl} alt={item.product.name} width={48} height={48} className="object-cover w-full h-full" />
                                            ) : (
                                                <ShoppingBag className="h-5 w-5 text-foreground/30" />
                                            )}
                                        </div>
                                        <div className="flex flex-col truncate">
                                            <p className="font-bold text-sm text-foreground truncate">{item.product.name}</p>
                                            <div className="flex items-center text-xs text-foreground/50">
                                                <span>Qty: {item.quantity}</span>
                                                {item.variant && (
                                                    <>
                                                        <span className="mx-1">•</span>
                                                        <span>{item.variant.name}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right ml-4">
                                        <p className="font-bold text-sm text-foreground">₦{(Number(item.priceAtPurchase) * item.quantity).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-foreground/40 italic">Item details unavailable</p>
                        )}
                    </div>

                    <div className="h-px bg-border/50 w-full" />

                    {/* Totals */}
                    <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-foreground/60 font-medium">Subtotal</span>
                            <span className="font-bold text-foreground">₦{Number(safeOrder.subtotal).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-foreground/60 font-medium">Delivery Fee ({safeOrder.deliveryArea})</span>
                            <span className="font-bold text-foreground">₦{Number(safeOrder.deliveryFee).toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between items-center pt-4 mt-4 border-t border-border">
                            <span className="text-lg font-black text-foreground">Total Paid</span>
                            <span className="text-xl font-black text-primary">₦{Number(safeOrder.total).toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Action Area */}
                    <div className="pt-8 space-y-4 print:hidden">
                        <Link 
                            href={`/${safeStore.slug}/track/${safeOrder.id}`}
                            className="w-full flex items-center justify-center gap-3 py-5 px-8 rounded-[24px] bg-indigo-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                        >
                            <Truck className="h-5 w-5" />
                            Track Your Package
                        </Link>

                        <div className="grid grid-cols-2 gap-4">
                            <PrintButton />
                            {!safeOrder.isDisputed ? (
                                <DisputeButton orderId={safeOrder.id} />
                            ) : (
                                <div className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-orange-500/10 text-orange-600 border border-orange-500/20 font-bold text-sm">
                                    <ShieldAlert className="h-4 w-4" />
                                    Disputed
                                </div>
                            )}
                        </div>

                        <p className="text-[10px] text-center font-bold text-foreground/30 uppercase tracking-widest mt-6">
                            Powered by LinkStore Core
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
