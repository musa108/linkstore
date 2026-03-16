import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import SetupStoreForm from "./setup-store-form";

export default async function SetupPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    const store = await prisma.store.findUnique({
        where: { vendorId: userId },
    });

    if (store) {
        redirect("/dashboard");
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl">
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-gray-900">Welcome to LinkStore</h1>
                    <p className="mt-2 text-gray-600">Let's set up your business storefront.</p>
                </div>

                <SetupStoreForm />
            </div>
        </div>
    );
}
