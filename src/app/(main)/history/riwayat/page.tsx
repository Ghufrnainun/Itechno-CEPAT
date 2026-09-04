"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Badge } from "@/components/ui/Badge";
import { TaskStatus } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { TaskCardSkeleton } from "@/components/ui/Skeleton";
import { useCurrentRole } from "@/app/(main)/layout";
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
  Briefcase,
  PlayCircle,
  Users,
  Plus,
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
  accepted_workers?: Array<{ id_user: string; nama_lengkap: string; avatar_url: string | null; bid_amount?: number | null }>;
  received_rating: number | null;
}

// ─── Requester History Card ───────────────────────────────────────────────────

function RequesterHistoryCard({ task }: { task: RequesterTask }) {
  const statusColors: Record<string, string> = {
    open: "bg-primary/5 border-primary/20",
    accepted: "bg-amber-500/5 border-amber-500/20",
    in_progress: "bg-purple-500/5 border-purple-500/20",
    completed: "bg-secondary-container/30 border-secondary/20",
    cancelled: "bg-error-container/20 border-error/20",
  };

  const borderClass = statusColors[task.status] ?? "bg-surface-container-lowest border-card-border";

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
              Diposting {formatDate(task.created_at)}
              {task.completed_at && ` • Selesai ${formatDate(task.completed_at)}`}
            </p>
          </div>
          <Badge status={task.status as TaskStatus} />
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
          <div className="flex items-center gap-1 font-sans text-[11px]">
            <Users className="w-3.5 h-3.5" />
            <span className="font-mono tabular-nums">{task.applicant_count} pelamar</span>
          </div>
        </div>

        {/* Worker(s) chips */}
        {task.accepted_workers && task.accepted_workers.length > 0 ? (
          <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-card-border/40">
            <span className="font-sans text-[11px] text-on-surface-variant font-semibold">
              Worker ({task.accepted_workers.length}):
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {task.accepted_workers.map((w) => (
                <div
                  key={w.id_user}
                  className="flex items-center gap-1.5 bg-surface-container-lowest rounded-lg px-2 py-0.5 border border-card-border"
                >
                  <Avatar src={w.avatar_url} name={w.nama_lengkap} size="xs" />
                  <span className="font-sans text-[11px] font-medium text-on-surface">
                    {w.nama_lengkap}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : task.accepted_worker ? (
          <div className="flex items-center gap-2 bg-surface-container-lowest rounded-lg px-2.5 py-1 border border-card-border self-start">
            <Avatar src={task.accepted_worker.avatar_url} name={task.accepted_worker.nama_lengkap} size="xs" />
            <span className="font-sans text-[11px] font-medium text-on-surface">
              Worker: {task.accepted_worker.nama_lengkap}
            </span>
          </div>
        ) : null}

        {/* Rating */}
        {task.received_rating !== null && (
          <div className="flex items-center gap-1 text-amber-500 font-mono text-xs font-bold">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>Rating: {task.received_rating.toFixed(1)}</span>
          </div>
        )}
      </div>
    </Link>
  );
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

const WORKER_FILTERS: { label: string; status: string | null; icon: React.ComponentType<{ className?: string }> }[] = [
  { label: "Semua", status: null, icon: ListFilter },
  { label: "Menunggu", status: "pending", icon: Hourglass },
  { label: "Diterima", status: "accepted", icon: CheckCircle2 },
  { label: "Ditolak", status: "rejected", icon: XCircle },
];

const REQUESTER_FILTERS: { label: string; status: string | null; icon: React.ComponentType<{ className?: string }> }[] = [
  { label: "Semua", status: null, icon: ListFilter },
  { label: "Aktif", status: "open", icon: Hourglass },
  { label: "Berjalan", status: "in_progress", icon: PlayCircle },
  { label: "Selesai", status: "completed", icon: CheckCircle2 },
  { label: "Dibatalkan", status: "cancelled", icon: XCircle },
];

// Module-level in-memory cache for instant navigation
let cachedWorkerTasks: WorkerTask[] = [];
let cachedRequesterTasks: RequesterTask[] = [];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RiwayatPage() {
  const { role: userRole } = useCurrentRole();
  const [activeRole, setActiveRole] = useState<"requester" | "worker">("requester");
  const [workerTasks, setWorkerTasks] = useState<WorkerTask[]>(cachedWorkerTasks);
  const [requesterTasks, setRequesterTasks] = useState<RequesterTask[]>(cachedRequesterTasks);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Sync role awal dengan role user
  useEffect(() => {
    if (userRole) {
      setActiveRole(userRole);
    }
  }, [userRole]);

  const fetchTasks = useCallback(async (roleToFetch: "requester" | "worker", silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/users/me/tasks?role=${roleToFetch}`);
      if (!res.ok) {
        if (roleToFetch === "worker" && cachedWorkerTasks.length === 0) setWorkerTasks([]);
        if (roleToFetch === "requester" && cachedRequesterTasks.length === 0) setRequesterTasks([]);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (data.success && Array.isArray(data.data)) {
        if (roleToFetch === "worker") {
          cachedWorkerTasks = data.data;
          setWorkerTasks(data.data);
        } else {
          cachedRequesterTasks = data.data;
          setRequesterTasks(data.data);
        }
      }
    } catch {
      console.error("Gagal memuat riwayat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeRole === "worker") {
      if (cachedWorkerTasks.length > 0) {
        setWorkerTasks(cachedWorkerTasks);
        fetchTasks("worker", true);
      } else {
        fetchTasks("worker", false);
      }
    } else {
      if (cachedRequesterTasks.length > 0) {
        setRequesterTasks(cachedRequesterTasks);
        fetchTasks("requester", true);
      } else {
        fetchTasks("requester", false);
      }
    }
  }, [activeRole, fetchTasks]);

  // Filter tasks
  const filteredWorkerTasks = activeFilter
    ? workerTasks.filter((t) => t.application_status === activeFilter)
    : workerTasks;

  const filteredRequesterTasks = activeFilter
    ? requesterTasks.filter((t) => t.status === activeFilter)
    : requesterTasks;

  // Worker Stats
  const totalEarned = workerTasks
    .filter((t) => t.task_status === "completed" && t.application_status === "accepted")
    .reduce((sum, t) => sum + t.kompensasi, 0);
  const totalCompletedWorker = workerTasks.filter(
    (t) => t.task_status === "completed" && t.application_status === "accepted"
  ).length;
  const totalPendingWorker = workerTasks.filter((t) => t.application_status === "pending").length;

  // Requester Stats
  const totalCreatedRequester = requesterTasks.length;
  const totalInProgressRequester = requesterTasks.filter(
    (t) => t.status === "in_progress" || t.status === "accepted"
  ).length;
  const totalCompletedRequester = requesterTasks.filter((t) => t.status === "completed").length;

  const currentFilters = activeRole === "worker" ? WORKER_FILTERS : REQUESTER_FILTERS;

  return (
    <div className="flex flex-col h-full bg-surface font-sans">
      {/* Header */}
      <header className="page-header bg-surface-container-lowest border-b border-card-border px-6 py-5">
        <div>
          <h1 className="font-headline text-2xl text-on-surface font-extrabold tracking-tight">Riwayat Aktivitas</h1>
          <p className="font-body-sm text-sm text-on-surface-variant font-medium mt-0.5">
            Daftar seluruh tugas dan lamaran yang pernah Anda ikuti
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6 pb-36 lg:pb-12">

          {/* Role Mode Switcher Tabs */}
          <div className="flex items-center gap-2 p-1 bg-surface-container-low border border-card-border rounded-xl">
            <button
              onClick={() => {
                triggerHaptic("light");
                setActiveRole("requester");
                setActiveFilter(null);
              }}
              className={cn(
                "flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-2 cursor-pointer",
                activeRole === "requester"
                  ? "bg-surface-container-lowest text-primary shadow-xs border border-card-border"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <Store className="w-4 h-4" />
              <span>Sebagai Pemberi Tugas (Requester)</span>
            </button>
            <button
              onClick={() => {
                triggerHaptic("light");
                setActiveRole("worker");
                setActiveFilter(null);
              }}
              className={cn(
                "flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-2 cursor-pointer",
                activeRole === "worker"
                  ? "bg-surface-container-lowest text-primary shadow-xs border border-card-border"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <Briefcase className="w-4 h-4" />
              <span>Sebagai Pekerja (Worker)</span>
            </button>
          </div>

          {/* Summary stats */}
          {activeRole === "worker" ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-surface-container-lowest border border-card-border rounded-xl p-4 text-center shadow-xs">
                <div className="font-mono text-2xl md:text-3xl font-extrabold text-on-surface tabular-nums">{totalCompletedWorker}</div>
                <div className="font-sans text-xs text-on-surface-variant mt-1 font-semibold">Task Selesai</div>
              </div>
              <div className="bg-surface-container-lowest border border-card-border rounded-xl p-4 text-center shadow-xs">
                <div className="font-mono text-2xl md:text-3xl font-extrabold text-amber-600 tabular-nums">{totalPendingWorker}</div>
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
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-surface-container-lowest border border-card-border rounded-xl p-4 text-center shadow-xs">
                <div className="font-mono text-2xl md:text-3xl font-extrabold text-on-surface tabular-nums">{totalCreatedRequester}</div>
                <div className="font-sans text-xs text-on-surface-variant mt-1 font-semibold">Total Tugas Dibuat</div>
              </div>
              <div className="bg-surface-container-lowest border border-card-border rounded-xl p-4 text-center shadow-xs">
                <div className="font-mono text-2xl md:text-3xl font-extrabold text-primary tabular-nums">{totalInProgressRequester}</div>
                <div className="font-sans text-xs text-on-surface-variant mt-1 font-semibold">Sedang Berjalan</div>
              </div>
              <div className="bg-secondary text-on-secondary shadow-xs border border-secondary/20 flex flex-col justify-between p-4 rounded-xl text-center">
                <div className="font-mono text-2xl md:text-3xl font-extrabold text-white tabular-nums">{totalCompletedRequester}</div>
                <div className="font-sans text-xs text-white/85 mt-1 font-semibold">Tugas Selesai</div>
              </div>
            </div>
          )}

          {/* Filter tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {currentFilters.map((f) => {
              const IconComp = f.icon;
              return (
                <button
                  key={f.label}
                  onClick={() => {
                    triggerHaptic("light");
                    setActiveFilter(f.status);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors duration-150 cursor-pointer shrink-0",
                    activeFilter === f.status
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
          ) : activeRole === "worker" ? (
            filteredWorkerTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-on-surface-variant">
                  <History className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-headline text-base font-bold text-on-surface">Belum Ada Riwayat Lamaran</h3>
                  <p className="font-body-sm text-xs text-on-surface-variant mt-1">
                    Mulai melamar tugas untuk mengisi riwayat pekerjaan Anda di sini.
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
                {filteredWorkerTasks.map((task) => (
                  <WorkerHistoryCard key={task.id_task_applicants} task={task} />
                ))}
              </div>
            )
          ) : (
            filteredRequesterTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-on-surface-variant">
                  <Store className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-headline text-base font-bold text-on-surface">Belum Ada Tugas yang Dibuat</h3>
                  <p className="font-body-sm text-xs text-on-surface-variant mt-1">
                    Buat tugas baru untuk menemukan pekerja terpercaya di sekitar Anda.
                  </p>
                </div>
                <Link href="/task/new">
                  <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
                    Buat Tugas Baru
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredRequesterTasks.map((task) => (
                  <RequesterHistoryCard key={task.id_tasks} task={task} />
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
