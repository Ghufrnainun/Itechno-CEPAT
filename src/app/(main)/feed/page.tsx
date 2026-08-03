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

export default function FeedPage() {
  const router = useRouter();
  const { role } = useCurrentRole();
  const { coords } = useGeolocation();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"feed" | "mytasks">(role === "requester" ? "mytasks" : "feed");
  const [tasks, setTasks] = useState<(Task & { distance: number })[]>([]);
  const [sortBy, setSortBy] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Selected task for inspector
  const [selectedTask, setSelectedTask] = useState<(Task & { distance?: number }) | null>(null);
  
  // Mock data for currently logged in worker
  const [appliedTaskIds, setAppliedTaskIds] = useState<string[]>(["t1", "t2"]);

  useEffect(() => {
    setActiveTab(role === "requester" ? "mytasks" : "feed");
    // Reset selected task when role changes
    setSelectedTask(null);
  }, [role]);

  useEffect(() => {
    async function loadTasks() {
      // Fetch with a large radius since this is the main feed
      let list = await getFeedTasks(coords.latitude, coords.longitude, 10);
      
      // If requester, mock that these are their posted tasks. 
      // We will add random status to them for filtering.
      if (role === "requester") {
        list = list.slice(0, 4); // Just show some tasks as their own
        // add mock status to tasks
        list[0] = { ...list[0], status: "open" } as any; // Sedang mencari
        list[1] = { ...list[1], status: "completed" } as any; // Selesai
        list[2] = { ...list[2], status: "open" } as any; // Sedang mencari
        list[3] = { ...list[3], status: "completed" } as any; // Selesai
        
        if (sortBy === "open") list = list.filter((t: any) => t.status === "open");
        if (sortBy === "completed") list = list.filter((t: any) => t.status === "completed");
      } else {
        // Search logic for worker
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          list = list.filter(t => t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query));
        }

        // Filter by category
        if (sortBy === "fotografi") {
          list = list.filter(t => t.title.toLowerCase().includes("foto") || t.description.toLowerCase().includes("foto"));
        } else if (sortBy === "survey") {
          list = list.filter(t => t.title.toLowerCase().includes("survey") || t.description.toLowerCase().includes("survey"));
        } else if (sortBy === "data_entry") {
          list = list.filter(t => t.title.toLowerCase().includes("input") || t.title.toLowerCase().includes("data"));
        }

        // Sorting logic
        if (sortBy === "distance") {
          list.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        } else if (sortBy === "highest") {
          list.sort((a, b) => b.compensation - a.compensation);
        } else {
          // Default: newest or "all"
          list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
      }

      setTasks(list);
    }
    loadTasks();
  }, [coords, sortBy, searchQuery, role]);

  const handleApply = (taskId: string) => {
    setAppliedTaskIds([...appliedTaskIds, taskId]);
    showToast("Berhasil melamar tugas ini!");
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
            // WORKER VIEW: TUGAS TERSEDIA & LAMARAN SAYA
            activeTab === "feed" ? (
              // FEED TAB (List View)
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
                        { id: "distance", label: "Terdekat" },
                        { id: "highest", label: "Imbalan tertinggi" },
                        { id: "fotografi", label: "Fotografi" },
                        { id: "survey", label: "Survey" },
                        { id: "data_entry", label: "Data Entry" }
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
    </div>
  );
}
