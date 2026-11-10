"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateStore, updateStorePayoutDetails } from "@/lib/actions/store";
import { ImagePlus, X, Palette, Megaphone, Loader2, Landmark, CreditCard, User, Truck, ShieldCheck } from "lucide-react";
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
  const [primaryColor, setPrimaryColor] = useState(initialData.primaryColor || "#eb5a28");

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError("");

    formData.append("logoUrl", logoUrl);
    formData.append("primaryColor", primaryColor);

    try {
      const result = await updateStore(initialData.id, formData);

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

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
        staggerChildren: 0.06,
      },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.form
      variants={container}
      initial="hidden"
      animate="show"
      action={onSubmit}
      className="space-y-8 text-foreground"
    >
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#eb5a28]">
          Store Configuration
        </span>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
          Store Settings
        </h1>
        <p className="mt-0.5 text-xs text-foreground/60">
          Visual styling, delivery fees, and Paystack settlement accounts.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 p-4 text-xs font-bold text-rose-700 border border-rose-200">
          {error}
        </div>
      )}

      {/* Visual Identity */}
      <motion.div variants={item} className="rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-subtle space-y-6">
        <div className="flex items-center gap-2.5 border-b border-border/80 pb-4">
          <Palette className="h-4 w-4 text-[#eb5a28]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Visual Identity &amp; Branding
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Logo Upload */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-foreground">Store Logo</label>
            <div className="flex items-center gap-5">
              <input type="hidden" name="logoUrl" value={logoUrl} />
              {logoUrl ? (
                <div className="group relative h-24 w-24 overflow-hidden rounded-2xl border border-border bg-secondary shadow-xs">
                  <Image src={logoUrl} alt="Logo" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setLogoUrl("")}
                      className="h-8 w-8 rounded-lg bg-white text-rose-600 flex items-center justify-center hover:bg-rose-50"
                    >
                      <X className="h-4 w-4" />
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
                  className="flex h-24 w-24 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-border bg-canvas text-foreground/45 transition hover:border-[#eb5a28] hover:bg-[#fff4ed]/30 hover:text-[#eb5a28]"
                >
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-[10px] font-bold">Upload</span>
                </CldUploadButton>
              )}
              <div className="flex-1 space-y-1">
                <p className="text-xs font-bold text-foreground">Square Image Format</p>
                <p className="text-[11px] text-foreground/50">
                  Recommended size: 500×500px for sharp display in your header.
                </p>
              </div>
            </div>
          </div>

          {/* Color Picker */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-foreground">Accent Brand Color</label>
            <div className="flex items-center gap-4">
              <div
                className="h-16 w-16 rounded-2xl border border-border shadow-xs shrink-0 cursor-pointer relative overflow-hidden"
                style={{ backgroundColor: primaryColor }}
              >
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-full rounded-xl border border-border bg-canvas/60 p-2.5 text-xs font-mono font-bold text-foreground uppercase outline-none focus:border-[#eb5a28] focus:bg-white"
                />
                <p className="text-[11px] text-foreground/50">
                  Applied to buttons, links, and cart count badges on your storefront.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Store Information */}
      <motion.div variants={item} className="rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-subtle space-y-6">
        <div className="border-b border-border/80 pb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Store Profile &amp; Announcement
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Store Display Name</label>
            <input
              name="name"
              defaultValue={initialData.name}
              placeholder="e.g. Zainab's Closet"
              className="w-full rounded-xl border border-border bg-canvas/60 p-3 text-xs font-medium outline-none transition focus:border-[#eb5a28] focus:bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Store Slug URL</label>
            <div className="relative">
              <input
                name="slug"
                defaultValue={initialData.slug}
                className="w-full rounded-xl border border-border bg-secondary p-3 pl-12 text-xs font-bold text-foreground/50 cursor-not-allowed outline-none font-mono"
                disabled
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-foreground/40">
                /@
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">Store Description</label>
          <textarea
            name="description"
            defaultValue={initialData.description || ""}
            className="w-full rounded-xl border border-border bg-canvas/60 p-3 text-xs font-medium outline-none transition focus:border-[#eb5a28] focus:bg-white h-24 resize-none"
            placeholder="Tell shoppers what you sell, your shipping times, and brand promise..."
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Megaphone className="h-3.5 w-3.5 text-[#eb5a28]" />
            <span>Top Announcement Ribbon</span>
          </label>
          <input
            name="announcement"
            defaultValue={initialData.announcement || ""}
            className="w-full rounded-xl border border-border bg-canvas/60 p-3 text-xs font-medium outline-none transition focus:border-[#eb5a28] focus:bg-white"
            placeholder="e.g. Free nationwide shipping on orders above ₦40,000 this week!"
          />
          <p className="text-[11px] text-foreground/45 italic">
            Leave blank to hide the top banner on your storefront.
          </p>
        </div>
      </motion.div>

      {/* Logistics & Delivery Rates */}
      <motion.div variants={item} className="rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-subtle space-y-6">
        <div className="flex items-center gap-2.5 border-b border-border/80 pb-4">
          <Truck className="h-4 w-4 text-[#eb5a28]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Flat-Rate Delivery Rates
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Mainland Delivery Fee (₦)</label>
            <input
              name="mainlandDeliveryFee"
              type="number"
              defaultValue={Number(initialData.mainlandDeliveryFee)}
              className="w-full rounded-xl border border-border bg-canvas/60 p-3 text-xs font-medium outline-none transition focus:border-[#eb5a28] focus:bg-white"
              placeholder="2500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Island Delivery Fee (₦)</label>
            <input
              name="islandDeliveryFee"
              type="number"
              defaultValue={Number(initialData.islandDeliveryFee)}
              className="w-full rounded-xl border border-border bg-canvas/60 p-3 text-xs font-medium outline-none transition focus:border-[#eb5a28] focus:bg-white"
              placeholder="3500"
            />
          </div>
        </div>
      </motion.div>

      {/* Paystack Settlement Payout Details */}
      <motion.div variants={item} className="rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-subtle space-y-6">
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-2.5">
            <Landmark className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Paystack Settlement Account
            </h2>
          </div>
          {initialData.subaccountCode && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              Verified Subaccount
            </span>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Settlement Bank</label>
            <select
              name="bankCode"
              defaultValue={initialData.bankName || ""}
              disabled={!!initialData.subaccountCode}
              className="w-full rounded-xl border border-border bg-canvas/60 p-3 text-xs font-medium outline-none transition focus:border-[#eb5a28] focus:bg-white appearance-none disabled:opacity-60"
              onChange={(e) => {
                const selectedBank = banks.find((b) => b.code === e.target.value);
                if (selectedBank) {
                  const nameInput = document.getElementById("bankNameInput") as HTMLInputElement;
                  if (nameInput) nameInput.value = selectedBank.name;
                }
              }}
            >
              <option value="">Select your bank</option>
              {banks.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
            <input
              type="hidden"
              name="bankName"
              id="bankNameInput"
              defaultValue={initialData.bankName || ""}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">10-Digit NUBAN Account Number</label>
            <input
              name="accountNumber"
              type="text"
              defaultValue={initialData.accountNumber || ""}
              disabled={!!initialData.subaccountCode}
              placeholder="0123456789"
              className="w-full rounded-xl border border-border bg-canvas/60 p-3 text-xs font-medium outline-none transition focus:border-[#eb5a28] focus:bg-white disabled:opacity-60"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-foreground">Account Holder Full Name</label>
            <input
              name="accountName"
              type="text"
              defaultValue={initialData.accountName || ""}
              disabled={!!initialData.subaccountCode}
              placeholder="As registered with your bank"
              className="w-full rounded-xl border border-border bg-canvas/60 p-3 text-xs font-medium outline-none transition focus:border-[#eb5a28] focus:bg-white disabled:opacity-60"
            />
          </div>
        </div>

        {!initialData.subaccountCode && (
          <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-200 text-xs text-amber-900 leading-relaxed font-medium">
            ⚠️ Please verify that your account name matches your bank details exactly. Paystack uses this account to settle your 95% revenue on each completed sale.
          </div>
        )}
      </motion.div>

      {/* Save Button */}
      <motion.div variants={item} className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary h-12 px-8 text-xs font-bold shadow-sm"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span>Save Settings</span>
          )}
        </button>
      </motion.div>
    </motion.form>
  );
}
