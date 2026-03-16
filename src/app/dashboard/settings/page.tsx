import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import SettingsForm from "./settings-form";
import { serializePrisma } from "@/lib/utils";

export default async function SettingsPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    const store = await prisma.store.findUnique({
        where: { vendorId: userId },
    });

    if (!store) {
        redirect("/setup");
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Store Settings</h2>
                <p className="text-muted-foreground">Manage your store appearance and delivery logistics.</p>
            </div>

            <div className="max-w-2xl rounded-xl border bg-white p-8 shadow-sm">
                <SettingsForm initialData={serializePrisma(store)} />
            </div>
        </div>
    );
}
