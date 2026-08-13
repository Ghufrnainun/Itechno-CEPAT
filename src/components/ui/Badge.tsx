import React from "react";
import { TaskStatus } from "@/types/database";
import { cn } from "@/lib/utils";

export interface BadgeProps {
  status: TaskStatus | string;
  className?: string;
}

export function Badge({ status, className }: BadgeProps) {
  let variantStyle = "bg-surface-container text-primary border border-outline-variant";
  let label: string = status;

  switch (status.toLowerCase()) {
    case "open":
      variantStyle = "bg-primary/10 text-primary border border-primary/20";
      label = "Terbuka";
      break;
    case "accepted":
      variantStyle = "bg-tertiary-container text-tertiary border border-tertiary/25";
      label = "Diterima";
      break;
    case "in_progress":
      variantStyle = "bg-primary-container/15 text-primary-container border border-primary-container/30";
      label = "Dikerjakan";
      break;
    case "completed":
      variantStyle = "bg-secondary-container text-secondary border border-secondary/25";
      label = "Selesai";
      break;
    case "rejected":
    case "cancelled":
      variantStyle = "bg-error-container text-error border border-error/25";
      label = status.toLowerCase() === "rejected" ? "Ditolak" : "Dibatalkan";
      break;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-[11px] font-semibold tracking-wider uppercase",
        variantStyle,
        className
      )}
    >
      {label}
    </span>
  );
}
