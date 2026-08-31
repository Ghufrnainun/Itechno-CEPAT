"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Flame, ArrowUpRight, Zap, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakInfo {
  current_streak: number;
  longest_streak: number;
}

/** Bonus XP tiers — mirrors GamificationService.awardStreakBonusXP */
function getStreakBonus(streak: number): number {
  if (streak >= 30) return 100;
  if (streak >= 14) return 50;
  if (streak >= 7) return 25;
  if (streak >= 3) return 10;
  return 0;
}

function getNextTier(streak: number): { target: number; bonus: number } | null {
  if (streak >= 30) return null; // max tier
  if (streak >= 14) return { target: 30, bonus: 100 };
  if (streak >= 7) return { target: 14, bonus: 50 };
  if (streak >= 3) return { target: 7, bonus: 25 };
  return { target: 3, bonus: 10 };
}

export function StreakReminderCard({ className }: { className?: string }) {
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          "/api/xp/calendar?year=" +
            new Date().getFullYear() +
            "&month=" +
            (new Date().getMonth() + 1)
        );
        const json = await res.json();
        if (!cancelled && json.success) {
          setStreak({
            current_streak: json.streak?.current ?? 0,
            longest_streak: json.streak?.longest ?? 0,
          });
        }
      } catch (e) {
        console.error("Failed to fetch streak", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading || !streak) return null;

  const current = streak.current_streak;
  const bonus = getStreakBonus(current);
  const nextTier = getNextTier(current);

  return (
    <div className={cn("p-1 sm:p-1.5 rounded-2xl bg-surface-container-low border border-card-border shadow-xs", className)}>
      <Link
        href="/leaderboard"
        className={cn(
          "block rounded-xl border border-card-border overflow-hidden transition-all duration-200 hover:border-tertiary/40 group relative bg-surface-container-lowest"
        )}
      >
        <div className="p-4 sm:p-5 flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Flame Icon with Pulsing Effect */}
            <div
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105 shadow-xs",
                current > 0
                  ? "bg-tertiary/15 border-tertiary/30 text-tertiary"
                  : "bg-surface-container border-card-border text-on-surface-variant"
              )}
            >
              <Flame className={cn("w-6 h-6", current >= 3 && "animate-pulse")} />
            </div>

            {/* Content */}
            <div className="min-w-0">
              {current > 0 ? (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-headline font-extrabold text-sm sm:text-base text-on-surface">
                      🔥 Streak {current} Hari Aktif!
                    </h3>
                    {bonus > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary/15 text-tertiary text-[10px] font-mono font-bold border border-tertiary/20">
                        <Zap className="w-2.5 h-2.5" />+{bonus} XP Bonus
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                    {nextTier
                      ? `${nextTier.target - current} hari lagi menuju bonus +${nextTier.bonus} XP`
                      : "Tingkat bonus streak tertinggi tercapai! Pertahankan terus 💪"}
                  </p>
                </>
              ) : (
                <>
                  <h3 className="font-headline font-bold text-sm sm:text-base text-on-surface">
                    Mulai Streak Harianmu
                  </h3>
                  <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                    Selesaikan 1 tugas hari ini untuk mulai membangun streak & meraih bonus XP
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Action Button-in-Button */}
          <div className="w-9 h-9 rounded-xl bg-surface-container-low border border-card-border flex items-center justify-center text-on-surface-variant group-hover:bg-primary group-hover:text-on-primary group-hover:border-primary transition-all duration-200 shrink-0">
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>

        {/* Progress Bar to next tier */}
        {nextTier && current > 0 && (
          <div className="px-4 sm:px-5 pb-3">
            <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-tertiary to-amber-500 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(10, (current / nextTier.target) * 100))}%`,
                }}
              />
            </div>
          </div>
        )}
      </Link>
    </div>
  );
}
