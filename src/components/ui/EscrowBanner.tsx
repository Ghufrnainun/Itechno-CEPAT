import React from "react";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function EscrowBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-tertiary-container/30 rounded-lg border border-tertiary/20 p-2.5 flex items-center gap-2 shrink-0",
        className
      )}
    >
      <ShieldCheck className="w-4.5 h-4.5 text-tertiary shrink-0" />
      <p className="font-label-sm text-xs font-semibold text-tertiary">
        Dana ditahan di Escrow • Aman &amp; Terpercaya
      </p>
    </div>
  );
}
