"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentRole } from "@/app/(main)/layout";
import { formatCurrency } from "@/lib/utils/format";
import { renderIcon } from "@/lib/icon-map";
import { Badge } from "@/components/ui/Badge";
import { TaskStatus } from "@/types/database";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  ArrowRight,
  Plus,
  Compass,
  User,
  CheckCircle2,
  CalendarDays,
  ListFilter,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScheduledTask {
  id_tasks: string;
  judul_tugas: string;
  deskripsi_tugas: string;
  estimasi_waktu: string | null;
  kompensasi: number;
  status: TaskStatus;
  scheduled_at: string;
  scheduled_end: string | null;
  kategori: {
    id_category: string;
    nama_kategori: string;
    icon: string | null;
  };
  requester: {
    id_user: string;
    nama_lengkap: string;
    avatar_url: string | null;
  };
  worker: {
    id_user: string;
    nama_lengkap: string;
    avatar_url: string | null;
  } | null;
  user_role: "requester" | "worker";
}

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const DAY_NAMES = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

// Module-level SWR Cache for Scheduled Tasks
const scheduledTasksCache = new Map<string, ScheduledTask[]>();

export default function SchedulePage() {
  const router = useRouter();
  const { role: activeRole } = useCurrentRole();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [roleFilter, setRoleFilter] = useState<"all" | "requester" | "worker">("all");

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed
  const cacheKey = `${currentYear}-${currentMonth + 1}-${roleFilter}`;

  const [tasks, setTasks] = useState<ScheduledTask[]>(() => scheduledTasksCache.get(cacheKey) ?? []);
  const [loading, setLoading] = useState(() => !scheduledTasksCache.has(cacheKey));

  // Fetch scheduled tasks (SWR: background revalidation)
  const fetchTasks = useCallback(async () => {
    if (!scheduledTasksCache.has(cacheKey)) {
      setLoading(true);
    }
    try {
      const res = await fetch(
        `/api/tasks/scheduled?year=${currentYear}&month=${currentMonth + 1}&role=${roleFilter}`
      );
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setTasks(json.data);
          scheduledTasksCache.set(cacheKey, json.data);
        }
      }
    } catch (e) {
      console.error("Gagal memuat jadwal:", e);
    } finally {
      setLoading(false);
    }
  }, [currentYear, currentMonth, roleFilter, cacheKey]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Navigate months (instantly loads cached tasks if visited)
  const handlePrevMonth = () => {
    const nextDate = new Date(currentYear, currentMonth - 1, 1);
    setCurrentDate(nextDate);
    const key = `${nextDate.getFullYear()}-${nextDate.getMonth() + 1}-${roleFilter}`;
    if (scheduledTasksCache.has(key)) {
      setTasks(scheduledTasksCache.get(key)!);
    }
  };

  const handleNextMonth = () => {
    const nextDate = new Date(currentYear, currentMonth + 1, 1);
    setCurrentDate(nextDate);
    const key = `${nextDate.getFullYear()}-${nextDate.getMonth() + 1}-${roleFilter}`;
    if (scheduledTasksCache.has(key)) {
      setTasks(scheduledTasksCache.get(key)!);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Monday as first day of week (0 = Monday, 6 = Sunday)
    let firstDayIndex = firstDayOfMonth.getDay() - 1;
    if (firstDayIndex === -1) firstDayIndex = 6;

    const totalDays = lastDayOfMonth.getDate();
    const days: { date: Date; isCurrentMonth: boolean; key: string }[] = [];

    // Previous month filler days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1, prevMonthLastDay - i);
      days.push({ date: d, isCurrentMonth: false, key: `prev-${prevMonthLastDay - i}` });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(currentYear, currentMonth, i);
      days.push({ date: d, isCurrentMonth: true, key: `curr-${i}` });
    }

    // Next month filler days to complete grid (multiples of 7)
    const remainingSlots = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingSlots; i++) {
      const d = new Date(currentYear, currentMonth + 1, i);
      days.push({ date: d, isCurrentMonth: false, key: `next-${i}` });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Group tasks by date string (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map = new Map<string, ScheduledTask[]>();
    tasks.forEach((task) => {
      if (!task.scheduled_at) return;
      const d = new Date(task.scheduled_at);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      const existing = map.get(dateKey) || [];
      existing.push(task);
      map.set(dateKey, existing);
    });
    return map;
  }, [tasks]);

  // Selected date key
  const selectedDateKey = `${selectedDate.getFullYear()}-${String(
    selectedDate.getMonth() + 1
  ).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

  // Filter tasks for selected date
  const tasksForSelectedDate = useMemo(() => {
    return tasksByDate.get(selectedDateKey) || [];
  }, [tasksByDate, selectedDateKey]);

  // Upcoming scheduled tasks (from today onwards)
  const upcomingTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return [...tasks]
      .filter((t) => new Date(t.scheduled_at).getTime() >= today.getTime())
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  }, [tasks]);

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const today = new Date();

  return (
    <div className="flex flex-col h-full bg-surface font-sans">
      {/* ──── Header & Action Bar ──── */}
      <div className="border-b border-card-border/80 bg-surface-container-lowest/90 backdrop-blur-md sticky top-0 z-20 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline font-extrabold text-xl sm:text-2xl text-on-surface tracking-tight">
                Jadwal Tugas
              </h1>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Kelola waktu pelaksanaan tugas Anda secara terorganisir
            </p>
          </div>

          {/* Controls: Role Filter & New Task Button */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Role Filter Tabs */}
            <div className="inline-flex p-1 rounded-xl bg-surface-container-low border border-card-border">
              <button
                type="button"
                onClick={() => setRoleFilter("all")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                  roleFilter === "all"
                    ? "bg-surface-container-lowest text-primary font-bold shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter("requester")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                  roleFilter === "requester"
                    ? "bg-surface-container-lowest text-primary font-bold shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                Pemberi Tugas
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter("worker")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                  roleFilter === "worker"
                    ? "bg-surface-container-lowest text-primary font-bold shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                Pekerja
              </button>
            </div>

            {/* Quick CTA */}
            {activeRole === "requester" ? (
              <Link
                href="/task/new"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-sm hover:bg-primary-container transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buat Jadwal Baru</span>
              </Link>
            ) : (
              <Link
                href="/cari-tugas"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-sm hover:bg-primary-container transition-all"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Cari Tugas</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ──── Main Grid Layout (Calendar Left, Agenda Right) ──── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-36 lg:pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ════════ LEFT COLUMN: Interactive Month Calendar (7 cols) ════════ */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              
              {/* Calendar Container Card */}
              <div className="p-1 rounded-[1.75rem] bg-gradient-to-b from-card-border/70 to-card-border/30 border border-card-border/60 shadow-xs">
                <div className="bg-surface-container-lowest rounded-[calc(1.75rem-0.25rem)] p-4 sm:p-6 flex flex-col gap-4">
                  
                  {/* Month Navigation Toolbar */}
                  <div className="flex items-center justify-between border-b border-card-border/60 pb-4">
                    <div className="flex items-center gap-2">
                      <h2 className="font-headline font-bold text-lg sm:text-xl text-on-surface">
                        {MONTH_NAMES[currentMonth]} {currentYear}
                      </h2>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleToday}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer mr-1"
                      >
                        Hari Ini
                      </button>
                      <button
                        type="button"
                        aria-label="Bulan sebelumnya"
                        onClick={handlePrevMonth}
                        className="w-8 h-8 rounded-lg border border-card-border flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Bulan berikutnya"
                        onClick={handleNextMonth}
                        className="w-8 h-8 rounded-lg border border-card-border flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Day of Week Labels */}
                  <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] font-bold text-on-surface-variant/80 uppercase">
                    {DAY_NAMES.map((name) => (
                      <div key={name} className="py-1.5">
                        {name}
                      </div>
                    ))}
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                    {calendarDays.map(({ date, isCurrentMonth, key }) => {
                      const isSelected = isSameDay(date, selectedDate);
                      const isCurrentDay = isSameDay(date, today);

                      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
                        2,
                        "0"
                      )}-${String(date.getDate()).padStart(2, "0")}`;
                      const dayTasks = tasksByDate.get(dateKey) || [];
                      const hasTasks = dayTasks.length > 0;

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setSelectedDate(date);
                            if (!isCurrentMonth) {
                              setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1));
                            }
                          }}
                          className={cn(
                            "min-h-[64px] sm:min-h-[76px] p-1.5 sm:p-2 rounded-xl flex flex-col justify-between items-start transition-all cursor-pointer border text-left relative",
                            isSelected
                              ? "bg-primary/10 border-primary ring-2 ring-primary/20 shadow-xs"
                              : isCurrentDay
                              ? "bg-surface-container-low border-primary/40"
                              : isCurrentMonth
                              ? "bg-surface-container-lowest border-card-border/80 hover:bg-surface-container-low hover:border-primary/30"
                              : "bg-surface-container/30 border-transparent text-on-surface-variant/40 opacity-40 hover:opacity-70"
                          )}
                        >
                          {/* Day Number & Today Pill */}
                          <div className="flex items-center justify-between w-full">
                            <span
                              className={cn(
                                "font-mono text-xs sm:text-sm font-bold",
                                isSelected
                                  ? "text-primary font-extrabold"
                                  : isCurrentDay
                                  ? "text-primary"
                                  : isCurrentMonth
                                  ? "text-on-surface"
                                  : "text-on-surface-variant/50"
                              )}
                            >
                              {date.getDate()}
                            </span>

                            {isCurrentDay && (
                              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            )}
                          </div>

                          {/* Task Dots / Chips Indicator */}
                          {hasTasks && (
                            <div className="w-full flex flex-col gap-1 mt-1">
                              <div className="hidden sm:flex items-center gap-1 w-full overflow-hidden">
                                <span className="text-[10px] font-mono font-bold text-primary bg-primary/15 px-1.5 py-0.2 rounded truncate w-full">
                                  {dayTasks.length} Tugas
                                </span>
                              </div>
                              <div className="flex sm:hidden items-center gap-0.5">
                                {dayTasks.slice(0, 3).map((_, idx) => (
                                  <span key={idx} className="w-1.5 h-1.5 rounded-full bg-primary" />
                                ))}
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Calendar Legend */}
                  <div className="flex items-center justify-between pt-3 border-t border-card-border/60 text-[11px] text-on-surface-variant flex-wrap gap-2">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                        Hari Ini
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-md bg-primary/20 border border-primary/40" />
                        Ada Tugas
                      </span>
                    </div>
                    <span className="font-mono">
                      {selectedDate.toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                </div>
              </div>

            </div>

            {/* ════════ RIGHT COLUMN: Task Agenda & Selected Date Inspector (5 cols) ════════ */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              
              {/* Selected Date Header */}
              <div className="p-1 rounded-[1.75rem] bg-gradient-to-b from-card-border/70 to-card-border/30 border border-card-border/60 shadow-xs">
                <div className="bg-surface-container-lowest rounded-[calc(1.75rem-0.25rem)] p-4 sm:p-6 flex flex-col gap-4">
                  
                  <div className="flex items-center justify-between border-b border-card-border/60 pb-3">
                    <div>
                      <h3 className="font-headline font-bold text-base text-on-surface">
                        Agenda Tanggal Terpilih
                      </h3>
                      <p className="text-xs text-primary font-medium font-mono mt-0.5">
                        {selectedDate.toLocaleDateString("id-ID", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <span className="px-2.5 py-1 rounded-md bg-surface-container-low border border-card-border text-xs font-mono font-bold text-on-surface">
                      {tasksForSelectedDate.length} Tugas
                    </span>
                  </div>

                  {/* Loading state */}
                  {loading && (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-on-surface-variant">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="text-xs">Memuat daftar tugas terjadwal...</span>
                    </div>
                  )}

                  {/* Empty State for Selected Date */}
                  {!loading && tasksForSelectedDate.length === 0 && (
                    <div className="py-10 flex flex-col items-center justify-center text-center px-4">
                      <div className="w-12 h-12 rounded-2xl bg-surface-container-low text-on-surface-variant flex items-center justify-center mb-3">
                        <CalendarDays className="w-6 h-6 text-on-surface-variant/60" />
                      </div>
                      <h4 className="font-headline font-bold text-sm text-on-surface">
                        Tidak Ada Jadwal Tugas
                      </h4>
                      <p className="text-xs text-on-surface-variant mt-1 max-w-xs leading-relaxed">
                        Belum ada tugas mikro yang dijadwalkan untuk tanggal ini.
                      </p>

                      {activeRole === "requester" ? (
                        <Link
                          href="/task/new"
                          className="mt-4 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors shadow-xs"
                        >
                          + Jadwalkan Tugas Baru
                        </Link>
                      ) : (
                        <Link
                          href="/cari-tugas"
                          className="mt-4 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors shadow-xs"
                        >
                          Jelajahi Tugas Sekitar
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Tasks List for Selected Date */}
                  {!loading && tasksForSelectedDate.length > 0 && (
                    <div className="flex flex-col gap-3">
                      {tasksForSelectedDate.map((t) => {
                        const startDate = new Date(t.scheduled_at);
                        const endDate = t.scheduled_end ? new Date(t.scheduled_end) : null;

                        return (
                          <div
                            key={t.id_tasks}
                            className="p-4 rounded-2xl bg-surface-container-low border border-card-border/90 flex flex-col gap-3 hover:border-primary/40 transition-colors shadow-2xs"
                          >
                            {/* Time Slot & Badge */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-primary">
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                <span>
                                  {startDate.toLocaleTimeString("id-ID", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                  {endDate && (
                                    <>
                                      {" - "}
                                      {endDate.toLocaleTimeString("id-ID", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </>
                                  )}{" "}
                                  WIB
                                </span>
                              </div>

                              <Badge status={t.status} />
                            </div>

                            {/* Task Info */}
                            <div>
                              <h4 className="font-headline font-bold text-sm text-on-surface line-clamp-1">
                                {t.judul_tugas}
                              </h4>
                              <p className="text-xs text-on-surface-variant line-clamp-2 mt-1 leading-relaxed">
                                {t.deskripsi_tugas}
                              </p>
                            </div>

                            {/* Partner & Compensation Details */}
                            <div className="flex items-center justify-between pt-2 border-t border-card-border/60 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-on-surface-variant text-[11px]">
                                  {t.user_role === "requester" ? "Worker:" : "Requester:"}
                                </span>
                                <span className="font-semibold text-on-surface">
                                  {t.user_role === "requester"
                                    ? t.worker?.nama_lengkap || "Belum ditentukan"
                                    : t.requester.nama_lengkap}
                                </span>
                              </div>

                              <span className="font-mono font-bold text-primary text-sm">
                                {formatCurrency(t.kompensasi)}
                              </span>
                            </div>

                            {/* Direct Navigation Button */}
                            <Link
                              href={`/task/${t.id_tasks}`}
                              className="w-full py-2 px-3 rounded-xl bg-surface-container-lowest hover:bg-surface-container text-primary border border-card-border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <span>Lihat Detail Tugas</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              </div>

              {/* Upcoming Agenda Feed Summary */}
              <div className="p-4 rounded-2xl bg-surface-container-lowest border border-card-border/80 shadow-2xs flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    Jadwal Mendatang Terdekat
                  </span>
                  <span className="text-[11px] font-mono text-on-surface-variant">
                    {upcomingTasks.length} Total
                  </span>
                </div>

                {upcomingTasks.length === 0 ? (
                  <p className="text-xs text-on-surface-variant py-3 italic text-center">
                    Tidak ada agenda mendatang untuk bulan ini.
                  </p>
                ) : (
                  <div className="divide-y divide-card-border/40">
                    {upcomingTasks.slice(0, 4).map((ut) => (
                      <Link
                        key={ut.id_tasks}
                        href={`/task/${ut.id_tasks}`}
                        className="py-2.5 flex items-center justify-between gap-3 hover:bg-surface-container-low/50 px-2 rounded-lg transition-colors group"
                      >
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-headline font-semibold text-xs text-on-surface truncate group-hover:text-primary transition-colors">
                            {ut.judul_tugas}
                          </span>
                          <span className="text-[10px] text-on-surface-variant font-mono">
                            {new Date(ut.scheduled_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                            })}{" "}
                            •{" "}
                            {new Date(ut.scheduled_at).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            WIB
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-primary shrink-0">
                          {formatCurrency(ut.kompensasi)}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
