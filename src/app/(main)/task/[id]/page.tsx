"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useCurrentRole } from "@/app/(main)/layout";
import { TaskStatus } from "@/types/database";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { useToast } from "@/components/ui/Toast";
import { renderIcon } from "@/lib/icon-map";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EscrowBanner } from "@/components/ui/EscrowBanner";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import MapPickerWrapper from "@/features/task/components/MapPickerWrapper";
import {
  AlertCircle,
  ArrowLeft,
  PlayCircle,
  Users,
  MessageSquare,
  Store,
  Star,
  Wrench,
  MapPin,
  XCircle,
  CheckCircle2,
  Clock,
  Calendar,
  ShieldAlert,
  Loader2,
  Gavel,
  Flag,
  Briefcase,
} from "lucide-react";
import { DisputeModal } from "@/components/ui/DisputeModal";
import { ReportModal } from "@/components/ui/ReportModal";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TaskApplicant {
  id_task_applicants: string;
  id_worker: string;
  pesan: string | null;
  status: string;
  apply_count: number;
  alasan_penolakan: string | null;
  applied_at: string;
  worker_confirmed: boolean;
  bid_amount: number | null;
  worker: {
    id_user: string;
    nama_lengkap: string;
    avatar_url: string | null;
    rating_avg: number;
    total_completed: number;
    pendidikan_terakhir: string | null;
  };
}

