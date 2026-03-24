import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import SettingsForm from "./settings-form";
import { serializePrisma } from "@/lib/utils";
import { getPaystackBanks } from "@/lib/paystack";

export default async function SettingsPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    const [storeRaw, banksResponse] = await Promise.all([
        prisma.store.findUnique({
            where: { vendorId: userId },
        }),
        getPaystackBanks()
    ]);

    if (!storeRaw) {
        redirect("/setup");
    }

    const banks = Array.from(new Map((banksResponse.status ? banksResponse.data : []).map((bank: any) => [bank.code, bank])).values()) as any[];
    const store = serializePrisma(storeRaw);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Store Settings</h2>
                <p className="text-muted-foreground">Manage your store appearance, delivery logistics, and payouts.</p>
            </div>

            <div className="max-w-2xl rounded-xl border bg-card p-8 shadow-sm">
                <SettingsForm initialData={store} banks={banks} />
            </div>
        </div>
    );
}
