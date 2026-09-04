"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Badge } from "@/components/ui/Badge";
import { TaskStatus } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { TaskCardSkeleton } from "@/components/ui/Skeleton";
import {
  Banknote,
  Clock,
  Store,
  Star,
  ListFilter,
  Hourglass,
  CheckCircle2,
  XCircle,
  History,
  Compass,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/utils/haptics";

// ─── Types ───────────────────────────────────────────────────────────────────

interface WorkerTask {
  id_task_applicants: string;
  id_tasks: string;
  judul_tugas: string;
  estimasi_waktu: string | null;
  kompensasi: number;
  task_status: string;
  application_status: string;
  apply_count?: number;
  alasan_penolakan?: string | null;
  max_apply_attempts?: number;
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
    pending: "bg-tertiary-container/30 border-tertiary/30",
    accepted: "bg-secondary-container/25 border-secondary/30",
    rejected: "bg-error-container/25 border-error/30",
  };

  const borderClass = appStatusColor[task.application_status] ?? "bg-surface-container-lowest border-card-border";

  return (
    <Link href={`/task/${task.id_tasks}`}>
      <div className={cn(
        "rounded-xl border p-4 flex flex-col gap-3 cursor-pointer hover:shadow-xs transition-[box-shadow,border-color] duration-150",
        borderClass
      )}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-headline text-sm font-bold text-on-surface line-clamp-1">
              {task.judul_tugas}
            </h3>
            <p className="font-sans text-[11px] text-on-surface-variant mt-0.5">
              Dilamar {formatDate(task.applied_at)}
              {task.completed_at && ` • Selesai ${formatDate(task.completed_at)}`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge status={task.task_status as TaskStatus} />
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider font-mono",
              task.application_status === "accepted" ? "text-secondary bg-secondary-container/50 border-secondary/30" :
              task.application_status === "rejected" ? "text-error bg-error-container/40 border-error/30" :
              "text-tertiary bg-tertiary-container/40 border-tertiary/30"
            )}>
              Lamaran: {appStatusLabel[task.application_status] ?? task.application_status}
            </span>
          </div>
        </div>

        {/* Info row */}
        <div className="flex items-center gap-3 text-on-surface-variant flex-wrap text-xs">
          <div className="flex items-center gap-1.5 font-mono font-bold text-primary tabular-nums">
            <Banknote className="w-3.5 h-3.5 text-primary" />
            <span>{formatCurrency(task.kompensasi)}</span>
          </div>
          {task.estimasi_waktu && (
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <Clock className="w-3.5 h-3.5" />
              <span>{task.estimasi_waktu}</span>
            </div>
          )}
          {task.requester && (
            <div className="flex items-center gap-1.5 font-sans text-[11px]">
              <Store className="w-3.5 h-3.5" />
              <span>{task.requester.nama_lengkap}</span>
            </div>
          )}
        </div>

        {/* Alasan Penolakan jika ditolak */}
        {task.application_status === "rejected" && (
          <div className="bg-error-container/30 rounded-lg p-2.5 text-xs text-error font-sans flex flex-col gap-0.5 border border-error/25">
            <span className="font-bold">Ditolak: {task.alasan_penolakan || "Belum terpilih untuk tugas ini"}</span>
            {task.apply_count !== undefined && (
              <span className="text-[10px] opacity-85 font-mono tabular-nums">
                Percobaan: {task.apply_count} dari {task.max_apply_attempts ?? 3} maksimal
              </span>
            )}
          </div>
        )}

        {/* Rating yang diterima (jika task selesai & sudah dirating) */}
        {task.received_rating !== null && (
          <div className="flex items-start gap-2.5 bg-surface-container-lowest/80 rounded-lg p-2.5 border border-card-border">
            <div className="flex items-center gap-0.5 shrink-0">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={cn(
                    "w-3.5 h-3.5",
                    s <= (task.received_rating ?? 0)
                      ? "text-amber-400 fill-amber-400"
                      : "text-outline-variant"
                  )}
                />
              ))}
            </div>
            {task.received_comment && (
              <p className="font-sans text-[11px] text-on-surface-variant italic line-clamp-1">
                &ldquo;{task.received_comment}&rdquo;
              </p>
            )}
          </div>
        )}

        {/* Pending rating prompt */}
        {task.task_status === "completed" && task.received_rating === null && task.application_status === "accepted" && (
          <div className="flex items-center gap-1.5 text-primary font-sans text-xs font-semibold">
            <Star className="w-3.5 h-3.5" />
            Belum ada ulasan untuk task ini
          </div>
        )}
      </div>
    </Link>
  );
}

// ─── Filter Tabs ─────────────────────────────────────────────────────────────

