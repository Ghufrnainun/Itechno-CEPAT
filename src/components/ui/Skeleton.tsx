"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Skeleton as BoneyardSkeleton,
  BoneSuspense as BoneyardSuspense,
  configureBoneyard,
} from "boneyard-js/react";

// ─── Configure Boneyard Theme Defaults ─────────────────────────────────────────
if (typeof window !== "undefined") {
  try {
    configureBoneyard({
      color: "oklch(0.92 0.005 155 / 0.7)",
      darkColor: "oklch(0.24 0.005 155 / 0.7)",
      animate: "shimmer",
      shimmerColor: "oklch(0.97 0.005 155 / 0.9)",
      darkShimmerColor: "oklch(0.32 0.005 155 / 0.9)",
      speed: "1.8s",
      transition: true,
    });
  } catch {
    // Ignore configuration if already initialized
  }
}

// Re-export Boneyard primitives
export { BoneyardSkeleton as BoneSkeleton, BoneyardSuspense as BoneSuspense, configureBoneyard };

// ─── Legacy & Primitives Compatibility ─────────────────────────────────────────

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: "default" | "circular" | "rounded" | "card";
  /** Optional boneyard loading wrapper prop */
  loading?: boolean;
}

export function Skeleton({
  className,
  variant = "default",
  loading,
  children,
  ...props
}: SkeletonProps) {
  const variantStyles = {
    default: "rounded-md",
    circular: "rounded-full",
    rounded: "rounded-xl",
    card: "rounded-2xl border border-card-border p-5",
  };

  // If loading is explicitly provided with children, wrap with Boneyard
  if (loading !== undefined && children) {
    return (
      <BoneyardSkeleton loading={loading} className={className}>
        {children}
      </BoneyardSkeleton>
    );
  }

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

// ─── Domain Specific Skeletons (Matching Redesigned 2.0 Components) ───────────

export function TaskCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest border border-card-border/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-h-[140px] shadow-2xs">
      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <Skeleton className="h-5 w-3/5 rounded-lg" />
          <Skeleton className="h-4 w-14 rounded-md shrink-0" />
        </div>
        <div className="space-y-1.5 mb-3">
          <Skeleton className="h-3.5 w-full rounded" />
          <Skeleton className="h-3.5 w-4/5 rounded" />
        </div>
      </div>
      <div className="pt-3 border-t border-card-border/60 flex items-center justify-between mt-auto">
        <Skeleton className="h-5 w-24 rounded-lg" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16 rounded-md" />
          <Skeleton className="h-4 w-12 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
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
      <div className="bg-surface-container-lowest border border-card-border rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-2xs">
        <Skeleton variant="circular" className="w-24 h-24 sm:w-28 sm:h-28 shrink-0" />
        <div className="flex-1 w-full space-y-3 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1.5">
              <Skeleton className="h-7 w-48 mx-auto sm:mx-0 rounded-lg" />
              <Skeleton className="h-4 w-32 mx-auto sm:mx-0 rounded" />
            </div>
            <Skeleton className="h-9 w-28 mx-auto sm:mx-0 rounded-xl" />
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
          <div key={i} className="bg-surface-container-lowest border border-card-border rounded-2xl p-4 flex flex-col gap-2 shadow-2xs">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-6 w-24 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Tabs Skeleton */}
      <div className="bg-surface-container-lowest border border-card-border rounded-2xl p-6 space-y-4 shadow-2xs">
        <div className="flex gap-4 border-b border-card-border pb-3">
          <Skeleton className="h-6 w-28 rounded-lg" />
          <Skeleton className="h-6 w-28 rounded-lg" />
          <Skeleton className="h-6 w-28 rounded-lg" />
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
