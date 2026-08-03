"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Badge } from "@/components/ui/Badge";
import { TaskStatus } from "@/types/database";

// ─── Types ───────────────────────────────────────────────────────────────────

interface WorkerTask {
  id_task_applicants: string;
  id_tasks: string;
  judul_tugas: string;
  estimasi_waktu: string | null;
  kompensasi: number;
  task_status: string;
  application_status: string;
  applied_at: string;
  completed_at: string | null;
  requester: { id_user: string; nama_lengkap: string; avatar_url: string | null } | null;
  received_rating: number | null;
  received_comment: string | null;
}

// ─── Worker History Card ──────────────────────────────────────────────────────

function WorkerHistoryCard({ task }: { task: WorkerTask }) {
  const appStatusLabel: Record<string, string> = {
    pending: "Menunggu",
    accepted: "Diterima",
    rejected: "Ditolak",
  };

  const appStatusColor: Record<string, string> = {
    pending: "bg-amber-50 border-amber-200",
    accepted: "bg-green-50 border-green-200",
    rejected: "bg-red-50 border-red-200",
  };

  const borderClass = appStatusColor[task.application_status] ?? "bg-white border-outline-variant";

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
              Dilamar {formatDate(task.applied_at)}
              {task.completed_at && ` • Selesai ${formatDate(task.completed_at)}`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-xs shrink-0">
            <Badge status={task.task_status as TaskStatus} />
            <span className={`text-[10px] font-semibold px-xs py-0.5 rounded-full border font-label-sm
              ${task.application_status === "accepted" ? "text-green-700 bg-green-50 border-green-200" :
                task.application_status === "rejected" ? "text-red-700 bg-red-50 border-red-200" :
                "text-amber-700 bg-amber-50 border-amber-200"}`}>
              Lamaran: {appStatusLabel[task.application_status] ?? task.application_status}
            </span>
          </div>
        </div>

        {/* Info row */}
        <div className="flex items-center gap-md text-on-surface-variant flex-wrap">
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-[14px] text-primary">payments</span>
            <span className="font-label-sm text-label-sm font-bold text-primary">
              {formatCurrency(task.kompensasi)}
            </span>
          </div>
          {task.estimasi_waktu && (
            <div className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              <span className="font-label-sm text-[11px]">{task.estimasi_waktu}</span>
            </div>
          )}
          {task.requester && (
            <div className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-[14px]">storefront</span>
              <span className="font-label-sm text-[11px]">{task.requester.nama_lengkap}</span>
            </div>
          )}
        </div>

        {/* Rating yang diterima (jika task selesai & sudah dirating) */}
        {task.received_rating !== null && (
          <div className="flex items-start gap-sm bg-white/70 rounded-lg p-sm border border-outline-variant/50">
            <div className="flex items-center gap-xs shrink-0">
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  className="material-symbols-outlined text-[16px] text-amber-400"
                  style={{ fontVariationSettings: s <= (task.received_rating ?? 0) ? "'FILL' 1" : "'FILL' 0" }}
                >
                  star
                </span>
              ))}
            </div>
            {task.received_comment && (
              <p className="font-label-sm text-[11px] text-on-surface-variant italic line-clamp-1">
                &ldquo;{task.received_comment}&rdquo;
              </p>
            )}
          </div>
        )}

        {/* Pending rating prompt */}
        {task.task_status === "completed" && task.received_rating === null && task.application_status === "accepted" && (
          <div className="flex items-center gap-xs text-primary font-label-sm text-[11px] font-semibold">
            <span className="material-symbols-outlined text-[14px]">star</span>
            Belum ada ulasan untuk task ini
          </div>
        )}
      </div>
    </Link>
  );
}

// ─── Filter Tabs ─────────────────────────────────────────────────────────────

