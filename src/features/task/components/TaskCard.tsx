'use client';

import React, { useState } from "react";
import Link from "next/link";
import { Task } from "@/types/database";
import { SdgBadge } from "@/components/ui/SdgBadge";
import { formatCurrency, formatDistance } from "@/lib/utils/format";
import { Navigation, Gavel, Calendar, Flag } from "lucide-react";
import { ReportModal } from "@/components/ui/ReportModal";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task & { distance?: number };
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function TaskCard({ task, isSelected = false, onClick, className }: TaskCardProps) {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const cardBody = (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "p-4 feed-card w-full rounded-xl bg-surface-container-lowest border border-card-border shadow-xs",
        "transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out",
        "hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.985] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer",
        isSelected && "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20",
        className
      )}
    >
      <div className="flex justify-between items-start mb-1.5 gap-2">
        <h3 className="font-headline text-base font-bold text-on-surface leading-snug text-balance">
          {task.title}
          {task.is_bidding && (
            <span className="inline-flex items-center gap-1 align-middle ml-2 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide bg-primary/10 text-primary border border-primary/25">
              <Gavel className="w-2.5 h-2.5" /> Bid
            </span>
          )}
        </h3>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsReportModalOpen(true);
            }}
            title="Laporkan Tugas"
            aria-label="Laporkan Tugas"
            className="p-1 rounded-lg text-on-surface-variant/50 hover:text-error hover:bg-error-container/20 transition-colors cursor-pointer"
          >
            <Flag className="w-3.5 h-3.5" />
          </button>
          {task.distance !== undefined && (
            <div className="flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
              <Navigation className="w-3 h-3 text-primary fill-primary/20" />
              <span className="font-mono text-xs font-semibold text-primary tabular-nums">
                {formatDistance(task.distance)}
              </span>
            </div>
          )}
        </div>
      </div>

      <p className="font-body-sm text-xs text-on-surface-variant mb-3 line-clamp-2 leading-relaxed">
        {task.description}
      </p>

      <div className="flex justify-between items-end border-t border-card-border/60 pt-2.5 mt-auto">
        <span className="font-mono text-sm text-on-surface font-extrabold tabular-nums">
          {task.is_bidding
            ? `${formatCurrency(task.budget_min ?? 0)}–${formatCurrency(task.budget_max ?? task.compensation)}`
            : formatCurrency(task.compensation)}
        </span>

        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {task.scheduled_at && (
            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-md font-medium">
              <Calendar className="w-2.5 h-2.5" />
              {new Date(task.scheduled_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
            </span>
          )}
          {task.duration_estimate && (
            <span className="font-mono text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md uppercase font-medium">
              {task.duration_estimate}
            </span>
          )}
          <SdgBadge />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {onClick ? (
        cardBody
      ) : (
        <Link href={`/task/${task.id_task}`} className="block w-full text-left">
          {cardBody}
        </Link>
      )}

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        taskId={task.id_task}
        taskTitle={task.title}
      />
    </>
  );
}
