"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getFeedTasks } from "@/lib/supabase/queries/tasks";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Task } from "@/types/database";
import MapPickerWrapper from "@/features/task/components/MapPickerWrapper";
import { TaskCard } from "@/features/task/components/TaskCard";
import { TaskInspector } from "@/features/task/components/TaskInspector";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useDebounce } from "@/hooks/useDebounce";
import { formatCurrency } from "@/lib/utils/format";
import {
  MapPinOff,
  AlertCircle,
  List,
  Map as MapIcon,
  Search,
  Bookmark,
  Store,
  Loader2,
  Navigation,
  Gavel,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CariTugasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { coords, loading: locLoading } = useGeolocation();
  const { showToast } = useToast();

  const [viewMode, setViewMode] = useState<"list" | "map">("list");
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
        fetch("/api/tasks/applications/me"),
        fetch("/api/saved-tasks"),
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
        viewMode === "map" ? radius : undefined, // In list mode, don't hard limit by radius so all available nearest tasks show
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
  }, [coords, radius, debouncedSearch, selectedCategory, viewMode, showToast]);

  useEffect(() => {
    if (!locLoading) {
      fetchTasks();
    }
  }, [locLoading, fetchTasks]);

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
    <div className="flex flex-col h-full font-sans bg-surface overflow-hidden relative">
      {/* ───────────── UNIFIED HEADER ───────────── */}
      <header className="page-header shrink-0 z-30 bg-surface-container-lowest border-b border-card-border px-4 sm:px-6 py-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-headline text-xl sm:text-2xl text-on-surface font-extrabold tracking-tight">
              Cari Tugas
            </h1>
            <p className="font-body-sm text-xs text-on-surface-variant font-medium mt-0.5">
              Peluang pekerjaan mikro terdekat di sekitar kampusmu.
            </p>
          </div>

          {/* View Mode Toggle: [Daftar | Peta] */}
          <div className="flex items-center bg-surface-container-low border border-card-border rounded-xl p-1 shadow-2xs">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                viewMode === "list"
                  ? "bg-primary text-on-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <List className="w-4 h-4" />
              <span>Daftar</span>
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                viewMode === "map"
                  ? "bg-primary text-on-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <MapIcon className="w-4 h-4" />
              <span>Peta</span>
            </button>
          </div>
        </div>

        {/* Search Bar + Controls Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60" />
            <input
              type="text"
              placeholder="Cari tugas (misal: input data, jaga booth, fotografi)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-surface-container-low border border-card-border rounded-xl text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest focus:outline-none transition-colors"
            />
          </div>

          {/* Controls: Saved Filter + Radius */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setFilterSavedOnly(!filterSavedOnly)}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer",
                filterSavedOnly
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-surface-container-low border-card-border text-on-surface-variant hover:text-on-surface"
              )}
            >
              <Bookmark className={cn("w-3.5 h-3.5", filterSavedOnly && "fill-primary")} />
              <span>Tersimpan {savedTaskIds.length > 0 && `(${savedTaskIds.length})`}</span>
            </button>

            {viewMode === "map" && (
              <div className="flex items-center gap-2 bg-surface-container-low border border-card-border px-3 py-1.5 rounded-xl">
                <span className="text-[11px] font-bold text-on-surface-variant">Radius:</span>
                <span className="font-mono text-xs font-bold text-primary tabular-nums">{radius} km</span>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-20 accent-primary cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>

        {/* Category Pills Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-0.5">
          <button
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 border",
              selectedCategory === "all"
                ? "bg-primary text-on-primary border-primary font-bold shadow-xs"
                : "bg-surface-container-low text-on-surface-variant border-card-border hover:border-primary/40"
            )}
          >
            Semua Kategori
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id_category}
              onClick={() => setSelectedCategory(cat.id_category)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 border",
                selectedCategory === cat.id_category
                  ? "bg-primary text-on-primary border-primary font-bold shadow-xs"
                  : "bg-surface-container-low text-on-surface-variant border-card-border hover:border-primary/40"
              )}
            >
              {cat.nama_kategori}
            </button>
          ))}
        </div>
      </header>

      {/* ───────────── VIEW CONTENT CONTAINER ───────────── */}
      <div className="flex-1 w-full h-full flex flex-col md:flex-row relative overflow-hidden bg-surface">
        {viewMode === "list" ? (
          /* ───────────── LIST VIEW ───────────── */
          <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
            {/* Task Grid / Feed */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar flex flex-col gap-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-on-surface-variant font-mono">
                  {displayedTasks.length} TUGAS TERSEDIA
                </span>
                {loading && (
                  <span className="text-xs text-primary font-bold flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Memuat...
                  </span>
                )}
              </div>

              {displayedTasks.length === 0 && !loading ? (
                <div className="flex flex-col items-center justify-center p-12 text-center gap-3 bg-surface-container-lowest border border-card-border rounded-2xl">
                  <MapPinOff className="w-10 h-10 text-on-surface-variant/40" />
                  <h3 className="font-headline font-bold text-base text-on-surface">Tidak ada tugas ditemukan</h3>
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                  {displayedTasks.map((task) => (
                    <TaskCard
                      key={task.id_task}
                      task={task}
                      isSelected={selectedTask?.id_task === task.id_task}
                      onClick={() => setSelectedTask(task)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Side Inspector */}
            {selectedTask && (
              <div className="hidden lg:block w-[400px] border-l border-card-border h-full z-20 bg-surface-container-lowest">
                <TaskInspector
                  task={selectedTask}
                  onClose={() => setSelectedTask(null)}
                  onApply={() => handleApply(selectedTask.id_task)}
                  isApplied={appliedTaskIds.includes(selectedTask.id_task)}
                />
              </div>
            )}
          </div>
        ) : (
          /* ───────────── MAP VIEW ───────────── */
          <div className="flex-1 w-full h-full flex flex-col md:flex-row relative overflow-hidden bg-surface">
            {/* Background Map Layer */}
            <div className="h-[45vh] md:h-full md:flex-1 relative z-0 order-1 md:order-2">
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
              <div className="absolute top-4 left-4 md:left-6 z-10 bg-surface-container-lowest/95 backdrop-blur border border-card-border shadow-xs rounded-lg px-3 py-1.5 font-mono text-xs flex items-center gap-2 font-bold text-on-surface">
                <div className="w-2 h-2 rounded-full bg-primary inline-block" />
                <span>Peta Radar ({displayedTasks.length} Tugas dalam {radius} km)</span>
              </div>
            </div>

            {/* Left Sidebar - Task List */}
            <aside className="flex-1 md:w-[360px] bg-surface-container-lowest border-t md:border-t-0 md:border-r border-card-border shadow-xs z-10 flex flex-col order-2 md:order-1">
              <div className="p-3.5 border-b border-card-border bg-surface-container-low flex items-center justify-between">
                <h3 className="font-headline text-xs font-bold text-on-surface uppercase tracking-wider">
                  Daftar Tugas Radar
                </h3>
                <span className="bg-primary/10 text-primary border border-primary/20 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold tabular-nums">
                  {displayedTasks.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 custom-scrollbar">
                {displayedTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center px-4 gap-2">
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

            {/* Task Inspector Overlay */}
            {selectedTask && (
              <div className="absolute top-0 bottom-0 right-0 h-full z-20 w-full sm:w-[400px]">
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
