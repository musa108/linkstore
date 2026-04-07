import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { serializePrisma } from "@/lib/utils";
import { Star, MessageSquare, Package, User, Clock, StarHalf } from "lucide-react";
import Image from "next/image";

export default async function ReviewsPage() {
    const { userId } = await auth();

    if (!userId) redirect("/sign-in");

    const store = await (prisma as any).store.findUnique({
        where: { vendorId: userId },
        include: {
            products: {
                include: {
                    reviews: {
                        orderBy: { createdAt: "desc" }
                    }
                }
            }
        }
    });

    if (!store) redirect("/setup");

    const allReviews = (store.products as any[]).flatMap((p: any) => 
        (p.reviews as any[]).map((r: any) => ({ ...r, product: p }))
    ).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const averageRating = allReviews.length > 0 
        ? allReviews.reduce((acc, curr) => acc + curr.rating, 0) / allReviews.length 
        : 0;

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-foreground">Customer Reviews</h2>
                    <p className="text-foreground/50 font-medium mt-2">Manage feedback and track your store&apos;s reputation.</p>
                </div>
                
                <div className="bg-card px-8 py-4 rounded-[28px] shadow-bento border border-border/50 flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground/30">Average Rating</span>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-foreground">{averageRating.toFixed(1)}</span>
                            <div className="flex text-amber-400">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} className={`h-4 w-4 ${s <= Math.round(averageRating) ? 'fill-current' : 'text-gray-200'}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="w-px h-10 bg-border/50" />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground/30">Total Reviews</span>
                        <span className="text-2xl font-black text-foreground">{allReviews.length}</span>
                    </div>
                </div>
            </div>

            {allReviews.length === 0 ? (
                <div className="bg-card/40 border-dashed border-2 p-20 rounded-[40px] text-center space-y-4">
                    <div className="h-20 w-20 bg-card rounded-[28px] shadow-soft flex items-center justify-center mx-auto text-foreground/20">
                        <MessageSquare className="h-10 w-10" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">No reviews yet</h3>
                    <p className="text-foreground/40 max-w-xs mx-auto font-medium">Once customers confirm their orders, their feedback will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {allReviews.map((review) => (
                        <div key={review.id} className="bg-card rounded-[32px] p-8 shadow-soft border border-border/50 hover:shadow-indigo-100/50 transition-all group overflow-hidden relative">
                            <div className="relative z-10 grid md:grid-cols-4 gap-8">
                                {/* Product Info */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-2xl bg-secondary overflow-hidden relative border border-border/10 shrink-0">
                                            {review.product.imageUrl && (
                                                <Image src={review.product.imageUrl} alt={review.product.name} fill className="object-cover" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-0.5">Product</p>
                                            <p className="text-sm font-bold text-foreground truncate">{review.product.name}</p>
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-secondary/50 border border-border/5 flex items-center gap-2">
                                        <Package className="h-3 w-3 text-indigo-400" />
                                        <span className="text-[10px] font-black uppercase tracking-wider text-foreground/40">Verified Purchase</span>
                                    </div>
                                </div>

                                {/* Review Content */}
                                <div className="md:col-span-3 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                {review.customerName.slice(0, 1).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-foreground">{review.customerName}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <div className="flex text-amber-400">
                                                        {[1, 2, 3, 4, 5].map((s) => (
                                                            <Star key={s} className={`h-3 w-3 ${s <= review.rating ? 'fill-current' : 'text-gray-200'}`} />
                                                        ))}
                                                    </div>
                                                    <span className="w-1 h-1 bg-border rounded-full" />
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-foreground/30 uppercase tracking-widest">
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(review.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <p className="text-base font-medium text-foreground/70 leading-relaxed italic">
                                        &ldquo;{review.comment}&rdquo;
                                    </p>
                                </div>
                            </div>
                            
                            {/* Decorative Background Star */}
                            <Star className="absolute -bottom-10 -right-10 h-40 w-40 text-indigo-50/20 rotate-12" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
