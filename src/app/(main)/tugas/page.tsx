"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { TaskCardSkeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs";
import { TaskStatus } from "@/types/database";
import {
  Plus,
  Banknote,
  Clock,
  Users,
  Star,
  ArrowRight,
  ListFilter,
  Radio,
  PlayCircle,
  Handshake,
  CheckCircle2,
  XCircle,
  ClipboardList,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

const FILTERS: { label: string; status: string | null; icon: React.ComponentType<{ className?: string }> }[] = [
  { label: "Semua", status: null, icon: ListFilter },
  { label: "Aktif", status: "open", icon: Radio },
  { label: "Berjalan", status: "in_progress", icon: PlayCircle },
  { label: "Diterima", status: "accepted", icon: Handshake },
  { label: "Sudah Selesai", status: "completed", icon: CheckCircle2 },
  { label: "Dibatalkan", status: "cancelled", icon: XCircle },
];

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskManagementCard({ task, onRefresh }: { task: RequesterTask; onRefresh: () => void }) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const executeCancel = async () => {
    setIsCancelModalOpen(false);
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

        {/* Info Row */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-3 text-on-surface-variant">
            {/* Kompensasi */}
            <div className="flex items-center gap-1.5 font-mono font-bold text-primary tabular-nums">
              <Banknote className="w-3.5 h-3.5 text-primary" />
              <span>{formatCurrency(task.kompensasi)}</span>
            </div>
            {/* Estimasi */}
            {task.estimasi_waktu && (
              <div className="flex items-center gap-1 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5" />
                <span>{task.estimasi_waktu}</span>
              </div>
            )}
            {/* Jumlah pelamar */}
            <div className="flex items-center gap-1 font-sans text-[11px]">
              <Users className="w-3.5 h-3.5" />
              <span className="font-mono tabular-nums">{task.applicant_count} pelamar</span>
            </div>
          </div>
        </div>

        {/* Worker chip */}
        {task.accepted_worker && (
          <div className="flex items-center gap-2 bg-surface-container-lowest rounded-lg px-2.5 py-1 border border-card-border self-start">
            <Avatar
              src={task.accepted_worker.avatar_url}
              name={task.accepted_worker.nama_lengkap}
              size="xs"
            />
            <span className="font-sans text-[11px] font-medium text-on-surface">
              Worker: {task.accepted_worker.nama_lengkap}
            </span>
            {task.received_rating !== null && (
              <span className="text-amber-500 text-[11px] font-bold font-mono tabular-nums flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {task.received_rating.toFixed(1)}
              </span>
            )}
          </div>
        )}

        {/* Footer actions */}
        {task.status === "open" && (
          <div className="flex justify-end gap-2 pt-2 border-t border-card-border/60 mt-1">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsCancelModalOpen(true);
              }}
              disabled={cancelling}
              className="text-[11px] text-error font-semibold px-2.5 py-1 rounded-md hover:bg-error-container/30 transition-colors cursor-pointer disabled:opacity-50"
            >
              {cancelling ? "Membatalkan..." : "Batalkan Task"}
            </button>
            <button
              onClick={(e) => { e.preventDefault(); router.push(`/task/${task.id_tasks}`); }}
              className="text-[11px] text-primary font-semibold px-2.5 py-1 rounded-md hover:bg-primary/10 transition-colors cursor-pointer flex items-center gap-1"
            >
              Lihat Detail <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {task.status === "completed" && task.received_rating === null && (
          <div className="flex justify-end pt-2 border-t border-card-border/60 mt-1">
            <button
              onClick={(e) => { e.preventDefault(); router.push(`/task/${task.id_tasks}`); }}
              className="text-[11px] text-primary font-semibold px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Star className="w-3 h-3" />
              Berikan Rating
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Batalkan Task"
      >
        <div className="flex flex-col gap-4">
          <p className="font-sans text-xs text-on-surface">
            Yakin ingin membatalkan task <strong>{task.judul_tugas}</strong>? Task yang dibatalkan tidak dapat dikembalikan, dan dana di escrow (jika ada) akan dikembalikan ke dompet Anda.
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-card-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCancelModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={executeCancel}
              disabled={cancelling}
            >
              Ya, Batalkan
            </Button>
          </div>
        </div>
      </Modal>
    </Link>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ activeFilter }: { activeFilter: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-on-surface-variant">
        <ClipboardList className="w-7 h-7" />
      </div>
      <div>
        <h3 className="font-headline text-base font-bold text-on-surface">
          {activeFilter === "completed"
            ? "Belum Ada Task yang Selesai"
            : activeFilter === "open"
            ? "Belum Ada Task Aktif"
            : "Belum Ada Task"}
        </h3>
        <p className="font-body-sm text-xs text-on-surface-variant mt-1">
          {activeFilter === "completed"
            ? "Task yang sudah selesai akan muncul di sini."
            : "Mulai posting tugas baru untuk menemukan worker terbaik."}
        </p>
      </div>
      {activeFilter !== "completed" && (
        <Link href="/task/new">
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
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
      if (!res.ok) {
        setTasks([]);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (data.success && Array.isArray(data.data)) {
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

  const filteredTasks = tasks;

  const totalSelesai = tasks.filter((t) => t.status === "completed").length;
  const totalAktif = tasks.filter((t) => t.status === "open").length;
  const totalBerjalan = tasks.filter((t) => t.status === "in_progress" || t.status === "accepted").length;

  return (
    <div className="flex flex-col h-full bg-surface font-sans">
      {/* Header */}
      <header className="page-header bg-surface-container-lowest border-b border-card-border px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
        <div>
          <h1 className="font-headline text-xl sm:text-2xl text-on-surface font-extrabold tracking-tight">Kelola Tugas</h1>
          <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant font-medium mt-0.5 hidden sm:block">
            Pantau semua task yang pernah Anda posting
          </p>
        </div>
        <Link href="/task/new">
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
            Post Tugas Baru
          </Button>
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest border border-card-border rounded-xl p-4 text-center shadow-xs">
              <div className="font-mono text-2xl md:text-3xl font-extrabold text-on-surface tabular-nums">{totalAktif}</div>
              <div className="font-sans text-xs text-on-surface-variant mt-1 font-semibold">Task Aktif</div>
            </div>
            <div className="bg-surface-container-lowest border border-card-border rounded-xl p-4 text-center shadow-xs">
              <div className="font-mono text-2xl md:text-3xl font-extrabold text-primary tabular-nums">{totalBerjalan}</div>
              <div className="font-sans text-xs text-on-surface-variant mt-1 font-semibold">Sedang Berjalan</div>
            </div>
            <div className="bg-secondary-container/40 border border-secondary/20 p-4 rounded-xl text-center shadow-xs">
              <div className="font-mono text-2xl md:text-3xl font-extrabold text-secondary tabular-nums">{totalSelesai}</div>
              <div className="font-sans text-xs text-secondary mt-1 font-semibold">Selesai</div>
            </div>
          </div>

          {/* Motion Filter tabs */}
          <div className="overflow-x-auto pb-1 no-scrollbar">
            <Tabs
              value={activeFilter ?? "all"}
              onValueChange={(val) => setActiveFilter(val === "all" ? null : val)}
              variant="segment"
            >
              <TabsList className="w-fit flex-nowrap">
                {FILTERS.map((f) => {
                  const IconComp = f.icon;
                  return (
                    <TabsTrigger key={f.label} value={f.status ?? "all"}>
                      <IconComp className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                      <span>{f.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </div>

          {/* Task list */}
          {loading ? (
            <div className="flex flex-col gap-3">
              <TaskCardSkeleton />
              <TaskCardSkeleton />
              <TaskCardSkeleton />
            </div>
          ) : filteredTasks.length === 0 ? (
            <EmptyState activeFilter={activeFilter} />
          ) : (
            <div className="flex flex-col gap-3">
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
