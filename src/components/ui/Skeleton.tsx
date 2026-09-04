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
    <div className="flex-1 bg-surface font-sans overflow-y-auto min-h-screen pb-28 lg:pb-12 animate-fadeIn">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 flex flex-col gap-6">
        {/* Identity & Reputation Card Skeleton */}
        <div className="bg-surface-container-lowest border border-card-border rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            {/* Avatar + Info */}
            <div className="flex items-center gap-4 sm:gap-5">
              <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl shrink-0" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-6 w-44 rounded-lg" />
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-3.5 w-24 rounded-md" />
              </div>
            </div>

            {/* Action CTAs */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Skeleton className="h-10 w-24 rounded-xl flex-1 sm:flex-initial" />
              <Skeleton className="h-10 w-28 rounded-xl flex-1 sm:flex-initial" />
            </div>
          </div>

          {/* 2 Reputation Metric Cards */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 pt-4 sm:pt-5 border-t border-card-border/80">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="w-fit p-1 bg-surface-container-low rounded-xl border border-card-border flex gap-2">
          <Skeleton className="h-8 w-32 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>

        {/* Tab Content Skeleton (Bio & Skills + Contact) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mt-1">
          <div className="lg:col-span-2 flex flex-col gap-5 sm:gap-6">
            {/* Bio Card */}
            <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-6 shadow-xs border border-card-border space-y-3">
              <Skeleton className="h-5 w-32 rounded-md" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-4/5 rounded" />
            </div>
            {/* Skills Card */}
            <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-6 shadow-xs border border-card-border space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-card-border">
                <Skeleton className="h-5 w-40 rounded-md" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
              </div>
            </div>
          </div>
          {/* Right Column: Contact Info */}
          <div className="lg:col-span-1 flex flex-col gap-5 sm:gap-6">
            <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-6 shadow-xs border border-card-border space-y-4">
              <Skeleton className="h-5 w-36 rounded-md pb-3 border-b border-card-border" />
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
