"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Trophy,
  Star,
  Flame,
  CheckCircle2,
  Users,
  Crown,
  TrendingUp,
  HelpCircle,
  Zap,
  Clock,
  ChevronRight,
  Calendar,
  Sparkles,
  Award,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { StreakCalendar } from "@/components/ui/StreakCalendar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface LeaderboardUser {
  id_user: string;
  nama_lengkap: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  total_completed: number;
  rating_avg: number;
  rank?: number;
  current_streak?: number | null;
  longest_streak?: number | null;
}

interface XPLogEntry {
  id: string;
  xp_amount: number;
  source: string;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getXPProgress(xp: number, level: number) {
  const currentFloor = (level - 1) ** 2 * 100;
  const nextFloor = level ** 2 * 100;
  const pct = Math.min(100, Math.max(0, ((xp - currentFloor) / (nextFloor - currentFloor)) * 100));
  return { pct, currentFloor, nextFloor };
}

function formatNumber(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

function getSourceLabel(source: string): { label: string; icon: React.ReactNode; color: string } {
  const s = (source || "").toUpperCase();
  if (s.includes("TASK") || s.includes("COMPLETE"))
    return { label: "Penyelesaian Tugas", icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "text-secondary" };
  if (s.includes("STREAK"))
    return { label: "Bonus Streak Harian", icon: <Flame className="w-3.5 h-3.5" />, color: "text-tertiary" };
  if (s.includes("RATING") || s.includes("REVIEW"))
    return { label: "Ulasan Klien Positif", icon: <Star className="w-3.5 h-3.5" />, color: "text-amber-500" };
  if (s.includes("BADGE") || s.includes("ACHIEVEMENT"))
    return { label: "Pencapaian Lencana", icon: <Award className="w-3.5 h-3.5" />, color: "text-primary" };
  return { label: source || "Aktivitas Sistem", icon: <Zap className="w-3.5 h-3.5" />, color: "text-primary" };
}

// ─── Components ──────────────────────────────────────────────────────────────

function UserAvatar({
  user,
  className,
}: {
  user: LeaderboardUser;
  className?: string;
}) {
  const [err, setErr] = useState(false);
  const initials = user.nama_lengkap
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  if (!user.avatar_url || err) {
    return (
      <div
        className={cn(
          "w-full h-full bg-primary/10 text-primary flex items-center justify-center font-bold font-mono tracking-tight",
          className
        )}
      >
        {initials}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={user.avatar_url}
      alt={user.nama_lengkap}
      className={cn("w-full h-full object-cover", className)}
      onError={() => setErr(true)}
    />
  );
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [currentUser, setCurrentUser] = useState<LeaderboardUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<"current" | "last_month">("current");
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Main navigation tab
  const [activeTab, setActiveTab] = useState<"ranking" | "history">("ranking");

  // XP Activity state
  const [xpLogs, setXpLogs] = useState<XPLogEntry[]>([]);
  const [xpLoading, setXpLoading] = useState(false);
  const [xpPage, setXpPage] = useState(1);
  const [xpTotalPages, setXpTotalPages] = useState(1);

  // Fetch leaderboard data
  useEffect(() => {
    let cancelled = false;

    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?period=${period}`);
        const json = await res.json();
        if (!cancelled && json.success) {
          setUsers(json.data || []);
          if (json.currentUser) {
            setCurrentUser(json.currentUser);
          } else {
            setCurrentUser(null);
          }
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchLeaderboard();
    return () => {
      cancelled = true;
    };
  }, [period]);

  // Fetch XP history data
  useEffect(() => {
    if (activeTab !== "history") return;
    let cancelled = false;
    setXpLoading(true);

    (async () => {
      try {
        const res = await fetch(`/api/xp/history?page=${xpPage}&limit=12`);
        const json = await res.json();
        if (!cancelled && json.success) {
          setXpLogs(json.data || []);
          setXpTotalPages(json.pagination?.totalPages || 1);
        }
      } catch (e) {
        console.error("Failed to fetch XP history", e);
      } finally {
        if (!cancelled) setXpLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, xpPage]);

  const currentUserId = currentUser?.id_user;
  const myRank =
    currentUser?.rank ??
    (currentUserId ? users.findIndex((u) => u.id_user === currentUserId) + 1 : 0);
  const myUser =
    currentUser ?? (currentUserId ? users.find((u) => u.id_user === currentUserId) : undefined);

  const totalWorkers = users.length;
  const totalTasksDone = users.reduce((acc, u) => acc + (u.total_completed || 0), 0);
  const avgRating = users.length
    ? users.reduce((acc, u) => acc + (u.rating_avg || 0), 0) / users.length
    : 0;
  const topXP = users.length ? users[0].xp : 0;

  // Podium contestants
  const rank1 = users[0];
  const rank2 = users[1];
  const rank3 = users[2];
  const otherUsers = users.slice(3);

  return (
    <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-12 gap-6 font-sans">
      {/* ───────────── 1. PAGE HEADER & UNIFIED CONTROL BAR ───────────── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-card-border/60">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/20 to-primary/10 border border-amber-400/30 flex items-center justify-center text-amber-500 shadow-xs">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline font-extrabold text-2xl sm:text-3xl text-on-surface tracking-tight">
                Peringkat Pekerja
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
              Kumpulkan XP dari penyelesaian tugas dan streak harian untuk naik peringkat.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          {/* Help button */}
          <button
            onClick={() => setIsHelpOpen(true)}
            className="px-3 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:text-primary hover:bg-surface-container border border-card-border transition-colors duration-150 flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Aturan & Petunjuk Poin"
          >
            <HelpCircle className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">Aturan Poin</span>
          </button>
        </div>
      </header>

      {/* ───────────── 2. SEGMENTED PRIMARY NAVIGATION ───────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low p-1.5 rounded-2xl border border-card-border">
        {/* Main Tab Switcher */}
        <div className="flex items-center gap-1 bg-surface-container rounded-xl p-1 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("ranking")}
            className={cn(
              "flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer",
              activeTab === "ranking"
                ? "bg-surface-container-lowest text-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <Trophy className="w-4 h-4" />
            <span>Papan Peringkat</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer",
              activeTab === "history"
                ? "bg-surface-container-lowest text-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Riwayat &amp; Aktivitas XP</span>
          </button>
        </div>

        {/* Sub-Filter: Period (Only visible on Ranking tab) */}
        {activeTab === "ranking" && (
          <div className="flex items-center gap-1 self-end sm:self-auto w-full sm:w-auto justify-end">
            <span className="text-[11px] font-mono text-on-surface-variant uppercase tracking-wider mr-1 hidden lg:inline">
              Periode:
            </span>
            <button
              onClick={() => setPeriod("current")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                period === "current"
                  ? "bg-primary text-on-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
              )}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setPeriod("last_month")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                period === "last_month"
                  ? "bg-primary text-on-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
              )}
            >
              Bulan Lalu
            </button>
          </div>
        )}
      </div>

      {/* ───────────── 3. TAB CONTENT ───────────── */}
      {activeTab === "history" ? (
        /* ─── TAB: XP ACTIVITY & STREAK HEATMAP ─── */
        <div className="flex flex-col gap-6">
          {/* Heatmap Section */}
          <StreakCalendar />

          {/* Activity Timeline List */}
          <div className="rounded-3xl bg-surface-container-low border border-card-border p-1.5 shadow-xs">
            <div className="rounded-2xl bg-surface-container-lowest border border-card-border overflow-hidden">
              <div className="px-5 py-4 border-b border-card-border bg-surface-container-low/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-primary" />
                  <h2 className="font-headline font-bold text-sm text-on-surface">
                    Log Perolehan XP Terbaru
                  </h2>
                </div>
                <span className="text-xs text-on-surface-variant font-mono">
                  {xpLogs.length} Entri Ditampilkan
                </span>
              </div>

              {xpLoading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="w-8 h-8 rounded-full border-3 border-primary border-t-transparent animate-spin" />
                </div>
              ) : xpLogs.length === 0 ? (
                <div className="text-center py-14 px-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-3">
                    <Zap className="w-7 h-7" />
                  </div>
                  <p className="font-headline font-bold text-base text-on-surface">
                    Belum Ada Riwayat XP
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1 max-w-sm mx-auto">
                    Selesaikan tugas mikro atau jaga login harian untuk mulai mengumpulkan poin XP.
                  </p>
                  <Link
                    href="/feed"
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-xl hover:bg-primary-container transition-colors"
                  >
                    Cari Tugas Sekarang
                  </Link>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-card-border/70">
                    {xpLogs.map((log) => {
                      const src = getSourceLabel(log.source);
                      return (
                        <div
                          key={log.id}
                          className="flex items-center justify-between p-4 sm:px-6 hover:bg-surface-container-low/40 transition-colors"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div
                              className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-card-border/60",
                                src.color,
                                "bg-surface-container-low"
                              )}
                            >
                              {src.icon}
                            </div>
                            <div className="min-w-0">
                              <p className="font-headline font-bold text-xs sm:text-sm text-on-surface truncate">
                                {src.label}
                              </p>
                              <p className="text-[11px] text-on-surface-variant font-mono mt-0.5">
                                {formatDistanceToNow(new Date(log.created_at), {
                                  addSuffix: true,
                                  locale: idLocale,
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 pl-3">
                            <span className="inline-flex items-center gap-1 font-mono font-extrabold text-sm sm:text-base text-primary">
                              +{log.xp_amount} <span className="text-xs font-sans">XP</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {xpTotalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-card-border bg-surface-container-low/40">
                      <button
                        onClick={() => setXpPage((p) => Math.max(1, p - 1))}
                        disabled={xpPage <= 1}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        Sebelumnya
                      </button>
                      <span className="text-xs font-mono font-bold text-on-surface-variant">
                        Halaman {xpPage} dari {xpTotalPages}
                      </span>
                      <button
                        onClick={() => setXpPage((p) => Math.min(xpTotalPages, p + 1))}
                        disabled={xpPage >= xpTotalPages}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        Berikutnya
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ─── TAB: LEADERBOARD RANKING ─── */
        <div className="flex flex-col gap-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-24">
              <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center bg-surface-container-lowest border border-card-border rounded-3xl p-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Trophy className="w-8 h-8" />
              </div>
              <h2 className="font-headline font-bold text-lg text-on-surface">Belum Ada Peringkat</h2>
              <p className="text-xs text-on-surface-variant max-w-sm">
                Belum ada perolehan XP tercatat pada periode ini. Selesaikan tugas pertamamu untuk menjadi nomor 1!
              </p>
              <Link
                href="/feed"
                className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary text-xs font-bold rounded-xl hover:bg-primary-container transition-colors shadow-sm"
              >
                Cari Tugas Mikro
              </Link>
            </div>
          ) : (
            <>
              {/* ───────────── HERO PODIUM STAGE (TOP 3) ───────────── */}
              {rank1 && (
                <section aria-label="Podium Juara Utama">
                  <div className="p-2 sm:p-3 rounded-[2rem] bg-surface-container-low border border-card-border shadow-xs">
                    <div className="rounded-[calc(2rem-0.5rem)] bg-surface-container-lowest p-5 sm:p-8 border border-card-border relative overflow-hidden flex flex-col items-center">
                      {/* Ambient Champion Glow */}
                      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-gradient-to-b from-amber-400/20 via-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />

                      {/* Podium Title */}
                      <div className="flex items-center gap-2 mb-6 text-center z-10">
                        <span className="px-3 py-1 rounded-lg bg-amber-400/15 border border-amber-400/30 text-amber-600 text-[11px] font-bold font-mono uppercase tracking-wider flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5" /> Podium Teratas
                        </span>
                      </div>

                      {/* 3D Tiered Pedestal Grid */}
                      <div className="w-full max-w-2xl grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 items-end pt-8 pb-2 z-10">
                        {/* ── RANK 2 (Silver / Titanium) ── */}
                        <div className="flex flex-col items-center order-1">
                          {rank2 ? (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, delay: 0.15 }}
                              className="w-full flex flex-col items-center"
                            >
                              <div className="relative mb-3 group">
                                <Link href={`/profile/${rank2.id_user}`}>
                                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-3 border-slate-300 bg-surface-container shadow-md group-hover:scale-105 transition-transform duration-200">
                                    <UserAvatar user={rank2} />
                                  </div>
                                </Link>
                                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-slate-300 text-slate-800 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-md border-2 border-surface-container-lowest font-mono">
                                  2
                                </div>
                              </div>

                              <div className="text-center w-full px-1 mb-2">
                                <Link
                                  href={`/profile/${rank2.id_user}`}
                                  className="hover:text-primary transition-colors block"
                                >
                                  <p className="font-headline font-bold text-xs sm:text-sm text-on-surface truncate">
                                    {rank2.nama_lengkap}
                                  </p>
                                </Link>
                                <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-slate-200/60 text-slate-700 text-[10px] font-mono font-bold">
                                  {formatNumber(rank2.xp)} XP
                                </span>
                              </div>

                              {/* Physical Pedestal Block 2 */}
                              <div className="w-full h-24 sm:h-28 rounded-t-2xl bg-gradient-to-b from-slate-200/80 to-slate-100/50 border-t-2 border-x border-slate-300 flex flex-col items-center justify-center shadow-inner">
                                <span className="text-2xl sm:text-3xl font-black font-mono text-slate-400">
                                  2ND
                                </span>
                                <span className="text-[10px] font-mono text-slate-500 font-bold">
                                  Lv {rank2.level}
                                </span>
                              </div>
                            </motion.div>
                          ) : (
                            <div className="w-full h-24 rounded-t-2xl bg-surface-container-low border border-dashed border-card-border" />
                          )}
                        </div>

                        {/* ── RANK 1 (Gold / Champion) ── */}
                        <div className="flex flex-col items-center order-2">
                          <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0 }}
                            className="w-full flex flex-col items-center -translate-y-4"
                          >
                            <div className="relative mb-3 group">
                              <motion.div
                                animate={{ y: [-3, 3, -3] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -top-7 left-1/2 -translate-x-1/2 text-amber-400"
                              >
                                <Crown className="w-8 h-8 drop-shadow-md fill-amber-400" />
                              </motion.div>
                              <Link href={`/profile/${rank1.id_user}`}>
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden border-4 border-amber-400 bg-surface-container shadow-[0_0_25px_rgba(251,191,36,0.35)] group-hover:scale-105 transition-transform duration-200">
                                  <UserAvatar user={rank1} />
                                </div>
                              </Link>
                              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm shadow-md border-2 border-surface-container-lowest font-mono">
                                1
                              </div>
                            </div>

                            <div className="text-center w-full px-1 mb-2">
                              <Link
                                href={`/profile/${rank1.id_user}`}
                                className="hover:text-primary transition-colors block"
                              >
                                <p className="font-headline font-extrabold text-sm sm:text-base text-on-surface truncate">
                                  {rank1.nama_lengkap}
                                </p>
                              </Link>
                              <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-md bg-amber-400/20 text-amber-700 text-[11px] font-mono font-bold">
                                {formatNumber(rank1.xp)} XP
                              </span>
                            </div>

                            {/* Physical Pedestal Block 1 */}
                            <div className="w-full h-32 sm:h-36 rounded-t-2xl bg-gradient-to-b from-amber-200/90 to-amber-100/40 border-t-3 border-x border-amber-400 flex flex-col items-center justify-center shadow-inner">
                              <span className="text-3xl sm:text-4xl font-black font-mono text-amber-500">
                                1ST
                              </span>
                              <span className="text-xs font-mono text-amber-700 font-bold">
                                Lv {rank1.level} · Juara
                              </span>
                            </div>
                          </motion.div>
                        </div>

                        {/* ── RANK 3 (Bronze / Copper) ── */}
                        <div className="flex flex-col items-center order-3">
                          {rank3 ? (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, delay: 0.25 }}
                              className="w-full flex flex-col items-center"
                            >
                              <div className="relative mb-3 group">
                                <Link href={`/profile/${rank3.id_user}`}>
                                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-3 border-amber-600 bg-surface-container shadow-md group-hover:scale-105 transition-transform duration-200">
                                    <UserAvatar user={rank3} />
                                  </div>
                                </Link>
                                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-amber-600 text-amber-100 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-md border-2 border-surface-container-lowest font-mono">
                                  3
                                </div>
                              </div>

                              <div className="text-center w-full px-1 mb-2">
                                <Link
                                  href={`/profile/${rank3.id_user}`}
                                  className="hover:text-primary transition-colors block"
                                >
                                  <p className="font-headline font-bold text-xs sm:text-sm text-on-surface truncate">
                                    {rank3.nama_lengkap}
                                  </p>
                                </Link>
                                <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-amber-600/15 text-amber-700 text-[10px] font-mono font-bold">
                                  {formatNumber(rank3.xp)} XP
                                </span>
                              </div>

                              {/* Physical Pedestal Block 3 */}
                              <div className="w-full h-18 sm:h-22 rounded-t-2xl bg-gradient-to-b from-amber-700/20 to-amber-600/10 border-t-2 border-x border-amber-600/40 flex flex-col items-center justify-center shadow-inner">
                                <span className="text-2xl sm:text-3xl font-black font-mono text-amber-700/60">
                                  3RD
                                </span>
                                <span className="text-[10px] font-mono text-amber-700 font-bold">
                                  Lv {rank3.level}
                                </span>
                              </div>
                            </motion.div>
                          ) : (
                            <div className="w-full h-18 rounded-t-2xl bg-surface-container-low border border-dashed border-card-border" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* ───────────── 4. MY POSITION CARD ───────────── */}
              {myUser && (
                <section aria-label="Posisi Peringkat Anda">
                  <div className="p-1.5 sm:p-2 rounded-2xl bg-primary/10 border border-primary/30 shadow-xs">
                    <div className="rounded-xl bg-surface-container-lowest p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-card-border">
                      <div className="flex items-center gap-3.5">
                        <div className="relative shrink-0">
                          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-primary/10 ring-2 ring-primary/40">
                            <UserAvatar user={myUser} />
                          </div>
                          <span className="absolute -bottom-1.5 -right-1 px-1.5 py-0.2 rounded-md bg-primary text-on-primary font-mono text-[9px] font-extrabold uppercase">
                            Kamu
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-headline font-bold text-sm sm:text-base text-on-surface">
                              {myUser.nama_lengkap}
                            </h3>
                            <span className="font-mono font-extrabold text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                              #{myRank || "-"}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-on-surface-variant font-medium mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              {(myUser.rating_avg || 0).toFixed(1)}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
                              {myUser.total_completed || 0} Tugas
                            </span>
                            {myUser.current_streak ? (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-tertiary font-bold">
                                  <Flame className="w-3.5 h-3.5" />
                                  {myUser.current_streak} Hari Streak
                                </span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* XP Progress Bar & Quick Action */}
                      <div className="flex items-center gap-4">
                        <div className="md:w-60 flex flex-col gap-1.5">
                          <div className="flex justify-between items-baseline text-xs">
                            <span className="font-bold text-primary font-mono">
                              {formatNumber(myUser.xp || 0)} XP
                            </span>
                            <span className="font-mono text-on-surface-variant text-[11px]">
                              Lv {myUser.level || 1}
                            </span>
                          </div>
                          <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-500"
                              style={{
                                width: `${getXPProgress(myUser.xp || 0, myUser.level || 1).pct}%`,
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-on-surface-variant font-mono text-right">
                            {formatNumber(
                              Math.max(
                                0,
                                getXPProgress(myUser.xp || 0, myUser.level || 1).nextFloor -
                                  (myUser.xp || 0)
                              )
                            )}{" "}
                            XP lagi ke Lv {(myUser.level || 1) + 1}
                          </span>
                        </div>

                        <Link
                          href={`/profile/${myUser.id_user}`}
                          className="hidden sm:flex w-9 h-9 rounded-xl bg-surface-container-low border border-card-border items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all shrink-0"
                          title="Lihat Profil & Lencana Saya"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* ───────────── 5. COMMUNITY STATS BENTO STRIP ───────────── */}
              <section aria-label="Statistik Komunitas">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-surface-container-low border border-card-border flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-on-surface-variant">
                      Total Pekerja
                    </span>
                    <span className="font-headline font-extrabold text-xl text-on-surface mt-1 flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary shrink-0" />
                      {formatNumber(totalWorkers)}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-surface-container-low border border-card-border flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-on-surface-variant">
                      Tugas Selesai
                    </span>
                    <span className="font-headline font-extrabold text-xl text-on-surface mt-1 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                      {formatNumber(totalTasksDone)}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-surface-container-low border border-card-border flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-on-surface-variant">
                      Rating Rata-rata
                    </span>
                    <span className="font-headline font-extrabold text-xl text-on-surface mt-1 flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                      {avgRating.toFixed(1)}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-surface-container-low border border-card-border flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-on-surface-variant">
                      Top XP Bulan Ini
                    </span>
                    <span className="font-headline font-extrabold text-xl text-primary mt-1 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 shrink-0" />
                      {formatNumber(topXP)}
                    </span>
                  </div>
                </div>
              </section>

              {/* ───────────── 6. FULL RANKINGS TABLE ───────────── */}
              {otherUsers.length > 0 && (
                <section aria-label="Daftar Peringkat Lengkap">
                  <div className="rounded-3xl bg-surface-container-low border border-card-border p-1.5 shadow-xs">
                    <div className="rounded-2xl bg-surface-container-lowest border border-card-border overflow-hidden">
                      <div className="px-5 py-3.5 border-b border-card-border bg-surface-container-low/60 flex items-center justify-between">
                        <h2 className="font-headline font-bold text-sm text-on-surface">
                          Peringkat Seluruh Pekerja
                        </h2>
                        <span className="text-xs text-on-surface-variant font-mono">
                          {users.length} Pekerja Terdaftar
                        </span>
                      </div>

                      <div className="divide-y divide-card-border">
                        {otherUsers.map((user, idx) => {
                          const rank = user.rank || idx + 4;
                          const isMe = currentUser?.id_user === user.id_user;
                          const progress = getXPProgress(user.xp, user.level);

                          return (
                            <div
                              key={user.id_user}
                              className={cn(
                                "flex items-center gap-3 p-3.5 sm:px-5 transition-colors",
                                isMe
                                  ? "bg-primary/5 ring-1 ring-inset ring-primary/30"
                                  : "hover:bg-surface-container-low/50"
                              )}
                            >
                              {/* Rank number */}
                              <div className="w-8 h-8 rounded-xl bg-surface-container font-mono font-extrabold text-xs text-on-surface-variant flex items-center justify-center shrink-0">
                                #{rank}
                              </div>

                              {/* Avatar */}
                              <Link href={`/profile/${user.id_user}`} className="shrink-0">
                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-surface-variant">
                                  <UserAvatar user={user} />
                                </div>
                              </Link>

                              {/* Name & metadata */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/profile/${user.id_user}`}
                                    className="font-headline font-bold text-xs sm:text-sm text-on-surface hover:text-primary transition-colors truncate"
                                  >
                                    {user.nama_lengkap}
                                  </Link>
                                  {isMe && (
                                    <span className="px-1.5 py-0.2 rounded-md bg-primary text-on-primary text-[9px] font-mono font-bold uppercase">
                                      Kamu
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 text-[11px] text-on-surface-variant mt-0.5 flex-wrap">
                                  <span className="flex items-center gap-0.5">
                                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                    {user.rating_avg.toFixed(1)}
                                  </span>
                                  <span>•</span>
                                  <span>{user.total_completed} Tugas</span>
                                  {user.current_streak ? (
                                    <>
                                      <span>•</span>
                                      <span className="text-tertiary flex items-center gap-0.5">
                                        <Flame className="w-3 h-3" />
                                        {user.current_streak} Hari
                                      </span>
                                    </>
                                  ) : null}
                                </div>

                                {/* XP Progress bar mini */}
                                <div className="mt-1.5 h-1 bg-surface-container rounded-full overflow-hidden max-w-xs">
                                  <div
                                    className="h-full bg-primary/70 rounded-full"
                                    style={{ width: `${progress.pct}%` }}
                                  />
                                </div>
                              </div>

                              {/* XP & Level */}
                              <div className="text-right shrink-0">
                                <p className="font-mono font-extrabold text-sm text-primary">
                                  {formatNumber(user.xp)}
                                </p>
                                <span className="font-mono text-[10px] text-on-surface-variant font-bold">
                                  Lv {user.level}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}

      {/* ───────────── 7. MODAL HELP / PETUNJUK POIN ───────────── */}
      <Modal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title="Petunjuk Sistem Poin & Peringkat"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs sm:text-sm text-on-surface-variant p-2 pb-6">
          <p>
            Papan Peringkat beroperasi menggunakan siklus <strong className="text-primary">Periode Bulanan</strong>.
            XP yang dihitung pada tabel peringkat adalah akumulasi aktivitas dari tanggal 1 hingga akhir bulan berjalan.
          </p>

          <div className="bg-primary/5 p-4 rounded-2xl border border-primary/15">
            <h3 className="font-headline font-bold text-on-surface mb-2 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              Prioritas Penentuan Peringkat
            </h3>
            <ol className="list-decimal list-inside space-y-1">
              <li><strong>Total XP Periode Berjalan</strong> (Prioritas Utama).</li>
              <li><strong>Total Tugas Selesai</strong> sepanjang waktu.</li>
              <li><strong>Rata-rata Rating</strong> dari seluruh ulasan klien.</li>
            </ol>
          </div>

          <div className="bg-tertiary/5 p-4 rounded-2xl border border-tertiary/15">
            <h3 className="font-headline font-bold text-on-surface mb-2 flex items-center gap-2">
              <Flame className="w-4 h-4 text-tertiary" />
              Tingkat Bonus Streak Harian
            </h3>
            <p className="mb-2">Jaga konsistensi login &amp; penyelesaian tugas setiap hari untuk bonus XP:</p>
            <ul className="space-y-1 font-mono text-xs">
              <li>• 3–6 hari berturut-turut: <strong>+10 XP</strong></li>
              <li>• 7–13 hari berturut-turut: <strong>+25 XP</strong></li>
              <li>• 14–29 hari berturut-turut: <strong>+50 XP</strong></li>
              <li>• 30+ hari berturut-turut: <strong>+100 XP</strong></li>
            </ul>
          </div>

          <div className="bg-surface-container-low p-4 rounded-2xl border border-card-border">
            <h3 className="font-headline font-bold text-on-surface mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Level Akun vs Peringkat
            </h3>
            <p className="text-xs">
              Level akun Anda bersifat <strong>permanen</strong> dan tidak direset setiap bulan. Level dihitung dari seluruh XP kumulatif sejak pertama kali akun dibuat.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
