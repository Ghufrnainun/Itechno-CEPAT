"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useCurrentRole } from "@/app/(main)/layout";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/utils/format";
import MapPickerWrapper from "@/features/task/components/MapPickerWrapper";
import {
  Wallet,
  ChevronRight,
  CheckCircle2,
  Briefcase,
  PlusSquare,
  Compass,
  MapPin,
  Maximize2,
  Store,
  Footprints,
  SearchX,
  Plus,
  Search,
  ArrowRight,
  Sparkles,
  Calendar,
  Trophy,
  Flame,
  Clock,
  Bookmark,
  History,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePwaInstall } from "@/hooks/usePwaInstall";

export default function DashboardPage() {
  const { role, user, toggleRole } = useCurrentRole();
  const { coords } = useGeolocation();
  const { canInstall, promptInstall } = usePwaInstall();

  const [tasks, setTasks] = useState<any[]>([]);
  const [recommendedTasks, setRecommendedTasks] = useState<any[]>([]);
  const [featuredTask, setFeaturedTask] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [myActiveTasks, setMyActiveTasks] = useState<any[]>([]);
  const [scheduledCount, setScheduledCount] = useState<number>(0);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    async function loadData() {
      if (!hasLoadedOnce.current) {
        setLoading(true);
      }
      try {
        const mapUrl = new URL("/api/tasks/nearby", window.location.origin);
        mapUrl.searchParams.append("lat", coords.latitude.toString());
        mapUrl.searchParams.append("lng", coords.longitude.toString());
        mapUrl.searchParams.append("radius", "5000");

        const feedUrl = new URL("/api/tasks/feed", window.location.origin);
        feedUrl.searchParams.append("lat", coords.latitude.toString());
        feedUrl.searchParams.append("lng", coords.longitude.toString());
        feedUrl.searchParams.append("limit", "6");
        feedUrl.searchParams.append("sort", "distance_asc");

        const [mapRes, feedRes, activityRes, schedRes] = await Promise.all([
          fetch(mapUrl.toString(), { cache: "no-store" }),
          fetch(feedUrl.toString(), { cache: "no-store" }),
          fetch("/api/users/me/tasks?role=worker", { cache: "no-store" }),
          fetch("/api/tasks/scheduled", { cache: "no-store" }).catch(() => null),
        ]);

        if (mapRes.ok) {
          const mapJson = await mapRes.json().catch(() => ({}));
          setTasks(mapJson.data || []);
        }

        if (feedRes.ok) {
          const feedJson = await feedRes.json().catch(() => ({}));
          if (feedJson.data && feedJson.data.length > 0) {
            setFeaturedTask(feedJson.data[0]);
            setRecommendedTasks(feedJson.data.slice(1, 5));
          }
        }

        if (activityRes.ok) {
          const activityJson = await activityRes.json().catch(() => ({}));
          if (activityJson.success && Array.isArray(activityJson.data)) {
            setMyActiveTasks(activityJson.data);
          }
        }

        if (schedRes && schedRes.ok) {
          const schedJson = await schedRes.json().catch(() => ({}));
          if (schedJson.success && Array.isArray(schedJson.data)) {
            setScheduledCount(schedJson.data.length);
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

  return (
    <div className="flex flex-col h-full bg-surface font-sans min-h-screen">
      {/* ───────────── HEADER ───────────── */}
      <header className="page-header bg-surface-container-lowest border-b border-card-border px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex flex-row items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider border border-primary/20 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              {getGreeting()}
            </span>
            <span className="text-on-surface-variant text-xs">•</span>
            <span className="text-[11px] sm:text-xs font-semibold text-on-surface-variant font-mono">
              Area Kampus
            </span>
          </div>

          <h1 className="font-headline font-extrabold text-xl sm:text-3xl text-on-surface tracking-tight">
            Halo, {userName} 👋
          </h1>
          <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant mt-0.5 hidden sm:block">
            {role === "worker" ? (
              <>
                Tersedia <span className="font-bold text-primary font-mono tabular-nums">{nearbyCount} tugas mikro</span> di sekitarmu hari ini.
              </>
            ) : (
              <>
                Mode <span className="font-bold text-primary">Pemberi Tugas</span> aktif. Buat tugas baru dan delegasikan dengan aman.
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {canInstall && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => promptInstall()}
              icon={<Download className="w-3.5 h-3.5 text-primary" />}
              className="min-h-[38px] sm:min-h-[44px] text-xs font-bold px-3 sm:px-4 shadow-2xs border-primary/30 hover:border-primary text-primary hover:bg-primary/5"
            >
              <span className="hidden sm:inline">Pasang Aplikasi</span>
              <span className="sm:hidden">Pasang App</span>
            </Button>
          )}

          {role === "requester" ? (
            <Link href="/task/new">
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                className="min-h-[38px] sm:min-h-[44px] text-xs font-bold px-3.5 sm:px-5 shadow-xs"
              >
                Post Tugas Baru
              </Button>
            </Link>
          ) : (
            <Link href="/cari-tugas">
              <Button
                variant="primary"
                size="sm"
                icon={<Search className="w-3.5 h-3.5" />}
                className="min-h-[38px] sm:min-h-[44px] text-xs font-bold px-3.5 sm:px-5 shadow-xs"
              >
                Cari Tugas
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* ───────────── MAIN CONTENT ───────────── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6 pb-28 lg:pb-12">
        {/* Mobile Role Switcher */}
        <section className="lg:hidden">
          <div className="bg-surface-container-low border border-card-border rounded-xl p-1 flex relative shadow-2xs">
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

          {/* Mobile Quick Action Strip (Gojek/Grab style 5 items) */}
          <div className="grid grid-cols-5 gap-2 mt-3 p-3 bg-surface-container-lowest border border-card-border rounded-2xl shadow-xs">
            <Link
              href="/schedule"
              className="flex flex-col items-center gap-1.5 p-1 text-center hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-2xs">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-on-surface leading-tight">Jadwal</span>
            </Link>

            <Link
              href="/leaderboard"
              className="flex flex-col items-center gap-1.5 p-1 text-center hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shadow-2xs">
                <Trophy className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-on-surface leading-tight">Peringkat</span>
            </Link>

            <Link
              href="/saved"
              className="flex flex-col items-center gap-1.5 p-1 text-center hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 rounded-xl bg-secondary-container/50 text-secondary flex items-center justify-center shadow-2xs">
                <Bookmark className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-on-surface leading-tight">Tersimpan</span>
            </Link>

            <Link
              href="/history/riwayat"
              className="flex flex-col items-center gap-1.5 p-1 text-center hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 rounded-xl bg-surface-container text-on-surface-variant flex items-center justify-center shadow-2xs">
                <History className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-on-surface leading-tight">Riwayat</span>
            </Link>

            <Link
              href="/wallet"
              className="flex flex-col items-center gap-1.5 p-1 text-center hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shadow-2xs">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-on-surface leading-tight">Dompet</span>
            </Link>
          </div>
        </section>

        {/* ───────────── ESSENTIAL OVERVIEW (2 Clean Cards) ───────────── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Saldo Utama */}
          <div className="rounded-2xl bg-surface-container-lowest border border-card-border p-5 flex flex-col justify-between shadow-xs hover:border-primary/40 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-on-surface-variant">
                Saldo Tersedia
              </span>
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Wallet className="w-4 h-4" />
              </div>
            </div>

            {loading ? (
              <Skeleton className="h-10 w-2/3 rounded-lg mb-4" />
            ) : (
              <div className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight font-mono tabular-nums mb-3">
                Rp {(user?.total_balance ?? 0).toLocaleString("id-ID")}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-card-border/80">
              <span className="text-xs text-on-surface-variant font-medium">
                Dapat langsung ditarik atau digunakan
              </span>
              <Link
                href="/wallet"
                className="text-xs text-primary font-bold hover:underline flex items-center gap-1 font-mono"
              >
                Buka Dompet <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: Status Pekerjaan Aktif */}
          <div className="rounded-2xl bg-surface-container-lowest border border-card-border p-5 flex flex-col justify-between shadow-xs hover:border-primary/40 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-on-surface-variant">
                {role === "worker" ? "Aktivitas Tugas Berjalan" : "Tugas Diposting"}
              </span>
              <div className="p-2 rounded-xl bg-secondary-container/40 text-secondary">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-3">
              <div className="text-3xl sm:text-4xl font-extrabold text-on-surface font-mono tracking-tight tabular-nums">
                {myActiveTasks.length}
              </div>
              <span className="text-xs font-semibold text-on-surface-variant">
                {myActiveTasks.length > 0 ? "tugas dalam proses" : "tugas aktif"}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-card-border/80">
              <span className="text-xs text-on-surface-variant font-medium">
                {myActiveTasks.length > 0
                  ? "Cek status perkembangan tugasmu"
                  : "Belum ada pekerjaan aktif saat ini"}
              </span>
              {role === "worker" ? (
                <Link
                  href="/cari-tugas"
                  className="text-xs text-primary font-bold hover:underline flex items-center gap-1 font-mono"
                >
                  Ambil Tugas <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <Link
                  href="/tugas"
                  className="text-xs text-primary font-bold hover:underline flex items-center gap-1 font-mono"
                >
                  Kelola <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* ───────────── NEARBY OPPORTUNITIES + RADAR MAP ───────────── */}
        <section className="grid grid-cols-1 xl:grid-cols-5 gap-4 md:gap-5">
          {/* Featured Task Card (col-span 3) */}
          <div className="xl:col-span-3 rounded-2xl bg-surface-container-lowest border border-card-border shadow-xs flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 border-b border-card-border bg-surface-container-low flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-primary" />
                <h2 className="text-xs font-bold text-on-surface font-headline uppercase tracking-wider">
                  Peluang Terdekat Unggulan
                </h2>
              </div>
              <Link href="/cari-tugas" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="p-6 flex flex-col gap-3">
                <Skeleton className="h-6 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-1/2 rounded" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ) : featuredTask ? (
              <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between gap-4">
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
                      {featuredTask.distance
                        ? `${featuredTask.distance.toFixed(1)} km dari posisimu`
                        : "Area Kampus"}
                    </span>
                  </div>

                  <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                    {featuredTask.description}
                  </p>
                </div>

                <div className="pt-3.5 flex items-center justify-between border-t border-card-border mt-1">
                  <span className="text-xs text-on-surface-variant font-medium flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-on-surface-variant" />
                    {featuredTask.requester_name || "UMKM Sekitar"}
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
                <Link href="/cari-tugas">
                  <Button variant="secondary" size="sm">
                    Jelajahi Semua Area
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mini Radar Map (col-span 2) */}
          <div className="xl:col-span-2 rounded-2xl bg-surface-container-lowest border border-card-border shadow-xs flex flex-col h-64 xl:h-full min-h-[260px] overflow-hidden relative">
            <div className="absolute top-3 left-3 right-3 z-10 flex justify-between pointer-events-none">
              <div className="bg-surface-container-lowest/95 backdrop-blur border border-card-border shadow-xs rounded-lg px-2.5 py-1.5 flex items-center gap-2 pointer-events-auto">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-[11px] font-bold text-on-surface uppercase tracking-wider font-mono tabular-nums">
                  Radar • {nearbyCount} Tugas
                </span>
              </div>
              <Link
                href="/cari-tugas?view=map"
                className="w-8 h-8 bg-surface-container-lowest/95 backdrop-blur border border-card-border rounded-lg shadow-xs flex items-center justify-center text-on-surface-variant pointer-events-auto hover:text-primary transition-colors"
                title="Buka Peta Penuh"
              >
                <Maximize2 className="w-4 h-4" />
              </Link>
            </div>

            <div className="absolute inset-0 z-0">
              <MapPickerWrapper
                center={{ latitude: coords.latitude, longitude: coords.longitude }}
                tasks={tasks}
                radiusKm={5}
              />
            </div>

            <div className="absolute bottom-3 left-3 right-3 z-10 text-center pointer-events-none">
              <Link
                href="/cari-tugas?view=map"
                className="pointer-events-auto inline-block bg-surface-container-lowest/95 backdrop-blur border border-card-border px-3 py-1.5 rounded-xl text-xs font-bold text-primary shadow-xs hover:bg-surface-container-low transition-colors"
              >
                Buka Peta Penuh →
              </Link>
            </div>
          </div>
        </section>

        {/* ───────────── SECONDARY FEATURE WIDGETS: JADWAL & LEADERBOARD ───────────── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Widget 1: Jadwal & Agenda */}
          <Link
            href="/schedule"
            className="group rounded-2xl bg-surface-container-lowest border border-card-border p-5 shadow-xs hover:border-primary/40 transition-all flex items-center justify-between gap-4 cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-sm text-on-surface group-hover:text-primary transition-colors flex items-center gap-1.5">
                  Jadwal & Agenda Tugas
                  <span className="font-mono text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                    {scheduledCount} Agenda
                  </span>
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Pantau kalender jadwal pengerjaan dan deadline tugas aktif.
                </p>
              </div>
            </div>
            <div className="p-2 rounded-lg text-on-surface-variant group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0">
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Widget 2: Peringkat & Streak */}
          <Link
            href="/leaderboard"
            className="group rounded-2xl bg-surface-container-lowest border border-card-border p-5 shadow-xs hover:border-primary/40 transition-all flex items-center justify-between gap-4 cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-sm text-on-surface group-hover:text-amber-600 transition-colors flex items-center gap-1.5">
                  Papan Peringkat & Streak
                  <span className="font-mono text-[10px] font-bold bg-amber-500/10 text-amber-700 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                    <Flame className="w-3 h-3 text-amber-500" /> XP Bulanan
                  </span>
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Lihat top worker berprestasi dan jaga streak harianmu.
                </p>
              </div>
            </div>
            <div className="p-2 rounded-lg text-on-surface-variant group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0">
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </section>

        {/* ───────────── MORE NEARBY TASKS (Grid) ───────────── */}
        {recommendedTasks.length > 0 && (
          <section className="bg-surface-container-lowest border border-card-border rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-card-border/80 pb-3">
              <h3 className="font-headline text-sm font-bold text-on-surface">
                Tugas Lainnya di Sekitar Kampus
              </h3>
              <Link href="/cari-tugas" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                <span>Lihat Semua ({tasks.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {recommendedTasks.slice(0, 3).map((task) => (
                <Link key={task.id_task} href={`/task/${task.id_task}`}>
                  <div className="group bg-surface-container-low/60 border border-card-border/80 rounded-xl p-4 hover:border-primary/40 hover:bg-surface-container-low transition-all duration-150 cursor-pointer flex flex-col justify-between h-full gap-3 shadow-2xs min-h-[140px]">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <h4 className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {task.title}
                        </h4>
                        <span className="text-xs font-mono font-bold text-primary shrink-0 bg-primary/10 px-2.5 py-0.5 rounded-lg border border-primary/20 tabular-nums">
                          {formatCurrency(task.compensation)}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-on-surface-variant pt-2.5 border-t border-card-border/60 font-mono">
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
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