interface TaskDetail {
  id_tasks: string;
  judul_tugas: string;
  deskripsi_tugas: string;
  estimasi_waktu: string | null;
  kompensasi: number;
  is_bidding: boolean;
  budget_min: number | null;
  budget_max: number | null;
  status: TaskStatus;
  worker_started: boolean;
  requester_started: boolean;
  max_applicants: number;
  max_apply_attempts: number;
  created_at: string;
  completed_at: string | null;
  scheduled_at?: string | null;
  scheduled_end?: string | null;
  latitude: number | null;
  longitude: number | null;
  id_requester: string;
  requester: {
    id_user: string;
    nama_lengkap: string;
    avatar_url: string | null;
    rating_avg: number;
    total_completed: number;
  };
  requirements: string[];
  applicants: TaskApplicant[];
  reviews: Array<{
    id_reviews: string;
    rating: number;
    comment: string | null;
    created_at: string;
    rater: { id_user: string; nama_lengkap: string; avatar_url: string | null };
    ratee?: { id_user: string; nama_lengkap: string; avatar_url: string | null };
  }>;
  has_applied: boolean;
  viewer_application?: {
    id_task_applicants: string;
    status: string;
    apply_count: number;
    alasan_penolakan: string | null;
    pesan: string | null;
    bid_amount: number | null;
  } | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TaskDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { role } = useCurrentRole();
  const { showToast } = useToast();

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [ratingTargetIndex, setRatingTargetIndex] = useState(0); // index dalam antrian rating
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedApplicantToReject, setSelectedApplicantToReject] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [applyBid, setApplyBid] = useState("");
  const [bidError, setBidError] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isCancelTaskModalOpen, setIsCancelTaskModalOpen] = useState(false);
  const [cancelTaskMode, setCancelTaskMode] = useState<"worker" | "requester">("worker");

  // Fetch task detail dari API
  const fetchTask = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${id}`);
      if (!res.ok) {
        showToast("Task tidak ditemukan.");
        setTask(null);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (data.success && data.data) {
        setTask(data.data);
      } else {
        showToast(data.message || "Task tidak ditemukan.");
      }
    } catch (e) {
      showToast("Gagal memuat task.");
      setTask(null);
    } finally {
      setLoading(false);
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  // ── Worker: Apply ──────────────────────────────────────────────────────────
  // Mode edit: task bidding + lamaran masih pending → PATCH perbarui bid
  const isEditingPendingBid = task?.is_bidding === true && task?.viewer_application?.status === "pending";

  const openApplyOrEditModal = () => {
    setBidError("");
    if (isEditingPendingBid) {
      setApplyBid(task?.viewer_application?.bid_amount ? String(task.viewer_application.bid_amount) : "");
      setApplyMessage(task?.viewer_application?.pesan ?? "");
    } else {
      setApplyBid("");
      setApplyMessage("");
    }
    setIsApplyModalOpen(true);
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBidError("");

    // Validasi bid untuk task bidding (sealed bid, wajib dalam range budget)
    let numericBid: number | undefined = undefined;
    if (task?.is_bidding) {
      numericBid = parseFloat(applyBid);
      const minBid = task.budget_min ?? 0;
      const maxBid = task.budget_max ?? task.kompensasi;
      if (!numericBid || isNaN(numericBid) || numericBid <= 0) {
        setBidError("Masukkan harga penawaran Anda terlebih dahulu.");
        return;
      }
      if (numericBid < minBid) {
        setBidError(`Penawaran minimal ${formatCurrency(minBid)}.`);
        return;
      }
      if (numericBid > maxBid) {
        setBidError(`Penawaran maksimal ${formatCurrency(maxBid)}.`);
        return;
      }
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/tasks/${id}/apply`, {
        method: isEditingPendingBid ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEditingPendingBid
            ? { bid_amount: numericBid }
            : { pesan: applyMessage, bid_amount: numericBid }
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setIsApplyModalOpen(false);
        setApplyMessage("");
        setApplyBid("");
        showToast(isEditingPendingBid
          ? "Penawaran berhasil diperbarui!"
          : task?.is_bidding
            ? "Penawaran terkirim! Menunggu pilihan pemberi kerja."
            : "Berhasil melamar pekerjaan! Menunggu persetujuan pemberi kerja.");
        fetchTask(); // refresh task data
      } else {
        showToast(data.message || "Gagal mengirim lamaran.");
      }
    } catch {
      showToast("Terjadi kesalahan jaringan.");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Worker: Cancel Application ─────────────────────────────────────────────
  const handleCancelApplication = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tasks/${id}/apply`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        showToast("Lamaran berhasil dibatalkan.");
        fetchTask(); // refresh task data
      } else {
        showToast(data.message || "Gagal membatalkan lamaran.");
      }
    } catch {
      showToast("Terjadi kesalahan jaringan.");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Requester: Accept Applicant ────────────────────────────────────────────
  const handleAcceptApplicant = async (applicantId: string, workerName: string, expectedBidAmount?: number) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tasks/applicants/${applicantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", expected_bid_amount: expectedBidAmount }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        showToast(`${workerName} diterima! Task dimulai.`);
        fetchTask();
      } else {
        showToast(data.message || "Gagal menerima pelamar.");
      }
    } catch {
      showToast("Terjadi kesalahan jaringan.");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Requester: Reject Applicant ────────────────────────────────────────────
  const openRejectModal = (applicantId: string) => {
    setSelectedApplicantToReject(applicantId);
    setRejectReason("");
    setIsRejectModalOpen(true);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplicantToReject) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tasks/applicants/${selectedApplicantToReject}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          alasan_penolakan: rejectReason.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        showToast("Lamaran ditolak.");
        setIsRejectModalOpen(false);
        setSelectedApplicantToReject(null);
        setRejectReason("");
        fetchTask();
      } else {
        showToast(data.message || "Gagal menolak pelamar.");
      }
    } catch {
      showToast("Terjadi kesalahan jaringan.");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Requester: Start Task Manually (dengan worker yang sudah diterima) ───────
  const handleManualStartTask = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tasks/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "start" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        showToast("Tugas berhasil dimulai dengan worker yang telah diterima!");
        fetchTask();
      } else {
        showToast(data.message || "Gagal memulai tugas.");
      }
    } catch {
      showToast("Terjadi kesalahan jaringan.");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Dua Pihak: Confirm Start Work ────────────────────────────────────────────
  const handleStartWork = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tasks/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirm_start" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        showToast("Konfirmasi mulai tugas berhasil dicatat!");
        fetchTask();
      } else {
        showToast(data.message || "Gagal mengkonfirmasi mulai tugas.");
      }
    } catch {
      showToast("Terjadi kesalahan jaringan.");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Requester: Confirm Completion ──────────────────────────────────────────
  const handleConfirmCompletion = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tasks/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        showToast("Task selesai! Poin telah ditransfer ke Worker.");
        fetchTask();
        openRatingModal();
      } else {
        showToast(data.message || "Gagal mengkonfirmasi penyelesaian.");
      }
    } catch {
      showToast("Terjadi kesalahan jaringan.");
    } finally {
      setActionLoading(false);
    }
  };

  const openRatingModal = () => {
    setReviewComment("");
    setRating(5);
    setIsRatingModalOpen(true);
  };

  // ── Rating Submit (via Review API) ─────────────────────────────────────────
  // Antrian rating: requester rate semua accepted workers satu per satu;
  //                 worker rate requester (1 orang)
  const getRatingTargets = (): TaskApplicant[] => {
    if (!task) return [];
    if (role === "worker") return []; // worker rate requester, bukan array worker
    // requester: rate semua accepted worker yang belum dirating
    const ratedWorkerIds = task.reviews
      .filter(r => r.rater.id_user === task.id_requester)
      .map(r => r.ratee?.id_user);
    return task.applicants.filter(
      a => a.status === "accepted" && !ratedWorkerIds.includes(a.id_worker)
    );
  };

  const currentRatingTarget = getRatingTargets()[ratingTargetIndex];

  const hasWorkerRatedRequester = () => {
    if (!task || role !== "worker") return false;
    const myApp = task.applicants.find(a => a.id_task_applicants === task.viewer_application?.id_task_applicants);
    if (!myApp) return false;
    return task.reviews.some(r => r.rater.id_user === myApp.id_worker && r.ratee?.id_user === task.id_requester);
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    let revieweeId: string | undefined;
    if (role === "worker") {
      revieweeId = task.id_requester;
    } else {
      revieweeId = currentRatingTarget?.id_worker;
    }

    if (!revieweeId) {
      setIsRatingModalOpen(false);
      return;
    }

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: task.id_tasks,
          reviewee_id: revieweeId,
          rating,
          comment: reviewComment || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        showToast(`Ulasan berhasil disimpan!`);
        fetchTask();
        setReviewComment("");
        setRating(5);
        // Untuk requester: lanjut ke worker berikutnya jika masih ada
        if (role === "requester") {
          const remaining = getRatingTargets().filter(t => t.id_worker !== revieweeId);
          if (remaining.length > 0) {
            setRatingTargetIndex(0); // reset karena list sudah direfresh
          } else {
            setIsRatingModalOpen(false);
          }
        } else {
          setIsRatingModalOpen(false);
        }
      } else {
        showToast(data.message || "Gagal menyimpan ulasan.");
      }
    } catch {
      showToast("Terjadi kesalahan jaringan.");
    }
  };

  // ── Action: Cancel Task (shared by worker and requester) ────────────────
  const executeCancelTask = async () => {
    setIsCancelTaskModalOpen(false);
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        if (cancelTaskMode === "worker") {
          showToast("Anda telah mengundurkan diri. Task dibatalkan.");
        } else {
          showToast("Task berhasil dibatalkan.");
        }
        router.push("/tugas");
      } else {
        showToast(data.message || "Gagal membatalkan task.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  // ── Loading & Not Found States ─────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 font-sans flex flex-col gap-6 bg-surface">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-8 w-2/3 rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-56 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 font-sans min-h-[60vh] flex items-center justify-center">
        <ErrorState
          title="Tugas Tidak Ditemukan"
          message="Tugas ini mungkin telah diselesaikan, dibatalkan, atau URL yang Anda tuju salah."
          actionText="Kembali ke Cari Tugas"
          onRetry={() => router.push("/cari-tugas")}
        />
      </div>
    );
  }

  const taskStatus = task.status;
  const isRequester = role === "requester";
  const taskForMap = task.latitude && task.longitude
    ? [{ id_task: task.id_tasks, title: task.judul_tugas, latitude: task.latitude, longitude: task.longitude, compensation: task.kompensasi, status: task.status, description: task.deskripsi_tugas, duration_estimate: task.estimasi_waktu ?? "", created_at: task.created_at, updated_at: task.created_at, id_requester: task.id_requester }]
    : [];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 font-sans flex flex-col gap-6 bg-surface pb-44 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl hover:bg-surface-container-low flex items-center justify-center border border-card-border cursor-pointer transition-colors duration-150 text-on-surface-variant hover:text-on-surface"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="font-mono text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
              Detail Pekerjaan
            </span>
            <h1 className="font-headline text-2xl text-on-surface font-extrabold tracking-tight">{task.judul_tugas}</h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsReportModalOpen(true)}
          title="Laporkan Pelanggaran Tugas ke Admin"
          className="px-3 py-1.5 rounded-xl border border-card-border hover:border-error/40 bg-surface-container-lowest hover:bg-error-container/20 text-xs font-semibold text-on-surface-variant hover:text-error transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Flag className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Laporkan Task</span>
        </button>
      </div>

      <EscrowBanner />

      {/* Main Details and Map grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Left */}
        <div className="md:col-span-2 flex flex-col gap-5">
          {/* Card 1: Hero Price & Requester Profile */}
          <div className="bg-surface-container-lowest border border-card-border rounded-2xl p-4 sm:p-6 flex flex-col gap-4 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge status={taskStatus} />
                  {task.is_bidding && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-mono font-bold uppercase tracking-wider">
                      Sealed Bidding
                    </span>
                  )}
                </div>

                {task.is_bidding ? (
                  <div className="mt-1">
                    <div className="font-mono text-2xl sm:text-3xl font-black text-primary tabular-nums tracking-tight">
                      {formatCurrency(task.budget_min ?? 0)} – {formatCurrency(task.budget_max ?? task.kompensasi)}
                    </div>
                    <p className="font-sans text-xs text-on-surface-variant mt-0.5">
                      Mode Bidding: penawaran rahasia, harga terbaik dipilih oleh pemberi tugas.
                    </p>
                  </div>
                ) : (
                  <div className="mt-1">
                    <div className="font-mono text-2xl sm:text-3xl font-black text-primary tabular-nums tracking-tight flex items-baseline gap-1.5">
                      <span>{formatCurrency(task.kompensasi)}</span>
                      <span className="text-xs font-normal text-on-surface-variant font-sans">/ orang</span>
                    </div>
                    <p className="font-mono text-[11px] text-on-surface-variant mt-0.5">
                      Total Escrow: {formatCurrency(task.kompensasi * (task.max_applicants ?? 1))} ({task.max_applicants ?? 1} worker)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Requester info row */}
            <div className="pt-4 border-t border-card-border/70 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar
                  src={task.requester.avatar_url}
                  name={task.requester.nama_lengkap}
                  size="md"
                  className="rounded-xl border border-card-border shrink-0"
                />
                <div>
                  <span className="font-headline font-bold text-xs sm:text-sm text-on-surface block">
                    {task.requester.nama_lengkap}
                  </span>
                  <span className="font-sans text-[11px] text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                    <span className="text-amber-500 font-bold font-mono">★ {task.requester.rating_avg.toFixed(1)}</span>
                    <span>•</span>
                    <span>{task.requester.total_completed} tugas selesai</span>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push(`/profile/${task.requester.id_user}`)}
                className="text-xs font-bold text-primary hover:underline px-2 py-1 rounded-lg hover:bg-primary/5 transition-colors shrink-0"
              >
                Lihat Profil
              </button>
            </div>
          </div>

          {/* Card 2: Task Description & Specifications */}
          <div className="bg-surface-container-lowest border border-card-border rounded-2xl p-4 sm:p-6 flex flex-col gap-5 shadow-xs">
            {/* Description */}
            <div className="flex flex-col gap-2">
              <h3 className="font-headline text-sm font-bold text-on-surface flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                <span>Deskripsi Pekerjaan</span>
              </h3>
              <p className="font-sans text-xs sm:text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                {task.deskripsi_tugas}
              </p>
            </div>

            {/* Scheduled Time Banner */}
            {task.scheduled_at && (
              <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-primary block uppercase tracking-wider font-mono">
                      Jadwal Pelaksanaan Tugas
                    </span>
                    <span className="font-medium text-on-surface text-xs sm:text-sm">
                      {new Date(task.scheduled_at).toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                      {" • "}
                      {new Date(task.scheduled_at).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      WIB
                      {task.scheduled_end && (
                        <>
                          {" - "}
                          {new Date(task.scheduled_end).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          WIB
                        </>
                      )}
                    </span>
                  </div>
                </div>
                <span className="self-start sm:self-center px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold shrink-0 font-mono">
                  Terjadwal
                </span>
              </div>
            )}

            {/* Requirements / Skill Badges */}
            {task.requirements.length > 0 && (
              <div className="flex flex-col gap-2 pt-1">
                <span className="text-xs font-bold text-on-surface font-headline">Keahlian yang Dibutuhkan:</span>
                <div className="flex flex-wrap gap-2">
                  {task.requirements.map((skill: any) => (
                    <span
                      key={skill.id_skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold"
                    >
                      {renderIcon(skill.icon, "w-3 h-3 shrink-0")}
                      <span>{skill.nama_skill}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 4 Specifications Mini-Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-card-border/70">
              <div className="p-3 rounded-xl bg-surface-container-low/70 border border-card-border/60 flex flex-col gap-1">
                <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider font-bold">
                  Estimasi Waktu
                </span>
                <span className="font-bold text-on-surface text-xs sm:text-sm font-headline">
                  {task.estimasi_waktu ?? "-"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low/70 border border-card-border/60 flex flex-col gap-1">
                <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider font-bold">
                  Kebutuhan Worker
                </span>
                <span className="font-bold text-on-surface text-xs sm:text-sm font-headline">
                  {task.max_applicants ?? 1} Orang
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low/70 border border-card-border/60 flex flex-col gap-1">
                <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider font-bold">
                  Maks. Apply
                </span>
                <span className="font-bold text-on-surface text-xs sm:text-sm font-headline">
                  {task.max_apply_attempts ?? 3}x Percobaan
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low/70 border border-card-border/60 flex flex-col gap-1">
                <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider font-bold">
                  Diposting Pada
                </span>
                <span className="font-bold text-on-surface text-xs sm:text-sm font-headline">
                  {formatDate(task.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Status step tracker */}
          <div className="bg-surface-container-lowest border border-card-border rounded-2xl p-4 sm:p-6 flex flex-col gap-4 shadow-xs">
            <h3 className="font-headline text-sm font-bold text-on-surface flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>Progres Status Tugas</span>
            </h3>
            <div className="flex items-center justify-between pt-sm relative">
              <div className="absolute top-1/2 left-[12%] right-[12%] h-[2px] bg-outline-variant/30 -translate-y-1/2 -z-10"></div>

              {(["open", "accepted", "in_progress", "completed"] as TaskStatus[]).map((s, i) => {
                const labels = ["Buka", "Diterima", "Dikerjakan", "Selesai"];
                const stepStatuses: TaskStatus[] = ["open", "accepted", "in_progress", "completed"];
                const stepIndex = stepStatuses.indexOf(taskStatus);
                const isActive = s === taskStatus;
                const isPast = stepStatuses.indexOf(s) < stepIndex;
                return (
                  <div key={s} className="flex flex-col items-center gap-xs">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isActive ? "bg-primary text-white" : isPast ? "bg-primary/30 text-primary" : "bg-surface-container text-on-surface-variant"}`}>
                      {i + 1}
                    </div>
                    <span className="font-label-sm text-[10px] uppercase font-semibold">{labels[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daftar Pelamar (Requester Only & Open Status) */}
          {isRequester && taskStatus === "open" && (
            <div className="flex flex-col gap-4 bg-surface-container-lowest border border-card-border rounded-2xl p-4 sm:p-6 shadow-xs">
              <div className="flex justify-between items-center border-b border-card-border pb-3">
                <h3 className="font-headline text-sm font-extrabold text-on-surface flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span>Daftar Pelamar ({task.applicants.length})</span>
                </h3>
                <span className="font-mono text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                  Worker Diterima: {task.applicants.filter(a => a.status === "accepted").length} / {task.max_applicants ?? 1}
                </span>
              </div>

              {/* Opsi Mulai Tugas Sekarang dengan Worker yang Sudah Diterima */}
              {task.applicants.filter(a => a.status === "accepted").length > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col gap-1.5 my-1">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs">
                    <PlayCircle className="w-4 h-4" />
                    Mulai Tugas Sekarang dengan Worker Terpilih?
                  </div>
                  <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                    Anda telah menerima {task.applicants.filter(a => a.status === "accepted").length} worker. Anda bisa mulai sekarang tanpa perlu menunggu slot ({task.max_applicants}) penuh. Pelamar pending lainnya akan otomatis di-reject.
                  </p>
                  <Button
                    onClick={handleManualStartTask}
                    disabled={actionLoading}
                    variant="primary"
                    className="w-full py-2 mt-1 text-xs font-bold"
                  >
                    Mulai Tugas Sekarang ({task.applicants.filter(a => a.status === "accepted").length} Worker)
                  </Button>
                </div>
              )}

              {task.applicants.length === 0 ? (
                <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
                  <Users className="w-8 h-8 text-outline-variant/60" />
                  <p className="font-body-sm text-xs text-on-surface-variant">Belum ada yang melamar.</p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-card-border/60">
                  {task.applicants.map((app) => (
                    <div key={app.id_task_applicants} className="py-3.5 flex flex-col gap-2.5">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={app.worker.avatar_url}
                            name={app.worker.nama_lengkap}
                            size="lg"
                            shape="rounded"
                          />
                          <div>
                            <h4 className="font-headline text-xs font-bold text-on-surface">
                              {app.worker.nama_lengkap}
                            </h4>
                            <p className="font-sans text-[11px] text-on-surface-variant">
                              {app.worker.pendidikan_terakhir ?? "Mahasiswa"} •{" "}
                              <span className="text-amber-500 font-bold font-mono tabular-nums">★ {app.worker.rating_avg.toFixed(1)}</span>
                            </p>
                          </div>
                        </div>
                        <Badge status={app.status === "accepted" ? "accepted" : app.status === "rejected" ? "rejected" : "open"} />
                      </div>

                      {/* Harga penawaran (task bidding) — hanya requester yang melihat halaman ini */}
                      {task.is_bidding && app.bid_amount != null && (
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                          <span className="font-sans text-[11px] font-bold text-on-surface-variant uppercase tracking-wide">Penawaran</span>
                          <span className="font-mono text-xs font-extrabold text-primary tabular-nums">
                            {formatCurrency(app.bid_amount)}
                          </span>
                        </div>
                      )}

                      {app.pesan && (
                        <p className="font-body-sm text-xs text-on-surface-variant bg-surface-container-low p-2.5 rounded-lg border border-card-border/50 italic leading-relaxed">
                          &quot;{app.pesan}&quot;
                        </p>
                      )}

                      {app.status === "pending" && (
                        <div className="flex justify-between items-center gap-2 mt-1">
                          {/* Tombol Chat Sejajar di Pojok Kiri */}
                          <button
                            type="button"
                            onClick={() => router.push(`/chat?userId=${app.id_worker}`)}
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 cursor-pointer transition-colors duration-150"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Chat
                          </button>

                          <div className="flex items-center gap-sm">
                            <Button
                              onClick={() => openRejectModal(app.id_task_applicants)}
                              variant="ghost"
                              className="py-1 px-3 text-xs font-bold text-error hover:bg-error/10"
                              disabled={actionLoading}
                            >
                              Tolak
                            </Button>
                            <Button
                              onClick={() => handleAcceptApplicant(app.id_task_applicants, app.worker.nama_lengkap, app.bid_amount ?? undefined)}
                              variant="primary"
                              className="py-1 px-3 text-xs font-bold"
                              disabled={actionLoading}
                            >
                              {task.is_bidding && app.bid_amount != null
                                ? `Terima Bid ${formatCurrency(app.bid_amount)}`
                                : "Terima Worker"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reviews (jika task completed) */}
          {taskStatus === "completed" && task.reviews.length > 0 && (
            <div className="flex flex-col gap-4 bg-surface-container-lowest border border-card-border rounded-xl p-4 md:p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-card-border pb-3">
                <h3 className="font-headline text-sm font-bold text-on-surface">Ulasan &amp; Rating Transaksi</h3>
                <span className="font-mono text-xs text-on-surface-variant bg-surface-container px-2.5 py-0.5 rounded-full font-semibold tabular-nums">
                  {task.reviews.length} Ulasan
                </span>
              </div>

              {/* Group 1: Ulasan dari Requester */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-1.5 text-primary font-mono text-xs font-bold uppercase tracking-wider bg-primary/10 px-3 py-1.5 rounded-lg">
                  <Store className="w-4 h-4" />
                  Ulasan dari Requester (Pemberi Tugas)
                </div>
                {task.reviews.filter((r) => r.rater.id_user === task.id_requester).length === 0 ? (
                  <p className="font-body-sm text-xs text-on-surface-variant italic pl-2 py-1">
                    Belum ada ulasan dari Requester.
                  </p>
                ) : (
                  task.reviews
                    .filter((r) => r.rater.id_user === task.id_requester)
                    .map((r) => (
                      <div key={r.id_reviews} className="p-3.5 bg-surface-container-low border border-card-border/60 rounded-lg flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Avatar
                              src={r.rater.avatar_url}
                              name={r.rater.nama_lengkap}
                              size="sm"
                            />
                            <div>
                              <span className="font-headline text-xs font-bold text-on-surface">{r.rater.nama_lengkap}</span>
                              {r.ratee && (
                                <span className="font-sans text-[11px] text-on-surface-variant block">
                                  Memberikan rating untuk: <span className="font-semibold text-primary">{r.ratee.nama_lengkap}</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={cn(
                                  "w-3.5 h-3.5",
                                  s <= r.rating ? "text-amber-400 fill-amber-400" : "text-outline-variant"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        {r.comment && (
                          <p className="font-body-sm text-xs text-on-surface-variant italic bg-surface-container-lowest p-2 rounded-md border border-card-border/40 mt-1">
                            &ldquo;{r.comment}&rdquo;
                          </p>
                        )}
                      </div>
                    ))
                )}
              </div>

              {/* Group 2: Ulasan dari Worker */}
              <div className="flex flex-col gap-2.5 pt-2 border-t border-card-border">
                <div className="flex items-center gap-1.5 text-secondary font-mono text-xs font-bold uppercase tracking-wider bg-secondary-container/40 px-3 py-1.5 rounded-lg">
                  <Wrench className="w-4 h-4" />
                  Ulasan dari Worker (Pengerja)
                </div>
                {task.reviews.filter((r) => r.rater.id_user !== task.id_requester).length === 0 ? (
                  <p className="font-body-sm text-xs text-on-surface-variant italic pl-2 py-1">
                    Belum ada ulasan dari Worker.
                  </p>
                ) : (
                  task.reviews
                    .filter((r) => r.rater.id_user !== task.id_requester)
                    .map((r) => (
                      <div key={r.id_reviews} className="p-3.5 bg-surface-container-low border border-card-border/60 rounded-lg flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Avatar
                              src={r.rater.avatar_url}
                              name={r.rater.nama_lengkap}
                              size="sm"
                              className="bg-secondary text-on-secondary"
                            />
                            <div>
                              <span className="font-headline text-xs font-bold text-on-surface">{r.rater.nama_lengkap}</span>
                              {r.ratee && (
                                <span className="font-sans text-[11px] text-on-surface-variant block">
                                  Memberikan rating untuk: <span className="font-semibold text-secondary">{r.ratee.nama_lengkap}</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={cn(
                                  "w-3.5 h-3.5",
                                  s <= r.rating ? "text-amber-400 fill-amber-400" : "text-outline-variant"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        {r.comment && (
                          <p className="font-body-sm text-xs text-on-surface-variant italic bg-surface-container-lowest p-2 rounded-md border border-card-border/40 mt-1">
                            &ldquo;{r.comment}&rdquo;
                          </p>
                        )}
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Location Map Right */}
        <div className="flex flex-col gap-4 mb-16 md:mb-0">
          <div className="bg-surface-container-lowest border border-card-border rounded-xl p-4 md:p-5 flex flex-col gap-3 shadow-xs">
            <h3 className="font-headline text-sm font-bold text-on-surface flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary" />
              Lokasi Pengerjaan
            </h3>

            <div className="h-[200px] w-full relative rounded-lg overflow-hidden border border-card-border isolate z-0">
              <MapPickerWrapper
                center={{
                  latitude: task.latitude ?? -7.782865,
                  longitude: task.longitude ?? 110.367003,
                }}
                tasks={taskForMap}
              />
            </div>

            {task.latitude && task.longitude && (
              <span className="font-mono text-[11px] text-on-surface-variant text-center tabular-nums">
                Koordinat: {task.latitude.toFixed(6)}, {task.longitude.toFixed(6)}
              </span>
            )}
          </div>

          {/* Action buttons based on role */}
          {role === "worker" ? (
            <div className="hidden md:flex flex-col gap-sm">
              {/* Pesan status jika worker telah ditolak */}
              {task.viewer_application?.status === "rejected" && (
                <div className="bg-error-container/30 border border-error/25 rounded-xl p-4 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-error font-bold text-xs">
                    <XCircle className="w-4 h-4 shrink-0" />
                    Anda telah ditolak untuk pekerjaan ini.
                  </div>
                  {task.viewer_application.alasan_penolakan && (
                    <p className="font-body-sm text-xs text-on-surface-variant italic">
                      &ldquo;Alasan: {task.viewer_application.alasan_penolakan}&rdquo;
                    </p>
                  )}
                  <span className="font-sans text-xs text-on-surface-variant font-medium">
                    Percobaan apply: <span className="font-mono tabular-nums">{task.viewer_application.apply_count}</span> dari <span className="font-mono tabular-nums">{task.max_apply_attempts}</span> maksimal.
                  </span>
                </div>
              )}

              {taskStatus === "open" && (
                <>
                  {task.viewer_application?.status === "rejected" ? (
                    task.viewer_application.apply_count < task.max_apply_attempts ? (
                      <Button
                        onClick={() => setIsApplyModalOpen(true)}
                        disabled={actionLoading}
                        className="w-full py-3"
                        variant="primary"
                      >
                        Lamar Kembali (Percobaan {task.viewer_application.apply_count + 1}/{task.max_apply_attempts})
                      </Button>
                    ) : (
                      <div className="p-3 text-center border border-error/25 rounded-lg bg-error-container/30 text-error font-sans text-xs font-semibold">
                        Batas Maksimal Percobaan Apply Telah Tercapai ({task.viewer_application.apply_count}/{task.max_apply_attempts})
                      </div>
                    )
                  ) : (
                    <>
                      {/* Kartu info penawaran aktif (task bidding, masih pending) */}
                      {isEditingPendingBid && (
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col gap-1.5 mb-1">
                          <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
                            <Gavel className="w-4 h-4 shrink-0" />
                            Penawaran Anda Terkirim
                          </div>
                          <span className="font-mono text-lg font-bold text-on-surface tabular-nums">
                            {formatCurrency(task.viewer_application?.bid_amount ?? 0)}
                          </span>
                          <p className="font-body-sm text-[11px] text-on-surface-variant leading-relaxed">
                            Penawaran bersifat rahasia (sealed bid). Anda masih bisa mengubah atau membatalkannya selama belum dipilih oleh pemberi tugas.
                          </p>
                        </div>
                      )}
                      <Button
                        onClick={openApplyOrEditModal}
                        disabled={(task.has_applied && !isEditingPendingBid) || actionLoading}
                        className="w-full py-3"
                        variant="primary"
                      >
                        {isEditingPendingBid
                          ? "Ubah Penawaran"
                          : task.has_applied
                            ? "Sudah Dilamar"
                            : "Lamar Pekerjaan Ini"}
                      </Button>
                      {task.has_applied && (
                        <Button
                          onClick={handleCancelApplication}
                          disabled={actionLoading}
                          className="w-full py-2"
                          variant="ghost"
                        >
                          {task.is_bidding ? "Batalkan Penawaran" : "Batalkan Lamaran"}
                        </Button>
                      )}
                    </>
                  )}
                </>
              )}

              {taskStatus === "accepted" && (() => {
                const acceptedWorkers = task.applicants.filter(a => a.status === "accepted");
                const myEntry = acceptedWorkers.find(a => a.id_task_applicants === task.viewer_application?.id_task_applicants);
                const iHaveConfirmed = myEntry?.worker_confirmed ?? false;
                return (
                  <div className="flex flex-col gap-3 p-4 bg-surface-container-lowest border border-card-border rounded-xl shadow-xs">
                    {/* List Worker Terdaftar */}
                    <div className="flex flex-col gap-1 bg-surface-container-low p-2.5 rounded-lg border border-card-border/60">
                      <span className="font-sans text-[11px] font-bold text-on-surface">
                        Worker Terdaftar dalam Task Ini ({acceptedWorkers.length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {acceptedWorkers.map((a) => (
                          <span key={a.id_task_applicants} className="px-2 py-0.5 rounded bg-surface-container-lowest border border-card-border font-sans text-[11px] font-semibold text-on-surface">
                            👷 {a.worker.nama_lengkap}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 border-b border-card-border pb-3">
                      <span className="font-mono text-xs font-bold text-on-surface uppercase tracking-wider">
                        Status Konfirmasi Mulai (Tahap 2):
                      </span>
                      {/* Requester status */}
                      <div className="flex items-center justify-between font-sans text-xs">
                        <span className="flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-primary" />
                          Requester:
                        </span>
                        <span className={cn("font-semibold", task.requester_started ? "text-secondary font-bold" : "text-amber-600")}>
                          {task.requester_started ? "Sudah Konfirmasi" : "Belum Konfirmasi"}
                        </span>
                      </div>
                      {/* Per-worker status */}
                      {acceptedWorkers.map((a) => (
                        <div key={a.id_task_applicants} className="flex items-center justify-between font-sans text-xs">
                          <span className="flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5 text-secondary" />
                            {a.worker.nama_lengkap}:
                          </span>
                          <span className={cn("font-semibold", a.worker_confirmed ? "text-secondary font-bold" : "text-amber-600")}>
                            {a.worker_confirmed ? "Sudah Konfirmasi" : "Belum Konfirmasi"}
                          </span>
                        </div>
                      ))}
                    </div>

                    <p className="font-body-sm text-xs text-on-surface-variant italic">
                      Tugas akan otomatis lanjut ke tahap <span className="font-bold text-primary">Dikerjakan (Step 3)</span> setelah semua pihak yang bersangkutan memberikan konfirmasi mulai.
                    </p>

                    {!iHaveConfirmed ? (
                      <Button onClick={handleStartWork} className="w-full py-3" variant="primary" disabled={actionLoading}>
                        Konfirmasi Mulai Kerjakan
                      </Button>
                    ) : (
                      <div className="p-3 text-center border border-card-border rounded-lg bg-surface-container-low text-primary font-sans text-xs font-semibold">
                        Anda sudah konfirmasi. Menunggu konfirmasi dari pihak lain...
                      </div>
                    )}

                    <Button
                      type="button"
                      onClick={() => setIsDisputeModalOpen(true)}
                      variant="ghost"
                      className="w-full text-xs text-amber-600 hover:bg-amber-500/10 border border-amber-500/30 flex items-center justify-center gap-1.5 py-2 cursor-pointer"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Laporkan Kendala / Ajukan Sengketa</span>
                    </Button>
                  </div>
                );
              })()}

              {taskStatus === "in_progress" && (
                <div className="flex flex-col gap-2">
                  <div className="p-3 text-center border border-card-border rounded-lg bg-surface-container-low text-primary font-sans text-xs font-semibold">
                    Tugas Sedang Dikerjakan. Menunggu Konfirmasi Selesai dari Requester.
                  </div>
                  <Button
                    onClick={() => {
                      setCancelTaskMode("worker");
                      setIsCancelTaskModalOpen(true);
                    }}
                    disabled={actionLoading}
                    className="w-full py-2 text-xs font-semibold"
                    variant="destructive"
                  >
                    Mundur dari Tugas
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setIsDisputeModalOpen(true)}
                    variant="ghost"
                    className="w-full text-xs text-amber-600 hover:bg-amber-500/10 border border-amber-500/30 flex items-center justify-center gap-1.5 py-2 cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Laporkan Eksploitasi / Ajukan Sengketa</span>
                  </Button>
                </div>
              )}
              {taskStatus === "completed" && (
                hasWorkerRatedRequester() ? (
                  <div className="p-3 text-center border border-card-border rounded-lg bg-surface-container-low text-secondary font-sans text-xs font-semibold">
                    Anda sudah memberikan ulasan untuk task ini.
                  </div>
                ) : (
                  <Button onClick={openRatingModal} className="w-full py-3" variant="secondary">
                    Berikan Ulasan Balik ke Requester
                  </Button>
                )
              )}
            </div>
          ) : (
            // Requester Actions
            <div className="hidden md:flex flex-col gap-3">
              {taskStatus === "open" && (
                <div className="p-3 text-center border border-card-border rounded-lg bg-surface-container-low text-primary font-sans text-xs font-semibold">
                  Menunggu pelamar. Pilih dari daftar pelamar di bawah.
                </div>
              )}
              {taskStatus === "accepted" && (() => {
                const acceptedWorkers = task.applicants.filter(a => a.status === "accepted");
                return (
                  <div className="flex flex-col gap-3 p-4 bg-surface-container-lowest border border-card-border rounded-xl shadow-xs">
                    {/* List Worker Terdaftar */}
                    <div className="flex flex-col gap-1 bg-surface-container-low p-2.5 rounded-lg border border-card-border/60">
                      <span className="font-sans text-[11px] font-bold text-on-surface">
                        Worker Terdaftar dalam Task Ini ({acceptedWorkers.length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {acceptedWorkers.map((a) => (
                          <span key={a.id_task_applicants} className="px-2 py-0.5 rounded bg-surface-container-lowest border border-card-border font-sans text-[11px] font-semibold text-on-surface">
                            👷 {a.worker.nama_lengkap}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 border-b border-card-border pb-3">
                      <span className="font-mono text-xs font-bold text-on-surface uppercase tracking-wider">
                        Status Konfirmasi Mulai (Tahap 2):
                      </span>
                      {/* Requester */}
                      <div className="flex items-center justify-between font-sans text-xs">
                        <span className="flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-primary" />
                          Requester (Anda):
                        </span>
                        <span className={cn("font-semibold", task.requester_started ? "text-secondary font-bold" : "text-amber-600")}>
                          {task.requester_started ? "Sudah Konfirmasi" : "Belum Konfirmasi"}
                        </span>
                      </div>
                      {/* Per-worker status */}
                      {acceptedWorkers.map((a) => (
                        <div key={a.id_task_applicants} className="flex items-center justify-between font-sans text-xs">
                          <span className="flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5 text-secondary" />
                            {a.worker.nama_lengkap}:
                          </span>
                          <span className={cn("font-semibold", a.worker_confirmed ? "text-secondary font-bold" : "text-amber-600")}>
                            {a.worker_confirmed ? "Sudah Konfirmasi" : "Belum Konfirmasi"}
                          </span>
                        </div>
                      ))}
                    </div>

                    <p className="font-body-sm text-xs text-on-surface-variant italic">
                      Tugas akan otomatis lanjut ke tahap <span className="font-bold text-primary">Dikerjakan (Step 3)</span> setelah semua pihak yang bersangkutan memberikan konfirmasi mulai.
                    </p>

                    {!task.requester_started ? (
                      <Button onClick={handleStartWork} className="w-full py-3" variant="primary" disabled={actionLoading}>
                        Konfirmasi Mulai Pekerjaan
                      </Button>
                    ) : (
                      <div className="p-3 text-center border border-card-border rounded-lg bg-surface-container-low text-primary font-sans text-xs font-semibold">
                        Anda sudah konfirmasi. Menunggu konfirmasi dari Worker...
                      </div>
                    )}

                    <Button
                      type="button"
                      onClick={() => setIsDisputeModalOpen(true)}
                      variant="ghost"
                      className="w-full text-xs text-amber-600 hover:bg-amber-500/10 border border-amber-500/30 flex items-center justify-center gap-1.5 py-2 cursor-pointer"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Laporkan Kendala / Ajukan Sengketa</span>
                    </Button>
                  </div>
                );
              })()}
              {taskStatus === "in_progress" && (
                <div className="flex flex-col gap-2">
                  <Button onClick={handleConfirmCompletion} className="w-full py-3" variant="primary" disabled={actionLoading}>
                    Konfirmasi Selesai &amp; Cairkan Poin
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setIsDisputeModalOpen(true)}
                    variant="ghost"
                    className="w-full text-xs text-amber-600 hover:bg-amber-500/10 border border-amber-500/30 flex items-center justify-center gap-1.5 py-2 cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Laporkan Kendala / Ajukan Sengketa</span>
                  </Button>
                </div>
              )}
              {taskStatus === "completed" && (() => {
                const unratedWorkers = getRatingTargets();
                return unratedWorkers.length > 0 ? (
                  <Button onClick={() => { setRatingTargetIndex(0); openRatingModal(); }} className="w-full py-3" variant="secondary">
                    Beri Rating Worker ({unratedWorkers.length} belum dirating)
                  </Button>
                ) : (
                  <div className="p-3 text-center border border-card-border rounded-lg bg-surface-container-low text-secondary font-sans text-xs font-semibold">
                    Semua worker sudah dirating.
                  </div>
                );
              })()}
              {(taskStatus === "open" || taskStatus === "accepted" || taskStatus === "in_progress") && (
                <Button
                  onClick={() => {
                    setCancelTaskMode("requester");
                    setIsCancelTaskModalOpen(true);
                  }}
                  disabled={actionLoading}
                  className="w-full py-2"
                  variant="destructive"
                >
                  Batalkan Task
                </Button>
              )}
            </div>
          )}
        </div>
      </div>


      {/* Modal: Lamar Pekerjaan */}
      <Modal isOpen={isApplyModalOpen} onClose={() => setIsApplyModalOpen(false)} title={isEditingPendingBid ? "Ubah Penawaran" : task?.is_bidding ? "Ajukan Penawaran" : "Kirim Lamaran Kerja"}>
        <form onSubmit={handleApplySubmit} noValidate className="flex flex-col gap-4 font-sans text-xs">
          {/* Input Harga Penawaran — hanya untuk task bidding (sealed bid) */}
          {task?.is_bidding && (
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-on-surface">
                Harga Penawaran Anda <span className="text-error">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 font-mono font-bold text-on-surface-variant text-xs pointer-events-none">Rp</span>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className={cn(
                    "w-full pl-11 pr-3 py-2.5 text-base sm:text-xs font-mono font-bold bg-surface-container-low border rounded-xl text-on-surface focus:ring-2 focus:bg-surface-container-lowest focus:outline-none min-h-[44px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors",
                    bidError
                      ? "border-error focus:border-error focus:ring-error/20"
                      : "border-card-border focus:border-primary focus:ring-primary/20"
                  )}
                  placeholder={`Range: ${formatCurrency(task.budget_min ?? 0)} – ${formatCurrency(task.budget_max ?? task.kompensasi)}`}
                  value={applyBid}
                  onChange={(e) => {
                    setApplyBid(e.target.value);
                    if (bidError) setBidError("");
                  }}
                />
              </div>
              {bidError ? (
                <p className="text-xs font-medium text-error flex items-center gap-1.5 mt-0.5 animate-fadeIn">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{bidError}</span>
                </p>
              ) : (
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Penawaran bersifat rahasia (sealed bid), hanya pemberi tugas yang dapat melihatnya.
                </p>
              )}
            </div>
          )}

          {!isEditingPendingBid && (
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-on-surface">
                Pesan Singkat untuk Pemberi Kerja (opsional)
              </label>
              <textarea
                className="w-full bg-surface-container-low border border-card-border rounded-lg p-3 text-base sm:text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest focus:outline-none min-h-[100px] custom-scrollbar"
                placeholder="Ceritakan keahlianmu dan mengapa kamu cocok untuk tugas ini."
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
                maxLength={500}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-card-border pt-3 mt-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsApplyModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={actionLoading}>
              {actionLoading ? "Memproses..." : isEditingPendingBid ? "Perbarui Penawaran" : task?.is_bidding ? "Kirim Penawaran" : "Kirim Lamaran"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Ulasan & Rating */}
      <Modal
        isOpen={isRatingModalOpen}
        onClose={() => {
          setIsRatingModalOpen(false);
          setReviewComment("");
          setRating(5);
        }}
        title={
          isRequester && currentRatingTarget
            ? `Berikan Ulasan: ${currentRatingTarget.worker.nama_lengkap}`
            : "Berikan Ulasan Rating"
        }
      >
        <form onSubmit={handleRatingSubmit} noValidate className="flex flex-col gap-4 font-sans text-xs">
          <div className="flex flex-col items-center gap-2">
            <span className="font-semibold text-on-surface text-center">
              {isRequester && currentRatingTarget
                ? `Berapa bintang untuk ${currentRatingTarget.worker.nama_lengkap}?`
                : !isRequester && task
                ? `Berapa bintang untuk ${task.requester.nama_lengkap}?`
                : "Berapa bintang yang Anda berikan?"}
            </span>
            <div className="flex gap-2 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="cursor-pointer p-1 transition-transform active:scale-95 focus:outline-none"
                >
                  <Star
                    className={cn(
                      "w-8 h-8",
                      star <= rating ? "text-amber-400 fill-amber-400" : "text-outline-variant"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-on-surface">
              Komentar / Masukan (opsional)
            </label>
            <textarea
              className="w-full bg-surface-container-low border border-card-border rounded-lg p-3 text-base sm:text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest focus:outline-none min-h-[90px] custom-scrollbar"
              placeholder="Berikan komentar singkat mengenai hasil kerja / komunikasi..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              maxLength={500}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-card-border pt-3 mt-1">
            <Button type="submit" fullWidth size="md">
              Kirim Ulasan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Tolak Pelamar (Opsional dengan Alasan Penolakan) */}
      <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} title="Tolak Pelamar Kerja">
        <form onSubmit={handleRejectSubmit} noValidate className="flex flex-col gap-4 font-sans text-xs">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-on-surface">
              Alasan Penolakan (Opsional)
            </label>
            <textarea
              className="w-full bg-surface-container-low border border-card-border rounded-lg p-3 text-base sm:text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest focus:outline-none min-h-[100px] custom-scrollbar"
              placeholder="Berikan catatan / alasan penolakan (misal: kualifikasi belum sesuai, lokasi terlalu jauh, dll)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              maxLength={500}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-card-border pt-3 mt-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsRejectModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              className="bg-error-container/30 text-error hover:bg-error-container/50 border border-error/20"
              disabled={actionLoading}
            >
              {actionLoading ? "Memproses..." : "Konfirmasi Tolak Pelamar"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Ajukan Mediasi Sengketa */}
      <DisputeModal
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        taskId={task.id_tasks}
        taskTitle={task.judul_tugas}
        userRole={role}
        counterpartName={
          role === "requester"
            ? task.applicants.find((a) => a.status === "accepted")?.worker?.nama_lengkap
            : task.requester?.nama_lengkap
        }
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        taskId={task.id_tasks}
        taskTitle={task.judul_tugas}
      />

      {/* ───────────── MOBILE STICKY BOTTOM ACTION BAR (Thumb Reach) ───────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-3.5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] bg-surface-container-lowest/95 backdrop-blur-md border-t border-card-border flex items-center justify-between gap-2.5 z-[100] shadow-2xl">
        {/* Chat Button (Available when in progress or accepted) */}
        {(taskStatus === "accepted" || taskStatus === "in_progress") && (
          <Button
            variant="secondary"
            size="lg"
            onClick={async () => {
              try {
                const partnerId = role === "requester"
                  ? task.applicants.find(a => a.status === "accepted")?.worker?.id_user
                  : task.requester?.id_user;
                if (!partnerId) return;
                const res = await fetch("/api/chat/rooms", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ partner_id: partnerId, task_id: task.id_tasks }),
                });
                const json = await res.json();
                if (json.success) {
                  router.push(`/chat?room=${json.data.id_chat_room}`);
                }
              } catch (e) {
                console.error(e);
              }
            }}
            className="px-4 min-h-[46px]"
            icon={<MessageSquare className="w-4 h-4" />}
          >
            Chat
          </Button>
        )}

        {role === "worker" ? (
          taskStatus === "open" ? (
            task.has_applied ? (
              isEditingPendingBid ? (
                <Button
                  variant="primary"
                  size="lg"
                  className="flex-1 min-h-[46px] text-xs font-bold"
                  onClick={openApplyOrEditModal}
                >
                  Ubah Penawaran
                </Button>
              ) : (
                <div className="flex-1 py-3 px-3 rounded-xl bg-surface-container-low text-primary font-bold text-xs text-center border border-card-border">
                  Lamaran Sudah Dikirim
                </div>
              )
            ) : (
              <Button
                variant="primary"
                size="lg"
                className="flex-1 min-h-[46px] text-xs font-bold"
                onClick={openApplyOrEditModal}
                disabled={actionLoading}
              >
                {task.is_bidding ? "Ajukan Penawaran" : "Lamar Pekerjaan Ini"}
              </Button>
            )
          ) : taskStatus === "accepted" ? (() => {
            const acceptedWorkers = task.applicants.filter(a => a.status === "accepted");
            const myEntry = acceptedWorkers.find(a => a.id_task_applicants === task.viewer_application?.id_task_applicants);
            const iHaveConfirmed = myEntry?.worker_confirmed ?? false;
            return !iHaveConfirmed ? (
              <Button
                variant="primary"
                size="lg"
                className="flex-1 min-h-[46px] text-xs font-bold"
                onClick={handleStartWork}
                disabled={actionLoading}
              >
                Konfirmasi Mulai Kerja
              </Button>
            ) : (
              <div className="flex-1 py-3 px-3 rounded-xl bg-surface-container-low text-primary font-bold text-xs text-center border border-card-border">
                Menunggu Requester...
              </div>
            );
          })() : taskStatus === "completed" && !hasWorkerRatedRequester() ? (
            <Button
              variant="secondary"
              size="lg"
              className="flex-1 min-h-[46px] text-xs font-bold"
              onClick={() => setIsRatingModalOpen(true)}
            >
              Beri Ulasan Requester
            </Button>
          ) : null
        ) : (
          // Requester Mobile Sticky
          taskStatus === "accepted" && !task.requester_started ? (
            <Button
              variant="primary"
              size="lg"
              className="flex-1 min-h-[46px] text-xs font-bold"
              onClick={handleStartWork}
              disabled={actionLoading}
            >
              Konfirmasi Mulai Pekerjaan
            </Button>
          ) : taskStatus === "in_progress" ? (
            <Button
              variant="primary"
              size="lg"
              className="flex-1 min-h-[46px] text-xs font-bold"
              onClick={handleConfirmCompletion}
              disabled={actionLoading}
            >
              Konfirmasi Selesai &amp; Cairkan
            </Button>
          ) : taskStatus === "completed" && getRatingTargets().length > 0 ? (
            <Button
              variant="secondary"
              size="lg"
              className="flex-1 min-h-[46px] text-xs font-bold"
              onClick={() => { setRatingTargetIndex(0); setIsRatingModalOpen(true); }}
            >
              Beri Rating Worker
            </Button>
          ) : null
        )}
      </div>
    </div>
  );
}
