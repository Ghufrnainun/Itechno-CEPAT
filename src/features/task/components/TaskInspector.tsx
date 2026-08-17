import React, { useState } from "react";
import { Task } from "@/types/database";
import { formatCurrency, formatDistance } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
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
  Loader2,
  Flag,
  Calendar,
} from "lucide-react";

interface TaskInspectorProps {
  task: Task & {
    distance?: number;
    status?: string;
    requester_name?: string;
    requester?: { nama_lengkap?: string };
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
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Gagal memulai chat.");
    } finally {
      setIsStartingChat(false);
    }
  };

  const requesterName = task.requester_name || task.requester?.nama_lengkap || "Pemberi Kerja";

  return (
    <>
      <aside className="w-full sm:w-[440px] fixed inset-y-0 right-0 sm:relative bg-surface-container-lowest border-l border-card-border flex-shrink-0 h-full flex flex-col z-50 sm:z-20 shadow-xl animate-fadeIn font-sans">
        {/* Top Nav / Action Bar */}
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-card-border bg-surface-container-lowest">
          <button 
            onClick={onClose}
            aria-label="Tutup detail tugas"
            className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer w-8 h-8 rounded-lg hover:bg-surface-container-low flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsReportModalOpen(true)}
              title="Laporkan Pelanggaran Tugas ke Admin"
              aria-label="Laporkan Pelanggaran Tugas ke Admin"
              className="text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
            >
              <Flag className="w-4 h-4" />
            </button>
            <button
              title="Bagikan Tugas"
              aria-label="Bagikan Tugas"
              className="text-on-surface-variant hover:text-primary transition-colors w-8 h-8 rounded-lg hover:bg-surface-container-low flex items-center justify-center cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              title="Simpan Tugas"
              aria-label="Simpan Tugas"
              className="text-on-surface-variant hover:text-primary transition-colors w-8 h-8 rounded-lg hover:bg-surface-container-low flex items-center justify-center cursor-pointer"
            >
              <Bookmark className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          {/* Header Info */}
          <div>
            <h2 className="font-headline font-bold text-xl text-on-surface leading-snug mb-3">{task.title}</h2>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 uppercase border border-primary/20">
                  {requesterName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-on-surface">
                      {requesterName}
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary fill-primary/10" />
                  </div>
                  <div className="flex items-center gap-1.5 text-on-surface-variant text-[11px]">
                    <span className="flex items-center gap-1 text-amber-600 font-bold">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      4.8
                    </span>
                    <span>•</span>
                    <span>Pemberi Kerja</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-mono text-xl font-bold text-primary">
                  {formatCurrency(task.compensation)}
                </div>
                <div className="text-[10px] text-on-surface-variant uppercase font-mono">
                  Sistem Escrow Terlindungi
                </div>
              </div>
            </div>

            {/* Badges / Metrics Row */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-card-border/60">
              {task.distance !== undefined && (
                <div className="flex items-center gap-2 p-2.5 bg-surface-container-low rounded-xl border border-card-border/40">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-on-surface-variant font-mono">Jarak</span>
                    <span className="text-xs font-bold text-on-surface font-mono truncate">{formatDistance(task.distance)}</span>
                  </div>
                </div>
              )}
              {task.duration_estimate && (
                <div className="flex items-center gap-2 p-2.5 bg-surface-container-low rounded-xl border border-card-border/40">
                  <Clock className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-on-surface-variant font-mono">Estimasi</span>
                    <span className="text-xs font-bold text-on-surface truncate">{task.duration_estimate}</span>
                  </div>
                </div>
              )}
              {task.scheduled_at && (
                <div className="flex items-center gap-2 p-2.5 bg-primary/5 rounded-xl border border-primary/20 col-span-2">
                  <Calendar className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-primary font-bold font-mono uppercase">Jadwal Tugas</span>
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

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-headline font-bold text-sm text-on-surface">Deskripsi Pekerjaan</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-line bg-surface-container-low p-4 rounded-xl border border-card-border/60">
              {task.description}
            </p>
          </div>

          {/* Requirements / Skills */}
          {task.skills && task.skills.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-headline font-bold text-sm text-on-surface">Keahlian yang Dibutuhkan</h3>
              <div className="flex flex-wrap gap-1.5">
                {task.skills.map((skill: any) => (
                  <span
                    key={skill.id_skill || skill.nama_skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low border border-card-border text-xs font-semibold text-on-surface"
                  >
                    {renderIcon(skill.icon, "w-3.5 h-3.5 text-primary")}
                    <span>{skill.nama_skill}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Security & Escrow guarantee badge */}
          <div className="p-3.5 rounded-2xl bg-secondary/5 border border-secondary/20 flex items-start gap-3">
            <Lock className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-bold text-secondary block">Jaminan Escrow ITechno</span>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Dana kompensasi telah dikunci di sistem escrow kami. Pembayaran akan otomatis dicairkan segera setelah pekerjaan Anda diverifikasi selesai.
              </p>
            </div>
          </div>

          {/* Report Task to Admin Section */}
          <div className="pt-2 border-t border-card-border/60 flex items-center justify-between">
            <span className="text-[11px] text-on-surface-variant">Menemukan pelanggaran atau kejanggalan?</span>
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="text-[11px] font-semibold text-error hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Flag className="w-3 h-3" />
              <span>Laporkan Tugas</span>
            </button>
          </div>
        </div>

        {/* Bottom CTA Fixed */}
        <div className="p-4 bg-surface-container-lowest border-t border-card-border flex flex-col gap-2.5">
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
              >
                Lihat Detail Halaman Tugas
              </Button>
            </div>
          ) : (
            <div className="flex gap-2.5">
              <Button 
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={handleInitChat}
                disabled={isStartingChat}
                icon={isStartingChat ? undefined : <MessageSquare className="w-4 h-4" />}
              >
                {isStartingChat ? "Memproses..." : "Chat"}
              </Button>
              <Button 
                variant="primary"
                size="lg"
                className="flex-1"
                onClick={onApply}
              >
                Ambil Tugas Ini
              </Button>
            </div>
          )}
        </div>
      </aside>

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
