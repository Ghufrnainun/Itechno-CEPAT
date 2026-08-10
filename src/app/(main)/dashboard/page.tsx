"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useCurrentRole } from "@/app/(main)/layout";
import { getNearbyTasks } from "@/lib/supabase/queries/tasks";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Task } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils/format";
import MapPickerWrapper from "@/features/task/components/MapPickerWrapper";

export default function DashboardPage() {
  const { role, user, toggleRole } = useCurrentRole();
  const { coords } = useGeolocation();

  const [tasks, setTasks] = useState<any[]>([]); // Lightweight tasks for map
  const [recommendedTasks, setRecommendedTasks] = useState<any[]>([]); // Recommendations based on skills
  const [featuredTask, setFeaturedTask] = useState<any | null>(null); // Rich task for featured card
  const [escrowAmount, setEscrowAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"activity" | "recommendations">("recommendations");
  const [myActiveTasks, setMyActiveTasks] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    async function loadData() {
      // Only show full loading skeleton on first load.
      // Subsequent geo-updates silently refresh in the background.
      if (!hasLoadedOnce.current) {
        setLoading(true);
      }
      try {
        // 1. Fetch lightweight tasks for the mini-map
        const mapUrl = new URL('/api/tasks/nearby', window.location.origin);
        mapUrl.searchParams.append('lat', coords.latitude.toString());
        mapUrl.searchParams.append('lng', coords.longitude.toString());
        mapUrl.searchParams.append('radius', '5000'); // 5km
        
        const mapRes = await fetch(mapUrl.toString(), { cache: 'no-store' });
        if (mapRes.ok) {
          const mapJson = await mapRes.json();
          setTasks(mapJson.data || []);
        }

        // 2. Fetch 1 featured task with rich data from the feed API
        const feedUrl = new URL('/api/tasks/feed', window.location.origin);
        feedUrl.searchParams.append('lat', coords.latitude.toString());
        feedUrl.searchParams.append('lng', coords.longitude.toString());
        feedUrl.searchParams.append('limit', '1');
        feedUrl.searchParams.append('sort', 'distance_asc');

        const feedRes = await fetch(feedUrl.toString(), { cache: 'no-store' });
        if (feedRes.ok) {
          const feedJson = await feedRes.json();
          if (feedJson.data && feedJson.data.length > 0) {
            setFeaturedTask(feedJson.data[0]);
          }
        }

        const recUrl = new URL('/api/tasks/feed', window.location.origin);
        recUrl.searchParams.append('lat', coords.latitude.toString());
        recUrl.searchParams.append('lng', coords.longitude.toString());
        recUrl.searchParams.append('limit', '3');
        recUrl.searchParams.append('sort', 'newest');

        const recRes = await fetch(recUrl.toString(), { cache: 'no-store' });
        if (recRes.ok) {
           const recJson = await recRes.json();
           if (recJson.data) {
             setRecommendedTasks(recJson.data);
           }
        }

        // 3. Fetch escrow amount
        const escrowRes = await fetch('/api/wallet/escrow', { cache: 'no-store' });
        if (escrowRes.ok) {
          const escrowJson = await escrowRes.json();
          if (escrowJson.success && escrowJson.data) {
            setEscrowAmount(escrowJson.data.escrow_amount);
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

  // Fetch user's active task applications when switching to activity tab
  useEffect(() => {
    if (activeTab !== "activity" || myActiveTasks.length > 0) return;
    async function loadMyTasks() {
      setLoadingActivity(true);
      try {
        const res = await fetch('/api/users/me/tasks?role=worker', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setMyActiveTasks(json.data);
          }
        }
      } catch (err) {
        console.error("Failed to load activity:", err);
      } finally {
        setLoadingActivity(false);
      }
    }
    loadMyTasks();
  }, [activeTab]);

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
    <div className="flex flex-col h-full bg-layout-bg font-sans transition-colors duration-300">
      {/* Clean White Header */}
      <header className="page-header bg-surface-container-lowest border-b border-outline-variant/30 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight">
            {getGreeting()}, {userName} 👋
          </h1>
          <p className="font-body-sm text-sm text-on-surface-variant mt-0.5">
            {role === "worker" ? (
              <>
                Ada <span className="font-bold text-primary">{nearbyCount} tugas dekat kampus</span> yang bisa kamu ambil hari ini.
              </>
            ) : (
              <>
                Kamu dalam mode <span className="font-bold text-primary">Pemberi Kerja</span>. Post bantuan cepat untuk UMKM atau kegiatanmu.
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {role === "requester" ? (
            <Link href="/task/new">
              <Button variant="primary" size="md" className="font-bold">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
                Post Tugas Baru
              </Button>
            </Link>
          ) : (
            <Link href="/feed">
              <Button variant="primary" size="md" className="font-bold">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">search</span>
                Cari Tugas Terdekat
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Scrollable Main Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-8 flex flex-col gap-6">

        {/* ───────────── ASYMMETRIC BENTO STATS GRID (12 Columns) ───────────── */}
        <section className="grid grid-cols-12 gap-4 md:gap-5">
          {/* Card 1 — Saldo Poin (Featured, Tall: col-span-12 lg:col-span-5) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="col-span-12 lg:col-span-5 p-1 md:p-1.5 rounded-xl bg-black/[0.02] ring-1 ring-black/5 shadow-xs hover:-translate-y-1 hover:shadow-md active:scale-[0.98] transition-all"
          >
            <div className="h-full rounded-lg border border-primary/20 bg-primary/5 p-5 flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between mb-4 text-primary font-bold">
                <span className="text-xs font-mono uppercase tracking-wider">Saldo Poin Utama</span>
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">account_balance_wallet</span>
                </div>
              </div>

              {loading ? (
                <div className="h-12 bg-primary/10 rounded animate-pulse w-3/4 mb-4" aria-label="Memuat saldo" />
              ) : (
                <div aria-live="polite">
                  <div className="text-4xl md:text-5xl font-extrabold text-on-surface font-mono tracking-tight mb-2 flex items-center gap-2">
                    {user?.total_balance ? formatCurrency(user.total_balance).replace('Rp', '') : '-'} <span className="text-sm font-sans font-bold text-on-surface-variant">pts</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-primary font-bold flex items-center gap-1.5 bg-white px-2.5 py-1 rounded border border-primary/10 shadow-2xs">
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">trending_up</span>
                      Lihat riwayat
                    </div>
                    <Link href="/wallet" className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5">
                      Detail <span className="material-symbols-outlined text-[14px]" aria-hidden="true">chevron_right</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Card 2 — Rating (col-span-6 lg:col-span-3) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="col-span-6 lg:col-span-3 p-1 md:p-1.5 rounded-xl bg-black/[0.02] ring-1 ring-black/5 shadow-xs hover:-translate-y-1 hover:shadow-md active:scale-[0.98] transition-all"
          >
            <div className="h-full rounded-lg border border-outline-variant/60 bg-white p-4 md:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3 text-on-surface-variant font-bold">
                <span className="text-xs font-mono uppercase tracking-wider">Rating</span>
                <span
                  className="material-symbols-outlined text-[20px] text-amber-500"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                 aria-hidden="true">
                  star
                </span>
              </div>
              {loading ? (
                <div className="h-8 bg-surface-container-high rounded animate-pulse w-1/2" aria-label="Memuat rating" />
              ) : (
                <div aria-live="polite">
                  <div className="text-3xl font-extrabold text-on-surface font-mono tracking-tight flex items-center gap-2">
                    {user?.rating_avg ?? 0} <span className="text-sm text-tertiary font-sans">/ 5.0</span>
                  </div>
                  <div className="text-xs text-on-surface-variant mt-1.5 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    Dari {totalCompleted} task selesai
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Card 3 — Task Selesai (col-span-6 lg:col-span-4) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="col-span-6 lg:col-span-4 p-1 md:p-1.5 rounded-xl bg-black/[0.02] ring-1 ring-black/5 shadow-xs hover:-translate-y-1 hover:shadow-md active:scale-[0.98] transition-all"
          >
            <div className="h-full rounded-lg border border-secondary-container/50 bg-secondary-fixed/30 p-4 md:p-5 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-on-secondary-fixed opacity-10 pointer-events-none">
                <span className="material-symbols-outlined text-[80px]" aria-hidden="true">task_alt</span>
              </div>
              <div className="flex items-center justify-between mb-3 text-on-secondary-fixed font-bold relative z-10">
                <span className="text-xs font-mono uppercase tracking-wider">Task Selesai</span>
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">task_alt</span>
              </div>
              {loading ? (
                <div className="h-8 bg-secondary-container rounded animate-pulse w-1/2" aria-label="Memuat task selesai" />
              ) : (
                <div className="relative z-10" aria-live="polite">
                  <div className="text-3xl font-extrabold text-on-surface font-mono tracking-tight flex flex-wrap items-center gap-2">
                    {totalCompleted} <span className="text-xs text-on-secondary-fixed/80 font-sans font-bold">tugas</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Card 4 — Dana Ditahan / Escrow (col-span-12) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="col-span-12 p-1 md:p-1.5 rounded-xl bg-black/[0.02] ring-1 ring-black/5 shadow-xs hover:-translate-y-1 hover:shadow-md active:scale-[0.98] transition-all"
          >
            <div className="h-full rounded-lg border border-tertiary-container bg-tertiary-fixed p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-tertiary/10 flex items-center justify-center text-tertiary shrink-0">
                  <span className="material-symbols-outlined text-[22px]" aria-hidden="true">lock_clock</span>
                </div>
                <div>
                  <div className="text-xs font-mono text-tertiary font-bold uppercase tracking-wider">
                    Dana Terkunci Escrow
                  </div>
                  <div className="text-2xl font-extrabold text-on-surface font-mono tracking-tight mt-0.5 flex flex-wrap items-center gap-2">
                    {formatCurrency(escrowAmount || 0)}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-tertiary-container pt-2 sm:pt-0">
                <span className="text-xs text-on-tertiary-fixed font-medium hidden md:inline">
                  Aman di Escrow hingga task disetujui
                </span>
                <Link href="/wallet" className="px-3.5 py-1.5 text-xs font-bold text-on-tertiary bg-tertiary rounded hover:bg-tertiary/90 transition-colors cursor-pointer shadow-2xs">
                  Lihat Status
                </Link>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ───────────── ROLE SWITCHER (MOBILE ONLY) ───────────── */}
        <section className="lg:hidden">
          <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-1 flex relative shadow-xs">
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary rounded-lg transition-transform duration-300 ease-out shadow-sm"
              style={{
                transform: role === "worker" ? "translateX(0)" : "translateX(calc(100% + 8px))",
              }}
            />
            <button
              onClick={() => role !== "worker" && toggleRole()}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-[13px] font-bold z-10 transition-colors ${
                role === "worker" ? "text-on-primary" : "text-on-surface hover:bg-black/5"
              } rounded-lg`}
            >
              <span className="material-symbols-outlined text-[18px]">handyman</span>
              Pekerja
            </button>
            <button
              onClick={() => role !== "requester" && toggleRole()}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-[13px] font-bold z-10 transition-colors ${
                role === "requester" ? "text-on-primary" : "text-on-surface hover:bg-black/5"
              } rounded-lg`}
            >
              <span className="material-symbols-outlined text-[18px]">work</span>
              Pemberi
            </button>
          </div>
        </section>

        {/* ───────────── QUICK LINKS (MOBILE ONLY) ───────────── */}
        <section className="lg:hidden grid grid-cols-2 sm:grid-cols-4 gap-3">
          {role === "requester" ? (
            <Link href="/task/new" className="bg-white border border-outline-variant/60 rounded-xl p-3 flex flex-col items-center justify-center gap-2 shadow-xs hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">add_box</span>
              </div>
              <span className="text-[11px] font-bold text-on-surface text-center leading-tight">Post Tugas</span>
            </Link>
          ) : (
            <Link href="/cari-tugas" className="bg-white border border-outline-variant/60 rounded-xl p-3 flex flex-col items-center justify-center gap-2 shadow-xs hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">explore</span>
              </div>
              <span className="text-[11px] font-bold text-on-surface text-center leading-tight">Cari Tugas</span>
            </Link>
          )}
          <Link href="/history/riwayat" className="bg-white border border-outline-variant/60 rounded-xl p-3 flex flex-col items-center justify-center gap-2 shadow-xs hover:border-primary/40 transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">history</span>
            </div>
            <span className="text-[11px] font-bold text-on-surface text-center leading-tight">Riwayat</span>
          </Link>
          <Link href="/wallet" className="bg-white border border-outline-variant/60 rounded-xl p-3 flex flex-col items-center justify-center gap-2 shadow-xs hover:border-primary/40 transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </div>
            <span className="text-[11px] font-bold text-on-surface text-center leading-tight">Dompet</span>
          </Link>
          <Link href="/bantuan" className="bg-white border border-outline-variant/60 rounded-xl p-3 flex flex-col items-center justify-center gap-2 shadow-xs hover:border-primary/40 transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">help</span>
            </div>
            <span className="text-[11px] font-bold text-on-surface text-center leading-tight">Bantuan</span>
          </Link>
        </section>

        {/* ───────────── FEATURED TASK + PROMOTED MAP ───────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-1 xl:grid-cols-5 gap-4 md:gap-6"
        >
          {/* Featured Task Card (col-span 3) */}
          <section className="xl:col-span-3 p-1.5 md:p-2 rounded-xl bg-black/[0.02] ring-1 ring-black/5 shadow-xs flex flex-col">
            <div className="h-full rounded-lg border border-white/60 bg-white flex flex-col overflow-hidden shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.02)]">
              <div className="px-5 py-4 border-b border-outline-variant/60 bg-surface-container-lowest flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary text-[18px]" aria-hidden="true">local_fire_department</span>
                  <h2 className="text-sm font-bold text-on-surface">Peluang Utama Sekitar</h2>
                </div>
                <span className="bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary-container text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider">
                  HOT TASK
                </span>
              </div>

              {loading ? (
                <div className="p-6 flex flex-col sm:flex-row gap-6 items-center" aria-label="Memuat tugas">
                  <div className="w-full sm:w-2/5 h-36 bg-surface-container-high rounded-lg animate-pulse" />
                  <div className="flex-1 space-y-3 w-full">
                    <div className="h-6 bg-surface-container-high rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-surface-container-high rounded animate-pulse w-1/2" />
                    <div className="h-12 bg-surface-container-high rounded animate-pulse w-full" />
                  </div>
                </div>
              ) : featuredTask ? (
                <div className="flex-1 p-5 md:p-6 flex flex-col sm:flex-row gap-5" aria-live="polite">
                  {/* Task Image removed as requested */}

                  {/* Task Details */}
                  <div className="flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex justify-between items-start mb-1.5 gap-2">
                        <h3 className="text-lg font-extrabold text-on-surface leading-snug">
                          {featuredTask.title}
                        </h3>
                        <div className="text-base font-bold text-primary font-mono shrink-0 bg-primary/5 px-2.5 py-1 rounded border border-primary/10">
                          {formatCurrency(featuredTask.compensation)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-on-surface-variant text-xs font-semibold mb-2">
                        <span className="material-symbols-outlined text-[15px] text-primary" aria-hidden="true">location_on</span>
                        <span className="text-primary font-mono">
                          {featuredTask.distance ? `${featuredTask.distance.toFixed(1)} km dari posisi` : "~"}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                        {featuredTask.description}
                      </p>
                    </div>

                    <div className="pt-3 flex items-center justify-between border-t border-outline-variant/40 mt-1">
                      <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase text-on-surface-variant font-bold">
                        <span className="material-symbols-outlined text-[16px] text-tertiary" aria-hidden="true">shield</span>
                        Escrow Protected
                      </span>
                      <Link href={`/task/${featuredTask.id_task}`}>
                        <Button variant="primary" size="sm" className="font-bold px-4">
                          Lihat Detail
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3">
                  <span className="material-symbols-outlined text-[48px] text-outline-variant/40" aria-hidden="true">location_off</span>
                  <p className="text-sm text-on-surface-variant font-medium">Tidak ada tugas terdekat di radius 2km.</p>
                  <Link href="/feed">
                    <Button variant="secondary" size="sm">Jelajahi Semua Area</Button>
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* Mini Map (col-span 2) */}
          <section className="xl:col-span-2 p-1.5 md:p-2 rounded-xl bg-black/[0.02] ring-1 ring-black/5 shadow-xs flex flex-col h-72 xl:h-full min-h-[280px]">
            <div className="h-full rounded-lg border border-white/60 bg-interaction-bg overflow-hidden relative shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.02)]">
              {/* Overlay controls */}
              <div className="absolute top-3 left-3 right-3 z-10 flex justify-between pointer-events-none">
                <div className="bg-white border border-outline-variant shadow-2xs rounded px-3 py-2 flex items-center gap-2 pointer-events-auto">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary pulse-dot" />
                  <span className="text-xs font-bold text-on-surface uppercase tracking-wider font-mono">
                    Radar • {nearbyCount} Task
                  </span>
                </div>
                <Link
                  href="/feed?view=map"
                  className="w-8 h-8 bg-white/95 backdrop-blur border border-outline-variant rounded shadow-2xs flex items-center justify-center text-on-surface-variant pointer-events-auto hover:text-primary transition-colors"
                  title="Buka Peta Penuh"
                >
                  <span className="material-symbols-outlined text-[16px]" aria-hidden="true">open_in_full</span>
                </Link>
              </div>

              {/* Map Component */}
              <div className="absolute inset-0 z-0">
                <MapPickerWrapper
                  center={{ latitude: coords.latitude, longitude: coords.longitude }}
                  tasks={tasks}
                  radiusKm={2}
                />
              </div>

              {/* Bottom indicator */}
              <div className="absolute bottom-3 left-3 right-3 z-10 text-center pointer-events-none">
                <span className="inline-block bg-white border border-outline-variant/60 px-3 py-1.5 rounded text-xs text-on-surface-variant font-mono font-bold uppercase tracking-wider shadow-2xs">
                  Radius 2 KM Terdeteksi
                </span>
              </div>
            </div>
          </section>
        </motion.div>

        {/* ───────────── INTEGRATED TABBED PANEL (Aktivitas vs Rekomendasi) ───────────── */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white border border-outline-variant/60 rounded-xl p-5 shadow-2xs flex flex-col gap-4"
        >
          {/* Tab Header */}
          <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3" role="tablist">
            <div className="flex items-center gap-4">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "recommendations"}
                aria-controls="panel-recommendations"
                id="tab-recommendations"
                onClick={() => setActiveTab("recommendations")}
                className={`text-sm font-bold pb-1 transition-all cursor-pointer relative ${
                  activeTab === "recommendations" ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Rekomendasi Tugas ({recommendedTasks.length})
                {activeTab === "recommendations" && (
                  <motion.div layoutId="tabUnderline" className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "activity"}
                aria-controls="panel-activity"
                id="tab-activity"
                onClick={() => setActiveTab("activity")}
                className={`text-sm font-bold pb-1 transition-all cursor-pointer relative ${
                  activeTab === "activity" ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Aktivitas Saya ({myActiveTasks.length})
                {activeTab === "activity" && (
                  <motion.div layoutId="tabUnderline" className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            </div>

            <Link href="/feed" className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
              Lihat Semua <span className="material-symbols-outlined text-[14px]" aria-hidden="true">arrow_forward</span>
            </Link>
          </div>

          {/* Tab Content */}
          {activeTab === "recommendations" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1" id="panel-recommendations" role="tabpanel" aria-labelledby="tab-recommendations">
              {recommendedTasks.slice(0, 3).map((task) => (
                <Link key={task.id_task} href={`/task/${task.id_task}`}>
                  <div className="group border border-outline-variant/60 rounded-lg p-3.5 hover:border-primary/50 hover:bg-surface-container-low transition-all cursor-pointer flex flex-col justify-between h-full space-y-3 shadow-2xs">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h4 className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {task.title}
                        </h4>
                        <span className="text-xs font-mono font-bold text-primary shrink-0 bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                          {formatCurrency(task.compensation)}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant line-clamp-2">
                        {task.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-on-surface-variant pt-3 border-t border-outline-variant/30 font-mono">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">storefront</span>
                        {task.requester_name || "UMKM"}
                      </span>
                      <span className="flex items-center gap-1.5 text-primary font-bold">
                        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">directions_walk</span>
                        {task.distance ? `${task.distance.toFixed(1)} km` : "~"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}

              {recommendedTasks.length === 0 && (
                <div className="col-span-3 py-10 flex flex-col items-center justify-center text-center gap-2">
                  <span className="material-symbols-outlined text-[40px] text-outline-variant/40" aria-hidden="true">search_off</span>
                  <p className="text-sm font-semibold text-on-surface-variant">Belum ada rekomendasi tugas saat ini.</p>
                  <Link href="/feed">
                    <Button variant="secondary" size="sm">Buka Feed Tugas</Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 pt-1" id="panel-activity" role="tabpanel" aria-labelledby="tab-activity">
              {loadingActivity ? (
                <div className="py-8 flex flex-col items-center justify-center gap-3" aria-live="polite">
                  <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <span className="text-sm text-on-surface-variant font-medium">Memuat aktivitas...</span>
                </div>
              ) : myActiveTasks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {myActiveTasks.slice(0, 4).map((app) => {
                    const statusName = app.application_status || "Pending";
                    const statusColor = statusName === "accepted" ? "bg-secondary text-on-secondary" : statusName === "rejected" ? "bg-error text-on-error" : "bg-tertiary text-on-tertiary";
                    return (
                      <Link key={app.id_task_applicants} href={`/task/${app.id_tasks}`}>
                        <div className="group border border-outline-variant/60 rounded-lg p-4 hover:border-primary/50 hover:bg-surface-container-low transition-all cursor-pointer flex flex-col gap-3 shadow-2xs">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2 leading-snug flex-1">
                              {app.judul_tugas || "Tugas"}
                            </h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${statusColor}`}>
                              {statusName}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-on-surface-variant">
                            <span className="flex items-center gap-1.5 font-medium">
                              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">person</span>
                              {app.requester?.nama_lengkap || "Pemberi Kerja"}
                            </span>
                            <span className="font-mono font-bold text-primary">
                              {app.kompensasi ? formatCurrency(app.kompensasi) : "-"}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                /* Actionable Empty State */
                <div className="bg-surface-container-low/50 border border-outline-variant/60 border-dashed rounded-lg p-5 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-2xs border border-outline-variant mb-2">
                    <span className="material-symbols-outlined text-primary text-[20px]" aria-hidden="true">pending_actions</span>
                  </div>
                  <h4 className="text-sm font-bold text-on-surface">Belum ada tugas aktif</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5 max-w-sm mb-3">
                    {role === "worker"
                      ? "Ambil tugas terdekat di sekitarmu untuk mulai mengumpulkan poin."
                      : "Post tugas baru untuk menemukan mahasiswa yang siap membantu."}
                  </p>
                  {role === "worker" ? (
                    <Link href="/feed">
                      <Button variant="primary" size="sm">Cari Tugas Sekarang</Button>
                    </Link>
                  ) : (
                    <Link href="/task/new">
                      <Button variant="primary" size="sm">Post Tugas Pertama</Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Footer Trust Indicator */}
          <div className="pt-4 flex items-center justify-center gap-2 text-on-surface-variant/80 text-xs font-mono border-t border-outline-variant/30 mt-2">
            <span className="material-symbols-outlined text-[16px] text-tertiary" aria-hidden="true">verified_user</span>
            <span>Semua transaksi dilindungi sistem Escrow CEPAT • SDG 8</span>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
