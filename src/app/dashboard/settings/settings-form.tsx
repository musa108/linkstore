"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateStore, updateStorePayoutDetails } from "@/lib/actions/store";
import { ImagePlus, X, Palette, Megaphone, Loader2, Landmark, CreditCard, User } from "lucide-react";
import { Store, Bank } from "@/types";
import { motion, Variants } from "framer-motion";
import { CldUploadButton, CloudinaryUploadWidgetResults } from "next-cloudinary";
import Image from "next/image";

interface SettingsFormProps {
    initialData: Store;
    banks: Bank[]; 
}

export default function SettingsForm({ initialData, banks }: SettingsFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [logoUrl, setLogoUrl] = useState(initialData.logoUrl || "");
    const [primaryColor, setPrimaryColor] = useState(initialData.primaryColor || "#4f46e6");

    async function onSubmit(formData: FormData) {
        setLoading(true);
        setError("");

        // Append custom fields
        formData.append("logoUrl", logoUrl);
        formData.append("primaryColor", primaryColor);

        try {
            // Update general settings
            const result = await updateStore(initialData.id, formData);

            if (result.error) {
                setError(result.error);
                setLoading(false);
                return;
            }

            // If payout details are provided and subaccount doesn't exist yet, or to update
            const bankCode = formData.get("bankCode") as string;
            const accountNumber = formData.get("accountNumber") as string;
            
            if (bankCode && accountNumber && !initialData.subaccountCode) {
                const payoutResult = await updateStorePayoutDetails(formData);
                if (payoutResult.error) {
                    setError(`Settings saved, but payout setup failed: ${payoutResult.error}`);
                    setLoading(false);
                    return;
                }
            }

            router.refresh();
        } catch (err) {
            console.error(err);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    const container: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08
            }
        }
    };

    const item: Variants = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
    };

    return (
        <motion.form
            variants={container}
            initial="hidden"
            animate="show"
            action={onSubmit}
            className="space-y-10 pb-10"
        >
            {error && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600 border border-red-100"
                >
                    {error}
                </motion.div>
            )}

            <div className="space-y-12">
                {/* Visual Identity Section */}
                <motion.div variants={item} className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <Palette className="h-4 w-4" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Visual Identity</h3>
                    </div>

                    <div className="grid gap-10 md:grid-cols-2">
                        {/* Logo Upload */}
                        <div className="space-y-4">
                            <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Store Logo</label>
                            <div className="flex items-center gap-6">
                                <input type="hidden" name="logoUrl" value={logoUrl} />
                                {logoUrl ? (
                                    <div className="group relative h-32 w-32 overflow-hidden rounded-[24px] border-4 border-white bg-gray-50 shadow-immersive transition-all hover:scale-[1.02]">
                                        <Image src={logoUrl} alt="Logo" fill className="object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => setLogoUrl("")}
                                                className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-red-500 transition-all active:scale-95"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <CldUploadButton
                                        onSuccess={(result: CloudinaryUploadWidgetResults) => {
                                            if (result.info && typeof result.info !== "string") {
                                                setLogoUrl(result.info.secure_url);
                                            }
                                        }}
                                        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "linkstore"}
                                        className="flex h-32 w-32 flex-col items-center justify-center gap-2 rounded-[24px] border-2 border-dashed border-gray-200 bg-gray-50/50 text-gray-400 transition-all hover:border-indigo-400 hover:bg-indigo-50/30 hover:text-indigo-600 group"
                                    >
                                        <ImagePlus className="h-6 w-6" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Upload Logo</span>
                                    </CldUploadButton>
                                )}
                                <div className="flex-1 space-y-2">
                                    <p className="text-xs font-bold text-gray-900">Brand Representation</p>
                                    <p className="text-[11px] text-gray-500 leading-relaxed font-medium">Add a square logo (e.g. 500x500px) for the best appearance in the header.</p>
                                </div>
                            </div>
                        </div>

                        {/* Color Picker */}
                        <div className="space-y-4">
                            <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Primary Brand Color</label>
                            <div className="flex items-center gap-6">
                                <div
                                    className="h-20 w-20 rounded-[20px] shadow-immersive border-4 border-white shrink-0 transition-transform hover:rotate-12 cursor-pointer relative"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    <input
                                        type="color"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    />
                                </div>
                                <div className="flex-1 space-y-3">
                                    <input
                                        type="text"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        className="w-full rounded-xl border border-gray-100 bg-white p-3 text-xs font-mono font-black text-gray-700 uppercase focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 outline-none shadow-sm"
                                    />
                                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">This color will be applied to your buttons, highlights, and icons.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Announcement Bar Section */}
                <motion.div variants={item} className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                            <Megaphone className="h-4 w-4" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Announcement Bar</h3>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Banner Message</label>
                        <textarea
                            name="announcement"
                            defaultValue={initialData.announcement || ""}
                            className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 p-4 text-sm font-bold text-gray-900 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none h-24 resize-none shadow-sm"
                            placeholder="e.g. Free delivery on orders over ₦50,000 this weekend! 🚚"
                        />
                        <p className="text-[11px] text-gray-400 font-medium ml-1 italic">Leave empty to hide the announcement bar on your storefront.</p>
                    </div>
                </motion.div>

                <motion.div variants={item} className="grid gap-8 md:grid-cols-2">
                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Store Name</label>
                        <input
                            name="name"
                            defaultValue={initialData.name}
                            placeholder="My Amazing Shop"
                            className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 p-4 text-sm font-bold text-gray-900 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none shadow-sm"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Store Link (Slug)</label>
                        <div className="relative">
                            <input
                                name="slug"
                                defaultValue={initialData.slug}
                                className="w-full rounded-2xl border border-gray-100 bg-gray-100/50 p-4 pl-12 text-sm font-bold text-gray-400 cursor-not-allowed outline-none"
                                disabled
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <span className="text-xs font-bold">/@</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div variants={item} className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Store Description</label>
                    <textarea
                        name="description"
                        defaultValue={initialData.description || ""}
                        className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 p-4 text-sm font-bold text-gray-900 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none h-32 resize-none shadow-sm"
                        placeholder="Tell your customers about your shop. This will appear on your storefront..."
                    />
                </motion.div>

                {/* Advanced Features Section */}
                <motion.div variants={item} className="pt-4">
                    <div className="rounded-[32px] bg-indigo-50/30 border border-indigo-100 p-8 space-y-8">
                        <div>
                            <h3 className="text-lg font-black text-gray-900 tracking-tight">Advanced Features</h3>
                            <p className="text-xs text-indigo-500 font-bold uppercase tracking-wider mt-1">Configure automation and analytics preferences.</p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-2">
                            <div className="space-y-3">
                                <label className="text-sm font-black text-gray-700 ml-1">WhatsApp Number</label>
                                <div className="relative">
                                    <input
                                        name="phoneNumber"
                                        defaultValue={initialData.phoneNumber || ""}
                                        placeholder="2348012345678"
                                        className="w-full rounded-2xl border border-white bg-white/80 p-4 pl-12 text-sm font-black text-gray-900 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none shadow-sm"
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                                        +
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-400 font-medium ml-1">Format: 2348012345678 (no &quot;+&quot; sign)</p>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-black text-gray-700 ml-1">Low Stock Alert Threshold</label>
                                <input
                                    name="lowStockThreshold"
                                    type="number"
                                    defaultValue={initialData.lowStockThreshold || 5}
                                    className="w-full rounded-2xl border border-white bg-white/80 p-4 text-sm font-black text-gray-900 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none shadow-sm"
                                />
                                <p className="text-[10px] text-gray-400 font-medium ml-1">Get alerts when stock falls below this number.</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Delivery Logistics Section */}
                <motion.div variants={item} className="pt-4">
                    <div className="rounded-[32px] bg-indigo-50/30 border border-indigo-100 p-8 space-y-6">
                        <div>
                            <h3 className="text-lg font-black text-gray-900 tracking-tight">Delivery Logistics</h3>
                            <p className="text-xs text-indigo-500 font-bold uppercase tracking-wider mt-1">Configure flat-rate delivery fees for your local region.</p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-3">
                                <label className="text-sm font-black text-gray-700 ml-1">Mainland Fee (₦)</label>
                                <input
                                    name="mainlandDeliveryFee"
                                    type="number"
                                    defaultValue={Number(initialData.mainlandDeliveryFee)}
                                    className="w-full rounded-2xl border border-white bg-white/80 p-4 text-sm font-black text-gray-900 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none shadow-sm"
                                    placeholder="0"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-sm font-black text-gray-700 ml-1">Island Fee (₦)</label>
                                <input
                                    name="islandDeliveryFee"
                                    type="number"
                                    defaultValue={Number(initialData.islandDeliveryFee)}
                                    className="w-full rounded-2xl border border-white bg-white/80 p-4 text-sm font-black text-gray-900 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all outline-none shadow-sm"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Payout Details Section */}
                <motion.div variants={item} className="pt-4">
                    <div className="rounded-[32px] bg-emerald-50/30 border border-emerald-100 p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 tracking-tight">Payout Details</h3>
                                <p className="text-xs text-emerald-500 font-bold uppercase tracking-wider mt-1">Where you want your money settled.</p>
                            </div>
                            {initialData.subaccountCode && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 border border-emerald-500/20">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Account Verified
                                </span>
                            )}
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-3">
                                <label className="text-sm font-black text-gray-700 ml-1 flex items-center gap-2">
                                    <Landmark className="h-4 w-4 text-emerald-600" />
                                    Settlement Bank
                                </label>
                                <select
                                    name="bankCode"
                                    defaultValue={initialData.bankName || ""}
                                    disabled={!!initialData.subaccountCode}
                                    className="w-full rounded-2xl border border-white bg-white/80 p-4 text-sm font-black text-gray-900 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/5 transition-all outline-none shadow-sm appearance-none disabled:opacity-60"
                                    onChange={(e) => {
                                        const selectedBank = banks.find(b => b.code === e.target.value);
                                        if (selectedBank) {
                                            // We'll use the hidden input for bankName
                                            const nameInput = document.getElementById('bankNameInput') as HTMLInputElement;
                                            if (nameInput) nameInput.value = selectedBank.name;
                                        }
                                    }}
                                >
                                    <option value="">Select Bank</option>
                                    {banks.map((bank) => (
                                        <option key={bank.code} value={bank.code}>{bank.name}</option>
                                    ))}
                                </select>
                                <input type="hidden" name="bankName" id="bankNameInput" defaultValue={initialData.bankName || ""} />
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-black text-gray-700 ml-1 flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-emerald-600" />
                                    Account Number
                                </label>
                                <input
                                    name="accountNumber"
                                    type="text"
                                    defaultValue={initialData.accountNumber || ""}
                                    disabled={!!initialData.subaccountCode}
                                    placeholder="0123456789"
                                    className="w-full rounded-2xl border border-white bg-white/80 p-4 text-sm font-black text-gray-900 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/5 transition-all outline-none shadow-sm disabled:opacity-60"
                                />
                            </div>

                            <div className="space-y-3 md:col-span-2">
                                <label className="text-sm font-black text-gray-700 ml-1 flex items-center gap-2">
                                    <User className="h-4 w-4 text-emerald-600" />
                                    Account Name
                                </label>
                                <input
                                    name="accountName"
                                    type="text"
                                    defaultValue={initialData.accountName || ""}
                                    disabled={!!initialData.subaccountCode}
                                    placeholder="Your Full Name"
                                    className="w-full rounded-2xl border border-white bg-white/80 p-4 text-sm font-black text-gray-900 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/5 transition-all outline-none shadow-sm disabled:opacity-60"
                                />
                            </div>
                        </div>

                        {!initialData.subaccountCode && (
                            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                                <p className="text-[10px] font-bold text-amber-800 leading-relaxed uppercase tracking-wider">
                                    ⚠️ IMPORTANT: Please ensure your account name matches your bank records. Once linked to Paystack for payouts, these details can only be changed by contacting support.
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            <motion.div variants={item} className="pt-6 flex justify-end">
                <button
                    type="submit"
                    disabled={loading}
                    className="group relative flex h-14 w-full md:w-64 items-center justify-center overflow-hidden rounded-2xl bg-gray-900 text-sm font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-black active:scale-[0.98] disabled:opacity-50 shadow-xl"
                >
                    <span className={`transition-all duration-300 ${loading ? "opacity-0 scale-50" : "opacity-100 scale-100"}`}>
                        Save Changes
                    </span>
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    )}
                </button>
            </motion.div>
        </motion.form>
    );
}
