"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Flame, Trophy, Calendar, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakCalendarProps {
  /** Compact mode for embedding in leaderboard */
  compact?: boolean;
  className?: string;
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const DAY_NAMES = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function getXPIntensity(xp: number): string {
  if (xp <= 0) return "bg-surface-container/60 hover:bg-surface-container";
  if (xp <= 25) return "bg-primary/20 hover:bg-primary/30 text-primary";
  if (xp <= 75) return "bg-primary/50 hover:bg-primary/60 text-on-primary";
  return "bg-primary hover:bg-primary-container text-on-primary shadow-xs";
}

function getXPTextClass(xp: number): string {
  if (xp <= 0) return "text-on-surface-variant/40";
  if (xp <= 25) return "text-primary font-bold";
  if (xp <= 75) return "text-primary-container font-extrabold";
  return "text-on-primary font-extrabold";
}

export function StreakCalendar({ compact = false, className }: StreakCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [calendarData, setCalendarData] = useState<Record<string, number>>({});
  const [streakData, setStreakData] = useState({ current: 0, longest: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const res = await fetch(`/api/xp/calendar?year=${year}&month=${month + 1}`);
        const json = await res.json();
        if (!cancelled && json.success) {
          setCalendarData(json.data || {});
          setStreakData({
            current: json.streak?.current ?? 0,
            longest: json.streak?.longest ?? 0,
          });
        }
      } catch (e) {
        console.error("Failed to fetch XP calendar", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [year, month]);

  // Calendar grid calculation (Monday first)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let firstDayIndex = firstDayOfMonth.getDay() - 1;
    if (firstDayIndex === -1) firstDayIndex = 6;

    const totalDays = lastDayOfMonth.getDate();
    const days: { date: Date; isCurrentMonth: boolean; key: string }[] = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, prevMonthLastDay - i), isCurrentMonth: false, key: `p-${prevMonthLastDay - i}` });
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true, key: `c-${i}` });
    }
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false, key: `n-${i}` });
    }
    return days;
  }, [year, month]);

  const today = new Date();
  const isToday = (d: Date) =>
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();

  const getDateKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const totalMonthXP = Object.values(calendarData).reduce((sum, v) => sum + v, 0);
  const activeDays = Object.values(calendarData).filter((v) => v > 0).length;

  return (
    <div className={cn("p-1.5 sm:p-2 rounded-[2rem] bg-surface-container-low border border-card-border shadow-xs", className)}>
      <div className="rounded-[calc(2rem-0.5rem)] bg-surface-container-lowest border border-card-border/70 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-card-border bg-surface-container-low/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center border border-tertiary/20">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-sm text-on-surface">
                {compact ? "Aktivitas XP Kamu" : "Kalender Aktivitas & Streak Harian"}
              </h3>
              <p className="text-[11px] text-on-surface-variant font-medium">
                Pantau perolehan XP dan konsistensi harian Anda
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-surface-container-low p-1 rounded-xl border border-card-border">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-headline font-bold text-xs text-on-surface min-w-[110px] text-center px-1">
              {MONTH_NAMES[month]} {year}
            </span>
            <button
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {/* Stats Bento Summary */}
          {!compact && (
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-surface-container-low rounded-2xl p-3.5 border border-card-border text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant font-mono">
                  XP Bulan Ini
                </p>
                <p className="font-mono font-extrabold text-base sm:text-lg text-primary mt-1">
                  {totalMonthXP.toLocaleString("id-ID")} <span className="text-xs font-sans">XP</span>
                </p>
              </div>
              <div className="bg-surface-container-low rounded-2xl p-3.5 border border-card-border text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant font-mono">
                  Hari Aktif
                </p>
                <p className="font-mono font-extrabold text-base sm:text-lg text-on-surface mt-1">
                  {activeDays} <span className="text-xs font-sans text-on-surface-variant">Hari</span>
                </p>
              </div>
              <div className="bg-surface-container-low rounded-2xl p-3.5 border border-card-border text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant font-mono">
                  Streak Aktif
                </p>
                <p className="font-mono font-extrabold text-base sm:text-lg text-tertiary mt-1 flex items-center justify-center gap-1">
                  <Flame className="w-4 h-4" />
                  {streakData.current} <span className="text-xs font-sans">Hari</span>
                </p>
              </div>
            </div>
          )}

          {/* Day Names Header */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2">
            {DAY_NAMES.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] sm:text-[11px] font-bold text-on-surface-variant/70 font-mono uppercase py-1"
              >
                {compact ? d[0] : d}
              </div>
            ))}
          </div>

          {/* Calendar Grid Cells */}
          {isLoading ? (
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-xl bg-surface-container animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {calendarDays.map((day) => {
                const dateKey = getDateKey(day.date);
                const xp = calendarData[dateKey] || 0;
                const isTodayCell = isToday(day.date);
                const intensity = day.isCurrentMonth
                  ? getXPIntensity(xp)
                  : "bg-transparent opacity-20 pointer-events-none";
                const textClass = day.isCurrentMonth
                  ? getXPTextClass(xp)
                  : "text-on-surface-variant/20";

                return (
                  <div
                    key={day.key}
                    title={
                      day.isCurrentMonth
                        ? `${day.date.getDate()} ${MONTH_NAMES[month]}: ${
                            xp > 0 ? `+${xp} XP diperoleh` : "Tidak ada aktivitas XP"
                          }`
                        : undefined
                    }
                    className={cn(
                      "aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-150 relative cursor-default border border-transparent",
                      intensity,
                      isTodayCell &&
                        "ring-2 ring-primary ring-offset-2 ring-offset-surface-container-lowest font-black"
                    )}
                  >
                    <span
                      className={cn(
                        "font-mono transition-transform",
                        textClass,
                        compact ? "text-[10px] sm:text-xs" : "text-xs sm:text-sm"
                      )}
                    >
                      {day.date.getDate()}
                    </span>
                    {xp > 0 && !compact && (
                      <span className="text-[9px] font-mono font-bold leading-none mt-0.5 opacity-90">
                        +{xp}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Heatmap Legend */}
          <div className="flex items-center justify-between mt-5 pt-3 border-t border-card-border/60">
            <span className="text-[11px] text-on-surface-variant font-mono font-medium">
              Aktivitas: Sedikit
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-md bg-surface-container" title="0 XP" />
              <div className="w-3.5 h-3.5 rounded-md bg-primary/20" title="1-25 XP" />
              <div className="w-3.5 h-3.5 rounded-md bg-primary/50" title="26-75 XP" />
              <div className="w-3.5 h-3.5 rounded-md bg-primary shadow-xs" title="75+ XP" />
            </div>
            <span className="text-[11px] text-on-surface-variant font-mono font-medium">
              Banyak
            </span>
          </div>

          {/* Compact streak summary banner */}
          {compact && streakData.current > 0 && (
            <div className="mt-3 py-2 px-3 rounded-xl bg-tertiary/10 border border-tertiary/20 flex items-center justify-center gap-2 text-xs text-tertiary font-bold">
              <Flame className="w-4 h-4" />
              <span>
                Streak Kamu: <strong>{streakData.current} Hari</strong> (Rekor: {streakData.longest} Hari)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
