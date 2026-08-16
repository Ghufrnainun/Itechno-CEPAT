import React, { useState } from "react";
import { Task } from "@/types/database";
import { formatCurrency, formatDistance } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { renderIcon } from "@/lib/icon-map";
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
          </div>

          <div className="flex flex-col gap-0.5 mb-5 p-3.5 bg-surface-container-low rounded-xl border border-card-border">
            {task.is_bidding ? (
              <>
                <span className="font-headline text-2xl font-extrabold text-primary font-mono tabular-nums">
                  {formatCurrency(task.budget_min ?? 0)} – {formatCurrency(task.budget_max ?? task.compensation)} <span className="text-xs font-normal text-on-surface-variant font-sans">/ worker</span>
                </span>
                <span className="text-[11px] text-primary font-bold font-sans">
                  Mode Bidding — ajukan penawaran harga terbaik Anda
                </span>
              </>
            ) : (
              <span className="font-headline text-2xl font-extrabold text-primary font-mono tabular-nums">
                {formatCurrency(task.compensation)} <span className="text-xs font-normal text-on-surface-variant font-sans">/ worker</span>
              </span>
            )}
            {task.max_applicants && !task.is_bidding && (
              <span className="text-[11px] text-on-surface-variant font-mono">
                Total Escrow: {formatCurrency(task.compensation * task.max_applicants)} ({task.max_applicants} worker)
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 bg-surface-container-low border border-card-border rounded-xl p-3">
            <div className="flex flex-col items-center justify-center p-1 border-r border-card-border text-center">
              <MapPin className="w-4 h-4 text-primary mb-1" />
              <span className="text-xs font-bold text-on-surface font-mono">
                {task.distance !== undefined ? formatDistance(task.distance) : "-"}
              </span>
              <span className="text-[11px] text-on-surface-variant">Jarak</span>
            </div>
            <div className="flex flex-col items-center justify-center p-1 border-r border-card-border text-center">
              <Clock className="w-4 h-4 text-primary mb-1" />
              <span className="text-xs font-bold text-on-surface">{task.duration_estimate || "-"}</span>
              <span className="text-[11px] text-on-surface-variant">Estimasi</span>
            </div>
            <div className="flex flex-col items-center justify-center p-1 text-center">
              <Users className="w-4 h-4 text-primary mb-1" />
              <span className="text-xs font-bold text-on-surface">{task.max_applicants ?? 1} Worker</span>
              <span className="text-[11px] text-on-surface-variant">Kuota</span>
            </div>
          </div>
        </div>

        {/* Escrow Box */}
        <div className="bg-tertiary-container/30 border border-tertiary/25 rounded-xl p-3.5 flex items-start gap-3 text-tertiary">
          <Lock className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">
            {task.is_bidding ? (
              <>Dana pemberi kerja ditahan aman di Escrow (maksimal <span className="font-bold font-mono">{formatCurrency(task.budget_max ?? task.compensation)} / worker</span>). Setelah penawaran Anda diterima, dana dicairkan sesuai harga kesepakatan saat tugas selesai.</>
            ) : (
              <>Dana <span className="font-bold font-mono">{formatCurrency(task.compensation)} / worker</span> ditahan aman di Escrow dan langsung dicairkan setelah hasil kerja disetujui.</>
            )}
          </p>
        </div>

        {/* Task Description */}
        <div>
          <h3 className="font-headline font-bold text-xs uppercase tracking-wider text-on-surface-variant mb-2">Deskripsi Tugas</h3>
          <p className="text-xs text-on-surface leading-relaxed whitespace-pre-wrap bg-surface-container-low p-3.5 rounded-xl border border-card-border">
            {task.description}
          </p>
        </div>

        <div>
          <h3 className="font-headline font-bold text-xs uppercase tracking-wider text-on-surface-variant mb-2">Skill yang Dibutuhkan</h3>
          {task.skills && task.skills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {task.skills.map((skill) => (
                <div key={skill.id_skill} className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full border border-primary/20">
                  {renderIcon(skill.icon ?? null, "w-3.5 h-3.5 shrink-0")}
                  <span>{skill.nama_skill}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-on-surface-variant italic">Tidak ada spesifikasi skill khusus.</p>
          )}
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
  );
}
