"use client";

import React, { useState } from "react";
import { ArrowRight, Check, Sparkles, Store } from "lucide-react";
import { useRouter } from "next/navigation";

export function LinkClaimer({ baseHref = "/sign-up" }: { baseHref?: string }) {
  const [storeName, setStoreName] = useState("");
  const router = useRouter();

  const cleanSlug = storeName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    const destination = cleanSlug ? `${baseHref}?slug=${encodeURIComponent(cleanSlug)}` : baseHref;
    router.push(destination);
  };

  return (
    <form onSubmit={handleClaim} className="mx-auto w-full max-w-xl">
      <div className="flex flex-col sm:flex-row items-stretch gap-2.5 rounded-2xl border-2 border-border/80 bg-white p-2 shadow-elevated focus-within:border-primary">
        <div className="flex flex-1 items-center px-3 py-2 text-sm sm:text-base">
          <span className="font-semibold text-foreground/45 select-none">
            linkstore.app/
          </span>
          <input
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="your-brand"
            className="flex-1 bg-transparent font-bold text-foreground outline-none placeholder:text-foreground/30 placeholder:font-normal"
            maxLength={32}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary h-12 whitespace-nowrap px-6 text-sm sm:text-base font-bold shadow-sm"
        >
          Claim Your Link
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-center gap-6 text-xs text-foreground/60">
        <span className="flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-primary" /> Free forever URL
        </span>
        <span className="flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-primary" /> Takes under 3 minutes
        </span>
      </div>
    </form>
  );
}