const WORKER_FILTERS: { label: string; appStatus: string | null; icon: string }[] = [
  { label: "Semua", appStatus: null, icon: "list_alt" },
  { label: "Menunggu", appStatus: "pending", icon: "hourglass_empty" },
  { label: "Diterima", appStatus: "accepted", icon: "check_circle" },
  { label: "Ditolak", appStatus: "rejected", icon: "cancel" },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RiwayatPage() {
  const [tasks, setTasks] = useState<WorkerTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/me/tasks?role=worker`);
      const data = await res.json();
      if (data.success) {
        setTasks(data.data);
      }
    } catch {
      console.error("Gagal memuat riwayat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Filter di client side (by application_status)
  const filteredTasks = activeFilter
    ? tasks.filter((t) => t.application_status === activeFilter)
    : tasks;

  // Summary stats
  const totalEarned = tasks
    .filter((t) => t.task_status === "completed" && t.application_status === "accepted")
    .reduce((sum, t) => sum + t.kompensasi, 0);
  const totalCompleted = tasks.filter(
    (t) => t.task_status === "completed" && t.application_status === "accepted"
  ).length;
  const totalPending = tasks.filter((t) => t.application_status === "pending").length;

  return (
    <div className="flex flex-col h-full bg-layout-bg font-sans">
      {/* Header */}
      <header className="page-header">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-extrabold">Riwayat Tugas</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant font-medium">
            Semua task yang pernah Anda lamar sebagai Worker
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto p-lg flex flex-col gap-lg">

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-md">
            <div className="bento-card text-center">
              <div className="font-headline-md text-headline-md font-bold text-on-surface font-mono">{totalCompleted}</div>
              <div className="font-label-sm text-label-sm text-on-surface-variant mt-xs">Task Selesai</div>
            </div>
            <div className="bento-card text-center">
              <div className="font-headline-md text-headline-md font-bold text-amber-600 font-mono">{totalPending}</div>
              <div className="font-label-sm text-label-sm text-on-surface-variant mt-xs">Menunggu</div>
            </div>
            <div className="relative overflow-hidden bento-card text-center bg-primary-container">
              <div
                className="font-headline-md text-headline-md font-bold text-on-primary font-mono"
                style={{ fontSize: totalEarned > 999999 ? "16px" : undefined }}
              >
                {totalEarned >= 1000
                  ? `${(totalEarned / 1000).toFixed(0)}rb`
                  : totalEarned.toLocaleString("id-ID")}
              </div>
              <div className="font-label-sm text-label-sm text-on-primary/80 mt-xs">Total Poin Earned</div>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-xs overflow-x-auto pb-xs custom-scrollbar">
            {WORKER_FILTERS.map((f) => (
              <button
                key={f.label}
                onClick={() => setActiveFilter(f.appStatus)}
                className={`flex items-center gap-xs px-md py-sm rounded-lg font-label-sm text-label-sm font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0
                  ${activeFilter === f.appStatus
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-white border border-outline-variant text-on-surface-variant hover:bg-surface-container"
                  }`}
              >
                <span className="material-symbols-outlined text-[15px]">{f.icon}</span>
                {f.label}
              </button>
            ))}
          </div>

          {/* Task list */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-sm">
              <span className="material-symbols-outlined text-primary text-[40px] animate-spin">progress_activity</span>
              <p className="font-body-sm text-on-surface-variant">Memuat riwayat...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-md text-center">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[32px] text-outline">history</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Belum Ada Riwayat</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
                  Mulai melamar tugas untuk mengisi riwayat kamu di sini.
                </p>
              </div>
              <Link
                href="/cari-tugas"
                className="bg-primary text-on-primary font-label-md text-label-md font-bold py-sm px-lg rounded-lg flex items-center gap-xs transition-colors hover:bg-primary/90"
              >
                <span className="material-symbols-outlined text-[18px]">explore</span>
                Cari Tugas Sekarang
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-sm">
              {filteredTasks.map((task) => (
                <WorkerHistoryCard key={task.id_task_applicants} task={task} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
