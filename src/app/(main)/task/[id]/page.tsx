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
import MapPickerWrapper from "@/features/task/components/MapPickerWrapper";

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
  status: TaskStatus;
  worker_started: boolean;
  requester_started: boolean;
  max_applicants: number;
  max_apply_attempts: number;
  created_at: string;
  completed_at: string | null;
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
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingTargetIndex, setRatingTargetIndex] = useState(0); // index dalam antrian rating
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedApplicantToReject, setSelectedApplicantToReject] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [applyMessage, setApplyMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  // Fetch task detail dari API
  const fetchTask = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${id}`);
      const data = await res.json();
      if (data.success) {
        setTask(data.data);
      } else {
        showToast(data.message || "Task tidak ditemukan.");
      }
    } catch {
      showToast("Gagal memuat detail task.");
    } finally {
      setLoading(false);
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  // ── Worker: Apply ──────────────────────────────────────────────────────────
  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tasks/${id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pesan: applyMessage }),
      });
      const data = await res.json();
      if (data.success) {
        setIsApplyModalOpen(false);
        setApplyMessage("");
        showToast("Berhasil melamar pekerjaan! Menunggu persetujuan pemberi kerja.");
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
      const data = await res.json();
      if (data.success) {
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
  const handleAcceptApplicant = async (applicantId: string, workerName: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tasks/applicants/${applicantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      const data = await res.json();
      if (data.success) {
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
      const data = await res.json();
      if (data.success) {
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
      const data = await res.json();
      if (data.success) {
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
      const data = await res.json();
      if (data.success) {
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
      const data = await res.json();
      if (data.success) {
        showToast("Task selesai! Poin telah ditransfer ke Worker.");
        fetchTask();
        setIsRatingModalOpen(true);
      } else {
        showToast(data.message || "Gagal mengkonfirmasi penyelesaian.");
      }
    } catch {
      showToast("Terjadi kesalahan jaringan.");
    } finally {
      setActionLoading(false);
    }
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
      const data = await res.json();
      if (data.success) {
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

  // ── Loading & Not Found States ─────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-xl gap-sm min-h-[50vh]">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p className="font-body-md text-body-md text-on-surface-variant">Memuat detail tugas...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center p-xl gap-sm min-h-[50vh]">
        <span className="material-symbols-outlined text-outline text-[48px]" aria-hidden="true">error</span>
        <h3 className="font-headline-sm text-headline-sm">Tugas Tidak Ditemukan</h3>
        <Button onClick={() => router.push("/feed")}>Kembali ke Feed</Button>
      </div>
    );
  }

  const taskStatus = task.status;
  const taskForMap = task.latitude && task.longitude
    ? [{ id_task: task.id_tasks, title: task.judul_tugas, latitude: task.latitude, longitude: task.longitude, compensation: task.kompensasi, status: task.status, description: task.deskripsi_tugas, duration_estimate: task.estimasi_waktu ?? "", created_at: task.created_at, updated_at: task.created_at, id_requester: task.id_requester }]
    : [];

  return (
    <div className="max-w-4xl mx-auto p-lg md:p-xl font-sans flex flex-col gap-lg">
      {/* Header */}
      <div className="flex items-center gap-sm">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full hover:bg-surface-container flex items-center justify-center border border-outline-variant/60 cursor-pointer"
        >
          <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
        </button>
        <div>
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            Detail Pekerjaan
          </span>
          <h1 className="font-headline-md text-headline-md text-on-surface">{task.judul_tugas}</h1>
        </div>
      </div>

      <EscrowBanner />

      {/* Main Details and Map grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        {/* Info Left */}
        <div className="md:col-span-2 flex flex-col gap-md">
          <div className="bg-white border border-outline-variant rounded-xl p-md md:p-lg flex flex-col gap-md">
            <div className="flex justify-between items-center pb-sm border-b border-outline-variant/50">
              <div className="flex flex-col">
                <span className="font-label-md text-label-md font-bold text-primary font-mono text-[18px]">
                  {formatCurrency(task.kompensasi)} <span className="text-xs font-normal text-on-surface-variant font-sans">/ worker</span>
                </span>
                <span className="font-label-sm text-[11px] text-on-surface-variant font-mono">
                  Total Escrow: {formatCurrency(task.kompensasi * (task.max_applicants ?? 1))} ({task.max_applicants ?? 1} worker)
                </span>
              </div>
              <Badge status={taskStatus} />
            </div>

            {/* Requester info */}
            <div className="flex items-center gap-sm text-on-surface-variant">
              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-sm shrink-0">
                {task.requester.nama_lengkap.charAt(0)}
              </div>
              <div>
                <p className="font-label-sm text-label-sm font-semibold text-on-surface">{task.requester.nama_lengkap}</p>
                <p className="font-body-sm text-[11px] text-on-surface-variant">
                  ★ {task.requester.rating_avg.toFixed(1)} • {task.requester.total_completed} task selesai
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-xs">
              <h3 className="font-body-md text-body-md font-semibold text-on-surface">Deskripsi</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                {task.deskripsi_tugas}
              </p>
            </div>

            {task.requirements.length > 0 && (
              <div className="flex flex-wrap gap-xs">
                {task.requirements.map((skill: any) => (
                  <span
                    key={skill.id_skill}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-interaction-bg border border-outline-variant text-primary-container font-label-sm text-[11px] font-semibold"
                  >
                    {renderIcon(skill.icon, "w-3 h-3 shrink-0")}
                    {skill.nama_skill}
                  </span>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-md border-t border-outline-variant/50 pt-md font-label-sm text-label-sm">
              <div>
                <span className="text-on-surface-variant block">Estimasi Waktu</span>
                <span className="font-bold text-on-surface text-body-sm">{task.estimasi_waktu ?? "-"}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Max Worker</span>
                <span className="font-bold text-on-surface text-body-sm">{task.max_applicants ?? 1} Orang</span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Max Percobaan</span>
                <span className="font-bold text-on-surface text-body-sm">{task.max_apply_attempts ?? 3}x Apply</span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Diposting Pada</span>
                <span className="font-bold text-on-surface text-body-sm">{formatDate(task.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Status step tracker */}
          <div className="bg-white border border-outline-variant rounded-xl p-md md:p-lg flex flex-col gap-sm">
            <h3 className="font-body-md text-body-md font-semibold text-on-surface">Progres Status Tugas</h3>
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
          {role === "requester" && taskStatus === "open" && (
            <div className="flex flex-col gap-sm bg-white border border-outline-variant rounded-xl p-md md:p-lg">
              <div className="flex justify-between items-center border-b border-outline-variant/50 pb-sm">
                <h3 className="font-body-md text-body-md font-extrabold text-on-surface">
                  Daftar Pelamar ({task.applicants.length})
                </h3>
                <span className="font-label-sm text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Worker Diterima: {task.applicants.filter(a => a.status === "accepted").length} / {task.max_applicants ?? 1}
                </span>
              </div>

              {/* Opsi Mulai Tugas Sekarang dengan Worker yang Sudah Diterima */}
              {task.applicants.filter(a => a.status === "accepted").length > 0 && (
                <div className="bg-lime-50 border border-lime-200 rounded-xl p-md flex flex-col gap-xs my-xs">
                  <div className="flex items-center gap-xs text-lime-900 font-bold text-body-sm">
                    <span className="material-symbols-outlined text-[18px]">play_circle</span>
                    Mulai Tugas Sekarang dengan Worker Terpilih?
                  </div>
                  <p className="font-body-sm text-[12px] text-lime-800">
                    Anda telah menerima {task.applicants.filter(a => a.status === "accepted").length} worker. Anda bisa mulai sekarang tanpa perlu menunggu slot ({task.max_applicants}) penuh. Pelamar pending lainnya akan otomatis di-reject.
                  </p>
                  <Button
                    onClick={handleManualStartTask}
                    disabled={actionLoading}
                    variant="lime"
                    className="w-full py-2 mt-xs text-xs font-bold"
                  >
                    Mulai Tugas Sekarang ({task.applicants.filter(a => a.status === "accepted").length} Worker)
                  </Button>
                </div>
              )}

              {task.applicants.length === 0 ? (
                <div className="py-8 text-center">
                  <span className="material-symbols-outlined text-outline text-[40px]" aria-hidden="true">people_search</span>
                  <p className="font-body-sm text-on-surface-variant mt-2">Belum ada yang melamar.</p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-outline-variant/60">
                  {task.applicants.map((app) => (
                    <div key={app.id_task_applicants} className="py-md flex flex-col gap-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-md">
                          <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold font-mono">
                            {app.worker.nama_lengkap.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-body-md text-body-md font-semibold text-on-surface">
                              {app.worker.nama_lengkap}
                            </h4>
                            <p className="font-label-sm text-label-sm text-on-surface-variant">
                              {app.worker.pendidikan_terakhir ?? "Mahasiswa"} •{" "}
                              <span className="text-amber-500 font-bold">★ {app.worker.rating_avg.toFixed(1)}</span>
                            </p>
                          </div>
                        </div>
                        <Badge status={app.status === "accepted" ? "accepted" : app.status === "rejected" ? "rejected" : "open"} />
                      </div>

                      {app.pesan && (
                        <p className="font-body-sm text-body-sm text-on-surface-variant bg-surface-container-low p-sm rounded border border-outline-variant/50 italic">
                          &quot;{app.pesan}&quot;
                        </p>
                      )}

                      {app.status === "pending" && (
                        <div className="flex justify-between items-center gap-sm mt-xs">
                          {/* Tombol Chat Sejajar di Pojok Kiri */}
                          <button
                            type="button"
                            onClick={() => router.push(`/chat?userId=${app.id_worker}`)}
                            className="flex items-center gap-xs font-label-sm text-xs font-bold px-3 py-1.5 rounded-lg border border-primary/40 text-primary hover:bg-primary/10 cursor-pointer transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">chat</span>
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
                              onClick={() => handleAcceptApplicant(app.id_task_applicants, app.worker.nama_lengkap)}
                              variant="primary"
                              className="py-1 px-3 text-xs font-bold"
                              disabled={actionLoading}
                            >
                              Terima Worker
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
            <div className="flex flex-col gap-md bg-white border border-outline-variant rounded-xl p-md md:p-lg">
              <div className="flex items-center justify-between border-b border-outline-variant/50 pb-sm">
                <h3 className="font-body-md text-body-md font-extrabold text-on-surface">Ulasan & Rating Transaksi</h3>
                <span className="font-label-sm text-[11px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full font-mono font-semibold">
                  {task.reviews.length} Ulasan
                </span>
              </div>

              {/* Group 1: Ulasan dari Requester (Pemberi Kerja) */}
              <div className="flex flex-col gap-sm">
                <div className="flex items-center gap-xs text-primary font-label-sm text-xs font-bold uppercase tracking-wider bg-primary/10 px-sm py-1 rounded-md">
                  <span className="material-symbols-outlined text-[16px]">storefront</span>
                  Ulasan dari Requester (Pemberi Tugas)
                </div>
                {task.reviews.filter((r) => r.rater.id_user === task.id_requester).length === 0 ? (
                  <p className="font-body-sm text-[12px] text-on-surface-variant italic pl-sm py-1">
                    Belum ada ulasan dari Requester.
                  </p>
                ) : (
                  task.reviews
                    .filter((r) => r.rater.id_user === task.id_requester)
                    .map((r) => (
                      <div key={r.id_reviews} className="p-sm bg-surface-container-lowest border border-outline-variant/60 rounded-lg flex flex-col gap-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-sm">
                            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                              {r.rater.nama_lengkap.charAt(0)}
                            </div>
                            <div>
                              <span className="font-label-sm text-label-sm font-bold text-on-surface">{r.rater.nama_lengkap}</span>
                              {r.ratee && (
                                <span className="font-label-sm text-[11px] text-on-surface-variant block">
                                  Memberikan rating untuk: <span className="font-semibold text-primary">{r.ratee.nama_lengkap}</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-[2px]">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className="material-symbols-outlined text-[16px] text-amber-500"
                                style={{ fontVariationSettings: star <= r.rating ? "'FILL' 1" : "'FILL' 0" }}
                                aria-hidden="true"
                              >
                                star
                              </span>
                            ))}
                          </div>
                        </div>
                        {r.comment && (
                          <p className="font-body-sm text-[12px] text-on-surface-variant italic bg-white p-xs rounded border border-outline-variant/30 mt-xs">
                            &ldquo;{r.comment}&rdquo;
                          </p>
                        )}
                      </div>
                    ))
                )}
              </div>

              {/* Group 2: Ulasan dari Worker (Pengerja) */}
              <div className="flex flex-col gap-sm pt-xs border-t border-outline-variant/40">
                <div className="flex items-center gap-xs text-secondary font-label-sm text-xs font-bold uppercase tracking-wider bg-secondary/10 px-sm py-1 rounded-md">
                  <span className="material-symbols-outlined text-[16px]">engineering</span>
                  Ulasan dari Worker (Pengerja)
                </div>
                {task.reviews.filter((r) => r.rater.id_user !== task.id_requester).length === 0 ? (
                  <p className="font-body-sm text-[12px] text-on-surface-variant italic pl-sm py-1">
                    Belum ada ulasan dari Worker.
                  </p>
                ) : (
                  task.reviews
                    .filter((r) => r.rater.id_user !== task.id_requester)
                    .map((r) => (
                      <div key={r.id_reviews} className="p-sm bg-surface-container-lowest border border-outline-variant/60 rounded-lg flex flex-col gap-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-sm">
                            <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                              {r.rater.nama_lengkap.charAt(0)}
                            </div>
                            <div>
                              <span className="font-label-sm text-label-sm font-bold text-on-surface">{r.rater.nama_lengkap}</span>
                              {r.ratee && (
                                <span className="font-label-sm text-[11px] text-on-surface-variant block">
                                  Memberikan rating untuk: <span className="font-semibold text-secondary">{r.ratee.nama_lengkap}</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-[2px]">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className="material-symbols-outlined text-[16px] text-amber-500"
                                style={{ fontVariationSettings: star <= r.rating ? "'FILL' 1" : "'FILL' 0" }}
                                aria-hidden="true"
                              >
                                star
                              </span>
                            ))}
                          </div>
                        </div>
                        {r.comment && (
                          <p className="font-body-sm text-[12px] text-on-surface-variant italic bg-white p-xs rounded border border-outline-variant/30 mt-xs">
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
        <div className="flex flex-col gap-md">
          <div className="bg-white border border-outline-variant rounded-xl p-md flex flex-col gap-sm">
            <h3 className="font-body-md text-body-md font-semibold text-on-surface flex items-center gap-xs">
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">location_on</span>
              Lokasi Pengerjaan
            </h3>

            <div className="h-[200px] w-full relative">
              <MapPickerWrapper
                center={{
                  latitude: task.latitude ?? -7.782865,
                  longitude: task.longitude ?? 110.367003,
                }}
                tasks={taskForMap}
              />
            </div>

            {task.latitude && task.longitude && (
              <span className="font-label-sm text-label-sm text-on-surface-variant text-center font-mono">
                Koordinat: {task.latitude.toFixed(6)}, {task.longitude.toFixed(6)}
              </span>
            )}
          </div>

          {/* Action buttons based on role */}
          {role === "worker" ? (
            <div className="flex flex-col gap-sm">
              {/* Pesan status jika worker telah ditolak */}
              {task.viewer_application?.status === "rejected" && (
                <div className="bg-error/10 border border-error/20 rounded-xl p-md flex flex-col gap-xs">
                  <div className="flex items-center gap-xs text-error font-bold text-body-sm">
                    <span className="material-symbols-outlined text-[18px]">cancel</span>
                    Anda telah ditolak untuk pekerjaan ini.
                  </div>
                  {task.viewer_application.alasan_penolakan && (
                    <p className="font-body-sm text-on-surface-variant italic">
                      &ldquo;Alasan: {task.viewer_application.alasan_penolakan}&rdquo;
                    </p>
                  )}
                  <span className="font-label-sm text-[11px] text-on-surface-variant font-medium">
                    Percobaan apply: {task.viewer_application.apply_count} dari {task.max_apply_attempts} maksimal.
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
                      <div className="p-sm text-center border border-error/30 rounded bg-error/10 text-error font-label-sm text-label-sm font-semibold">
                        Batas Maksimal Percobaan Apply Telah Tercapai ({task.viewer_application.apply_count}/{task.max_apply_attempts})
                      </div>
                    )
                  ) : (
                    <>
                      <Button
                        onClick={() => setIsApplyModalOpen(true)}
                        disabled={task.has_applied || actionLoading}
                        className="w-full py-3"
                        variant="primary"
                      >
                        {task.has_applied ? "Sudah Dilamar" : "Lamar Pekerjaan Ini"}
                      </Button>
                      {task.has_applied && (
                        <Button
                          onClick={handleCancelApplication}
                          disabled={actionLoading}
                          className="w-full py-2"
                          variant="ghost"
                        >
                          Batalkan Lamaran
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
                  <div className="flex flex-col gap-sm p-md bg-surface-container-lowest border border-outline-variant/60 rounded-xl">
                    {/* List Worker Terdaftar */}
                    <div className="flex flex-col gap-xs bg-surface-container-low p-xs rounded border border-outline-variant/40">
                      <span className="font-label-sm text-[11px] font-bold text-on-surface">
                        Worker Terdaftar dalam Task Ini ({acceptedWorkers.length}):
                      </span>
                      <div className="flex flex-wrap gap-xs">
                        {acceptedWorkers.map((a) => (
                          <span key={a.id_task_applicants} className="px-2 py-0.5 rounded bg-white border border-outline-variant/60 font-body-sm text-[11px] font-semibold text-on-surface">
                            👷 {a.worker.nama_lengkap}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-xs border-b border-outline-variant/40 pb-sm">
                      <span className="font-label-sm text-xs font-bold text-on-surface uppercase tracking-wider">
                        Status Konfirmasi Mulai (Tahap 2):
                      </span>
                      {/* Requester status */}
                      <div className="flex items-center justify-between font-body-sm text-xs">
                        <span className="flex items-center gap-xs">
                          <span className="material-symbols-outlined text-[16px] text-primary">storefront</span>
                          Requester:
                        </span>
                        <span className={`font-semibold ${task.requester_started ? "text-secondary font-bold" : "text-amber-600"}`}>
                          {task.requester_started ? "Sudah Konfirmasi ✅" : "Belum Konfirmasi ⏳"}
                        </span>
                      </div>
                      {/* Per-worker status */}
                      {acceptedWorkers.map((a) => (
                        <div key={a.id_task_applicants} className="flex items-center justify-between font-body-sm text-xs">
                          <span className="flex items-center gap-xs">
                            <span className="material-symbols-outlined text-[16px] text-secondary">engineering</span>
                            {a.worker.nama_lengkap}:
                          </span>
                          <span className={`font-semibold ${a.worker_confirmed ? "text-secondary font-bold" : "text-amber-600"}`}>
                            {a.worker_confirmed ? "Sudah Konfirmasi ✅" : "Belum Konfirmasi ⏳"}
                          </span>
                        </div>
                      ))}
                    </div>

                    <p className="font-body-sm text-[11px] text-on-surface-variant italic">
                      Tugas akan otomatis lanjut ke tahap <span className="font-bold text-primary">Dikerjakan (Step 3)</span> setelah semua pihak yang bersangkutan memberikan konfirmasi mulai.
                    </p>

                    {!iHaveConfirmed ? (
                      <Button onClick={handleStartWork} className="w-full py-3 mt-xs" variant="lime" disabled={actionLoading}>
                        Konfirmasi Mulai Kerjakan
                      </Button>
                    ) : (
                      <div className="p-sm text-center border border-outline-variant rounded bg-surface-container text-primary font-label-sm text-label-sm font-semibold">
                        Anda sudah konfirmasi. Menunggu konfirmasi dari pihak lain...
                      </div>
                    )}
                  </div>
                );
              })()}

              {taskStatus === "in_progress" && (
                <div className="p-sm text-center border border-outline-variant rounded bg-surface-container text-primary font-label-sm text-label-sm font-semibold">
                  Tugas Sedang Dikerjakan. Menunggu Konfirmasi Selesai dari Requester.
                </div>
              )}
              {taskStatus === "completed" && (
                hasWorkerRatedRequester() ? (
                  <div className="p-sm text-center border border-outline-variant rounded bg-surface-container text-secondary font-label-sm text-label-sm font-semibold">
                    ✅ Anda sudah memberikan ulasan untuk task ini.
                  </div>
                ) : (
                  <Button onClick={() => setIsRatingModalOpen(true)} className="w-full py-3" variant="secondary">
                    Berikan Ulasan Balik ke Requester
                  </Button>
                )
              )}
            </div>
          ) : (
            // Requester Actions
            <div className="flex flex-col gap-sm">
              {taskStatus === "open" && (
                <div className="p-sm text-center border border-outline-variant rounded bg-surface-container text-primary font-label-sm text-label-sm font-semibold">
                  Menunggu pelamar. Pilih dari daftar pelamar di bawah.
                </div>
              )}
              {taskStatus === "accepted" && (() => {
                const acceptedWorkers = task.applicants.filter(a => a.status === "accepted");
                return (
                  <div className="flex flex-col gap-sm p-md bg-surface-container-lowest border border-outline-variant/60 rounded-xl">
                    {/* List Worker Terdaftar */}
                    <div className="flex flex-col gap-xs bg-surface-container-low p-xs rounded border border-outline-variant/40">
                      <span className="font-label-sm text-[11px] font-bold text-on-surface">
                        Worker Terdaftar dalam Task Ini ({acceptedWorkers.length}):
                      </span>
                      <div className="flex flex-wrap gap-xs">
                        {acceptedWorkers.map((a) => (
                          <span key={a.id_task_applicants} className="px-2 py-0.5 rounded bg-white border border-outline-variant/60 font-body-sm text-[11px] font-semibold text-on-surface">
                            👷 {a.worker.nama_lengkap}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-xs border-b border-outline-variant/40 pb-sm">
                      <span className="font-label-sm text-xs font-bold text-on-surface uppercase tracking-wider">
                        Status Konfirmasi Mulai (Tahap 2):
                      </span>
                      {/* Requester */}
                      <div className="flex items-center justify-between font-body-sm text-xs">
                        <span className="flex items-center gap-xs">
                          <span className="material-symbols-outlined text-[16px] text-primary">storefront</span>
                          Requester (Anda):
                        </span>
                        <span className={`font-semibold ${task.requester_started ? "text-secondary font-bold" : "text-amber-600"}`}>
                          {task.requester_started ? "Sudah Konfirmasi ✅" : "Belum Konfirmasi ⏳"}
                        </span>
                      </div>
                      {/* Per-worker status */}
                      {acceptedWorkers.map((a) => (
                        <div key={a.id_task_applicants} className="flex items-center justify-between font-body-sm text-xs">
                          <span className="flex items-center gap-xs">
                            <span className="material-symbols-outlined text-[16px] text-secondary">engineering</span>
                            {a.worker.nama_lengkap}:
                          </span>
                          <span className={`font-semibold ${a.worker_confirmed ? "text-secondary font-bold" : "text-amber-600"}`}>
                            {a.worker_confirmed ? "Sudah Konfirmasi ✅" : "Belum Konfirmasi ⏳"}
                          </span>
                        </div>
                      ))}
                    </div>

                    <p className="font-body-sm text-[11px] text-on-surface-variant italic">
                      Tugas akan otomatis lanjut ke tahap <span className="font-bold text-primary">Dikerjakan (Step 3)</span> setelah semua pihak yang bersangkutan memberikan konfirmasi mulai.
                    </p>

                    {!task.requester_started ? (
                      <Button onClick={handleStartWork} className="w-full py-3 mt-xs" variant="lime" disabled={actionLoading}>
                        Konfirmasi Mulai Pekerjaan
                      </Button>
                    ) : (
                      <div className="p-sm text-center border border-outline-variant rounded bg-surface-container text-primary font-label-sm text-label-sm font-semibold">
                        Anda sudah konfirmasi. Menunggu konfirmasi dari Worker...
                      </div>
                    )}
                  </div>
                );
              })()}
              {taskStatus === "in_progress" && (
                <Button onClick={handleConfirmCompletion} className="w-full py-3" variant="primary" disabled={actionLoading}>
                  Konfirmasi Selesai &amp; Cairkan Poin
                </Button>
              )}
              {taskStatus === "completed" && (() => {
                const unratedWorkers = getRatingTargets();
                return unratedWorkers.length > 0 ? (
                  <Button onClick={() => { setRatingTargetIndex(0); setIsRatingModalOpen(true); }} className="w-full py-3" variant="secondary">
                    Beri Rating Worker ({unratedWorkers.length} belum dirating)
                  </Button>
                ) : (
                  <div className="p-sm text-center border border-outline-variant rounded bg-surface-container text-secondary font-label-sm text-label-sm font-semibold">
                    ✅ Semua worker sudah dirating.
                  </div>
                );
              })()}
              {taskStatus === "open" && (
                <Button
                  onClick={async () => {
                    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
                    const data = await res.json();
                    if (data.success) {
                      showToast("Task berhasil dibatalkan.");
                      router.push("/tugas");
                    } else {
                      showToast(data.message || "Gagal membatalkan task.");
                    }
                  }}
                  className="w-full py-2"
                  variant="ghost"
                >
                  Batalkan Task
                </Button>
              )}
            </div>
          )}
        </div>
      </div>


      {/* Modal: Lamar Pekerjaan */}
      <Modal isOpen={isApplyModalOpen} onClose={() => setIsApplyModalOpen(false)} title="Kirim Lamaran Kerja">
        <form onSubmit={handleApplySubmit} className="flex flex-col gap-md">
          <div className="flex flex-col gap-xs">
            <label className="font-body-sm text-body-sm text-on-surface-variant font-medium">
              Pesan Singkat untuk Pemberi Kerja (opsional)
            </label>
            <textarea
              className="input-field min-h-[120px] font-body-sm custom-scrollbar"
              placeholder="Ceritakan keahlianmu dan mengapa kamu cocok untuk tugas ini."
              value={applyMessage}
              onChange={(e) => setApplyMessage(e.target.value)}
              maxLength={500}
            />
          </div>

          <div className="flex justify-end gap-sm border-t border-outline-variant/30 pt-md mt-sm">
            <button
              type="button"
              onClick={() => setIsApplyModalOpen(false)}
              className="font-label-md text-label-md font-bold px-md py-sm rounded border border-outline-variant/60 hover:bg-surface-container cursor-pointer transition-colors"
            >
              Batal
            </button>
            <Button type="submit" disabled={actionLoading}>
              {actionLoading ? "Mengirim..." : "Kirim Lamaran"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Ulasan & Rating */}
      <Modal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        title={
          role === "requester" && currentRatingTarget
            ? `Berikan Ulasan: ${currentRatingTarget.worker.nama_lengkap}`
            : "Berikan Ulasan Rating"
        }
      >
        <form onSubmit={handleRatingSubmit} className="flex flex-col gap-md">
          <div className="flex flex-col items-center gap-sm">
            <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
              {role === "requester" && currentRatingTarget
                ? `Berapa bintang untuk ${currentRatingTarget.worker.nama_lengkap}?`
                : role === "worker" && task
                ? `Berapa bintang untuk ${task.requester.nama_lengkap}?`
                : "Berapa bintang yang Anda berikan?"}
            </span>
            <div className="flex gap-sm">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="cursor-pointer text-[32px] text-amber-400 focus:outline-none"
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: star <= rating ? "'FILL' 1" : "'FILL' 0" }}
                   aria-hidden="true">
                    star
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-xs">
            <label className="font-body-sm text-body-sm text-on-surface-variant font-medium">
              Komentar / Masukan (opsional)
            </label>
            <textarea
              className="input-field min-h-[100px] font-body-sm custom-scrollbar"
              placeholder="Berikan komentar singkat mengenai hasil kerja / komunikasi..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              maxLength={500}
            />
          </div>

          <div className="flex justify-end gap-sm border-t border-outline-variant/30 pt-md mt-sm">
            <Button type="submit" fullWidth>
              Kirim Ulasan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Tolak Pelamar (Opsional dengan Alasan Penolakan) */}
      <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} title="Tolak Pelamar Kerja">
        <form onSubmit={handleRejectSubmit} className="flex flex-col gap-md">
          <div className="flex flex-col gap-xs">
            <label className="font-body-sm text-body-sm text-on-surface-variant font-medium">
              Alasan Penolakan (Opsional)
            </label>
            <textarea
              className="input-field min-h-[100px] font-body-sm custom-scrollbar"
              placeholder="Berikan catatan / alasan penolakan (misal: kualifikasi belum sesuai, lokasi terlalu jauh, dll)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              maxLength={500}
            />
          </div>

          <div className="flex justify-end gap-sm border-t border-outline-variant/30 pt-md mt-sm">
            <button
              type="button"
              onClick={() => setIsRejectModalOpen(false)}
              className="font-label-md text-label-md font-bold px-md py-sm rounded border border-outline-variant/60 hover:bg-surface-container cursor-pointer transition-colors"
            >
              Batal
            </button>
            <Button type="submit" variant="ghost" className="bg-error/10 text-error hover:bg-error/20" disabled={actionLoading}>
              {actionLoading ? "Memproses..." : "Konfirmasi Tolak Pelamar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
