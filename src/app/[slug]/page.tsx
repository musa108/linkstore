import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import ClientStorefront from "./client-storefront";
import { serializePrisma } from "@/lib/utils";
import { ShieldAlert, Store as StoreIcon, RefreshCcw } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PublicStorePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    try {
        // ESSENTIAL DATA FETCH
        const store = await (prisma as any).store.findUnique({
            where: { slug },
            include: {
                products: {
                    where: { inStock: true },
                    include: { 
                        variants: true, 
                        media: true,
                        reviews: {
                            orderBy: { createdAt: "desc" }
                        }
                    },
                    orderBy: { createdAt: "desc" },
                },
            },
        }) as any;

        if (!store) {
            notFound();
        }

        // Increment visits (Fire and forget, don't let it crash the page)
        prisma.store.update({
            where: { id: store.id },
            data: { visits: { increment: 1 } }
        }).catch(() => {});

        return <ClientStorefront 
            store={serializePrisma(store)} 
            products={serializePrisma(store.products || [])} 
        />;

    } catch (error) {
        console.error("CRITICAL_STOREFRONT_CRASH:", error);
        
        // Maintenance / Safety Fallback UI
        return (
            <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-6 text-center">
                <div className="w-full max-w-md bg-card rounded-[40px] p-12 shadow-2xl border border-border/50 animate-in fade-in zoom-in duration-500">
                    <div className="mx-auto w-24 h-24 mb-8 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                        <StoreIcon className="h-12 w-12" />
                    </div>
                    
                    <h1 className="text-2xl font-black text-foreground mb-4">Store Temporarily Offline</h1>
                    <p className="text-foreground/50 font-medium mb-4 leading-relaxed">
                        We&apos;re currently updating the store configuration. Please check back in a few moments.
                    </p>
                    {process.env.NODE_ENV !== "production" && (
                        <div className="mb-10 p-4 bg-red-50 rounded-2xl border border-red-100 text-left overflow-auto max-h-40">
                            <p className="text-[10px] font-mono text-red-600 break-words">
                                ERROR: {error instanceof Error ? error.message : String(error)}
                            </p>
                        </div>
                    )}
                    
                    <Link 
                        href={`/${slug}`}
                        className="w-full h-15 bg-foreground text-card rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-95"
                    >
                        <RefreshCcw className="h-4 w-4" />
                        Retry Connection
                    </Link>
                </div>
            </div>
        );
    }
}
