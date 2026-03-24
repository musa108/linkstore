import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import CheckoutForm from "./checkout-form";
import { serializePrisma } from "@/lib/utils";

export default async function CheckoutPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const store = await prisma.store.findUnique({
        where: { slug },
    });

    if (!store) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-secondary py-12 px-6">
            <div className="mx-auto max-w-4xl space-y-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground">Complete Your Order</h1>
                    <p className="text-foreground/50">Secure checkout for {store.name}</p>
                </div>

                <CheckoutForm store={serializePrisma(store)} />
            </div>
        </div>
    );
}