const WORKER_FILTERS: { label: string; appStatus: string | null; icon: React.ComponentType<{ className?: string }> }[] = [
  { label: "Semua", appStatus: null, icon: ListFilter },
  { label: "Menunggu", appStatus: "pending", icon: Hourglass },
  { label: "Diterima", appStatus: "accepted", icon: CheckCircle2 },
  { label: "Ditolak", appStatus: "rejected", icon: XCircle },
];

// Module-level in-memory cache for instant navigation
let cachedWorkerTasks: WorkerTask[] = [];
let hasLoadedWorkerTasksOnce = false;

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RiwayatPage() {
  const [tasks, setTasks] = useState<WorkerTask[]>(cachedWorkerTasks);
  const [loading, setLoading] = useState(!hasLoadedWorkerTasksOnce && cachedWorkerTasks.length === 0);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const fetchTasks = useCallback(async (silent = false) => {
    if (!silent && cachedWorkerTasks.length === 0) {
      setLoading(true);
    }
    try {
      const res = await fetch(`/api/users/me/tasks?role=worker`);
      if (!res.ok) {
        if (cachedWorkerTasks.length === 0) setTasks([]);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (data.success && Array.isArray(data.data)) {
        cachedWorkerTasks = data.data;
        hasLoadedWorkerTasksOnce = true;
        setTasks(data.data);
      }
    } catch {
      console.error("Gagal memuat riwayat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cachedWorkerTasks.length > 0) {
      setTasks(cachedWorkerTasks);
      fetchTasks(true); // silent background revalidate
    } else {
      fetchTasks(false);
    }
  }, [fetchTasks]);

  const filteredTasks = activeFilter
    ? tasks.filter((t) => t.application_status === activeFilter)
    : tasks;

  const totalEarned = tasks
    .filter((t) => t.task_status === "completed" && t.application_status === "accepted")
    .reduce((sum, t) => sum + t.kompensasi, 0);
  const totalCompleted = tasks.filter(
    (t) => t.task_status === "completed" && t.application_status === "accepted"
  ).length;
  const totalPending = tasks.filter((t) => t.application_status === "pending").length;

  return (
    <div className="flex flex-col h-full bg-surface font-sans">
      {/* Header */}
      <header className="page-header bg-surface-container-lowest border-b border-card-border px-6 py-5">
        <div>
          <h1 className="font-headline text-2xl text-on-surface font-extrabold tracking-tight">Riwayat Tugas</h1>
          <p className="font-body-sm text-sm text-on-surface-variant font-medium mt-0.5">
            Semua task yang pernah Anda lamar sebagai Worker
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6 pb-36 lg:pb-12">

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest border border-card-border rounded-xl p-4 text-center shadow-xs">
              <div className="font-mono text-2xl md:text-3xl font-extrabold text-on-surface tabular-nums">{totalCompleted}</div>
              <div className="font-sans text-xs text-on-surface-variant mt-1 font-semibold">Task Selesai</div>
            </div>
            <div className="bg-surface-container-lowest border border-card-border rounded-xl p-4 text-center shadow-xs">
              <div className="font-mono text-2xl md:text-3xl font-extrabold text-amber-600 tabular-nums">{totalPending}</div>
              <div className="font-sans text-xs text-on-surface-variant mt-1 font-semibold">Menunggu</div>
            </div>
            <div className="bg-primary text-on-primary shadow-xs border border-primary/20 flex flex-col justify-between p-4 rounded-xl text-center">
              <div className="font-mono text-2xl md:text-3xl font-extrabold text-white tabular-nums">
                {totalEarned >= 1000
                  ? `${(totalEarned / 1000).toFixed(0)}rb`
                  : totalEarned.toLocaleString("id-ID")}
              </div>
              <div className="font-sans text-xs text-white/85 mt-1 font-semibold">Total Poin Earned</div>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {WORKER_FILTERS.map((f) => {
              const IconComp = f.icon;
              return (
                <button
                  key={f.label}
                  onClick={() => {
                    triggerHaptic("light");
                    setActiveFilter(f.appStatus);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors duration-150 cursor-pointer shrink-0",
                    activeFilter === f.appStatus
                      ? "bg-primary text-on-primary shadow-xs"
                      : "bg-surface-container-lowest border border-card-border text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
                  )}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Task list */}
          {loading ? (
            <div className="flex flex-col gap-3">
              <TaskCardSkeleton />
              <TaskCardSkeleton />
              <TaskCardSkeleton />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-on-surface-variant">
                <History className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-headline text-base font-bold text-on-surface">Belum Ada Riwayat</h3>
                <p className="font-body-sm text-xs text-on-surface-variant mt-1">
                  Mulai melamar tugas untuk mengisi riwayat kamu di sini.
                </p>
              </div>
              <Link href="/cari-tugas">
                <Button variant="primary" size="sm" icon={<Compass className="w-4 h-4" />}>
                  Cari Tugas Sekarang
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
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
