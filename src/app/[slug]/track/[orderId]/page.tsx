import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { 
    CheckCircle2, 
    Circle, 
    Clock, 
    Package, 
    Truck, 
    Home, 
    Star, 
    MessageSquare, 
    ChevronRight,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { serializePrisma } from "@/lib/utils";
import TrackingTimeline from "./tracking-timeline";
import ReviewForm from "./review-form";

interface TrackPageProps {
    params: Promise<{
        slug: string;
        orderId: string;
    }>;
}

export default async function TrackOrderPage({ params }: TrackPageProps) {
    const { slug, orderId } = await params;

    const [order, store] = await Promise.all([
        prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: true,
                        variant: true,
                    },
                },
            },
        }),
        prisma.store.findUnique({
            where: { slug },
        }),
    ]);

    if (!order || !store) {
        notFound();
    }

    // Security: Ensure order belongs to this store
    if (order.storeId !== store.id) {
        notFound();
    }

    const safeOrder = serializePrisma(order) as any;
    const safeStore = serializePrisma(store) as any;

    return (
        <div className="min-h-screen bg-secondary/30 pb-20">
            {/* Header */}
            <div className="bg-card border-b sticky top-0 z-10 backdrop-blur-md bg-card/80">
                <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href={`/${slug}`} className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black italic">
                            {store.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-sm font-black text-foreground">{store.name}</p>
                            <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Order Tracking</p>
                        </div>
                    </Link>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30">Order #</span>
                        <span className="text-sm font-mono font-black text-foreground">{order.id.slice(-6).toUpperCase()}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
                {/* Status Card */}
                <div className="bg-card rounded-[40px] p-8 md:p-12 shadow-soft border border-border/50 relative overflow-hidden">
                    <div className="relative z-10">
                        <TrackingTimeline order={safeOrder} />
                    </div>
                    {/* Background Glow */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/5 blur-[100px] rounded-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Order Details */}
                    <div className="md:col-span-2 space-y-8">
                        <div className="bg-card rounded-[40px] p-8 shadow-soft border border-border/50">
                            <h3 className="text-lg font-black text-foreground mb-8 flex items-center gap-3">
                                <Package className="h-5 w-5 text-indigo-500" />
                                Order Items
                            </h3>
                            <div className="space-y-4">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex gap-4 items-center p-4 rounded-3xl bg-secondary/30 border border-border/10">
                                        <div className="h-14 w-14 rounded-2xl bg-card border overflow-hidden relative shrink-0">
                                            {item.product.imageUrl && (
                                                <img src={item.product.imageUrl} alt={item.product.name} className="object-cover w-full h-full" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-foreground truncate">{item.product.name}</p>
                                            <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest">
                                                Qty: {item.quantity} {item.variant && ` · ${item.variant.name}`}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-foreground">₦{Number(item.priceAtPurchase).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-4 mt-6 border-t border-dashed border-border/50 flex justify-between items-center text-sm">
                                    <span className="font-bold text-foreground/40 uppercase tracking-widest">Total Value</span>
                                    <span className="text-xl font-black text-indigo-600">₦{Number(order.total).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Transparency Confirmation Logic */}
                        {(safeOrder.status === "SHIPPED" || safeOrder.status === "DELIVERED") && (
                            <div className="bg-card rounded-[40px] p-8 shadow-soft border border-border/50 overflow-hidden relative">
                                <h3 className="text-lg font-black text-foreground mb-6 flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                    Transparency Confirmation
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className={`p-5 rounded-3xl border transition-all ${safeOrder.vendorConfirmedDelivery ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-secondary/50 border-border/20 text-foreground/40'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest">Store Confirmed</p>
                                            {safeOrder.vendorConfirmedDelivery ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                                        </div>
                                        <p className="text-xs font-bold">{safeOrder.vendorConfirmedDelivery ? 'Verified by Vendor' : 'Pending Vendor Check'}</p>
                                    </div>
                                    <div className={`p-5 rounded-3xl border transition-all ${safeOrder.customerConfirmedDelivery ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-secondary/50 border-border/20 text-foreground/40'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest">Your Receipt</p>
                                            {safeOrder.customerConfirmedDelivery ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                                        </div>
                                        <p className="text-xs font-bold">{safeOrder.customerConfirmedDelivery ? 'Verified by You' : 'Awaiting Your Confirm'}</p>
                                    </div>
                                </div>

                                {safeOrder.status === "SHIPPED" && !safeOrder.customerConfirmedDelivery && (
                                    <div className="mt-8 p-6 bg-indigo-600 rounded-[30px] text-white shadow-xl shadow-indigo-100 animate-in fade-in slide-in-from-bottom-5 duration-700">
                                        <p className="text-sm font-bold mb-4 flex items-center gap-2">
                                            <Home className="h-4 w-4" />
                                            Have you received your package?
                                        </p>
                                        <ReviewForm orderId={safeOrder.id} role="CUSTOMER_RECEIPT" />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Review System */}
                        {safeOrder.status === "DELIVERED" && (
                            <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-2xl border border-border/50 animate-in fade-in zoom-in duration-500">
                                <h3 className="text-2xl font-black text-foreground mb-4 flex items-center gap-3">
                                    <Star className="h-8 w-8 text-amber-400 fill-amber-400" />
                                    Share Your Experience
                                </h3>
                                <p className="text-foreground/50 font-medium mb-10 leading-relaxed max-w-lg">
                                    Your order has been successfully delivered and verified. Help the store grow by sharing your honest review.
                                </p>
                                <ReviewForm 
                                    orderId={safeOrder.id} 
                                    role="PRODUCT_REVIEW" 
                                    orderItems={safeOrder.items.map((i: any) => ({ 
                                        productId: i.productId, 
                                        name: i.product.name 
                                    }))}
                                    customerName={safeOrder.customerName}
                                />
                            </div>
                        )}
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-8">
                        <div className="bg-card rounded-[40px] p-8 shadow-soft border border-border/50">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 mb-6">Delivery Address</h4>
                            <div className="flex gap-4">
                                <div className="h-10 w-10 rounded-2xl bg-secondary flex items-center justify-center shrink-0">
                                    <Home className="h-5 w-5 text-foreground/30" />
                                </div>
                                <p className="text-sm font-bold text-foreground/80 leading-relaxed pt-1">
                                    {order.address}
                                </p>
                            </div>
                        </div>
                        
                        <div className="bg-card rounded-[40px] p-8 shadow-soft border border-border/50">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 mb-6">Contact Store</h4>
                            <Link 
                                href={`https://wa.me/${store.phoneNumber || '234'}`} 
                                target="_blank"
                                className="w-full h-14 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-emerald-100"
                            >
                                <MessageSquare className="h-4 w-4" />
                                Chat on WhatsApp
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
