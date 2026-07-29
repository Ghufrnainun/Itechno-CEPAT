"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useCurrentRole } from "@/app/(main)/layout";
import { MOCK_TASKS } from "@/lib/supabase/queries/tasks";
import { Task, TaskApplicant, TaskStatus } from "@/types/database";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EscrowBanner } from "@/components/ui/EscrowBanner";
import { Modal } from "@/components/ui/Modal";
import MapPickerWrapper from "@/features/task/components/MapPickerWrapper";

export default function TaskDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { role } = useCurrentRole();
  const { showToast } = useToast();

  const [task, setTask] = useState<Task | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("open");
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [hasApplied, setHasApplied] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  // Load task detail
  useEffect(() => {
    const foundTask = MOCK_TASKS.find((t) => t.id_task === id);
    if (foundTask) {
      setTask(foundTask);
      setTaskStatus(foundTask.status);
    }
  }, [id]);

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center p-xl gap-sm min-h-[50vh]">
        <span className="material-symbols-outlined text-outline text-[48px]">error</span>
        <h3 className="font-headline-sm text-headline-sm">Tugas Tidak Ditemukan</h3>
        <Button onClick={() => router.push("/feed")}>Kembali ke Feed</Button>
      </div>
    );
  }

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasApplied(true);
    setIsApplyModalOpen(false);
    showToast("Berhasil melamar pekerjaan! Menunggu persetujuan pemberi kerja.");
  };

  const handleStartWork = () => {
    setTaskStatus("in_progress");
    showToast("Tugas diperbarui: Mulai pengerjaan!");
  };

  const handleConfirmCompletion = () => {
    setTaskStatus("completed");
    showToast("Poin ditransfer dari Escrow ke saldo Worker! Berikan ulasan.");
    setIsRatingModalOpen(true);
  };

  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsRatingModalOpen(false);
    showToast("Ulasan berhasil disimpan! Terima kasih.");
    router.push("/feed");
  };

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
          <h1 className="font-headline-md text-headline-md text-on-surface">{task.title}</h1>
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
                {formatCurrency(task.compensation)}
              </span>
              <Badge status={taskStatus} />
            </div>

            <div className="flex flex-col gap-xs">
              <h3 className="font-body-md text-body-md font-semibold text-on-surface">Deskripsi</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                {task.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-md border-t border-outline-variant/50 pt-md font-label-sm text-label-sm">
              <div>
                <span className="text-on-surface-variant block">Estimasi Waktu</span>
                <span className="font-bold text-on-surface text-body-sm">{task.duration_estimate}</span>
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
              
              <div className="flex flex-col items-center gap-xs">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${taskStatus === "open" ? "bg-primary text-white" : "bg-primary-container/20 text-primary-container"}`}>1</div>
                <span className="font-label-sm text-[10px] uppercase font-semibold">Buka</span>
              </div>

              <div className="flex flex-col items-center gap-xs">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${taskStatus === "accepted" ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant"}`}>2</div>
                <span className="font-label-sm text-[10px] uppercase font-semibold">Diterima</span>
              </div>

              <div className="flex flex-col items-center gap-xs">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${taskStatus === "in_progress" ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant"}`}>3</div>
                <span className="font-label-sm text-[10px] uppercase font-semibold">Mulai</span>
              </div>

              <div className="flex flex-col items-center gap-xs">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${taskStatus === "completed" ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant"}`}>4</div>
                <span className="font-label-sm text-[10px] uppercase font-semibold">Selesai</span>
              </div>
            </div>
          </div>

          {/* Daftar Pelamar (Requester Only & Open Status) */}
          {role === "requester" && taskStatus === "open" && (
            <div className="flex flex-col gap-sm bg-white border border-outline-variant rounded-xl p-md md:p-lg">
              <h3 className="font-body-md text-body-md font-extrabold text-on-surface">Daftar Pelamar ({2})</h3>
              <div className="flex flex-col divide-y divide-outline-variant/60">
                {/* Mock Applicants */}
                {[
                  { id: "1", name: "Siti Rahma", status: "pending", rating: 4.8, university: "UGM", message: "Saya punya kamera mirrorless, siap kerja hari ini." },
                  { id: "2", name: "Budi Santoso", status: "rejected", rating: 4.5, university: "UNY", message: "Bisa pakai kamera HP aja ga kak?" },
                ].map((app) => (
                  <div key={app.id} className="py-md flex flex-col gap-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-md">
                        <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold font-mono">
                          {app.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-body-md text-body-md font-semibold text-on-surface flex items-center gap-xs">
                            {app.name}
                            <span className="material-symbols-outlined text-primary-container text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                              verified
                            </span>
                          </h4>
                          <p className="font-label-sm text-label-sm text-on-surface-variant">
                            {app.university} • Rating: <span className="text-amber-500 font-bold">★ {app.rating}</span>
                          </p>
                        </div>
                      </div>
                      <Badge status={app.status === "accepted" ? "accepted" : app.status === "rejected" ? "cancelled" : "open"} />
                    </div>

                    <p className="font-body-sm text-body-sm text-on-surface-variant bg-surface-container-low p-sm rounded border border-outline-variant/50 italic">
                      &quot;{app.message}&quot;
                    </p>

                    {app.status === "pending" && (
                      <div className="flex justify-between items-center mt-xs">
                        <Button
                          onClick={() => {
                            router.push("/chat");
                          }}
                          variant="ghost"
                          className="py-1 px-3 text-xs font-bold border border-outline-variant/60"
                        >
                          <span className="material-symbols-outlined text-[16px] mr-1">chat</span>
                          Chat
                        </Button>
                        <div className="flex gap-sm">
                          <Button
                            onClick={() => {
                              showToast("Menolak lamaran.");
                            }}
                            variant="ghost"
                            className="py-1 px-3 text-xs font-bold"
                          >
                            Tolak
                          </Button>
                          <Button
                            onClick={() => {
                              setTaskStatus("accepted");
                              showToast(`Menerima ${app.name} untuk tugas ini. Memindahkan dana ke Escrow...`);
                            }}
                            variant="primary"
                            className="py-1 px-3 text-xs font-bold"
                          >
                            Terima Worker
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
                center={{ latitude: task.latitude, longitude: task.longitude }}
                tasks={[task]}
              />
            </div>
            
            <span className="font-label-sm text-label-sm text-on-surface-variant text-center font-mono">
              Koordinat: {task.latitude.toFixed(6)}, {task.longitude.toFixed(6)}
            </span>
          </div>

          {/* Context Action Button based on User Role */}
          {role === "worker" ? (
            <div className="flex flex-col gap-sm">
              {taskStatus === "open" && (
                <Button
                  onClick={() => setIsApplyModalOpen(true)}
                  disabled={hasApplied}
                  className="w-full py-3"
                  variant="primary"
                >
                  {hasApplied ? "Sudah Dilamar" : "Lamar Pekerjaan Ini"}
                </Button>
              )}
              {taskStatus === "accepted" && (
                <Button onClick={handleStartWork} className="w-full py-3" variant="lime">
                  Mulai Kerjakan
                </Button>
              )}
              {taskStatus === "in_progress" && (
                <div className="p-sm text-center border border-outline-variant rounded bg-surface-container text-primary font-label-sm text-label-sm font-semibold">
                  Tugas Sedang Dikerjakan. Menunggu Konfirmasi Selesai.
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
                  Menunggu pelamar terpilih. Silakan pilih pelamar di daftar pelamar.
                </div>
              )}
              {(taskStatus === "accepted" || taskStatus === "in_progress") && (
                <Button onClick={handleConfirmCompletion} className="w-full py-3" variant="primary">
                  Konfirmasi Selesai &amp; Cairkan Poin
                </Button>
              )}
              {taskStatus === "completed" && (
                <Button onClick={() => setIsRatingModalOpen(true)} className="w-full py-3" variant="secondary">
                  Berikan Ulasan Rating
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lamar Pekerjaan Modal */}
      <Modal isOpen={isApplyModalOpen} onClose={() => setIsApplyModalOpen(false)} title="Kirim Lamaran Kerja">
        <form onSubmit={handleApplySubmit} className="flex flex-col gap-md">
          <div className="flex flex-col gap-xs">
            <label className="font-body-sm text-body-sm text-on-surface-variant font-medium">
              Pesan Singkat untuk Pemberi Kerja
            </label>
            <textarea
              className="input-field min-h-[120px] font-body-sm custom-scrollbar"
              placeholder="Ceritakan keahlianmu dan mengapa kamu cocok untuk tugas ini. Contoh: Saya punya kamera DSLR dan siap mengambil foto menu makanan secara rapi."
              value={applyMessage}
              onChange={(e) => setApplyMessage(e.target.value)}
              required
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
            <Button type="submit">Kirim Lamaran</Button>
          </div>
        </form>
      </Modal>

      {/* Ulasan & Rating Modal */}
      <Modal isOpen={isRatingModalOpen} onClose={() => setIsRatingModalOpen(false)} title="Berikan Ulasan Rating">
        <form onSubmit={handleRatingSubmit} className="flex flex-col gap-md">
          <div className="flex flex-col items-center gap-sm">
            <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">Berapa bintang yang Anda berikan?</span>
            <div className="flex gap-sm">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="cursor-pointer text-[32px] text-amber-400 focus:outline-none"
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: star <= rating ? "'FILL' 1" : "'FILL' 0" }}>
                    star
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-xs">
            <label className="font-body-sm text-body-sm text-on-surface-variant font-medium">Komentar / Masukan</label>
            <textarea
              className="input-field min-h-[100px] font-body-sm custom-scrollbar"
              placeholder="Berikan komentar singkat mengenai hasil kerja / komunikasi..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              maxLength={500}
            />
          </div>

          <div className="flex justify-end gap-sm border-t border-outline-variant/30 pt-md mt-sm">
            <Button type="submit" fullWidth>Kirim Ulasan</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
