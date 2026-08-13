import React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: "default" | "circular" | "rounded" | "card";
}

export function Skeleton({
  className,
  variant = "default",
  ...props
}: SkeletonProps) {
  const variantStyles = {
    default: "rounded-md",
    circular: "rounded-full",
    rounded: "rounded-xl",
    card: "rounded-xl border border-card-border p-5",
  };

  return (
    <div
      aria-hidden="true"
      className={cn(
        "skeleton-shimmer bg-surface-container-low/70 overflow-hidden relative",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest border border-card-border rounded-xl p-5 flex flex-col gap-3.5 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-4 w-16 rounded" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4 rounded" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-4/5 rounded" />
      </div>
      <div className="pt-3 border-t border-card-border/60 flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" className="w-6 h-6" />
          <Skeleton className="h-4 w-20 rounded" />
        </div>
        <Skeleton className="h-5 w-24 rounded-md" />
      </div>
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <TaskCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-5xl mx-auto w-full p-4 md:p-6 lg:p-8 flex flex-col gap-6 animate-fadeIn">
      {/* Header Card Skeleton */}
      <div className="bg-surface-container-lowest border border-card-border rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-xs">
        <Skeleton variant="circular" className="w-24 h-24 sm:w-28 sm:h-28 shrink-0" />
        <div className="flex-1 w-full space-y-3 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1.5">
              <Skeleton className="h-7 w-48 mx-auto sm:mx-0 rounded-lg" />
              <Skeleton className="h-4 w-32 mx-auto sm:mx-0 rounded" />
            </div>
            <Skeleton className="h-9 w-28 mx-auto sm:mx-0 rounded-lg" />
          </div>
          <Skeleton className="h-4 w-full max-w-lg rounded" />
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>
        </div>
      </div>

      {/* Metrics Ribbon Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface-container-lowest border border-card-border rounded-xl p-4 flex flex-col gap-2">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-6 w-24 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Tabs Skeleton */}
      <div className="bg-surface-container-lowest border border-card-border rounded-xl p-6 space-y-4">
        <div className="flex gap-4 border-b border-card-border pb-3">
          <Skeleton className="h-6 w-28 rounded" />
          <Skeleton className="h-6 w-28 rounded" />
          <Skeleton className="h-6 w-28 rounded" />
        </div>
        <div className="space-y-3 pt-2">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-5/6 rounded" />
          <Skeleton className="h-4 w-4/6 rounded" />
        </div>
      </div>
    </div>
  );
}
