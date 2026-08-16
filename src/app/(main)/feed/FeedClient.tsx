"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentRole } from "@/app/(main)/layout";
import { getFeedTasks, MOCK_TASKS } from "@/lib/supabase/queries/tasks";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Task } from "@/types/database";
import { TaskCard } from "@/features/task/components/TaskCard";
import { TaskInspector } from "@/features/task/components/TaskInspector";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils/format";
import { useToast } from "@/components/ui/Toast";
import { useDebounce } from "@/hooks/useDebounce";

import { Modal } from "@/components/ui/Modal";
import { Plus, Search, SearchX, Gavel } from "lucide-react";

interface FeedClientProps {
  initialTasks: any[];
  initialCategories: any[];
}

export default function FeedClient({ initialTasks, initialCategories }: FeedClientProps) {
  const router = useRouter();
  const { role } = useCurrentRole();
  const { coords, loading: locLoading } = useGeolocation();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"feed" | "mytasks">(role === "requester" ? "mytasks" : "feed");
  const [tasks, setTasks] = useState<(Task & { distance: number })[]>(initialTasks as any);
  const [categories, setCategories] = useState<{id_category: string, nama_kategori: string}[]>(initialCategories);
  const [sortBy, setSortBy] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  // Selected task for inspector
  const [selectedTask, setSelectedTask] = useState<(Task & { distance?: number }) | null>(null);
  
  const [appliedTaskIds, setAppliedTaskIds] = useState<string[]>([]);
  const [appliedAppsMap, setAppliedAppsMap] = useState<Record<string, { status: string }>>({});

  // Apply Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [applyBid, setApplyBid] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);

  useEffect(() => {
    setActiveTab(role === "requester" ? "mytasks" : "feed");
    // Reset selected task when role changes
    setSelectedTask(null);
  }, [role]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories');
        const json = await res.json();
        if (json.success) {
          setCategories(json.data);
        }
      } catch (e) {
        console.error("Gagal load kategori", e);
      }
    }
    loadCategories();
  }, []);

  // Polling secukupnya untuk status lamaran worker (setiap 12 detik)
  useEffect(() => {
    if (role !== "worker") return;

    let isMounted = true;

    async function loadAppliedTaskIds() {
      try {
        const res = await fetch('/api/tasks/applications/me');
        const data = await res.json();
        if (data.success && isMounted) {
          const ids: string[] = [];
          const map: Record<string, { status: string }> = {};
          data.data.forEach((app: any) => {
            ids.push(app.id_tasks);
            map[app.id_tasks] = { status: app.status };
          });
          setAppliedTaskIds(ids);
          setAppliedAppsMap(map);
        }
      } catch (e) {
        console.error("Gagal load applied task ids", e);
      }
    }

    loadAppliedTaskIds();
    const interval = setInterval(loadAppliedTaskIds, 12000); // Polling ringan tiap 12 detik

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [role]);

  useEffect(() => {
    async function loadTasks() {
      if (role === "requester") {
        router.push("/tugas");
        return;
      }

      if (activeTab === "feed") {
        if (locLoading) return;
        
        let sortOrder = "newest";
        let categoryId: string | undefined = undefined;

        if (sortBy === "distance_asc" || sortBy === "price_desc") {
           sortOrder = sortBy;
        } else if (sortBy !== "all" && sortBy !== "skills_match") {
           categoryId = sortBy;
        }

        let list = await getFeedTasks(
           coords.latitude, 
           coords.longitude, 
           undefined, 
           debouncedSearchQuery || undefined, 
           categoryId, 
           sortOrder
        );

        setTasks(list);
      } else {
        try {
          const res = await fetch('/api/users/me/tasks?role=worker');
          const data = await res.json();
          if (data.success) {
            setTasks(data.data.map((t: any) => ({
              id_task: t.id_tasks,
              title: t.judul_tugas,
              description: "", 
              duration_estimate: t.estimasi_waktu ?? "",
              compensation: t.kompensasi,
              status: t.task_status,
              created_at: t.applied_at,
              updated_at: t.applied_at,
              id_requester: t.requester?.id_user ?? "",
              application_status: t.application_status
            })));
          }
        } catch (e) {
          console.error("Gagal load history", e);
        }
      }
    }
    loadTasks();
  }, [coords, sortBy, debouncedSearchQuery, role, activeTab, router, locLoading]);

  // Open Apply Modal
  const openApplyModal = () => {
    if (!selectedTask) return;
    setApplyMessage("");
    setApplyBid("");
    setIsApplyModalOpen(true);
  };

  // Submit Apply dengan Pesan (+ harga penawaran untuk task bidding)
  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    // Validasi bid untuk task bidding (sealed bid: wajib dalam range budget requester)
    let numericBid: number | undefined = undefined;
    if (selectedTask.is_bidding) {
      numericBid = parseFloat(applyBid);
      const minBid = selectedTask.budget_min ?? 0;
      const maxBid = selectedTask.budget_max ?? selectedTask.compensation;
      if (!numericBid || numericBid <= 0) {
        showToast("Masukkan harga penawaran Anda terlebih dahulu.");
        return;
      }
      if (numericBid < minBid || numericBid > maxBid) {
        showToast(`Penawaran harus berada di range ${formatCurrency(minBid)} – ${formatCurrency(maxBid)}.`);
        return;
      }
    }

    setApplyLoading(true);

    try {
      const res = await fetch('/api/tasks/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_tasks: selectedTask.id_task,
          pesan: applyMessage.trim() || undefined,
          bid_amount: numericBid,
        })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setAppliedTaskIds(prev => [...prev, selectedTask.id_task]);
        setAppliedAppsMap(prev => ({
          ...prev,
          [selectedTask.id_task]: { status: 'pending' }
        }));
        setIsApplyModalOpen(false);
        setApplyMessage("");
        setApplyBid("");
        showToast(selectedTask?.is_bidding
          ? "Penawaran terkirim! Menunggu pilihan pemberi kerja."
          : "Berhasil melamar tugas! Menunggu persetujuan pemberi kerja.");
      } else {
        showToast(data.message || "Gagal melamar tugas");
      }
    } catch (e) {
      showToast("Terjadi kesalahan jaringan.");
    } finally {
      setApplyLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface font-sans">
      {/* Main Container - Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Feed List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          
          {role === "requester" ? (
            // REQUESTER VIEW: KELOLA TUGAS
            <div className="flex flex-col h-full relative">
              {/* Header for Requester */}
              <div className="pt-6 px-6 pb-4 shrink-0 border-b border-card-border bg-surface-container-lowest/95 backdrop-blur-md z-10 sticky top-0 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                <div>
                  <h2 className="font-headline text-2xl text-on-surface font-extrabold tracking-tight">Kelola Tugas</h2>
                  <p className="font-body-sm text-xs text-on-surface-variant mt-1 font-medium">
                    {tasks.length} tugas yang pernah Anda posting
                  </p>
                  
                  {/* Filters for Requester */}
                  <div className="flex items-center gap-4 mt-3 overflow-x-auto pb-1 no-scrollbar">
                    {[
                      { id: "all", label: "Semua" },
                      { id: "open", label: "Sedang Mencari" },
                      { id: "completed", label: "Sudah Selesai" }
                    ].map(filter => (
                      <button 
                        key={filter.id}
                        onClick={() => setSortBy(filter.id)}
                        className={`font-sans text-xs pb-1 whitespace-nowrap transition-colors border-b-2 cursor-pointer ${sortBy === filter.id || (sortBy === "all" && filter.id === "all") ? "text-primary font-bold border-primary" : "text-on-surface-variant hover:text-on-surface border-transparent font-medium"}`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>
                <Link href="/task/new">
                  <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
                    Post Tugas Baru
                  </Button>
                </Link>
              </div>

              {/* Task List for Requester */}
              <div className="flex-1 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-32">
                  {tasks.length === 0 ? (
                    <div className="col-span-1 md:col-span-2 flex flex-col items-center gap-3 py-16 text-center">
                      <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant">
                        <SearchX className="w-6 h-6" />
                      </div>
                      <p className="font-headline text-sm font-bold text-on-surface">Tidak ada tugas</p>
                      <p className="font-body-sm text-xs text-on-surface-variant">Belum ada tugas yang sesuai dengan filter.</p>
                    </div>
                  ) : (
                    tasks.map((task) => (
                      <TaskCard
                        key={task.id_task}
                        task={task}
                        isSelected={false}
                        onClick={() => router.push(`/task/${task.id_task}`)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            // WORKER VIEW: TUGAS TERSEDIA
              <div className="flex flex-col h-full relative">
                {/* Header with Search and Filters */}
                <div className="pt-6 px-6 pb-4 shrink-0 border-b border-card-border bg-surface-container-lowest/95 backdrop-blur-md z-10 sticky top-0">
                  <h2 className="font-headline text-2xl text-on-surface font-extrabold tracking-tight">Tugas Terdekat</h2>
                  <p className="font-body-sm text-xs text-on-surface-variant mt-1 font-medium">
                    {tasks.length} tugas aktif dalam radius pencarian
                  </p>
                  
                  {/* Search & Filters */}
                  <div className="mt-4">
                    <div className="relative w-full max-w-2xl">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
                      <input 
                        className="w-full bg-surface-container-low border border-card-border rounded-xl min-h-[44px] py-2.5 pl-10 pr-4 font-sans text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest focus:outline-none transition-all shadow-xs" 
                        placeholder="Cari tugas, kategori, atau UMKM..." 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3 overflow-x-auto pb-1 no-scrollbar">
                      {[
                        { id: "all", label: "Semua" },
                        { id: "distance_asc", label: "Terdekat" },
                        { id: "price_desc", label: "Bayaran Tertinggi" },
                        { id: "skills_match", label: "Rekomendasi" }
                      ].map(filter => (
                        <button 
                          key={filter.id}
                          onClick={() => setSortBy(filter.id)}
                          className={`font-sans text-xs pb-1 whitespace-nowrap transition-colors border-b-2 cursor-pointer ${sortBy === filter.id ? "text-primary font-bold border-primary" : "text-on-surface-variant hover:text-on-surface border-transparent font-medium"}`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Task List */}
                <div className="flex-1 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-32">
                    {tasks.length === 0 ? (
                      <div className="col-span-1 md:col-span-2 flex flex-col items-center gap-3 py-16 text-center">
                        <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant">
                          <SearchX className="w-6 h-6" />
                        </div>
                        <p className="font-headline text-sm font-bold text-on-surface">Tidak menemukan tugas</p>
                        <p className="font-body-sm text-xs text-on-surface-variant">Coba sesuaikan filter atau kata kunci pencarian Anda.</p>
                      </div>
                    ) : (
                      tasks.map((task) => (
                        <TaskCard
                          key={task.id_task}
                          task={task}
                          isSelected={selectedTask?.id_task === task.id_task}
                          onClick={() => setSelectedTask(task)}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>

          )}
        </div>

        {/* Right Side: Task Inspector Sidebar */}
        {selectedTask && (
          <TaskInspector 
            task={selectedTask} 
            onClose={() => setSelectedTask(null)} 
            onApply={openApplyModal}
            isApplied={appliedTaskIds.includes(selectedTask.id_task)}
            applicationStatus={appliedAppsMap[selectedTask.id_task]?.status}
          />
        )}
      </div>

      {/* Modal Popup Pengiriman Pesan Lamaran */}
      <Modal isOpen={isApplyModalOpen} onClose={() => setIsApplyModalOpen(false)} title="Lamar Tugas Pekerjaan">
        <form onSubmit={handleApplySubmit} className="flex flex-col gap-4 font-sans text-xs">
          {selectedTask && (
            <div className="p-3 bg-surface-container-low border border-card-border rounded-xl flex flex-col gap-1">
              <span className="font-headline font-bold text-sm text-on-surface">{selectedTask.title}</span>
              {selectedTask.is_bidding ? (
                <span className="font-mono font-bold text-primary tabular-nums flex items-center gap-1.5">
                  <Gavel className="w-3.5 h-3.5" />
                  {formatCurrency(selectedTask.budget_min ?? 0)} – {formatCurrency(selectedTask.budget_max ?? selectedTask.compensation)} (bidding)
                </span>
              ) : (
                <span className="font-mono font-bold text-primary tabular-nums">
                  {formatCurrency(selectedTask.compensation)} / worker
                </span>
              )}
            </div>
          )}

          {/* Input Harga Penawaran — hanya untuk task bidding (sealed bid) */}
          {selectedTask?.is_bidding && (
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-on-surface">
                Harga Penawaran Anda <span className="text-error">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 font-mono font-bold text-on-surface-variant text-xs pointer-events-none">Rp</span>
                <input
                  type="number"
                  min={selectedTask.budget_min ?? 1000}
                  max={selectedTask.budget_max ?? undefined}
                  step={1000}
                  required
                  className="w-full pl-11 pr-3 py-2.5 text-xs font-mono font-bold bg-surface-container-low border border-card-border rounded-xl text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest focus:outline-none min-h-[44px]"
                  placeholder={`Range: ${formatCurrency(selectedTask.budget_min ?? 0)} – ${formatCurrency(selectedTask.budget_max ?? selectedTask.compensation)}`}
                  value={applyBid}
                  onChange={(e) => setApplyBid(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-on-surface-variant leading-relaxed">
                Penawaran bersifat rahasia (sealed bid) — hanya pemberi kerja yang dapat melihatnya.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-on-surface">
              Pesan untuk Pemberi Kerja (Opsional)
            </label>
            <textarea
              className="w-full bg-surface-container-low border border-card-border rounded-xl p-3 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest focus:outline-none min-h-[90px] custom-scrollbar"
              placeholder="Perkenalkan pengalaman Anda atau beri pesan singkat kepada pemberi kerja..."
              value={applyMessage}
              onChange={(e) => setApplyMessage(e.target.value)}
              maxLength={500}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-card-border pt-3 mt-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsApplyModalOpen(false)}
              disabled={applyLoading}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={applyLoading}>
              {applyLoading ? "Mengirim..." : "Kirim Lamaran"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
