"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TaskStatus } from "@/types/database";

// ─── Types ───────────────────────────────────────────────────────────────────

interface RequesterTask {
  id_tasks: string;
  judul_tugas: string;
  estimasi_waktu: string | null;
  kompensasi: number;
  status: string;
  created_at: string;
  completed_at: string | null;
  applicant_count: number;
  accepted_worker: { id_user: string; nama_lengkap: string; avatar_url: string | null } | null;
  received_rating: number | null;
}

// ─── Filter Tabs ─────────────────────────────────────────────────────────────

const FILTERS: { label: string; status: string | null; icon: string }[] = [
  { label: "Semua", status: null, icon: "list_alt" },
  { label: "Aktif", status: "open", icon: "radio_button_checked" },
  { label: "Berjalan", status: "in_progress", icon: "play_circle" },
  { label: "Diterima", status: "accepted", icon: "handshake" },
  { label: "Sudah Selesai", status: "completed", icon: "task_alt" },
  { label: "Dibatalkan", status: "cancelled", icon: "cancel" },
];

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskManagementCard({ task, onRefresh }: { task: RequesterTask; onRefresh: () => void }) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Yakin ingin membatalkan task ini?")) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/tasks/${task.id_tasks}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        onRefresh();
      } else {
        alert(data.message || "Gagal membatalkan task.");
      }
    } finally {
      setCancelling(false);
    }
  };

  const statusColors: Record<string, string> = {
    open: "bg-blue-50 border-blue-200",
    accepted: "bg-amber-50 border-amber-200",
    in_progress: "bg-purple-50 border-purple-200",
    completed: "bg-green-50 border-green-200",
    cancelled: "bg-red-50 border-red-200",
  };

  const borderClass = statusColors[task.status] ?? "bg-white border-outline-variant";

  return (
    <Link href={`/task/${task.id_tasks}`}>
      <div className={`rounded-xl border p-md flex flex-col gap-sm cursor-pointer hover:shadow-md transition-shadow ${borderClass}`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-sm">
          <div className="flex-1 min-w-0">
            <h3 className="font-label-md text-label-md font-semibold text-on-surface line-clamp-1">
              {task.judul_tugas}
            </h3>
            <p className="font-label-sm text-[11px] text-on-surface-variant mt-0.5">
              Diposting {formatDate(task.created_at)}
              {task.completed_at && ` • Selesai ${formatDate(task.completed_at)}`}
            </p>
          </div>
          <Badge status={task.status as TaskStatus} />
        </div>

        {/* Info Row */}
        <div className="flex items-center justify-between flex-wrap gap-sm">
          <div className="flex items-center gap-md text-on-surface-variant">
            {/* Kompensasi */}
            <div className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-[14px] text-primary" aria-hidden="true">payments</span>
              <span className="font-label-sm text-label-sm font-bold text-primary">
                {formatCurrency(task.kompensasi)}
              </span>
            </div>
            {/* Estimasi */}
            {task.estimasi_waktu && (
              <div className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-[14px]" aria-hidden="true">schedule</span>
                <span className="font-label-sm text-[11px]">{task.estimasi_waktu}</span>
              </div>
            )}
            {/* Jumlah pelamar */}
            <div className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">people</span>
              <span className="font-label-sm text-[11px]">{task.applicant_count} pelamar</span>
            </div>
          </div>
        </div>

        {/* Worker chip (jika sudah ada worker accepted) */}
        {task.accepted_worker && (
          <div className="flex items-center gap-xs bg-white/70 rounded-lg px-sm py-xs border border-outline-variant/50 self-start">
            <div className="w-5 h-5 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-[10px] font-bold shrink-0">
              {task.accepted_worker.nama_lengkap.charAt(0)}
            </div>
            <span className="font-label-sm text-[11px] font-medium text-on-surface">
              Worker: {task.accepted_worker.nama_lengkap}
            </span>
            {task.received_rating !== null && (
              <span className="text-amber-500 text-[11px] font-bold ml-xs">
                ★ {task.received_rating.toFixed(1)}
              </span>
            )}
          </div>
        )}

        {/* Footer actions */}
        {task.status === "open" && (
          <div className="flex justify-end gap-sm pt-xs border-t border-outline-variant/30 mt-xs">
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="font-label-sm text-[11px] text-error font-semibold px-sm py-xs rounded hover:bg-error/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              {cancelling ? "Membatalkan..." : "Batalkan Task"}
            </button>
            <button
              onClick={(e) => { e.preventDefault(); router.push(`/task/${task.id_tasks}`); }}
              className="font-label-sm text-[11px] text-primary font-semibold px-sm py-xs rounded hover:bg-primary/10 transition-colors cursor-pointer"
            >
              Lihat Detail →
            </button>
          </div>
        )}

        {task.status === "completed" && task.received_rating === null && (
          <div className="flex justify-end pt-xs border-t border-outline-variant/30 mt-xs">
            <button
              onClick={(e) => { e.preventDefault(); router.push(`/task/${task.id_tasks}`); }}
              className="font-label-sm text-[11px] text-primary font-semibold px-sm py-xs rounded bg-interaction-bg border border-outline-variant hover:bg-primary/10 transition-colors cursor-pointer flex items-center gap-xs"
            >
              <span className="material-symbols-outlined text-[13px]" aria-hidden="true">star</span>
              Berikan Rating
            </button>
          </div>
        )}
      </div>
    </Link>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ activeFilter }: { activeFilter: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-md text-center">
      <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
        <span className="material-symbols-outlined text-[32px] text-outline" aria-hidden="true">
          {activeFilter === "completed" ? "task_alt" : "assignment_late"}
        </span>
      </div>
      <div>
        <h3 className="font-headline-sm text-headline-sm text-on-surface">
          {activeFilter === "completed"
            ? "Belum Ada Task yang Selesai"
            : activeFilter === "open"
            ? "Belum Ada Task Aktif"
            : "Belum Ada Task"}
        </h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
          {activeFilter === "completed"
            ? "Task yang sudah selesai akan muncul di sini."
            : "Mulai posting tugas baru untuk menemukan worker terbaik."}
        </p>
      </div>
      {activeFilter !== "completed" && (
        <Link href="/task/new">
          <Button variant="primary">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
            Post Tugas Baru
          </Button>
        </Link>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function KelolaTaskPage() {
  const [tasks, setTasks] = useState<RequesterTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ role: "requester" });
      if (activeFilter) params.set("status", activeFilter);

      const res = await fetch(`/api/users/me/tasks?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTasks(data.data);
      }
    } catch {
      console.error("Gagal memuat daftar task.");
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = tasks; // sudah difilter dari API

  // Stats summary
  const totalSelesai = tasks.filter((t) => t.status === "completed").length;
  const totalAktif = tasks.filter((t) => t.status === "open").length;
  const totalBerjalan = tasks.filter((t) => t.status === "in_progress" || t.status === "accepted").length;

  return (
    <div className="flex flex-col h-full bg-layout-bg font-sans">
      {/* Header */}
      <header className="page-header">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-extrabold">Kelola Tugas</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant font-medium">
            Pantau semua task yang pernah Anda posting
          </p>
        </div>
        <Link href="/task/new">
          <Button variant="primary">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
            Post Tugas Baru
          </Button>
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto p-lg flex flex-col gap-lg">

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-md">
            <div className="bento-card text-center">
              <div className="font-headline-md text-headline-md font-bold text-on-surface font-mono">{totalAktif}</div>
              <div className="font-label-sm text-label-sm text-on-surface-variant mt-xs">Task Aktif</div>
            </div>
            <div className="bento-card text-center">
              <div className="font-headline-md text-headline-md font-bold text-primary font-mono">{totalBerjalan}</div>
              <div className="font-label-sm text-label-sm text-on-surface-variant mt-xs">Sedang Berjalan</div>
            </div>
            <div className="relative overflow-hidden bento-card text-center bg-primary-container">
              <div className="font-headline-md text-headline-md font-bold text-on-primary font-mono">{totalSelesai}</div>
              <div className="font-label-sm text-label-sm text-on-primary/80 mt-xs">Selesai</div>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-xs overflow-x-auto pb-xs custom-scrollbar">
            {FILTERS.map((f) => (
              <button
                key={f.label}
                onClick={() => setActiveFilter(f.status)}
                className={`flex items-center gap-xs px-md py-sm rounded-lg font-label-sm text-label-sm font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0
                  ${activeFilter === f.status
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-white border border-outline-variant text-on-surface-variant hover:bg-surface-container"
                  }`}
              >
                <span className="material-symbols-outlined text-[15px]" aria-hidden="true">{f.icon}</span>
                {f.label}
              </button>
            ))}
          </div>

          {/* Task list */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-sm">
              <span className="material-symbols-outlined text-primary text-[40px] animate-spin" aria-hidden="true">sync</span>
              <p className="font-body-sm text-on-surface-variant">Memuat daftar task...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <EmptyState activeFilter={activeFilter} />
          ) : (
            <div className="flex flex-col gap-sm">
              {filteredTasks.map((task) => (
                <TaskManagementCard key={task.id_tasks} task={task} onRefresh={fetchTasks} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
