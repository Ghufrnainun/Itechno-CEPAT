"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useCurrentRole } from "@/app/(main)/layout";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs";
import { formatCurrency } from "@/lib/utils/format";
import MapPickerWrapper from "@/features/task/components/MapPickerWrapper";
import { StreakReminderCard } from "@/components/ui/StreakReminderCard";
import {
  Wallet,
  TrendingUp,
  ChevronRight,
  Star,
  CheckCircle2,
  Lock,
  Briefcase,
  PlusSquare,
  Compass,
  History,
  HelpCircle,
  Flame,
  MapPin,
  ShieldCheck,
  Maximize2,
  Store,
  Footprints,
  SearchX,
  User,
  Plus,
  Search,
  ArrowRight,
  Sparkles,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { role, user, toggleRole } = useCurrentRole();
  const { coords } = useGeolocation();

  const [tasks, setTasks] = useState<any[]>([]);
  const [recommendedTasks, setRecommendedTasks] = useState<any[]>([]);
  const [featuredTask, setFeaturedTask] = useState<any | null>(null);
  const [escrowAmount, setEscrowAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"recommendations" | "activity">("recommendations");
  const [myActiveTasks, setMyActiveTasks] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    async function loadData() {
      if (!hasLoadedOnce.current) {
        setLoading(true);
      }
      try {
        const mapUrl = new URL('/api/tasks/nearby', window.location.origin);
        mapUrl.searchParams.append('lat', coords.latitude.toString());
        mapUrl.searchParams.append('lng', coords.longitude.toString());
        mapUrl.searchParams.append('radius', '5000');

        const feedUrl = new URL('/api/tasks/feed', window.location.origin);
        feedUrl.searchParams.append('lat', coords.latitude.toString());
        feedUrl.searchParams.append('lng', coords.longitude.toString());
        feedUrl.searchParams.append('limit', '6');
        feedUrl.searchParams.append('sort', 'distance_asc');

        const [mapRes, feedRes, escrowRes, activityRes] = await Promise.all([
          fetch(mapUrl.toString(), { cache: 'no-store' }),
          fetch(feedUrl.toString(), { cache: 'no-store' }),
          fetch('/api/wallet/escrow', { cache: 'no-store' }),
          fetch('/api/users/me/tasks?role=worker', { cache: 'no-store' }),
        ]);

        if (mapRes.ok) {
          const mapJson = await mapRes.json().catch(() => ({}));
          setTasks(mapJson.data || []);
        }

        if (feedRes.ok) {
          const feedJson = await feedRes.json().catch(() => ({}));
          if (feedJson.data && feedJson.data.length > 0) {
            setFeaturedTask(feedJson.data[0]);
            setRecommendedTasks(feedJson.data.slice(1, 4));
          }
        }

        if (escrowRes.ok) {
          const escrowJson = await escrowRes.json().catch(() => ({}));
          if (escrowJson.success && escrowJson.data) {
            setEscrowAmount(escrowJson.data.escrow_amount);
          }
        }

        if (activityRes.ok) {
          const activityJson = await activityRes.json().catch(() => ({}));
          if (activityJson.success && Array.isArray(activityJson.data)) {
            setMyActiveTasks(activityJson.data);
          }
        }
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        hasLoadedOnce.current = true;
        setLoading(false);
      }
    }
    loadData();
  }, [coords]);

  const userName = user?.nama_lengkap?.split(" ")[0] || user?.username || "Pekerja";
  const nearbyCount = tasks.length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang";
    if (hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  const totalCompleted = user?.total_completed ?? 0;

  return (
    <div className="flex flex-col h-full bg-surface font-sans min-h-screen">
      {/* ───────────── ELEVATED HEADER ───────────── */}
      <header className="page-header bg-surface-container-lowest border-b border-card-border px-4 sm:px-6 lg:px-8 py-3.5 sm:py-5 flex flex-row items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider border border-primary/20 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              {getGreeting()}
            </span>
            <span className="text-on-surface-variant text-xs">•</span>
            <span className="text-[11px] sm:text-xs font-semibold text-on-surface-variant font-mono">
              Semarang
            </span>
          </div>

          <h1 className="font-headline font-extrabold text-xl sm:text-3xl text-on-surface tracking-tight">
            Halo, {userName} 👋
          </h1>
          <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant mt-0.5 hidden sm:block">
            {role === "worker" ? (
              <>
                Tersedia <span className="font-bold text-primary font-mono tabular-nums">{nearbyCount} peluang tugas mikro</span> siap dikerjakan hari ini.
              </>
            ) : (
              <>
                Mode <span className="font-bold text-primary">Pemberi Kerja</span> aktif. Buat tugas baru dan delegasikan dengan aman.
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {role === "requester" ? (
            <Link href="/task/new">
              <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} className="min-h-[38px] sm:min-h-[44px] text-xs font-bold px-3 sm:px-4">
                Post Tugas
              </Button>
            </Link>
          ) : (
            <Link href="/feed">
              <Button variant="primary" size="sm" icon={<Search className="w-3.5 h-3.5" />} className="min-h-[38px] sm:min-h-[44px] text-xs font-bold px-3 sm:px-4">
                Cari Tugas
              </Button>
            </Link>
          )}
          <Link href="/leaderboard">
            <Button variant="secondary" size="sm" icon={<Trophy className="w-3.5 h-3.5" />} className="min-h-[38px] sm:min-h-[44px] text-xs font-bold px-3 sm:px-4">
              Ranking
            </Button>
          </Link>
        </div>
      </header>

      {/* ───────────── SCROLLABLE MAIN CONTENT ───────────── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6 pb-28 lg:pb-12">

        {/* ───────────── ROLE SWITCHER (MOBILE ONLY - TOP) ───────────── */}
        <section className="lg:hidden">
          <div className="bg-surface-container-low border border-card-border rounded-xl p-1 flex relative shadow-xs">
            <div
              className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-primary rounded-lg transition-transform duration-200 ease-out shadow-xs"
              style={{
                transform: role === "worker" ? "translateX(0)" : "translateX(100%)",
              }}
            />
            <button
              onClick={() => role !== "worker" && toggleRole()}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold z-10 transition-colors duration-150 rounded-lg cursor-pointer min-h-[44px]",
                role === "worker" ? "text-on-primary font-bold" : "text-on-surface"
              )}
            >
              <Briefcase className="w-4 h-4" />
              Mode Pekerja
            </button>
            <button
              onClick={() => role !== "requester" && toggleRole()}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold z-10 transition-colors duration-150 rounded-lg cursor-pointer min-h-[44px]",
                role === "requester" ? "text-on-primary font-bold" : "text-on-surface"
              )}
            >
              <PlusSquare className="w-4 h-4" />
              Mode Pemberi Tugas
            </button>
          </div>
        </section>

        {/* ───────────── STREAK REMINDER (WORKER ONLY) ───────────── */}
        {role === "worker" && (
          <section>
            <StreakReminderCard />
          </section>
        )}

        {/* ───────────── ASYMMETRIC BENTO STATS GRID (12 Columns) ───────────── */}
        <section className="grid grid-cols-12 gap-3.5 sm:gap-4 md:gap-5">
          {/* Card 1 — Saldo Poin Utama (Double Bezel: col-span-12 lg:col-span-5) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="col-span-12 lg:col-span-5"
          >
            <div className="p-1 sm:p-1.5 rounded-2xl bg-surface-container-low border border-card-border shadow-xs h-full">
              <div className="h-full rounded-xl bg-surface-container-lowest p-5 sm:p-6 flex flex-col justify-between border border-card-border shadow-xs hover:border-primary/40 transition-all duration-150">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider font-mono text-on-surface-variant">
                      Saldo Poin Utama
                    </span>
                    <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                      <Wallet className="w-4 h-4" />
                    </div>
                  </div>

                  {loading ? (
                    <div className="space-y-2 mb-4">
                      <Skeleton className="h-10 w-2/3 rounded-lg" />
                    </div>
                  ) : (
                    <div aria-live="polite">
                      <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight font-mono tabular-nums">
                        {user?.total_balance ? formatCurrency(user.total_balance).replace('Rp', '') : '0'}{" "}
                        <span className="text-sm font-bold text-on-surface-variant font-sans uppercase">pts</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between pt-3 border-t border-card-border">
                  <span className="text-xs text-primary font-bold flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" />
                    Siap dicairkan / dipakai
                  </span>
                  <Link href="/wallet" className="text-xs text-primary font-bold hover:underline flex items-center gap-1 font-mono">
                    Dompet <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2 — Rating Reputasi (col-span-6 lg:col-span-3) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="col-span-6 lg:col-span-3"
          >
            <div className="p-1 sm:p-1.5 rounded-2xl bg-surface-container-low border border-card-border shadow-xs h-full">
              <div className="h-full rounded-xl bg-surface-container-lowest p-5 flex flex-col justify-between border border-card-border shadow-xs hover:border-primary/40 transition-all duration-150">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-on-surface-variant">
                    Rating
                  </span>
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  </div>
                </div>

                {loading ? (
                  <Skeleton className="h-8 w-1/2 rounded-lg" />
                ) : (
                  <div aria-live="polite">
                    <div className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight font-mono tabular-nums">
                      {totalCompleted > 0 && user?.rating_avg ? user.rating_avg.toFixed(1) : "-"}{" "}
                      <span className="text-xs text-on-surface-variant font-sans font-semibold">/ 5.0</span>
                    </div>
                    <div className="text-[11px] text-on-surface-variant mt-1.5 font-medium">
                      {totalCompleted > 0 ? (
                        <>Dari <span className="font-mono font-bold tabular-nums text-on-surface">{totalCompleted}</span> task selesai</>
                      ) : (
                        "Belum ada ulasan tugas"
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Card 3 — Total Tugas Selesai (col-span-6 lg:col-span-4) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="col-span-6 lg:col-span-4"
          >
            <div className="p-1 sm:p-1.5 rounded-2xl bg-surface-container-low border border-card-border shadow-xs h-full">
              <div className="h-full rounded-xl bg-secondary-container/40 border border-secondary/25 p-5 flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between mb-2 text-secondary font-bold">
                  <span className="text-[11px] font-mono uppercase tracking-wider font-bold">
                    Pekerjaan Sukses
                  </span>
                  <CheckCircle2 className="w-4.5 h-4.5 text-secondary" />
                </div>

                {loading ? (
                  <Skeleton className="h-8 w-1/2 rounded-lg" />
                ) : (
                  <div aria-live="polite">
                    <div className="text-2xl sm:text-3xl font-extrabold text-on-surface font-mono tracking-tight tabular-nums flex items-baseline gap-1.5">
                      {totalCompleted > 0 ? totalCompleted : "0"}{" "}
                      <span className="text-xs text-secondary font-sans font-bold">tugas</span>
                    </div>
                    <div className="text-[11px] text-on-surface-variant mt-1.5 font-medium">
                      {totalCompleted > 0 ? "Tingkat keberhasilan 100%" : "Belum ada riwayat tugas"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Card 4 — Dana Terkunci Escrow (col-span-12) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="col-span-12"
          >
            <div className="rounded-2xl bg-surface-container-lowest p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs border border-card-border hover:border-primary/40 transition-colors duration-150">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-tertiary-container/50 border border-tertiary/20 flex items-center justify-center text-tertiary shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider font-mono">
                    Saldo Terkunci di Escrow
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight mt-0.5 font-mono tabular-nums">
                    {formatCurrency(escrowAmount || 0)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-card-border pt-3 sm:pt-0">
                <span className="text-xs text-on-surface-variant font-medium hidden md:inline">
                  Otomatis dirilis begitu tugas terverifikasi selesai
                </span>
                <Link href="/wallet">
                  <Button variant="secondary" size="sm" className="min-h-[38px] text-xs font-bold">
                    Rincian Escrow
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </section>



        {/* ───────────── QUICK SHORTCUT STRIP (MOBILE ONLY) ───────────── */}
        <section className="lg:hidden bg-surface-container-lowest border border-card-border/90 rounded-2xl p-2.5 shadow-2xs">
          <div className="grid grid-cols-4 gap-1">
            {role === "requester" ? (
              <Link href="/task/new" className="flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-xl hover:bg-surface-container-low transition-colors group">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                  <PlusSquare className="w-4.5 h-4.5" />
                </div>
                <span className="text-[11px] font-semibold text-on-surface text-center whitespace-nowrap">Post Tugas</span>
              </Link>
            ) : (
              <Link href="/cari-tugas" className="flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-xl hover:bg-surface-container-low transition-colors group">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                  <Compass className="w-4.5 h-4.5" />
                </div>
                <span className="text-[11px] font-semibold text-on-surface text-center whitespace-nowrap">Radar Map</span>
              </Link>
            )}

            <Link href="/history/riwayat" className="flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-xl hover:bg-surface-container-low transition-colors group">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                <History className="w-4.5 h-4.5" />
              </div>
              <span className="text-[11px] font-semibold text-on-surface text-center whitespace-nowrap">Riwayat</span>
            </Link>

            <Link href="/wallet" className="flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-xl hover:bg-surface-container-low transition-colors group">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                <Wallet className="w-4.5 h-4.5" />
              </div>
              <span className="text-[11px] font-semibold text-on-surface text-center whitespace-nowrap">Dompet</span>
            </Link>

            <Link href="/bantuan" className="flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-xl hover:bg-surface-container-low transition-colors group">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                <HelpCircle className="w-4.5 h-4.5" />
              </div>
              <span className="text-[11px] font-semibold text-on-surface text-center whitespace-nowrap">Bantuan</span>
            </Link>
          </div>
        </section>

        {/* ───────────── FEATURED OPPORTUNITY + MINI RADAR MAP ───────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 xl:grid-cols-5 gap-4 md:gap-5"
        >
          {/* Featured Task Card (col-span 3) */}
          <section className="xl:col-span-3 rounded-2xl bg-surface-container-lowest border border-card-border shadow-xs flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 border-b border-card-border bg-surface-container-low flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-tertiary" />
                <h2 className="text-xs font-bold text-on-surface font-headline uppercase tracking-wider">
                  Peluang Terdekat Unggulan
                </h2>
              </div>
              <span className="bg-tertiary-container/50 text-tertiary border border-tertiary/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider font-mono">
                HOT TASK
              </span>
            </div>

            {loading ? (
              <div className="p-6 flex flex-col gap-3" aria-label="Memuat tugas">
                <Skeleton className="h-6 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-1/2 rounded" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ) : featuredTask ? (
              <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between gap-4" aria-live="polite">
                <div>
                  <div className="flex justify-between items-start mb-2 gap-3">
                    <h3 className="text-base sm:text-lg font-extrabold text-on-surface font-headline leading-snug">
                      {featuredTask.title}
                    </h3>
                    <div className="text-sm sm:text-base font-bold text-primary font-mono shrink-0 bg-primary/10 px-3 py-1 rounded-lg border border-primary/20 tabular-nums">
                      {formatCurrency(featuredTask.compensation)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-on-surface-variant text-xs font-semibold mb-2.5">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-primary font-mono tabular-nums">
                      {featuredTask.distance ? `${featuredTask.distance.toFixed(1)} km dari posisimu` : "Area Kampus"}
                    </span>
                  </div>

                  <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                    {featuredTask.description}
                  </p>
                </div>

                <div className="pt-3.5 flex items-center justify-between border-t border-card-border mt-1">
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase text-tertiary font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    Escrow Protected
                  </span>
                  <Link href={`/task/${featuredTask.id_task}`}>
                    <Button variant="primary" size="sm" className="min-h-[38px] text-xs font-bold">
                      Lihat Rincian Tugas
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3">
                <SearchX className="w-10 h-10 text-on-surface-variant/40" />
                <p className="text-xs font-medium text-on-surface-variant">Belum ada tugas terdekat di radius 2km.</p>
                <Link href="/feed">
                  <Button variant="secondary" size="sm">Jelajahi Semua Area</Button>
                </Link>
              </div>
            )}
          </section>

          {/* Mini Radar Map (col-span 2) */}
          <section className="xl:col-span-2 rounded-2xl bg-surface-container-lowest border border-card-border shadow-xs flex flex-col h-64 xl:h-full min-h-[260px] overflow-hidden relative">
            {/* Map Overlay Controls */}
            <div className="absolute top-3 left-3 right-3 z-10 flex justify-between pointer-events-none">
              <div className="bg-surface-container-lowest/95 backdrop-blur border border-card-border shadow-xs rounded-lg px-2.5 py-1.5 flex items-center gap-2 pointer-events-auto">
                <div className="w-2 h-2 rounded-full bg-primary pulse-dot" />
                <span className="text-[11px] font-bold text-on-surface uppercase tracking-wider font-mono tabular-nums">
                  Radar • {nearbyCount} Task
                </span>
              </div>
              <Link
                href="/cari-tugas"
                className="w-8 h-8 bg-surface-container-lowest/95 backdrop-blur border border-card-border rounded-lg shadow-xs flex items-center justify-center text-on-surface-variant pointer-events-auto hover:text-primary transition-colors"
                title="Buka Peta Penuh"
              >
                <Maximize2 className="w-4 h-4" />
              </Link>
            </div>

            {/* Map Component Container */}
            <div className="absolute inset-0 z-0">
              <MapPickerWrapper
                center={{ latitude: coords.latitude, longitude: coords.longitude }}
                tasks={tasks}
                radiusKm={2}
              />
            </div>

            {/* Bottom status badge */}
            <div className="absolute bottom-3 left-3 right-3 z-10 text-center pointer-events-none">
              <span className="inline-block bg-surface-container-lowest/90 backdrop-blur border border-card-border px-3 py-1 rounded-full text-[10px] text-on-surface-variant font-mono font-bold uppercase tracking-wider shadow-xs">
                Radius 5 KM Kampus Aktif
              </span>
            </div>
          </section>
        </motion.div>

        {/* ───────────── INTEGRATED TABBED WORKFLOW PANEL ───────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="bg-surface-container-lowest border border-card-border rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col gap-4 sm:gap-5"
        >
          {/* Tab Header - Clean Single-Row Alignment on Mobile */}
          <div className="flex items-center justify-between gap-2 border-b border-card-border/80 pb-3">
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as "recommendations" | "activity")}
              variant="pill"
            >
              <TabsList className="w-fit flex-nowrap p-0.5">
                <TabsTrigger value="recommendations" className="px-2.5 sm:px-3.5 py-1.5 text-xs">
                  Rekomendasi <span className="font-mono text-[11px] opacity-75">({recommendedTasks.length})</span>
                </TabsTrigger>
                <TabsTrigger value="activity" className="px-2.5 sm:px-3.5 py-1.5 text-xs">
                  Aktivitas <span className="font-mono text-[11px] opacity-75">({myActiveTasks.length})</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Link
              href={activeTab === "recommendations" ? "/feed" : "/history/riwayat"}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 shrink-0"
            >
              <span className="hidden sm:inline">Lihat Semua</span>
              <span className="sm:hidden">Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Tab Content Panels */}
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === "recommendations" ? (
              <motion.div
                key="recommendations"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  "grid gap-4 pt-1",
                  recommendedTasks.length === 1
                    ? "grid-cols-1 max-w-md"
                    : recommendedTasks.length === 2
                    ? "grid-cols-1 sm:grid-cols-2 max-w-3xl"
                    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                )}
                id="panel-recommendations"
                role="tabpanel"
                aria-labelledby="tab-recommendations"
              >
                {recommendedTasks.slice(0, 3).map((task) => (
                  <Link key={task.id_task} href={`/task/${task.id_task}`}>
                    <div className="group bg-surface-container-low/60 border border-card-border/80 rounded-xl p-4 hover:border-primary/40 hover:bg-surface-container-low transition-all duration-200 cursor-pointer flex flex-col justify-between h-full gap-3 shadow-xs min-h-[145px]">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h4 className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors duration-150 line-clamp-2 leading-snug">
                            {task.title}
                          </h4>
                          <span className="text-xs font-mono font-bold text-primary shrink-0 bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20 tabular-nums">
                            {formatCurrency(task.compensation)}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed font-body-sm">
                          {task.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-on-surface-variant pt-3 border-t border-card-border/60 font-mono">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Store className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
                          {task.requester_name || "UMKM"}
                        </span>
                        <span className="flex items-center gap-1 text-primary font-bold tabular-nums">
                          <Footprints className="w-3.5 h-3.5 shrink-0" />
                          {task.distance ? `${task.distance.toFixed(1)} km` : "Dekat"}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}

                {recommendedTasks.length === 0 && (
                  <div className="col-span-full py-10 flex flex-col items-center justify-center text-center gap-2">
                    <SearchX className="w-8 h-8 text-on-surface-variant/40" />
                    <p className="text-xs font-medium text-on-surface-variant">Belum ada rekomendasi tugas saat ini.</p>
                    <Link href="/feed">
                      <Button variant="secondary" size="sm">Buka Feed Tugas</Button>
                    </Link>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="activity"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="space-y-3 pt-1"
                id="panel-activity"
                role="tabpanel"
                aria-labelledby="tab-activity"
              >
                {myActiveTasks.length > 0 ? (
                  <div className={cn(
                    "grid gap-3.5",
                    myActiveTasks.length === 1 ? "grid-cols-1 max-w-md" : "grid-cols-1 md:grid-cols-2"
                  )}>
                    {myActiveTasks.slice(0, 4).map((app) => {
                      const statusName = app.application_status || "Pending";
                      const statusColor =
                        statusName === "accepted"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : statusName === "rejected"
                          ? "bg-error-container text-error border-error/30"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";

                      return (
                        <Link key={app.id_task_applicants} href={`/task/${app.id_tasks}`}>
                          <div className="group bg-surface-container-low/60 border border-card-border/80 rounded-xl p-4 hover:border-primary/40 hover:bg-surface-container-low transition-all duration-200 cursor-pointer flex flex-col gap-3 shadow-xs">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors duration-150 line-clamp-2 leading-snug flex-1">
                                {app.judul_tugas || "Tugas"}
                              </h4>
                              <span className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 border font-mono", statusColor)}>
                                {statusName}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-on-surface-variant font-mono">
                              <span className="flex items-center gap-1.5 font-medium">
                                <User className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
                                {app.requester?.nama_lengkap || "Pemberi Kerja"}
                              </span>
                              <span className="font-mono font-bold text-primary tabular-nums">
                                {app.kompensasi ? formatCurrency(app.kompensasi) : "-"}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-surface-container-low/40 border border-card-border rounded-xl p-8 flex flex-col items-center justify-center text-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-on-surface-variant/40" />
                    <p className="text-xs font-bold text-on-surface">Belum ada aktivitas tugas berjalan</p>
                    <p className="text-xs text-on-surface-variant max-w-xs leading-relaxed">
                      {role === "worker"
                        ? "Ambil tugas terdekat di sekitarmu untuk mulai mengumpulkan poin."
                        : "Post tugas baru untuk menemukan mahasiswa yang siap membantu."}
                    </p>
                    {role === "worker" ? (
                      <Link href="/feed" className="mt-1">
                        <Button variant="primary" size="sm">Cari Tugas Sekarang</Button>
                      </Link>
                    ) : (
                      <Link href="/task/new" className="mt-1">
                        <Button variant="primary" size="sm">Post Tugas Pertama</Button>
                      </Link>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Trust Indicator */}
          <div className="pt-4 flex items-center justify-center gap-2 text-on-surface-variant text-xs font-mono border-t border-card-border mt-2">
            <ShieldCheck className="w-4 h-4 text-tertiary" />
            <span>Semua transaksi dilindungi sistem Escrow CEPAT • SDG 8</span>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
