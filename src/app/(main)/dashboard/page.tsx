"use client";

import React, { useState, useEffect } from "react";
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
  const { role, user } = useCurrentRole();
  const { coords } = useGeolocation();

  const [tasks, setTasks] = useState<any[]>([]); // Lightweight tasks for map
  const [featuredTask, setFeaturedTask] = useState<any | null>(null); // Rich task for featured card

  useEffect(() => {
    async function loadData() {
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
    }
    loadData();
  }, [coords]);

  const userName = user?.nama_lengkap?.split(" ")[0] || user?.username || "Pekerja";
  const nearbyCount = tasks.length;

  return (
    <div className="flex flex-col h-full bg-layout-bg font-sans transition-colors duration-300">
      {/* Clean White Header */}
      <header className="page-header bg-surface-container-lowest border-b border-outline-variant/30 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight">
            Halo, {userName}
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
                <span className="material-symbols-outlined text-[18px]">add</span>
                Post Tugas Baru
              </Button>
            </Link>
          ) : (
            <Link href="/feed">
              <Button variant="primary" size="md" className="font-bold">
                <span className="material-symbols-outlined text-[18px]">search</span>
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
            className="col-span-12 lg:col-span-5 p-1 md:p-1.5 rounded-xl bg-black/[0.02] ring-1 ring-black/5 shadow-xs"
          >
            <div className="h-full rounded-lg border border-primary/20 bg-primary/5 p-5 flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between mb-4 text-primary font-bold">
                <span className="text-xs font-mono uppercase tracking-wider">Saldo Poin Utama</span>
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px] text-primary">account_balance_wallet</span>
                </div>
              </div>

              {loading ? (
                <div className="h-12 bg-primary/10 rounded animate-pulse w-3/4 mb-4" />
              ) : (
                <div>
                  <div className="text-4xl md:text-5xl font-extrabold text-on-surface font-mono tracking-tight mb-2">
                    250.000 <span className="text-sm font-sans font-bold text-on-surface-variant">pts</span>
                  </div>

                  {/* Level Progress Bar */}
                  <div className="space-y-1.5 mt-3">
                    <div className="flex justify-between text-[11px] font-mono text-on-surface-variant font-medium">
                      <span>Level 3 Worker</span>
                      <span>75% to Level 4</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-primary/10 overflow-hidden">
                      <div className="h-full bg-primary rounded-full w-[75%]" />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-[11px] text-primary font-bold flex items-center gap-1.5 bg-white/80 backdrop-blur px-2.5 py-1 rounded border border-primary/10 shadow-2xs">
                      <span className="material-symbols-outlined text-[14px]">trending_up</span>
                      +15rb minggu ini
                    </div>
                    <Link href="/wallet" className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5">
                      Detail <span className="material-symbols-outlined text-[14px]">chevron_right</span>
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
            className="col-span-6 lg:col-span-3 p-1 md:p-1.5 rounded-xl bg-black/[0.02] ring-1 ring-black/5 shadow-xs"
          >
            <div className="h-full rounded-lg border border-outline-variant/60 bg-white p-4 md:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3 text-on-surface-variant font-bold">
                <span className="text-xs font-mono uppercase tracking-wider">Rating</span>
                <span
                  className="material-symbols-outlined text-[20px] text-amber-500"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
              </div>
              {loading ? (
                <div className="h-8 bg-surface-container-high rounded animate-pulse w-1/2" />
              ) : (
                <div>
                  <div className="text-3xl font-extrabold text-on-surface font-mono tracking-tight">
                    4.8 <span className="text-sm text-amber-500 font-sans">/ 5.0</span>
                  </div>
                  <div className="text-[11px] text-on-surface-variant mt-1.5 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#84CC16]" />
                    Dari 24 review terverifikasi
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
            className="col-span-6 lg:col-span-4 p-1 md:p-1.5 rounded-xl bg-black/[0.02] ring-1 ring-black/5 shadow-xs"
          >
            <div className="h-full rounded-lg border border-[#84CC16]/30 bg-[#84CC16]/10 p-4 md:p-5 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-[#84CC16] opacity-15 pointer-events-none">
                <span className="material-symbols-outlined text-[80px]">task_alt</span>
              </div>
              <div className="flex items-center justify-between mb-3 text-[#4D7C0F] font-bold relative z-10">
                <span className="text-xs font-mono uppercase tracking-wider">Task Selesai</span>
                <span className="material-symbols-outlined text-[20px]">task_alt</span>
              </div>
              {loading ? (
                <div className="h-8 bg-[#84CC16]/20 rounded animate-pulse w-1/2" />
              ) : (
                <div className="relative z-10">
                  <div className="text-3xl font-extrabold text-on-surface font-mono tracking-tight">
                    17 <span className="text-xs text-[#4D7C0F] font-sans font-bold">tugas</span>
                  </div>
                  <div className="text-[11px] text-[#4D7C0F] font-bold mt-1.5 flex items-center gap-1.5">
                    <span>Badge:</span>
                    <span className="bg-[#84CC16] text-white px-2 py-0.5 rounded shadow-2xs text-[9px] uppercase tracking-wide">
                      Pekerja Aktif
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Card 4 — Dana Ditahan / Escrow (col-span-12 lg:col-span-7) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="col-span-12 lg:col-span-7 p-1 md:p-1.5 rounded-xl bg-black/[0.02] ring-1 ring-black/5 shadow-xs"
          >
            <div className="h-full rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-amber-500/10 flex items-center justify-center text-amber-700 shrink-0">
                  <span className="material-symbols-outlined text-[22px]">lock_clock</span>
                </div>
                <div>
                  <div className="text-xs font-mono text-amber-800 font-bold uppercase tracking-wider">
                    Dana Terkunci Escrow
                  </div>
                  <div className="text-2xl font-extrabold text-on-surface font-mono tracking-tight mt-0.5">
                    Rp 100.000
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-amber-200/50 pt-2 sm:pt-0">
                <span className="text-xs text-amber-800/80 font-medium hidden md:inline">
                  Aman di Escrow hingga task disetujui
                </span>
                <Link href="/wallet">
                  <button type="button" className="px-3.5 py-1.5 text-xs font-bold text-amber-800 bg-white border border-amber-300 rounded hover:bg-amber-50 transition-colors cursor-pointer shadow-2xs">
                    Lihat Status
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
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
              <div className="px-5 py-3.5 border-b border-outline-variant/60 bg-surface-container-lowest flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">local_fire_department</span>
                  <h2 className="text-sm font-bold text-on-surface">Peluang Utama Sekitar</h2>
                </div>
                <span className="bg-orange-50 text-orange-600 border border-orange-200/50 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider">
                  HOT TASK
                </span>
              </div>

              {loading ? (
                <div className="p-6 flex flex-col sm:flex-row gap-6 items-center">
                  <div className="w-full sm:w-2/5 h-36 bg-surface-container-high rounded-lg animate-pulse" />
                  <div className="flex-1 space-y-3 w-full">
                    <div className="h-6 bg-surface-container-high rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-surface-container-high rounded animate-pulse w-1/2" />
                    <div className="h-12 bg-surface-container-high rounded animate-pulse w-full" />
                  </div>
                </div>
              ) : featuredTask ? (
                <div className="flex-1 p-5 md:p-6 flex flex-col sm:flex-row gap-5">
                  {/* Category Gradient Thumbnail */}
                  <div className="w-full sm:w-2/5 h-36 sm:h-auto rounded-lg overflow-hidden shrink-0 border border-outline-variant/30 relative bg-gradient-to-br from-primary/10 via-surface-container-high to-primary-container/20 flex flex-col items-center justify-center p-4 text-center shadow-inner">
                    <span className="material-symbols-outlined text-[42px] text-primary mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>
                      storefront
                    </span>
                    <span className="text-xs font-bold text-on-surface line-clamp-1">UMKM Lokal</span>
                    <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur text-on-surface px-2 py-1 rounded shadow-2xs border border-outline-variant/50 flex items-center gap-1">
                      <span className="material-symbols-outlined text-primary text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        verified
                      </span>
                      <span className="text-[10px] font-bold">Terverifikasi</span>
                    </div>
                  </div>

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
                        <span className="material-symbols-outlined text-[15px] text-primary">location_on</span>
                        <span className="text-primary font-mono">
                          {featuredTask.distance ? `${featuredTask.distance.toFixed(1)} km dari posisi` : "~"}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                        {featuredTask.description}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-outline-variant/40">
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-on-surface-variant font-bold">
                        <span className="material-symbols-outlined text-[14px] text-primary">shield</span>
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
                  <span className="material-symbols-outlined text-[48px] text-outline-variant/40">location_off</span>
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
                <div className="bg-white/95 backdrop-blur border border-outline-variant shadow-2xs rounded px-2.5 py-1.5 flex items-center gap-2 pointer-events-auto">
                  <div className="w-2 h-2 rounded-full bg-primary pulse-dot" />
                  <span className="text-[10px] font-bold text-on-surface uppercase tracking-wider font-mono">
                    Radar • {nearbyCount} Task
                  </span>
                </div>
                <Link
                  href="/feed?view=map"
                  className="w-8 h-8 bg-white/95 backdrop-blur border border-outline-variant rounded shadow-2xs flex items-center justify-center text-on-surface-variant pointer-events-auto hover:text-primary transition-colors"
                  title="Buka Peta Penuh"
                >
                  <span className="material-symbols-outlined text-[16px]">open_in_full</span>
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
              <div className="absolute bottom-2 left-2 right-2 z-10 text-center pointer-events-none">
                <span className="inline-block bg-white/90 backdrop-blur border border-outline-variant/60 px-3 py-1 rounded text-[10px] text-on-surface-variant font-mono font-bold uppercase tracking-wider shadow-2xs">
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
          <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setActiveTab("recommendations")}
                className={`text-sm font-bold pb-1 transition-all cursor-pointer relative ${
                  activeTab === "recommendations" ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Rekomendasi Tugas ({tasks.length})
                {activeTab === "recommendations" && (
                  <motion.div layoutId="tabUnderline" className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("activity")}
                className={`text-sm font-bold pb-1 transition-all cursor-pointer relative ${
                  activeTab === "activity" ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Aktivitas Saya
                {activeTab === "activity" && (
                  <motion.div layoutId="tabUnderline" className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            </div>

            <Link href="/feed" className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
              Lihat Semua <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>

          {/* Tab Content */}
          {activeTab === "recommendations" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {tasks.slice(0, 3).map((task) => (
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
                      <p className="text-[11px] text-on-surface-variant line-clamp-2">
                        {task.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-2 border-t border-outline-variant/30 font-mono">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">storefront</span>
                        UMKM
                      </span>
                      <span className="flex items-center gap-1 text-primary font-bold">
                        <span className="material-symbols-outlined text-[13px]">directions_walk</span>
                        {task.distance ? `${task.distance.toFixed(1)} km` : "~"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}

              {tasks.length === 0 && (
                <div className="col-span-3 py-10 flex flex-col items-center justify-center text-center gap-2">
                  <span className="material-symbols-outlined text-[40px] text-outline-variant/40">search_off</span>
                  <p className="text-sm font-semibold text-on-surface-variant">Belum ada rekomendasi tugas saat ini.</p>
                  <Link href="/feed">
                    <Button variant="secondary" size="sm">Buka Feed Tugas</Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {/* Actionable Empty State */}
              <div className="bg-surface-container-low/50 border border-outline-variant/60 border-dashed rounded-lg p-5 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-2xs border border-outline-variant mb-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">pending_actions</span>
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
            </div>
          )}

          {/* Footer Trust Indicator */}
          <div className="pt-2 flex items-center justify-center gap-2 text-on-surface-variant/60 text-[11px] font-mono border-t border-outline-variant/30">
            <span className="material-symbols-outlined text-[14px] text-primary">verified_user</span>
            <span>Semua transaksi dilindungi sistem Escrow CEPAT • SDG 8</span>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
