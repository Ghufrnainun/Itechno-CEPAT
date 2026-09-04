"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getFeedTasks } from "@/lib/supabase/queries/tasks";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Task } from "@/types/database";
import MapPickerWrapper from "@/features/task/components/MapPickerWrapper";
import { TaskCard } from "@/features/task/components/TaskCard";
import { TaskInspector } from "@/features/task/components/TaskInspector";
import { FeedSkeleton, TaskCardSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useDebounce } from "@/hooks/useDebounce";
import {
  MapPinOff,
  AlertCircle,
  List,
  Map as MapIcon,
  Search,
  Bookmark,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

function CariTugasPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { coords, loading: locLoading } = useGeolocation();
  const { showToast } = useToast();

  const [viewMode, setViewMode] = useState<"list" | "map">(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("view") === "map") return "map";
    }
    return "list";
  });
  const [tasks, setTasks] = useState<(Task & { distance?: number })[]>([]);
  const [categories, setCategories] = useState<{ id_category: string; nama_kategori: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 350);

  const [radius, setRadius] = useState<number>(10);
  const [loading, setLoading] = useState(true);

  const [selectedTask, setSelectedTask] = useState<(Task & { distance?: number }) | null>(null);
  const [appliedTaskIds, setAppliedTaskIds] = useState<string[]>([]);
  const [savedTaskIds, setSavedTaskIds] = useState<string[]>([]);
  const [filterSavedOnly, setFilterSavedOnly] = useState(false);

  // Apply Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [applyBid, setApplyBid] = useState("");
  const [bidError, setBidError] = useState("");
  const [taskToApply, setTaskToApply] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const taskBeingApplied = useMemo(() => {
    return tasks.find((t) => t.id_task === taskToApply) ?? selectedTask ?? null;
  }, [tasks, taskToApply, selectedTask]);

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setCategories(json.data);
        }
      } catch (e) {
        console.error("Gagal load kategori:", e);
      }
    }
    loadCategories();
  }, []);

  // Load applied & saved tasks
  const refreshUserData = useCallback(async () => {
    try {
      const [appRes, savedRes] = await Promise.all([
        fetch("/api/tasks/applications/me", { cache: "no-store" }),
        fetch("/api/saved-tasks", { cache: "no-store" }),
      ]);

      if (appRes.ok) {
        const appJson = await appRes.json();
        if (appJson.success && Array.isArray(appJson.data)) {
          setAppliedTaskIds(appJson.data.map((app: any) => app.id_tasks));
        }
      }

      if (savedRes.ok) {
        const savedJson = await savedRes.json();
        if (savedJson.success && Array.isArray(savedJson.data)) {
          setSavedTaskIds(savedJson.data.map((item: any) => item.task?.id_task || item.id_tasks));
        }
      }
    } catch (e) {
      console.error("Gagal load data pelamar/tersimpan:", e);
    }
  }, []);

  const handleToggleSaveTask = useCallback((taskId: string, saved: boolean) => {
    setSavedTaskIds((prev) => {
      if (saved) {
        return prev.includes(taskId) ? prev : [...prev, taskId];
      } else {
        return prev.filter((id) => id !== taskId);
      }
    });
  }, []);

  useEffect(() => {
    refreshUserData();
  }, [refreshUserData]);

  // Load tasks
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const categoryId = selectedCategory === "all" ? undefined : selectedCategory;
      const fetched = await getFeedTasks(
        coords.latitude,
        coords.longitude,
        viewMode === "map" ? radius : undefined,
        debouncedSearch || undefined,
        categoryId,
        "distance_asc"
      );
      setTasks(fetched);
    } catch (err) {
      console.error("Gagal memuat tugas:", err);
      showToast("Gagal memuat daftar tugas.");
    } finally {
      setLoading(false);
    }
  }, [coords.latitude, coords.longitude, radius, debouncedSearch, selectedCategory, viewMode, showToast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Handle URL filter params
  useEffect(() => {
    if (searchParams.get("filter") === "saved" || searchParams.get("tab") === "saved") {
      setFilterSavedOnly(true);
    }
    if (searchParams.get("view") === "map") {
      setViewMode("map");
    }
  }, [searchParams]);

  // Filter tasks based on saved toggle
  const displayedTasks = useMemo(() => {
    if (!filterSavedOnly) return tasks;
    return tasks.filter((t) => savedTaskIds.includes(t.id_task));
  }, [tasks, filterSavedOnly, savedTaskIds]);

  const handleApply = (taskId: string) => {
    setTaskToApply(taskId);
    setApplyMessage("");
    setApplyBid("");
    setBidError("");
    setIsApplyModalOpen(true);
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = taskToApply || selectedTask?.id_task;
    if (!targetId) return;
    setBidError("");

    let numericBid: number | undefined = undefined;
    if (taskBeingApplied?.is_bidding) {
      numericBid = parseFloat(applyBid);
      const minBid = taskBeingApplied.budget_min ?? 0;
      const maxBid = taskBeingApplied.budget_max ?? taskBeingApplied.compensation;
      if (!numericBid || isNaN(numericBid) || numericBid <= 0) {
        setBidError("Masukkan harga penawaran Anda.");
        return;
      }
      if (numericBid < minBid) {
        setBidError(`Penawaran minimal Rp ${minBid.toLocaleString("id-ID")}.`);
        return;
      }
      if (numericBid > maxBid) {
        setBidError(`Penawaran maksimal Rp ${maxBid.toLocaleString("id-ID")}.`);
        return;
      }
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/tasks/${targetId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pesan: applyMessage.trim() || undefined,
          bid_amount: numericBid,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setAppliedTaskIds((prev) => [...prev, targetId]);
        showToast(
          taskBeingApplied?.is_bidding
            ? "Penawaran terkirim! Menunggu konfirmasi pemberi tugas."
            : "Lamaran berhasil dikirim!"
        );
        setIsApplyModalOpen(false);
      } else {
        showToast(data.message || "Gagal melamar tugas.");
      }
    } catch (e) {
      showToast("Terjadi kesalahan jaringan.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 font-sans bg-surface relative">
      {/* ───────────── UNIFIED STICKY HEADER ───────────── */}
      <header className="sticky top-0 z-30 bg-surface-container-lowest/95 backdrop-blur-md border-b border-card-border px-3.5 sm:px-6 py-3 flex flex-col gap-2.5 shadow-2xs">
        {/* Row 1: Title & Dual Mode Toggle */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="font-headline text-lg sm:text-2xl text-on-surface font-extrabold tracking-tight">
              Cari Tugas
            </h1>
            <p className="text-[11px] sm:text-xs text-on-surface-variant font-medium hidden sm:block">
              Peluang pekerjaan mikro terdekat di sekitar kampusmu.
            </p>
          </div>

          {/* View Mode Toggle: [Daftar | Peta] */}
          <div className="flex items-center bg-surface-container-low border border-card-border/80 rounded-xl p-1 shadow-2xs shrink-0">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                viewMode === "list"
                  ? "bg-primary text-on-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <List className="w-3.5 h-3.5" />
              <span>Daftar</span>
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={cn(
                "flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                viewMode === "map"
                  ? "bg-primary text-on-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Peta</span>
            </button>
          </div>
        </div>

        {/* Row 2: Search Bar + Saved Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60" />
            <input
              type="text"
              placeholder="Cari tugas (desain, input data, logistik)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 text-base sm:text-xs bg-surface-container-low border border-card-border/80 rounded-xl text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest focus:outline-none transition-colors min-h-[42px]"
            />
          </div>

          <button
            type="button"
            onClick={() => setFilterSavedOnly(!filterSavedOnly)}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 min-h-[42px]",
              filterSavedOnly
                ? "bg-primary/10 border-primary text-primary"
                : "bg-surface-container-low border-card-border text-on-surface-variant hover:text-on-surface"
            )}
            title="Tugas Tersimpan"
          >
            <Bookmark className={cn("w-3.5 h-3.5", filterSavedOnly && "fill-primary")} />
            <span className="hidden sm:inline">Tersimpan</span>
            {savedTaskIds.length > 0 && <span className="font-mono tabular-nums text-[11px]">({savedTaskIds.length})</span>}
          </button>

          {viewMode === "map" && (
            <div className="hidden sm:flex items-center gap-2 bg-surface-container-low border border-card-border px-3 py-1.5 rounded-xl shrink-0 min-h-[42px]">
              <span className="text-[11px] font-bold text-on-surface-variant">Radius:</span>
              <span className="font-mono text-xs font-bold text-primary tabular-nums">{radius} km</span>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-16 sm:w-20 accent-primary cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Row 3: Horizontal Category Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-0.5 -mx-1 px-1">
          <button
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 border min-h-[34px] flex items-center justify-center",
              selectedCategory === "all"
                ? "bg-primary text-on-primary border-primary font-bold shadow-2xs"
                : "bg-surface-container-low text-on-surface-variant border-card-border/70 hover:border-primary/40"
            )}
          >
            Semua Kategori
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id_category}
              onClick={() => setSelectedCategory(cat.id_category)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 border min-h-[34px] flex items-center justify-center",
                selectedCategory === cat.id_category
                  ? "bg-primary text-on-primary border-primary font-bold shadow-2xs"
                  : "bg-surface-container-low text-on-surface-variant border-card-border/70 hover:border-primary/40"
              )}
            >
              {cat.nama_kategori}
            </button>
          ))}
        </div>
      </header>

      {/* ───────────── CONTENT AREA ───────────── */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row relative bg-surface">
        {viewMode === "list" ? (
          /* ───────────── LIST VIEW ───────────── */
          <div className="flex-1 flex flex-col md:flex-row min-h-0">
            {/* Task Grid */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 pb-28 lg:pb-12 custom-scrollbar flex flex-col gap-3.5">
              <div className="flex items-center justify-between px-0.5 mb-0.5">
                <span className="text-xs font-semibold text-on-surface-variant">
                  {displayedTasks.length} tugas tersedia di sekitarmu
                </span>
                {loading && (
                  <span className="text-xs text-primary font-bold flex items-center gap-1.5 font-mono">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Memuat...
                  </span>
                )}
              </div>

              {loading ? (
                <FeedSkeleton />
              ) : displayedTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center gap-3 bg-surface-container-lowest border border-card-border rounded-2xl">
                  <MapPinOff className="w-10 h-10 text-on-surface-variant/40" />
                  <h3 className="font-headline font-bold text-sm sm:text-base text-on-surface">Tidak ada tugas ditemukan</h3>
                  <p className="text-xs text-on-surface-variant max-w-sm leading-relaxed">
                    {filterSavedOnly
                      ? "Anda belum menyimpan tugas apapun."
                      : "Coba ubah kata kunci pencarian atau pilih kategori lain."}
                  </p>
                  {filterSavedOnly && (
                    <Button variant="secondary" size="sm" onClick={() => setFilterSavedOnly(false)}>
                      Tampilkan Semua Tugas
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
                  {displayedTasks.map((task) => (
                    <TaskCard
                      key={task.id_task}
                      task={task}
                      isSelected={selectedTask?.id_task === task.id_task}
                      isSaved={savedTaskIds.includes(task.id_task)}
                      onClick={() => setSelectedTask(task)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Side Inspector */}
            {selectedTask && (
              <div className="hidden lg:block w-[420px] border-l border-card-border h-full z-20 bg-surface-container-lowest overflow-hidden shrink-0">
                <TaskInspector
                  task={selectedTask}
                  onClose={() => setSelectedTask(null)}
                  onApply={() => handleApply(selectedTask.id_task)}
                  isApplied={appliedTaskIds.includes(selectedTask.id_task)}
                  isSaved={savedTaskIds.includes(selectedTask.id_task)}
                  onToggleSave={handleToggleSaveTask}
                />
              </div>
            )}

            {/* Mobile Inspector Bottom Sheet */}
            {selectedTask && (
              <div
                onClick={() => setSelectedTask(null)}
                className="lg:hidden fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-backdrop-fade"
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="bg-surface-container-lowest rounded-t-3xl border-t border-card-border max-h-[90dvh] h-[90dvh] flex flex-col overflow-hidden animate-sheet-slide-up shadow-2xl"
                >
                  <TaskInspector
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onApply={() => handleApply(selectedTask.id_task)}
                    isApplied={appliedTaskIds.includes(selectedTask.id_task)}
                    isSaved={savedTaskIds.includes(selectedTask.id_task)}
                    onToggleSave={handleToggleSaveTask}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ───────────── MAP VIEW ───────────── */
          <div className="flex-1 min-h-0 flex flex-col md:flex-row relative bg-surface h-full">
            {/* Background Map Layer */}
            <div className="flex-1 h-full w-full relative z-0 order-1 md:order-2 min-h-[calc(100dvh-200px)] md:min-h-0">
              <MapPickerWrapper
                center={{ latitude: coords.latitude, longitude: coords.longitude }}
                tasks={displayedTasks}
                radiusKm={radius}
                selectedTaskId={selectedTask?.id_task}
                onTaskClick={(taskId) => {
                  const clicked = displayedTasks.find((t) => t.id_task === taskId);
                  if (clicked) setSelectedTask(clicked);
                }}
              />

              {/* Floating Map Radar Badge */}
              <div className="absolute top-3 left-3 md:left-6 z-10 bg-surface-container-lowest/95 backdrop-blur border border-card-border shadow-xs rounded-xl px-3 py-1.5 font-mono text-xs flex items-center gap-2 font-bold text-on-surface">
                <div className="w-2 h-2 rounded-full bg-primary inline-block" />
                <span>Radar ({displayedTasks.length} Tugas • {radius} km)</span>
              </div>

              {/* Floating View List Button on Mobile (when no task is actively previewed) */}
              {!selectedTask && (
                <button
                  onClick={() => setViewMode("list")}
                  className="md:hidden absolute bottom-5 left-1/2 -translate-x-1/2 z-20 bg-primary text-on-primary px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform whitespace-nowrap"
                >
                  <List className="w-4 h-4" />
                  <span>Lihat Daftar ({displayedTasks.length})</span>
                </button>
              )}

              {/* Floating Task Preview Card on Mobile when a Pin is Selected */}
              {selectedTask && (
                <div className="md:hidden absolute bottom-5 left-3.5 right-3.5 z-30 animate-in slide-in-from-bottom-3">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTask(null);
                      }}
                      className="absolute -top-2.5 -right-1.5 z-40 w-6 h-6 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center shadow-md cursor-pointer text-xs"
                      aria-label="Tutup Preview"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <TaskCard
                      task={selectedTask}
                      isSelected={true}
                      isSaved={savedTaskIds.includes(selectedTask.id_task)}
                      onClick={() => {
                        router.push(`/task/${selectedTask.id_task}`);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Left Task List */}
            <aside className="hidden md:flex md:w-[360px] bg-surface-container-lowest border-r border-card-border shadow-xs z-10 flex-col order-1 min-h-0">
              <div className="p-3 border-b border-card-border bg-surface-container-low flex items-center justify-between shrink-0">
                <h3 className="font-headline text-xs font-bold text-on-surface uppercase tracking-wider">
                  Daftar Tugas Radar
                </h3>
                <span className="bg-primary/10 text-primary border border-primary/20 text-xs px-2.5 py-0.5 rounded-md font-mono font-bold tabular-nums">
                  {displayedTasks.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 pb-28 lg:pb-6 flex flex-col gap-2.5 custom-scrollbar">
                {loading ? (
                  <div className="flex flex-col gap-3">
                    <TaskCardSkeleton />
                    <TaskCardSkeleton />
                    <TaskCardSkeleton />
                  </div>
                ) : displayedTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-36 text-center px-4 gap-2">
                    <MapPinOff className="w-8 h-8 text-outline-variant/60" />
                    <p className="font-body-sm text-xs text-on-surface-variant">
                      Tidak ada tugas dalam radius {radius} km.
                    </p>
                  </div>
                ) : (
                  displayedTasks.map((task) => (
                    <TaskCard
                      key={task.id_task}
                      task={task}
                      isSelected={selectedTask?.id_task === task.id_task}
                      onClick={() => setSelectedTask(task)}
                    />
                  ))
                )}
              </div>
            </aside>

            {/* Desktop Task Inspector Overlay */}
            {selectedTask && (
              <div className="hidden lg:block absolute top-0 bottom-0 right-0 h-full z-20 w-[420px] border-l border-card-border bg-surface-container-lowest overflow-hidden shadow-lg">
                <TaskInspector
                  task={selectedTask}
                  onClose={() => setSelectedTask(null)}
                  onApply={() => handleApply(selectedTask.id_task)}
                  isApplied={appliedTaskIds.includes(selectedTask.id_task)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ───────────── MODAL: LAMAR PEKERJAAN ───────────── */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title={taskBeingApplied?.is_bidding ? "Ajukan Penawaran" : "Kirim Lamaran Tugas"}
      >
        <form onSubmit={handleApplySubmit} noValidate className="flex flex-col gap-4 font-sans text-xs">
          {taskBeingApplied?.is_bidding && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="apply-bid-input-cari" className="font-semibold text-on-surface">
                Harga Penawaran Anda <span className="text-error">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 font-mono font-bold text-on-surface-variant pointer-events-none text-xs">
                  Rp
                </span>
                <input
                  id="apply-bid-input-cari"
                  type="number"
                  inputMode="numeric"
                  value={applyBid}
                  onChange={(e) => {
                    setApplyBid(e.target.value);
                    if (bidError) setBidError("");
                  }}
                  placeholder={`Range: Rp ${(taskBeingApplied.budget_min ?? 0).toLocaleString("id-ID")} – Rp ${(taskBeingApplied.budget_max ?? taskBeingApplied.compensation).toLocaleString("id-ID")}`}
                  className={cn(
                    "w-full pl-10 pr-3 py-2.5 text-xs font-mono font-bold bg-surface-container-low text-on-surface rounded-lg border focus:ring-2 focus:bg-surface-container-lowest focus:outline-none min-h-[42px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors",
                    bidError
                      ? "border-error focus:border-error focus:ring-error/20"
                      : "border-card-border focus:border-primary focus:ring-primary/20"
                  )}
                />
              </div>
              {bidError ? (
                <p className="text-xs font-medium text-error flex items-center gap-1.5 mt-0.5 animate-fadeIn">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{bidError}</span>
                </p>
              ) : (
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Penawaran bersifat rahasia (sealed bid), hanya pemberi tugas yang dapat melihatnya.
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-on-surface">Pesan Singkat (Opsional)</label>
            <textarea
              value={applyMessage}
              onChange={(e) => setApplyMessage(e.target.value)}
              placeholder="Ceritakan kesiapan Anda untuk mengerjakan tugas ini..."
              rows={4}
              maxLength={500}
              className="w-full bg-surface-container-low border border-card-border rounded-lg p-3 text-base sm:text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest focus:outline-none resize-none min-h-[90px] custom-scrollbar"
            />
            <span className="text-right font-mono text-[10px] text-on-surface-variant tabular-nums">
              {applyMessage.length}/500
            </span>
          </div>

          <div className="flex gap-2 justify-end mt-1 border-t border-card-border pt-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsApplyModalOpen(false)}
              disabled={actionLoading}
            >
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={actionLoading}>
              {actionLoading ? "Mengirim..." : "Kirim Lamaran"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function CariTugasPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <CariTugasPageContent />
    </React.Suspense>
  );
}
