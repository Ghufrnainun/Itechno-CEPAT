import React from "react";
import { Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

export function SdgBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container/40 border border-secondary/20 shrink-0",
        className
      )}
    >
      <Briefcase className="w-3 h-3 text-secondary" />
      <span className="font-label-sm text-[10px] font-bold uppercase tracking-wider text-secondary">
        SDG 8
      </span>
    </div>
  );
}
