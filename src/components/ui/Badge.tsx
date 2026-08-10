import React from "react";
import { TaskStatus } from "@/types/database";

interface BadgeProps {
  status: TaskStatus | string;
}

export function Badge({ status }: BadgeProps) {
  let style = "inline-flex items-center gap-xs px-sm py-[2px] rounded-full font-label-sm text-label-sm font-semibold uppercase tracking-wider ";
  let label: string = status;

  switch (status.toLowerCase()) {
    case "open":
      style += "bg-surface-container text-primary border border-outline-variant";
      label = "Terbuka";
      break;
    case "accepted":
      style += "bg-amber-500/10 text-amber-600 border border-amber-500/20";
      label = "Diterima";
      break;
    case "in_progress":
      style += "bg-primary-container/10 text-primary-container border border-primary-container/20";
      label = "Dikerjakan";
      break;
    case "completed":
      style += "bg-secondary-container/20 text-secondary border border-secondary/20";
      label = "Selesai";
      break;
    case "rejected":
      style += "bg-error/10 text-error border border-error/20";
      label = "Ditolak";
      break;
    case "cancelled":
      style += "bg-error/10 text-error border border-error/20";
      label = "Dibatalkan";
      break;
  }

  return (
    <span className={style}>
      {label}
    </span>
  );
}
