"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentRole } from "@/app/(main)/layout";
import { getFeedTasks } from "@/lib/supabase/queries/tasks";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Task } from "@/types/database";
import { TaskCard } from "@/features/task/components/TaskCard";
import { TaskInspector } from "@/features/task/components/TaskInspector";
import { Button } from "@/components/ui/Button";
import { FeedSkeleton } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/utils/format";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Plus, Search, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FeedPage() {
  const router = useRouter();
  const { role } = useCurrentRole();
  const { coords, loading: locLoading } = useGeolocation();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"feed" | "mytasks">(role === "requester" ? "mytasks" : "feed");
  const [tasks, setTasks] = useState<(Task & { distance: number })[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [categories, setCategories] = useState<{id_category: string, nama_kategori: string}[]>([]);
  const [sortBy, setSortBy] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Selected task for inspector
  const [selectedTask, setSelectedTask] = useState<(Task & { distance?: number }) | null>(null);
  
  const [appliedTaskIds, setAppliedTaskIds] = useState<string[]>([]);
  const [appliedAppsMap, setAppliedAppsMap] = useState<Record<string, { status: string }>>({});

  // Apply Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);

  useEffect(() => {
    setActiveTab(role === "requester" ? "mytasks" : "feed");
    setSelectedTask(null);
  }, [role]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories');
        if (!res.ok) return;
        const json = await res.json().catch(() => ({}));
        if (json.success && Array.isArray(json.data)) {
          setCategories(json.data);
        }
      } catch (e) {
        console.error("Gagal load kategori", e);
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    if (role !== "worker") return;

    let isMounted = true;

    async function loadAppliedTaskIds() {
      try {
        const res = await fetch('/api/tasks/applications/me');
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        if (data.success && Array.isArray(data.data) && isMounted) {
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

    return () => {
      isMounted = false;
    };
  }, [role]);

  useEffect(() => {
    async function loadTasks() {
      if (role === "requester") {
        router.push("/tugas");
        return;
      }

      setIsLoadingTasks(true);
      try {
        if (activeTab === "feed") {
          if (locLoading) {
            setIsLoadingTasks(false);
            return;
          }
          
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
             searchQuery || undefined, 
             categoryId, 
             sortOrder
          );

          setTasks(list);
        } else {
          const res = await fetch('/api/users/me/tasks?role=worker');
          if (!res.ok) {
            setTasks([]);
            return;
          }
          const data = await res.json().catch(() => ({}));
          if (data.success && Array.isArray(data.data)) {
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
        }
      } catch (e) {
        console.error("Gagal load tasks", e);
      } finally {
        setIsLoadingTasks(false);
      }
    }
    loadTasks();
  }, [coords, sortBy, searchQuery, role, activeTab, router, locLoading]);

  const openApplyModal = () => {
    setApplyMessage("");
    setIsApplyModalOpen(true);
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    setApplyLoading(true);
    try {
      const res = await fetch(`/api/tasks/${selectedTask.id_task}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pesan: applyMessage })
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setAppliedTaskIds(prev => [...prev, selectedTask.id_task]);
        setAppliedAppsMap(prev => ({
          ...prev,
          [selectedTask.id_task]: { status: 'pending' }
        }));
        showToast("Lamaran Anda berhasil dikirim!");
        setIsApplyModalOpen(false);
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
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
          {role === "requester" ? (
            <div className="flex flex-col h-full relative">
              <div className="pt-6 px-6 pb-4 shrink-0 border-b border-card-border bg-surface-container-lowest/95 backdrop-blur-md z-10 sticky top-0 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                <div>
                  <h2 className="font-headline text-2xl text-on-surface font-extrabold tracking-tight">Kelola Tugas</h2>
                  <p className="font-body-sm text-sm text-on-surface-variant mt-1 font-medium">
                    {tasks.length} tugas yang pernah Anda posting
                  </p>
                  
                  <div className="flex items-center gap-4 mt-3 overflow-x-auto pb-1 no-scrollbar">
                    {[
                      { id: "all", label: "Semua" },
                      { id: "open", label: "Sedang Mencari" },
                      { id: "completed", label: "Sudah Selesai" }
                    ].map(filter => (
                      <button 
                        key={filter.id}
                        onClick={() => setSortBy(filter.id)}
                        className={cn(
                          "font-sans text-xs pb-1.5 whitespace-nowrap transition-colors duration-150 border-b-2 cursor-pointer",
                          sortBy === filter.id || (sortBy === "all" && filter.id === "all")
                            ? "text-primary font-bold border-primary" 
                            : "text-on-surface-variant hover:text-on-surface border-transparent font-medium"
                        )}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>
                <Link href="/task/new">
                  <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
                    Post Tugas Baru
                  </Button>
                </Link>
              </div>

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
            <div className="flex flex-col h-full relative">
              {/* Header with Search and Filters */}
              <div className="pt-6 px-6 pb-4 shrink-0 border-b border-card-border bg-surface-container-lowest/95 backdrop-blur-md z-10 sticky top-0">
                <h2 className="font-headline text-2xl text-on-surface font-extrabold tracking-tight">Tugas Terdekat</h2>
                <p className="font-body-sm text-sm text-on-surface-variant mt-0.5 font-medium">
                  {tasks.length} tugas aktif dalam radius pencarian
                </p>
                
                <div className="mt-4">
                  <div className="relative w-full max-w-2xl">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
                    <input 
                      className="w-full bg-surface-container-low border border-card-border rounded-xl min-h-[44px] py-2.5 pl-10 pr-4 font-sans text-base sm:text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest focus:outline-none transition-all shadow-xs" 
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
                        className={cn(
                          "font-sans text-xs pb-1.5 whitespace-nowrap transition-colors duration-150 border-b-2 cursor-pointer",
                          sortBy === filter.id 
                            ? "text-primary font-bold border-primary" 
                            : "text-on-surface-variant hover:text-on-surface border-transparent font-medium"
                        )}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Task List */}
              <div className="flex-1 p-6">
                {isLoadingTasks ? (
                  <FeedSkeleton />
                ) : tasks.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant">
                      <SearchX className="w-6 h-6" />
                    </div>
                    <p className="font-headline text-sm font-bold text-on-surface">Tidak menemukan tugas</p>
                    <p className="font-body-sm text-xs text-on-surface-variant">Coba sesuaikan filter atau kata kunci pencarian Anda.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-32">
                    {tasks.map((task) => (
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
            <div className="p-3 bg-surface-container-low border border-card-border rounded-lg flex flex-col gap-1">
              <span className="font-headline font-bold text-sm text-on-surface">{selectedTask.title}</span>
              <span className="font-mono font-bold text-primary tabular-nums">
                {formatCurrency(selectedTask.compensation)} / worker
              </span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-on-surface">
              Pesan untuk Pemberi Kerja (Opsional)
            </label>
            <textarea
              className="w-full bg-surface-container-low border border-card-border rounded-xl p-3 text-base sm:text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest focus:outline-none min-h-[90px] custom-scrollbar"
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
            <Button type="submit" size="sm" disabled={applyLoading}>
              {applyLoading ? "Mengirim..." : "Kirim Lamaran"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
