"use client";

import React, { useState, useEffect } from "react";
import { getFeedTasks } from "@/lib/supabase/queries/tasks";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Task } from "@/types/database";
import MapPickerWrapper from "@/features/task/components/MapPickerWrapper";
import { TaskCard } from "@/features/task/components/TaskCard";
import { TaskInspector } from "@/features/task/components/TaskInspector";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { MapPinOff, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CariTugasPage() {
  const { coords, loading: locLoading } = useGeolocation();
  const { showToast } = useToast();
  
  const [tasks, setTasks] = useState<(Task & { distance: number })[]>([]);
  const [radius, setRadius] = useState<number>(3);
  
  const [selectedTask, setSelectedTask] = useState<(Task & { distance?: number }) | null>(null);
  const [appliedTaskIds, setAppliedTaskIds] = useState<string[]>([]);

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [taskToApply, setTaskToApply] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function loadTasks() {
      if (locLoading) return;
      const fetched = await getFeedTasks(coords.latitude, coords.longitude, radius);
      setTasks(fetched);
    }
    loadTasks();
  }, [coords, radius, locLoading]);

  useEffect(() => {
    async function loadAppliedTaskIds() {
      try {
        const res = await fetch('/api/tasks/applications/me');
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        if (data.success && Array.isArray(data.data)) {
          setAppliedTaskIds(data.data.map((app: any) => app.id_tasks));
        }
      } catch (e) {
        console.error("Gagal load applied task ids", e);
      }
    }
    loadAppliedTaskIds();
  }, []);

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
      const data = await res.json().catch(() => ({}));
      
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
    <div className="flex flex-col h-full font-sans bg-surface overflow-hidden relative">
      {/* Header */}
      <header className="page-header shrink-0 z-30 bg-surface-container-lowest border-b border-card-border px-6 py-5 flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl text-on-surface font-extrabold tracking-tight">Cari Tugas Sekitar</h1>
          <p className="font-body-sm text-sm text-on-surface-variant font-medium mt-0.5">
            Temukan tugas yang tersedia di dekat lokasimu saat ini.
          </p>
        </div>
        
        {/* Radius Filter */}
        <div className="flex flex-col items-end gap-1.5">
          <label className="font-sans text-xs text-on-surface font-semibold flex justify-between w-[180px]">
            <span>Radius Pencarian</span>
            <span className="text-primary font-mono font-bold tabular-nums">{radius} km</span>
          </label>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-[180px] accent-primary cursor-pointer"
          />
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 w-full h-full flex flex-col md:flex-row relative overflow-hidden bg-surface">
        
        {/* Background Map Layer */}
        <div className="h-[45vh] md:h-full md:flex-1 relative z-0 order-1 md:order-2">
          <MapPickerWrapper
            center={{ latitude: coords.latitude, longitude: coords.longitude }}
            tasks={tasks}
            radiusKm={radius}
            selectedTaskId={selectedTask?.id_task}
            onTaskClick={(taskId) => {
              const clicked = tasks.find(t => t.id_task === taskId);
              if (clicked) setSelectedTask(clicked);
            }}
          />
          <div className="absolute top-4 left-4 md:left-6 z-10 bg-surface-container-lowest/95 backdrop-blur border border-card-border shadow-xs rounded-lg px-3 py-1.5 font-mono text-xs flex items-center gap-2 font-bold text-on-surface">
            <div className="pulse-dot w-2 h-2 rounded-full bg-primary inline-block" />
            Peta Radar Aktif
          </div>
        </div>

        {/* Left Sidebar - Task List */}
        <aside className="flex-1 md:w-[350px] bg-surface-container-lowest border-t md:border-t-0 md:border-r border-card-border shadow-xs z-10 flex flex-col order-2 md:order-1">
          <div className="p-4 border-b border-card-border bg-surface-container-low flex items-center justify-between">
            <h3 className="font-headline text-sm font-bold text-on-surface">
              Tugas Ditemukan
            </h3>
            <span className="bg-primary/10 text-primary border border-primary/20 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold tabular-nums">
              {tasks.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 custom-scrollbar">
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center px-4 gap-2">
                <MapPinOff className="w-8 h-8 text-outline-variant/60" />
                <p className="font-body-sm text-xs text-on-surface-variant">Tidak ada tugas dalam radius {radius} km.</p>
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
        </aside>

        {/* Right Sidebar - Task Inspector */}
        {selectedTask && (
          <div className="absolute top-0 bottom-0 right-0 h-full z-20">
            <TaskInspector 
              task={selectedTask} 
              onClose={() => setSelectedTask(null)} 
              onApply={() => handleApply(selectedTask.id_task)}
              isApplied={appliedTaskIds.includes(selectedTask.id_task)}
            />
          </div>
        )}

      </div>

      {/* Modal: Lamar Pekerjaan */}
      <Modal isOpen={isApplyModalOpen} onClose={() => setIsApplyModalOpen(false)} title="Kirim Lamaran Kerja">
        <form onSubmit={handleApplySubmit} className="flex flex-col gap-4 font-sans text-xs">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-on-surface">
              Pesan (Opsional)
            </label>
            <textarea
              value={applyMessage}
              onChange={(e) => setApplyMessage(e.target.value)}
              placeholder="Ceritakan mengapa Anda cocok untuk pekerjaan ini..."
              rows={4}
              maxLength={500}
              className="w-full bg-surface-container-low border border-card-border rounded-xl p-3 text-base sm:text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest focus:outline-none resize-none min-h-[90px]"
            />
            <span className="text-right font-mono text-[10px] text-on-surface-variant tabular-nums">
              {applyMessage.length}/500
            </span>
          </div>

          <div className="flex gap-2 justify-end mt-1 border-t border-card-border pt-3">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsApplyModalOpen(false)} disabled={actionLoading}>
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
