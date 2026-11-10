import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

function Stars({ rating }: { rating: number }) {
    return (
        <span className="flex text-amber-500" role="img" aria-label={`${rating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((s) => <Star key={s} className={`h-4 w-4 ${s <= rating ? "fill-current" : "text-border"}`} aria-hidden />)}
        </span>
    );
}

export default async function ReviewsPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");
    const store = await prisma.store.findUnique({ where: { vendorId: userId }, select: { id: true } });
    if (!store) redirect("/setup");

    const reviews = await prisma.review.findMany({
        where: { product: { storeId: store.id } }, orderBy: { createdAt: "desc" }, take: 100,
        include: { product: { select: { name: true } } },
    });
    const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Customer reviews</h1>
                    <p className="mt-1 text-foreground/70">Only customers with a delivered order can leave a review.</p>
                </div>
                <div className="rounded-[20px] border border-border bg-white px-6 py-4">
                    <p className="text-sm text-foreground/70">Average rating</p>
                    <p className="tabular text-3xl font-bold">{average.toFixed(1)} <span className="text-base font-medium text-foreground/60">from {reviews.length} review{reviews.length === 1 ? "" : "s"}</span></p>
                </div>
            </div>
            {reviews.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-border bg-white p-10 text-center">
                    <p className="font-semibold">No reviews yet</p>
                    <p className="mt-1 text-sm text-foreground/70">After an order is delivered, the customer can rate it from their tracking page.</p>
                </div>
            ) : (
                <ul className="space-y-3">
                    {reviews.map((r) => (
                        <li key={r.id} className="rounded-[20px] border border-border bg-white p-5">
                            <div className="flex flex-wrap items-center justify-between gap-2"><Stars rating={r.rating} /><time className="text-xs text-foreground/60" dateTime={r.createdAt.toISOString()}>{r.createdAt.toLocaleDateString("en-NG", { dateStyle: "medium" })}</time></div>
                            <p className="mt-2 font-medium">{r.product.name}</p>
                            {r.comment && <p className="mt-1 leading-relaxed text-foreground/80">{r.comment}</p>}
                            <p className="mt-2 text-sm text-foreground/60">{r.customerName}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
