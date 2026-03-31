"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
    return (
        <button
            onClick={() => window.print()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary p-4 text-sm font-bold text-foreground hover:bg-border/50 transition-all active:scale-[0.98] print:hidden"
        >
            <Printer className="h-4 w-4" />
            Download / Print Receipt
        </button>
    );
}
