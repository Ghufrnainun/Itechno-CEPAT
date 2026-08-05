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
  const { coords } = useGeolocation();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"feed" | "mytasks">(role === "requester" ? "mytasks" : "feed");
  const [tasks, setTasks] = useState<(Task & { distance: number })[]>([]);
  const [categories, setCategories] = useState<{id_category: string, nama_kategori: string}[]>([]);
  const [sortBy, setSortBy] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Selected task for inspector
  const [selectedTask, setSelectedTask] = useState<(Task & { distance?: number }) | null>(null);
  
  const [appliedTaskIds, setAppliedTaskIds] = useState<string[]>([]);

  // Apply Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [taskToApply, setTaskToApply] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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

  useEffect(() => {
    async function loadAppliedTaskIds() {
      if (role !== "worker") return;
      try {
        const res = await fetch('/api/tasks/applications/me');
        const data = await res.json();
        if (data.success) {
          setAppliedTaskIds(data.data.map((app: any) => app.id_tasks));
        }
      } catch (e) {
        console.error("Gagal load applied task ids", e);
      }
    }
    loadAppliedTaskIds();
  }, [role]);

  useEffect(() => {
    async function loadTasks() {
      if (role === "requester") {
        // Jika requester nyasar ke /feed, arahkan ke /tugas
        router.push("/tugas");
        return;
      }

      if (activeTab === "feed") {
        let sortOrder = "newest";
        let categoryId: string | undefined = undefined;

        if (sortBy === "distance_asc" || sortBy === "price_desc") {
           sortOrder = sortBy;
        } else if (sortBy !== "all") {
           categoryId = sortBy;
        }

        // Fetch all tasks without radius limit, but pass coords for distance calculation
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
        // Load Lamaran Saya
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
  }, [coords, sortBy, searchQuery, role, activeTab, router]);

  const handleApply = (taskId: string) => {
    setTaskToApply(taskId);
    setApplyMessage("");
    setIsApplyModalOpen(true);
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskToApply) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskToApply}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pesan: applyMessage })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setAppliedTaskIds(prev => [...prev, taskToApply]);
        showToast("Berhasil melamar tugas!");
        setIsApplyModalOpen(false);
      } else {
        showToast(data.message || "Gagal melamar tugas");
      }
    } catch (e) {
      showToast("Terjadi kesalahan jaringan.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-layout-bg font-sans">
      {/* Header Tabs (Only for Worker) */}
      {role === "worker" && (
        <header className="page-header shrink-0 flex items-end">
          <div className="flex gap-lg">
            <button
              onClick={() => { setActiveTab("feed"); setSelectedTask(null); }}
              className={`tab-underline ${activeTab === "feed" ? "active" : ""}`}
            >
              Tugas Tersedia
            </button>
            <button
              onClick={() => { setActiveTab("mytasks"); setSelectedTask(null); }}
              className={`tab-underline ${activeTab === "mytasks" ? "active" : ""}`}
            >
              Lamaran Saya
            </button>
          </div>
        </header>
      )}

      {/* Main Container - Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Feed List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          
          {role === "requester" ? (
            // REQUESTER VIEW: KELOLA TUGAS
            <div className="flex flex-col h-full relative">
              {/* Header for Requester */}
              <div className="pt-4 md:pt-8 px-4 md:px-8 pb-4 shrink-0 border-b border-outline-variant/30 bg-surface/95 backdrop-blur-sm z-10 sticky top-0 flex flex-col sm:flex-row justify-between sm:items-end gap-md">
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
              <div className="flex-1 p-4 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md pb-32">
                  {tasks.length === 0 ? (
                    <div className="col-span-1 md:col-span-2 flex flex-col items-center gap-sm py-16 text-center">
                      <span className="material-symbols-outlined text-outline text-[48px]">search_off</span>
                      <p className="font-headline-sm text-headline-sm text-on-surface font-bold">Tidak ada tugas</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">Belum ada tugas yang sesuai dengan filter.</p>
                    </div>
                  ) : (
                    tasks.map((task, index) => (
                      <TaskCard
                        key={task.id_task || `req-task-${index}`}
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
            // WORKER VIEW: TUGAS TERSEDIA & LAMARAN SAYA
            activeTab === "feed" ? (
              // FEED TAB (List View)
              <div className="flex flex-col h-full relative">
                {/* Header with Search and Filters */}
                <div className="pt-4 md:pt-8 px-4 md:px-8 pb-4 shrink-0 border-b border-outline-variant/30 bg-surface/95 backdrop-blur-sm z-10 sticky top-0">
                  <h2 className="font-headline-lg text-headline-lg text-on-surface font-extrabold">Tugas Terdekat</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-xs font-medium">
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
                        { id: "price_desc", label: "Imbalan tertinggi" },
                        ...categories.map(c => ({ id: c.id_category, label: c.nama_kategori }))
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
                <div className="flex-1 p-4 md:p-8">
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
                      tasks.map((task, index) => (
                        <TaskCard
                          key={task.id_task ? `${task.id_task}-${index}` : `task-${index}`}
                          task={task}
                          isSelected={selectedTask?.id_task === task.id_task}
                          onClick={() => setSelectedTask(task)}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // TAB 2 - MY TASKS / APPLICATIONS
              <div className="max-w-4xl mx-auto p-lg flex flex-col gap-md pt-xl">
                <h2 className="font-headline-md text-headline-md text-on-surface font-extrabold">Lamaran Pekerjaan Anda</h2>
                <div className="bg-white border border-outline-variant rounded-xl divide-y divide-outline-variant overflow-hidden mt-sm shadow-sm">
                  {appliedTaskIds.length === 0 ? (
                    <div className="p-xl text-center flex flex-col items-center gap-sm py-16">
                      <span className="material-symbols-outlined text-outline text-[48px]">
                        assignment_turned_in
                      </span>
                      <p className="font-body-md text-body-md text-on-surface-variant">
                        Anda belum melamar pekerjaan apapun hari ini.
                      </p>
                      <Button onClick={() => setActiveTab("feed")} className="mt-sm font-bold">
                        Mulai Cari Tugas
                      </Button>
                    </div>
                  ) : (
                    appliedTaskIds.map((taskId) => {
                      const task = MOCK_TASKS.find((t) => t.id_task === taskId);
                      if (!task) return null;
                      return (
                        <div 
                          key={taskId} 
                          onClick={() => setSelectedTask(task)}
                          className={`p-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md cursor-pointer transition-colors ${selectedTask?.id_task === taskId ? "bg-surface-container border-l-4 border-l-primary" : "hover:bg-surface-container-low"}`}
                        >
                          <div>
                            <h3 className="font-body-md text-body-md font-bold text-on-surface">{task.title}</h3>
                            <p className="font-body-sm text-body-sm text-on-surface-variant font-mono mt-xs">
                              Kompensasi: <span className="font-bold text-on-surface">{formatCurrency(task.compensation)}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-md">
                            <span className="bg-amber-500/10 text-amber-600 font-label-sm text-label-sm px-sm py-[4px] border border-amber-500/20 rounded-full font-bold uppercase">
                              MENUNGGU PERSETUJUAN
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )
          )}
        </div>

        {/* Right Side: Task Inspector Sidebar */}
        {selectedTask && (
          <TaskInspector 
            task={selectedTask} 
            onClose={() => setSelectedTask(null)} 
            onApply={() => handleApply(selectedTask.id_task)}
            isApplied={appliedTaskIds.includes(selectedTask.id_task)}
          />
        )}
      </div>

      {/* Modal: Lamar Pekerjaan */}
      <Modal isOpen={isApplyModalOpen} onClose={() => setIsApplyModalOpen(false)} title="Kirim Lamaran Kerja">
        <form onSubmit={handleApplySubmit} className="flex flex-col gap-md">
          <div className="flex flex-col gap-xs">
            <label className="font-body-sm text-body-sm text-on-surface-variant font-medium">
              Pesan (Opsional)
            </label>
            <textarea
              value={applyMessage}
              onChange={(e) => setApplyMessage(e.target.value)}
              placeholder="Ceritakan mengapa Anda cocok untuk pekerjaan ini..."
              rows={4}
              maxLength={500}
              className="w-full bg-surface-container border border-outline rounded p-sm text-on-surface font-body-sm text-body-sm focus:outline-none focus:border-primary resize-none"
            />
            <span className="text-right font-label-sm text-label-sm text-on-surface-variant">
              {applyMessage.length}/500
            </span>
          </div>

          <div className="flex gap-sm justify-end mt-sm">
            <Button type="button" variant="ghost" onClick={() => setIsApplyModalOpen(false)} disabled={actionLoading}>
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={actionLoading}>
              {actionLoading ? "Mengirim..." : "Kirim Lamaran"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
