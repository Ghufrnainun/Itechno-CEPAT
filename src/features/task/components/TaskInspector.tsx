import React, { useState, useEffect } from "react";
import { Task } from "@/types/database";
import { formatCurrency, formatDistance } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { renderIcon } from "@/lib/icon-map";
import { ReportModal } from "@/components/ui/ReportModal";
import {
  X,
  Share2,
  Bookmark,
  CheckCircle2,
  MapPin,
  Clock,
  Users,
  Star,
  Lock,
  MessageSquare,
  Eye,
  Flag,
  Calendar,
} from "lucide-react";

interface TaskInspectorProps {
  task: Task & {
    distance?: number;
    status?: string;
    requester_name?: string;
    requester_avatar?: string | null;
    requester?: { nama_lengkap?: string; avatar_url?: string | null };
    max_applicants?: number;
    max_apply_attempts?: number;
    applicant_count?: number;
  };
  onClose: () => void;
  onApply?: () => void;
  isApplied?: boolean;
  applicationStatus?: string;
}

export function TaskInspector({ task, onClose, onApply, isApplied, applicationStatus }: TaskInspectorProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Cek status bookmark saat komponen mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/saved-tasks/ids?ids=${encodeURIComponent(task.id_task)}`);
        const json = await res.json();
        if (!cancelled && json.success) {
          setIsSaved(json.data.includes(task.id_task));
        }
      } catch (e) {
        console.error("Gagal cek status bookmark", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [task.id_task]);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/task/${task.id_task}`;
    const shareData = {
      title: task.title,
      text: `Cek tugas ini di CEPAT: ${task.title}`,
      url: shareUrl,
    };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        showToast("Link tugas disalin!");
      }
    } catch (e: unknown) {
      // User batal share (AbortError) — bukan error
      const err = e as { name?: string } | null;
      if (err?.name !== "AbortError") {
        console.error("Share gagal", e);
        try {
          await navigator.clipboard.writeText(shareUrl);
          showToast("Link tugas disalin!");
        } catch (_) {
          showToast("Gagal membagikan tugas.");
        }
      }
    }
  };

  const handleToggleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/saved-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_tasks: task.id_task }),
      });
      const json = await res.json();
      if (json.success) {
        setIsSaved(json.saved);
        showToast(json.saved ? "Tugas disimpan!" : "Tugas dihapus dari tersimpan.");
      } else {
        showToast(json.message || "Gagal menyimpan tugas.");
      }
    } catch (e) {
      console.error("Gagal toggle bookmark", e);
      showToast("Gagal menyimpan tugas.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInitChat = async () => {
    try {
      setIsStartingChat(true);
      const resMe = await fetch('/api/users/me');
      const dataMe = await resMe.json();
      if (!dataMe.success) throw new Error("Gagal mendapatkan data user");
      
      const resInit = await fetch('/api/chat/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_tasks: task.id_task,
          id_worker: dataMe.data.id_user
        })
      });
      
      const dataInit = await resInit.json();
      if (dataInit.success) {
        router.push(`/chat?room=${dataInit.data.id_chat_room}`);
      } else {
        throw new Error(dataInit.message || "Gagal membuat obrolan");
      }
    } catch (e: unknown) {
      const err = e as { message?: string } | null;
      console.error(err);
      showToast(err?.message || "Gagal memulai chat.");
    } finally {
      setIsStartingChat(false);
    }
  };

  const requesterName = task.requester_name || task.requester?.nama_lengkap || "Pemberi Kerja";

  return (
    <>
      <div className="w-full h-full bg-surface-container-lowest flex flex-col relative font-sans overflow-hidden">
        {/* Mobile Sheet Drag Handle */}
        <div className="w-12 h-1.5 bg-on-surface-variant/20 rounded-full mx-auto mt-2.5 mb-1 lg:hidden shrink-0" />

        {/* Top Nav / Action Bar */}
        <div className="px-4 py-2.5 sm:py-3 flex items-center justify-between border-b border-card-border bg-surface-container-lowest shrink-0">
          <button 
            onClick={onClose}
            aria-label="Tutup detail tugas"
            className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer min-w-[40px] min-h-[40px] rounded-xl hover:bg-surface-container-low flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsReportModalOpen(true)}
              title="Laporkan Pelanggaran Tugas ke Admin"
              aria-label="Laporkan Pelanggaran Tugas ke Admin"
              className="text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-error/40"
            >
              <Flag className="w-4 h-4" />
            </button>
            <button
              onClick={handleShare}
              title="Bagikan Tugas"
              aria-label="Bagikan Tugas"
              className="text-on-surface-variant hover:text-primary transition-colors min-w-[40px] min-h-[40px] rounded-xl hover:bg-surface-container-low flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleToggleSave}
              disabled={isSaving}
              title={isSaved ? "Hapus dari Tersimpan" : "Simpan Tugas"}
              aria-label={isSaved ? "Hapus dari Tersimpan" : "Simpan Tugas"}
              aria-pressed={isSaved}
              className={`transition-colors min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary/40 ${
                isSaved
                  ? "text-primary bg-primary/10 hover:bg-primary/15"
                  : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
              }`}
            >
              <Bookmark className={`w-4.5 h-4.5 ${isSaved ? "fill-primary" : ""}`} />
            </button>
          </div>
        </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
        {/* Header Info */}
        <div>
          <h2 className="font-headline font-bold text-lg sm:text-xl text-on-surface leading-snug mb-3 break-words">
            {task.title}
          </h2>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar
                src={task.requester_avatar || task.requester?.avatar_url}
                name={requesterName}
                size="md"
                shape="rounded"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-on-surface">
                    {requesterName}
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary fill-primary/10" />
                </div>
                <div className="flex items-center gap-1.5 text-on-surface-variant text-xs">
                  <span className="flex items-center gap-1 text-amber-600 font-bold">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    4.8
                  </span>
                  <span>•</span>
                  <span>Pemberi Tugas</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1 mb-4 p-3 bg-surface-container-low rounded-xl border border-card-border">
            {task.is_bidding ? (
              <>
                <div className="flex flex-wrap items-baseline gap-1 text-primary font-mono font-extrabold text-base sm:text-lg tabular-nums">
                  <span>{formatCurrency(task.budget_min ?? 0)}</span>
                  <span className="text-on-surface-variant font-sans font-normal text-xs">–</span>
                  <span>{formatCurrency(task.budget_max ?? task.compensation)}</span>
                  <span className="text-xs font-normal text-on-surface-variant font-sans">/ orang</span>
                </div>
                <span className="text-xs text-primary font-bold font-sans">
                  Mode Bidding: ajukan penawaran harga terbaik Anda
                </span>
              </>
            ) : (
              <div className="flex items-baseline gap-1.5 text-primary font-mono font-extrabold text-xl sm:text-2xl tabular-nums">
                <span>{formatCurrency(task.compensation)}</span>
                <span className="text-xs font-normal text-on-surface-variant font-sans">/ orang</span>
              </div>
            )}
            {task.max_applicants && !task.is_bidding && (
              <span className="text-[11px] text-on-surface-variant font-mono mt-0.5">
                Total Escrow: {formatCurrency(task.compensation * task.max_applicants)} ({task.max_applicants} orang)
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-card-border/60">
            {task.distance !== undefined && (
              <div className="flex items-center gap-2 p-2.5 bg-surface-container-low rounded-xl border border-card-border/40">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-on-surface-variant font-mono">Jarak</span>
                  <span className="text-xs font-bold text-on-surface font-mono truncate">{formatDistance(task.distance)}</span>
                </div>
              </div>
            )}
            {task.duration_estimate && (
              <div className="flex items-center gap-2 p-2.5 bg-surface-container-low rounded-xl border border-card-border/40">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-on-surface-variant font-mono">Estimasi</span>
                  <span className="text-xs font-bold text-on-surface truncate">{task.duration_estimate}</span>
                </div>
              </div>
            )}
            {task.max_applicants && (
              <div className="flex items-center gap-2 p-2.5 bg-surface-container-low rounded-xl border border-card-border/40">
                <Users className="w-4 h-4 text-primary shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-on-surface-variant font-mono">Kuota</span>
                  <span className="text-xs font-bold text-on-surface truncate">{task.max_applicants} Orang</span>
                </div>
              </div>
            )}
            {task.scheduled_at && (
              <div className="flex items-center gap-2 p-2.5 bg-primary/5 rounded-xl border border-primary/20 col-span-2">
                <Calendar className="w-4 h-4 text-primary shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-primary font-bold font-mono uppercase">Jadwal Tugas</span>
                  <span className="text-xs font-bold text-on-surface">
                    {new Date(task.scheduled_at).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Escrow Box */}
        <div className="bg-tertiary-container/30 border border-tertiary/25 rounded-xl p-3.5 flex items-start gap-3 text-tertiary">
          <Lock className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">
            {task.is_bidding ? (
              <>Dana pemberi tugas ditahan aman di Escrow (maksimal <span className="font-bold font-mono">{formatCurrency(task.budget_max ?? task.compensation)} / orang</span>). Setelah penawaran Anda diterima, dana dicairkan sesuai harga kesepakatan saat tugas selesai.</>
            ) : (
              <>Dana <span className="font-bold font-mono">{formatCurrency(task.compensation)} / orang</span> ditahan aman di Escrow dan langsung dicairkan setelah hasil kerja disetujui.</>
            )}
          </p>
        </div>

        {/* Task Description */}
        <div>
          <h3 className="font-headline font-bold text-xs uppercase tracking-wider text-on-surface-variant mb-2">Deskripsi Pekerjaan</h3>
          <p className="text-xs text-on-surface leading-relaxed whitespace-pre-wrap bg-surface-container-low p-3.5 rounded-xl border border-card-border">
            {task.description}
          </p>
        </div>

        {/* Requirements / Skills */}
        {task.skills && task.skills.length > 0 && (
          <div>
            <h3 className="font-headline font-bold text-xs uppercase tracking-wider text-on-surface-variant mb-2">Keahlian yang Dibutuhkan</h3>
            <div className="flex flex-wrap gap-1.5">
              {task.skills.map((skill: { id_skill?: string; nama_skill?: string; icon?: string | null }) => (
                <div key={skill.id_skill || skill.nama_skill} className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full border border-primary/20">
                  {renderIcon(skill.icon ?? null, "w-3.5 h-3.5 shrink-0")}
                  <span>{skill.nama_skill}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security & Escrow guarantee badge */}
        <div className="p-3.5 rounded-2xl bg-secondary/5 border border-secondary/20 flex items-start gap-3">
          <Lock className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-xs font-bold text-secondary block">Jaminan Escrow ITechno</span>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Dana kompensasi telah dikunci di sistem escrow kami. Pembayaran akan otomatis dicairkan segera setelah pekerjaan Anda diverifikasi selesai.
            </p>
          </div>
        </div>

        {/* Report Task to Admin Section */}
        <div className="pt-2 border-t border-card-border/60 flex items-center justify-between">
          <span className="text-xs text-on-surface-variant">Menemukan pelanggaran atau kejanggalan?</span>
          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="text-xs font-semibold text-error hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Flag className="w-3 h-3" />
            <span>Laporkan Tugas</span>
          </button>
        </div>
      </div>

        {/* Bottom CTA Fixed */}
        <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] bg-surface-container-lowest border-t border-card-border flex flex-col gap-2.5 shrink-0 z-10">
          {isApplied ? (
            <div className="flex flex-col gap-2 p-3 bg-surface-container-low border border-card-border rounded-xl">
              <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                Status Lamaran Anda:
              </div>
              <p className="text-xs text-on-surface leading-relaxed">
                {applicationStatus === "accepted" ? (
                  task.status === "open" ? (
                    "Anda sudah diterima! Pekerjaan siap dikerjakan."
                  ) : (
                    "Anda sudah diterima, tugas sedang berlangsung."
                  )
                ) : (
                  "Lamaran Anda telah dikirim, menunggu persetujuan pemberi kerja."
                )}
              </p>
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                icon={<Eye className="w-3.5 h-3.5" />}
                onClick={() => router.push(`/task/${task.id_task}`)}
                className="min-h-[44px]"
              >
                Lihat Detail Halaman Tugas
              </Button>
            </div>
          ) : (
            <div className="flex gap-2.5">
              <Button 
                variant="secondary"
                size="lg"
                className="flex-1 min-h-[48px]"
                onClick={handleInitChat}
                disabled={isStartingChat}
                icon={isStartingChat ? undefined : <MessageSquare className="w-4 h-4" />}
              >
                {isStartingChat ? "Memproses..." : "Chat"}
              </Button>
              <Button 
                variant="primary"
                size="lg"
                className="flex-1 min-h-[48px]"
                onClick={onApply}
              >
                Ambil Tugas Ini
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        taskId={task.id_task}
        taskTitle={task.title}
      />
    </>
  );
}
