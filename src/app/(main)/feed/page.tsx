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

import { Modal } from "@/components/ui/Modal";

export default function FeedPage() {
  const router = useRouter();
  const { role } = useCurrentRole();
  const { coords, loading: locLoading } = useGeolocation();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"feed" | "mytasks">(role === "requester" ? "mytasks" : "feed");
  const [tasks, setTasks] = useState<(Task & { distance: number })[]>([]);
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
           searchQuery || undefined, 
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
  }, [coords, sortBy, searchQuery, role, activeTab, router, locLoading]);

  // Open Apply Modal
  const openApplyModal = () => {
    if (!selectedTask) return;
    setApplyMessage("");
    setIsApplyModalOpen(true);
  };

  // Submit Apply dengan Pesan
  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    setApplyLoading(true);

    try {
      const res = await fetch('/api/tasks/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_tasks: selectedTask.id_task,
          pesan: applyMessage.trim() || undefined,
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
        showToast("Berhasil melamar tugas! Menunggu persetujuan pemberi kerja.");
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
    <div className="flex flex-col h-full bg-layout-bg font-sans">
      {/* Main Container - Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Feed List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          
          {role === "requester" ? (
            // REQUESTER VIEW: KELOLA TUGAS
            <div className="flex flex-col h-full relative">
              {/* Header for Requester */}
              <div className="pt-xl px-xl pb-md shrink-0 border-b border-outline-variant/30 bg-surface/95 backdrop-blur-sm z-10 sticky top-0 flex flex-col sm:flex-row justify-between sm:items-end gap-md">
                <div>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface font-extrabold">Kelola Tugas</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-xs font-medium">
                    {tasks.length} tugas yang pernah Anda posting
                  </p>
                  
                  {/* Filters for Requester */}
                  <div className="flex items-center gap-lg mt-md overflow-x-auto pb-sm no-scrollbar">
                    {[
                      { id: "all", label: "Semua" },
                      { id: "open", label: "Sedang Mencari" },
                      { id: "completed", label: "Sudah Selesai" }
                    ].map(filter => (
                      <button 
                        key={filter.id}
                        onClick={() => setSortBy(filter.id)}
                        className={`font-label-md text-label-md pb-1 whitespace-nowrap transition-colors border-b-2 ${sortBy === filter.id || (sortBy === "all" && filter.id === "all") ? "text-primary font-bold border-primary" : "text-on-surface-variant hover:text-on-surface border-transparent font-medium"}`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>
                <Link href="/task/new">
                  <Button variant="primary" className="font-bold">
                    <span className="material-symbols-outlined text-[18px]">add</span> Post Tugas Baru
                  </Button>
                </Link>
              </div>

              {/* Task List for Requester */}
              <div className="flex-1 p-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md pb-32">
                  {tasks.length === 0 ? (
                    <div className="col-span-1 md:col-span-2 flex flex-col items-center gap-sm py-16 text-center">
                      <span className="material-symbols-outlined text-outline text-[48px]">search_off</span>
                      <p className="font-headline-sm text-headline-sm text-on-surface font-bold">Tidak ada tugas</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">Belum ada tugas yang sesuai dengan filter.</p>
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
                <div className="pt-xl px-xl pb-md shrink-0 border-b border-outline-variant/30 bg-surface/95 backdrop-blur-sm z-10 sticky top-0">
                  <h2 className="font-headline-lg text-headline-lg text-on-surface font-extrabold">Tugas Terdekat</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-sm font-medium">
                    {tasks.length} tugas aktif dalam radius pencarian
                  </p>
                  
                  {/* Search & Filters */}
                  <div className="mt-lg">
                    <div className="relative w-full max-w-2xl">
                      <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">search</span>
                      <input 
                        className="w-full bg-surface border border-[#DDE7E1] rounded-lg py-sm pl-12 pr-md font-body-sm text-body-sm text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:outline-none transition-colors" 
                        placeholder="Cari tugas, kategori, atau UMKM..." 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex items-center gap-lg mt-md overflow-x-auto pb-sm no-scrollbar">
                      {[
                        { id: "all", label: "Semua" },
                        { id: "distance_asc", label: "Terdekat" },
                        { id: "price_desc", label: "Bayaran Tertinggi" },
                        { id: "skills_match", label: "Rekomendasi" }
                      ].map(filter => (
                        <button 
                          key={filter.id}
                          onClick={() => setSortBy(filter.id)}
                          className={`font-label-md text-label-md pb-1 whitespace-nowrap transition-colors border-b-2 ${sortBy === filter.id ? "text-primary font-bold border-primary" : "text-on-surface-variant hover:text-on-surface border-transparent font-medium"}`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Task List */}
                <div className="flex-1 p-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-md pb-32">
                    {tasks.length === 0 ? (
                      <div className="col-span-1 md:col-span-2 flex flex-col items-center gap-sm py-16 text-center">
                        <span className="material-symbols-outlined text-outline text-[48px]">
                          search_off
                        </span>
                        <p className="font-headline-sm text-headline-sm text-on-surface font-bold">Tidak menemukan tugas</p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">Coba sesuaikan filter atau kata kunci pencarian Anda.</p>
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
        <form onSubmit={handleApplySubmit} className="flex flex-col gap-md">
          {selectedTask && (
            <div className="p-sm bg-surface-container-low border border-outline-variant/60 rounded-lg flex flex-col gap-xs">
              <span className="font-body-md text-body-md font-bold text-on-surface">{selectedTask.title}</span>
              <span className="font-label-sm text-label-sm font-bold text-primary font-mono">
                {formatCurrency(selectedTask.compensation)} / worker
              </span>
            </div>
          )}

          <div className="flex flex-col gap-xs">
            <label className="font-body-sm text-body-sm text-on-surface-variant font-medium">
              Pesan untuk Pemberi Kerja (Opsional)
            </label>
            <textarea
              className="input-field min-h-[100px] font-body-sm custom-scrollbar"
              placeholder="Perkenalkan pengalaman Anda atau beri pesan singkat kepada pemberi kerja..."
              value={applyMessage}
              onChange={(e) => setApplyMessage(e.target.value)}
              maxLength={500}
            />
          </div>

          <div className="flex justify-end gap-sm border-t border-outline-variant/30 pt-md mt-sm">
            <button
              type="button"
              onClick={() => setIsApplyModalOpen(false)}
              className="font-label-md text-label-md font-bold px-md py-sm rounded border border-outline-variant/60 hover:bg-surface-container cursor-pointer transition-colors"
              disabled={applyLoading}
            >
              Batal
            </button>
            <Button type="submit" variant="primary" disabled={applyLoading}>
              {applyLoading ? "Mengirim..." : "Kirim Lamaran"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
