import React from "react";
import Link from "next/link";
import { Task } from "@/types/database";
import { SdgBadge } from "@/components/ui/SdgBadge";
import { formatCurrency, formatDistance } from "@/lib/utils/format";

interface TaskCardProps {
  task: Task & { distance?: number };
  isSelected?: boolean;
  onClick?: () => void;
}

export function TaskCard({ task, isSelected = false, onClick }: TaskCardProps) {
  const cardBody = (
    <div
      onClick={onClick}
      className={`p-md feed-card w-full ${isSelected ? "selected" : ""}`}
    >
      <div className="flex justify-between items-start mb-xs">
        <h3 className="font-headline-sm text-headline-sm text-on-surface leading-tight text-balance text-[18px]">
          {task.title}
        </h3>
        {task.distance !== undefined && (
          <div className="flex items-center gap-xs bg-surface-container px-xs py-[2px] rounded shrink-0 ml-2">
            <span
              className="material-symbols-outlined text-[14px] text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              near_me
            </span>
            <span
              className="font-label-sm text-label-sm text-primary"
              style={{ fontFamily: "'JetBrains Mono'" }}
            >
              {formatDistance(task.distance)}
            </span>
          </div>
        )}
      </div>

      <p className="font-body-sm text-body-sm text-on-surface-variant mb-md truncate">
        {task.description}
      </p>

      <div className="flex justify-between items-end border-t border-outline-variant pt-sm mt-auto">
        <span
          className="font-label-md text-label-md text-on-surface font-bold"
          style={{ fontFamily: "'JetBrains Mono'" }}
        >
          {formatCurrency(task.compensation)}
        </span>
        
        <div className="flex items-center gap-sm">
          <span className="font-label-sm text-[10px] text-on-surface-variant bg-surface-container px-xs py-[2px] rounded uppercase">
            {task.duration_estimate}
          </span>
          <SdgBadge />
        </div>
      </div>
    </div>
  );

  if (onClick) {
    return cardBody;
  }

  return (
    <Link href={`/task/${task.id_task}`} className="block w-full text-left">
      {cardBody}
    </Link>
  );
}
