'use client';

import React, { useState } from "react";
import Link from "next/link";
import { Task } from "@/types/database";
import { SdgBadge } from "@/components/ui/SdgBadge";
import { formatCurrency, formatDistance } from "@/lib/utils/format";
import { Navigation, Gavel, Calendar, Flag, Bookmark } from "lucide-react";
import { ReportModal } from "@/components/ui/ReportModal";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task & { distance?: number };
  isSelected?: boolean;
  isSaved?: boolean;
  onClick?: () => void;
  className?: string;
}

export const TaskCard = React.memo(function TaskCard({
  task,
  isSelected = false,
  isSaved = false,
  onClick,
  className,
}: TaskCardProps) {
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
        "group p-4 sm:p-5 feed-card w-full rounded-2xl bg-surface-container-lowest border border-card-border/80 shadow-2xs",
        "transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out flex flex-col justify-between min-h-[140px]",
        "hover:border-primary/40 hover:shadow-xs active:scale-[0.985] active:brightness-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer",
        isSelected && "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20",
        className
      )}
    >
      <div>
        {/* Header Row: Title & Distance */}
        <div className="flex justify-between items-start gap-3 mb-1.5">
          <h3 className="font-headline text-sm sm:text-base font-bold text-on-surface group-hover:text-primary transition-colors leading-snug flex-1">
            {task.title}
            {task.is_bidding && (
              <span className="inline-flex items-center gap-1 align-middle ml-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                <Gavel className="w-2.5 h-2.5" /> Bid
              </span>
            )}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
            {isSaved && (
              <span title="Tugas Tersimpan" className="text-primary p-1 bg-primary/10 rounded-lg flex items-center justify-center">
                <Bookmark className="w-3 h-3 fill-primary text-primary" />
              </span>
            )}
            {task.distance !== undefined && (
              <span className="font-mono text-xs font-semibold text-primary tabular-nums shrink-0 flex items-center gap-1 bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/15">
                <Navigation className="w-3 h-3 fill-primary/20" />
                {formatDistance(task.distance)}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed mb-3">
          {task.description}
        </p>
      </div>

      {/* Footer: Price & Schedule/Duration */}
      <div className="flex items-center justify-between border-t border-card-border/60 pt-3 mt-auto">
        <span className="font-mono text-sm sm:text-base font-extrabold text-on-surface tracking-tight tabular-nums">
          {task.is_bidding
            ? `${formatCurrency(task.budget_min ?? 0)} – ${formatCurrency(task.budget_max ?? task.compensation)}`
            : formatCurrency(task.compensation)}
        </span>

        <div className="flex items-center gap-2 text-on-surface-variant font-mono text-[11px]">
          {task.scheduled_at && (
            <span className="inline-flex items-center gap-1 font-medium text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/15">
              <Calendar className="w-3 h-3" />
              {new Date(task.scheduled_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
            </span>
          )}
          {task.duration_estimate && (
            <span className="inline-flex items-center gap-1 font-medium bg-surface-container-low px-2 py-0.5 rounded-md border border-card-border/60 uppercase">
              {task.duration_estimate}
            </span>
          )}
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
});
