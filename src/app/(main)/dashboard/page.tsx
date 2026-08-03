"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCurrentRole } from "@/app/(main)/layout";
import { getNearbyTasks, MOCK_TASKS } from "@/lib/supabase/queries/tasks";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Task } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils/format";
import MapPickerWrapper from "@/features/task/components/MapPickerWrapper";

export default function DashboardPage() {
  const { role } = useCurrentRole();
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

  const userName = "Budi";
  const nearbyCount = tasks.length;

  return (
    <div className="flex flex-col h-full bg-layout-bg font-sans">
      {/* Page Header */}
      <header className="page-header">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface">
            Halo, {userName}.
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Ada{" "}
            <span className="font-semibold text-primary">{nearbyCount} tugas dekat kampus</span>{" "}
            yang bisa kamu ambil hari ini.
          </p>
        </div>
        <div className="flex gap-sm">
          {role === "requester" ? (
            <Link href="/task/new">
              <Button variant="primary">
                <span className="material-symbols-outlined text-[18px]">add</span>
                Post Tugas Baru
              </Button>
            </Link>
          ) : (
            <Link href="/feed">
              <Button variant="primary">
                <span className="material-symbols-outlined text-[18px]">search</span>
                Cari Tugas Terdekat
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-lg flex flex-col gap-lg">

        {/* Bento Stats Grid — 4 cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-md">
          {/* Card 1 — Saldo Poin */}
          <div className="bento-card">
            <div className="flex items-center justify-between mb-sm text-on-surface-variant">
              <span className="font-label-sm text-label-sm font-medium">Saldo poin</span>
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            </div>
            <div>
              <div
                className="font-headline-md text-headline-md font-bold text-on-surface tracking-tight"
                style={{ fontFamily: "'JetBrains Mono'" }}
              >
                250rb
              </div>
              <div className="font-label-sm text-[10px] text-primary mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">trending_up</span>
                +15rb minggu ini
              </div>
            </div>
          </div>

          {/* Card 2 — Dana Ditahan */}
          <div className="bento-card">
            <div className="flex items-center justify-between mb-sm text-on-surface-variant">
              <span className="font-label-sm text-label-sm font-medium">Dana ditahan</span>
              <span className="material-symbols-outlined text-[18px]">lock_clock</span>
            </div>
            <div>
              <div
                className="font-headline-md text-headline-md font-bold text-on-surface tracking-tight"
                style={{ fontFamily: "'JetBrains Mono'" }}
              >
                100rb
              </div>
              <div className="font-label-sm text-[10px] text-amber-600 mt-1 flex items-center gap-1 bg-amber-50 w-fit px-1.5 py-0.5 rounded border border-amber-200">
                Dalam escrow
              </div>
            </div>
          </div>

          {/* Card 3 — Rating */}
          <div className="bento-card">
            <div className="flex items-center justify-between mb-sm text-on-surface-variant">
              <span className="font-label-sm text-label-sm font-medium">Rating</span>
              <span
                className="material-symbols-outlined text-[18px] text-amber-500"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
            </div>
            <div>
              <div
                className="font-headline-md text-headline-md font-bold text-on-surface tracking-tight"
                style={{ fontFamily: "'JetBrains Mono'" }}
              >
                4.8
              </div>
              <div className="font-label-sm text-[10px] text-on-surface-variant mt-1">
                Dari 24 review
              </div>
            </div>
          </div>

          {/* Card 4 — Task Selesai (highlighted) */}
          <div className="relative overflow-hidden rounded-xl p-md flex flex-col justify-between min-h-[112px] shadow-sm bg-primary-container">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between mb-sm text-on-primary/80 relative z-10">
              <span className="font-label-sm text-label-sm font-medium">Task selesai</span>
              <span className="material-symbols-outlined text-[18px]">task_alt</span>
            </div>
            <div className="relative z-10">
              <div
                className="font-headline-md text-headline-md font-bold text-on-primary tracking-tight"
                style={{ fontFamily: "'JetBrains Mono'" }}
              >
                17
              </div>
              <div className="font-label-sm text-[10px] text-on-primary/90 mt-1 flex items-center gap-1">
                Level:{" "}
                <span className="font-semibold text-secondary-container">Pekerja Aktif</span>
              </div>
            </div>
          </div>
        </section>

        {/* Composite: Featured Task + Mini Map */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-md lg:gap-lg">
          {/* Featured Task (col-span 3) */}
          <section className="xl:col-span-3 bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="px-md py-sm border-b border-outline-variant bg-surface-container-low/50 flex justify-between items-center shrink-0">
              <h2 className="font-headline-sm text-label-md font-semibold text-on-surface">
                Peluang Utama Sekitar
              </h2>
              <span className="bg-interaction-bg text-primary-container text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 font-label-sm">
                <span
                  className="material-symbols-outlined text-[12px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  local_fire_department
                </span>
                Hot
              </span>
            </div>

            {featuredTask ? (
              <div className="flex-1 p-md flex flex-col sm:flex-row gap-md">
                {/* Task image placeholder */}
                <div className="w-full sm:w-2/5 h-32 sm:h-auto rounded-lg overflow-hidden shrink-0 border border-outline-variant/30 relative bg-surface-container-low flex items-center justify-center">
                  <span className="material-symbols-outlined text-[48px] text-outline-variant">image</span>
                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur text-on-surface px-2 py-1 rounded-md shadow-sm border border-white flex items-center gap-1">
                    <span
                      className="material-symbols-outlined text-primary-container text-[14px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      verified
                    </span>
                    <span className="font-label-sm text-[10px] font-bold">UMKM Verified</span>
                  </div>
                </div>

                {/* Task Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface leading-tight">
                        {featuredTask.title}
                      </h3>
                      <div className="font-label-md text-label-md font-bold text-primary shrink-0 ml-2">
                        {formatCurrency(featuredTask.compensation)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-on-surface-variant font-label-sm mb-3">
                      <span className="material-symbols-outlined text-[14px]">storefront</span>
                      <span>UMKM Lokal</span>
                      <span className="mx-1">•</span>
                      <span className="material-symbols-outlined text-[14px] text-primary">location_on</span>
                      <span className="text-primary font-semibold">
                        {featuredTask.distance ? `${featuredTask.distance.toFixed(1)} km` : "~"}
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                      {featuredTask.description}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 bg-layout-bg border border-outline-variant px-2 py-1 rounded-md">
                      <span className="material-symbols-outlined text-primary-container text-[14px]">work</span>
                      <span className="font-label-sm text-[10px] text-on-surface-variant font-medium">Decent Work • SDG 8</span>
                    </div>
                    <Link href={`/task/${featuredTask.id_task}`}>
                      <Button variant="primary" className="py-2 px-md text-sm">
                        Lihat Detail
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-xl text-center gap-sm">
                <span className="material-symbols-outlined text-[48px] text-outline">location_off</span>
                <p className="font-body-md text-body-md text-on-surface-variant">Tidak ada tugas terdekat ditemukan.</p>
              </div>
            )}
          </section>

          {/* Mini Map (col-span 2) */}
          <section className="xl:col-span-2 bg-interaction-bg rounded-xl border border-outline-variant overflow-hidden relative h-64 xl:h-full flex flex-col min-h-[260px]">
            {/* Overlay controls */}
            <div className="absolute top-3 left-3 right-3 z-10 flex justify-between pointer-events-none">
              <div className="bg-white/90 backdrop-blur border border-outline-variant shadow-sm rounded-lg px-3 py-1.5 flex items-center gap-2 pointer-events-auto">
                <div className="w-2 h-2 rounded-full bg-primary pulse-dot"></div>
                <span className="font-label-sm text-[11px] font-semibold text-on-surface">Radar Aktif</span>
              </div>
              <Link
                href="/feed"
                className="w-8 h-8 bg-white border border-outline-variant rounded-lg shadow-sm flex items-center justify-center text-on-surface-variant pointer-events-auto hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">open_in_full</span>
              </Link>
            </div>

            {/* Leaflet Map */}
            <div className="absolute inset-0">
              <MapPickerWrapper
                center={{ latitude: coords.latitude, longitude: coords.longitude }}
                tasks={tasks}
                radiusKm={2}
              />
            </div>

            {/* Bottom fade label */}
            <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-white/80 to-transparent z-10 text-center pointer-events-none">
              <span className="font-label-sm text-[10px] text-on-surface-variant font-medium">
                Radius 2km dari lokasi kamu
              </span>
            </div>
          </section>
        </div>

        {/* Activity Panel (Aktivitas + Rekomendasi) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-md lg:gap-lg">

          {/* Aktivitas Saat Ini */}
          <section className="bg-white border border-outline-variant rounded-xl p-md shadow-sm flex flex-col gap-md">
            <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              Aktivitas Saat Ini
            </h3>
            <div className="flex flex-col gap-sm">
              {/* No active task state */}
              <div className="bg-layout-bg border border-outline-variant border-dashed rounded-xl p-md flex flex-col items-center justify-center text-center py-6">
                <div className="w-10 h-10 bg-interaction-bg rounded-full flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-primary-container">pending_actions</span>
                </div>
                <span className="font-body-sm text-body-sm font-medium text-on-surface">Belum ada task aktif</span>
                <span className="font-label-sm text-[11px] text-on-surface-variant mt-1">Ambil tugas untuk mulai.</span>
              </div>

              {/* Alert: Applications pending */}
              <div className="bg-white border border-outline-variant rounded-lg p-sm flex items-center gap-3 hover:bg-layout-bg transition-colors cursor-pointer group">
                <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-amber-600 text-[16px]">hourglass_empty</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-label-sm text-label-sm font-semibold text-on-surface truncate">2 aplikasi menunggu</div>
                  <div className="font-body-sm text-[11px] text-on-surface-variant truncate">Menunggu respon UMKM</div>
                </div>
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
              </div>

              {/* Alert: Review pending */}
              <div className="bg-white border border-outline-variant rounded-lg p-sm flex items-center gap-3 hover:bg-layout-bg transition-colors cursor-pointer group">
                <div className="w-8 h-8 rounded-full bg-interaction-bg border border-outline-variant flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-[16px]">rate_review</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-label-sm text-label-sm font-semibold text-on-surface truncate">1 review belum diberikan</div>
                  <div className="font-body-sm text-[11px] text-on-surface-variant truncate">Task: Cuci Motor Kilat</div>
                </div>
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
              </div>
            </div>
          </section>

          {/* Rekomendasi Tugas */}
          <section className="lg:col-span-2 bg-white border border-outline-variant rounded-xl p-md shadow-sm flex flex-col gap-md">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                Rekomendasi Tugas
              </h3>
              <Link href="/feed" className="text-primary-container font-label-sm text-[12px] font-bold hover:underline">
                Lihat Semua
              </Link>
            </div>

            <div className="flex flex-col gap-sm">
              {tasks.slice(0, 3).map((task, index) => (
                <Link key={task.id_task} href={`/task/${task.id_task}`}>
                  <div className="task-card rounded-xl p-sm flex flex-col gap-2 cursor-pointer">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-label-md text-label-md font-semibold text-on-surface leading-tight line-clamp-2">
                        {task.title}
                      </h4>
                      <div className="font-label-sm text-label-sm font-bold text-on-surface bg-layout-bg px-1.5 py-0.5 rounded shrink-0">
                        {formatCurrency(task.compensation)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1 text-on-surface-variant">
                        <span className="material-symbols-outlined text-[12px]">storefront</span>
                        <span className="font-body-sm text-[11px]">UMKM Lokal</span>
                      </div>
                      <div className="flex items-center gap-1 text-primary">
                        <span className="material-symbols-outlined text-[12px]">directions_walk</span>
                        <span className="font-label-sm text-[10px] font-semibold">
                          {task.distance ? `${task.distance.toFixed(1)} km` : "~"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}

              {tasks.length === 0 && (
                <div className="flex flex-col items-center gap-sm py-8 text-center">
                  <span className="material-symbols-outlined text-[40px] text-outline">location_off</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Tidak ada tugas terdekat.</p>
                </div>
              )}
            </div>

            {/* Trust footer */}
            <div className="mt-auto pt-md flex items-center justify-center gap-2 text-on-surface-variant opacity-60">
              <span className="material-symbols-outlined text-[14px]">shield</span>
              <span className="font-label-sm text-[10px]">Semua transaksi dilindungi Escrow</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
