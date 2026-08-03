"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useCurrentRole } from "@/app/(main)/layout";
import { TaskStatus } from "@/types/database";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { useToast } from "@/components/ui/Toast";
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
  applied_at: string;
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
  }>;
  has_applied: boolean;
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
  const handleRejectApplicant = async (applicantId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tasks/applicants/${applicantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Lamaran ditolak.");
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

  // ── Worker: Start Work ─────────────────────────────────────────────────────
  const handleStartWork = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tasks/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in_progress" }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Status diperbarui: Sedang dikerjakan!");
        fetchTask();
      } else {
        showToast(data.message || "Gagal memperbarui status.");
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
  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    // Tentukan reviewee: jika role worker → review requester, jika requester → review accepted worker
    const acceptedWorker = task.applicants.find((a) => a.status === "accepted");
    const revieweeId = role === "worker" ? task.id_requester : acceptedWorker?.id_worker;

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
      setIsRatingModalOpen(false);
      if (data.success) {
        showToast("Ulasan berhasil disimpan! Terima kasih.");
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
        <span className="material-symbols-outlined text-primary text-[48px] animate-spin">
          progress_activity
        </span>
        <p className="font-body-md text-body-md text-on-surface-variant">Memuat detail tugas...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center p-xl gap-sm min-h-[50vh]">
        <span className="material-symbols-outlined text-outline text-[48px]">error</span>
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
          <span className="material-symbols-outlined">arrow_back</span>
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
              <span className="font-label-md text-label-md font-bold text-primary font-mono text-[18px]">
                {formatCurrency(task.kompensasi)}
              </span>
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
                {task.requirements.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-1 rounded-full bg-interaction-bg border border-outline-variant text-primary-container font-label-sm text-[11px] font-semibold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-md border-t border-outline-variant/50 pt-md font-label-sm text-label-sm">
              <div>
                <span className="text-on-surface-variant block">Estimasi Waktu</span>
                <span className="font-bold text-on-surface text-body-sm">{task.estimasi_waktu ?? "-"}</span>
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
              <h3 className="font-body-md text-body-md font-extrabold text-on-surface">
                Daftar Pelamar ({task.applicants.length})
              </h3>
              {task.applicants.length === 0 ? (
                <div className="py-8 text-center">
                  <span className="material-symbols-outlined text-outline text-[40px]">people_search</span>
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
                        <Badge status={app.status === "accepted" ? "accepted" : app.status === "rejected" ? "cancelled" : "open"} />
                      </div>

                      {app.pesan && (
                        <p className="font-body-sm text-body-sm text-on-surface-variant bg-surface-container-low p-sm rounded border border-outline-variant/50 italic">
                          &quot;{app.pesan}&quot;
                        </p>
                      )}

                      {app.status === "pending" && (
                        <div className="flex justify-end gap-sm mt-xs">
                          <Button
                            onClick={() => handleRejectApplicant(app.id_task_applicants)}
                            variant="ghost"
                            className="py-1 px-3 text-xs font-bold"
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
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reviews (jika task completed) */}
          {taskStatus === "completed" && task.reviews.length > 0 && (
            <div className="flex flex-col gap-sm bg-white border border-outline-variant rounded-xl p-md md:p-lg">
              <h3 className="font-body-md text-body-md font-extrabold text-on-surface">Ulasan</h3>
              {task.reviews.map((r) => (
                <div key={r.id_reviews} className="flex gap-sm py-sm border-b border-outline-variant/50 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-primary-container/30 flex items-center justify-center font-bold text-sm shrink-0">
                    {r.rater.nama_lengkap.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-xs">
                      <span className="font-label-sm text-label-sm font-semibold">{r.rater.nama_lengkap}</span>
                      <span className="text-amber-500 text-xs">{"★".repeat(r.rating)}</span>
                    </div>
                    {r.comment && (
                      <p className="font-body-sm text-[12px] text-on-surface-variant mt-xs">{r.comment}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Location Map Right */}
        <div className="flex flex-col gap-md">
          <div className="bg-white border border-outline-variant rounded-xl p-md flex flex-col gap-sm">
            <h3 className="font-body-md text-body-md font-semibold text-on-surface flex items-center gap-xs">
              <span className="material-symbols-outlined text-[18px]">location_on</span>
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
              {taskStatus === "open" && (
                <Button
                  onClick={() => setIsApplyModalOpen(true)}
                  disabled={task.has_applied || actionLoading}
                  className="w-full py-3"
                  variant="primary"
                >
                  {task.has_applied ? "Sudah Dilamar" : "Lamar Pekerjaan Ini"}
                </Button>
              )}
              {taskStatus === "accepted" && (
                <Button onClick={handleStartWork} className="w-full py-3" variant="lime" disabled={actionLoading}>
                  Mulai Kerjakan
                </Button>
              )}
              {taskStatus === "in_progress" && (
                <div className="p-sm text-center border border-outline-variant rounded bg-surface-container text-primary font-label-sm text-label-sm font-semibold">
                  Tugas Sedang Dikerjakan. Menunggu Konfirmasi Selesai dari Requester.
                </div>
              )}
              {taskStatus === "completed" && (
                <Button onClick={() => setIsRatingModalOpen(true)} className="w-full py-3" variant="secondary">
                  Berikan Ulasan Balik
                </Button>
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
              {(taskStatus === "accepted" || taskStatus === "in_progress") && (
                <Button onClick={handleConfirmCompletion} className="w-full py-3" variant="primary" disabled={actionLoading}>
                  Konfirmasi Selesai & Cairkan Poin
                </Button>
              )}
              {taskStatus === "completed" && (
                <Button onClick={() => setIsRatingModalOpen(true)} className="w-full py-3" variant="secondary">
                  Berikan Ulasan Rating
                </Button>
              )}
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
      <Modal isOpen={isRatingModalOpen} onClose={() => setIsRatingModalOpen(false)} title="Berikan Ulasan Rating">
        <form onSubmit={handleRatingSubmit} className="flex flex-col gap-md">
          <div className="flex flex-col items-center gap-sm">
            <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
              Berapa bintang yang Anda berikan?
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
                  >
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
    </div>
  );
}
