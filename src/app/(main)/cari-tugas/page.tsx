"use client";

import React, { useState, useEffect } from "react";
import { getFeedTasks } from "@/lib/supabase/queries/tasks";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Task } from "@/types/database";
import MapPickerWrapper from "@/features/task/components/MapPickerWrapper";
import { TaskCard } from "@/features/task/components/TaskCard";
import { TaskInspector } from "@/features/task/components/TaskInspector";
import { useToast } from "@/components/ui/Toast";

export default function CariTugasPage() {
  const { coords, loading: locLoading } = useGeolocation();
  const { showToast } = useToast();
  
  const [tasks, setTasks] = useState<(Task & { distance: number })[]>([]);
  const [radius, setRadius] = useState<number>(3); // Default 3km
  
  // Selected task for inspector
  const [selectedTask, setSelectedTask] = useState<(Task & { distance?: number }) | null>(null);
  
  const [appliedTaskIds, setAppliedTaskIds] = useState<string[]>([]);

  useEffect(() => {
    async function loadTasks() {
      if (locLoading) return;
      const fetched = await getFeedTasks(coords.latitude, coords.longitude, radius);
      setTasks(fetched);
      
      // If selectedTask is no longer in radius, maybe clear it? 
      // For now we keep it so the user can still read it.
    }
    loadTasks();
  }, [coords, radius, locLoading]);

  useEffect(() => {
    async function loadAppliedTaskIds() {
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
  }, []);

  const handleApply = async (taskId: string) => {
    try {
      const res = await fetch('/api/tasks/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_tasks: taskId })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setAppliedTaskIds(prev => [...prev, taskId]);
        showToast("Berhasil melamar tugas!");
      } else {
        showToast(data.message || "Gagal melamar tugas");
      }
    } catch (e) {
      showToast("Terjadi kesalahan jaringan.");
    }
  };

  return (
    <div className="flex flex-col h-full font-sans bg-layout-bg overflow-hidden relative">
      {/* Header */}
      <header className="page-header shrink-0 z-30 bg-white relative">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface">Cari Tugas Sekitar</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Temukan tugas yang tersedia di dekat lokasimu saat ini.
          </p>
        </div>
        
        {/* Radius Filter */}
        <div className="flex flex-col items-end gap-1">
          <label className="font-label-sm text-label-sm text-on-surface font-semibold flex justify-between w-[200px]">
            <span>Radius Pencarian</span>
            <span className="text-primary">{radius} km</span>
          </label>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-[200px] accent-primary"
          />
        </div>
      </header>

      {/* Main Container - Relative for Absolute Children */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-surface-container-low">
        
        {/* Background Map Layer */}
        <div className="absolute inset-0 z-0">
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
          <div className="absolute top-4 left-[370px] z-10 bg-white/95 border border-outline-variant shadow rounded px-md py-xs font-label-sm text-label-sm flex items-center gap-xs">
            <span className="pulse-dot w-2.5 h-2.5 rounded-full bg-secondary-container inline-block"></span>
            Peta Radar Aktif
          </div>
        </div>

        {/* Left Sidebar - Task List */}
        <aside className="absolute top-0 bottom-0 left-0 w-[350px] bg-white/95 backdrop-blur-md border-r border-outline-variant shadow-lg z-10 flex flex-col animate-slide-in">
          <div className="p-md border-b border-outline-variant/50 bg-surface">
            <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center justify-between">
              Tugas Ditemukan
              <span className="bg-primary-container text-on-primary-container text-xs px-2 py-1 rounded-full font-mono font-bold">
                {tasks.length}
              </span>
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-sm flex flex-col gap-sm custom-scrollbar">
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                <span className="material-symbols-outlined text-outline text-[40px] mb-2">location_off</span>
                <p className="font-body-sm text-on-surface-variant">Tidak ada tugas dalam radius {radius} km.</p>
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
    </div>
  );
}
