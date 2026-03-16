"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createStore } from "@/lib/actions/store";
import { Loader2 } from "lucide-react";

export default function SetupStoreForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function onSubmit(formData: FormData) {
        setLoading(true);
        setError("");

        try {
            const result = await createStore(formData);
            if (result.error) {
                setError(result.error);
            } else {
                router.push("/dashboard");
            }
        } catch (err) {
            console.error(err);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form action={onSubmit} className="space-y-6">
            {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Store Name
                </label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    placeholder="e.g. Trendy Wears Lagos"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
            </div>

            <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                    Store Link (Slug)
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
                        linkstore.app/
                    </span>
                    <input
                        type="text"
                        id="slug"
                        name="slug"
                        required
                        placeholder="my-shop"
                        className="block w-full min-w-0 flex-1 rounded-none rounded-r-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                    This will be your unique store URL to share on Instagram/WhatsApp.
                </p>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
                {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    "Create My Store"
                )}
            </button>
        </form>
    );
}
