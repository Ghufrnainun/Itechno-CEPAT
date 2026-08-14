import React, { useState } from "react";
import { Task } from "@/types/database";
import { formatCurrency, formatDistance } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useCurrentRole } from "@/app/(main)/layout";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { renderIcon } from "@/lib/icon-map";

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
      // Get current user (worker)
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
    <aside className="w-full sm:w-[440px] fixed inset-y-0 right-0 sm:relative bg-surface border-l border-outline-variant flex-shrink-0 h-full flex flex-col z-50 sm:z-20 shadow-xl sm:shadow-[-4px_0_24px_rgba(0,0,0,0.02)] animate-slide-in">
      {/* Top Nav / Action Bar */}
      <div className="px-lg py-md flex items-center justify-between border-b border-outline-variant/50">
        <button 
          onClick={onClose}
          className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center"
        >
          <span className="material-symbols-outlined" aria-hidden="true">close</span>
        </button>
        <div className="flex gap-sm">
          <button className="text-on-surface-variant hover:text-primary transition-colors w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">share</span>
          </button>
          <button className="text-on-surface-variant hover:text-primary transition-colors w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">bookmark_border</span>
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-lg no-scrollbar custom-scrollbar">
        {/* Header Info */}
        <div className="mb-lg">
          <h2 className="font-headline-lg text-headline-lg text-on-surface leading-tight mb-sm">{task.title}</h2>
          <div className="flex items-center justify-between mb-md">
            <div className="flex items-center gap-sm">
              <div className="w-10 h-10 min-w-[40px] rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0 uppercase">
                {requesterName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-xs">
                  <span className="font-label-md text-label-md font-semibold text-on-surface">
                    {requesterName}
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">verified</span>
                </div>
                <div className="flex items-center gap-xs text-outline font-body-sm text-body-sm">
                  <span className="flex items-center gap-[2px]">
                    <span className="material-symbols-outlined text-[14px] text-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">star</span> 
                    4.8 Rating
                  </span>
                  <span>•</span>
                  <span>Pemberi Kerja</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-0.5 mb-lg">
            <span className="font-headline-xl text-headline-xl font-bold text-on-surface font-label-sm font-mono">
              {formatCurrency(task.compensation)} <span className="text-xs font-normal text-on-surface-variant font-sans">/ worker</span>
            </span>
            {task.max_applicants && (
              <span className="font-label-sm text-[11px] text-on-surface-variant font-mono">
                Total Escrow: {formatCurrency(task.compensation * task.max_applicants)} ({task.max_applicants} worker)
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-xs bg-surface-container-lowest border border-outline-variant rounded-lg p-sm">
            <div className="flex flex-col items-center justify-center p-xs border-r border-outline-variant/50 text-center">
              <span className="material-symbols-outlined text-outline mb-1 text-[18px]" aria-hidden="true">location_on</span>
              <span className="font-label-md text-xs font-bold text-on-surface">
                {task.distance !== undefined ? formatDistance(task.distance) : "-"}
              </span>
              <span className="font-body-sm text-[11px] text-on-surface-variant">Jarak</span>
            </div>
            <div className="flex flex-col items-center justify-center p-xs border-r border-outline-variant/50 text-center">
              <span className="material-symbols-outlined text-outline mb-1 text-[18px]" aria-hidden="true">schedule</span>
              <span className="font-label-md text-xs font-bold text-on-surface">{task.duration_estimate || "-"}</span>
              <span className="font-body-sm text-[11px] text-on-surface-variant">Estimasi</span>
            </div>
            <div className="flex flex-col items-center justify-center p-xs text-center">
              <span className="material-symbols-outlined text-outline mb-1 text-[18px]" aria-hidden="true">group</span>
              <span className="font-label-md text-xs font-bold text-on-surface">{task.max_applicants ?? 1} Orang</span>
              <span className="font-body-sm text-[11px] text-on-surface-variant">Max Worker</span>
            </div>
          </div>
        </div>

        {/* Escrow Box */}
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-lg p-md flex items-start gap-md mb-lg">
          <span className="material-symbols-outlined text-[#D97706]" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">lock</span>
          <p className="font-body-sm text-body-sm text-[#92400E]">
            Dana <span className="font-label-md text-label-md font-bold font-mono">{formatCurrency(task.compensation)} / worker</span> ditahan aman dan cair setelah bukti kerja disetujui.
          </p>
        </div>

        {/* Task Description */}
        <div className="mb-lg">
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs">Deskripsi</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant whitespace-pre-wrap">
            {task.description}
          </p>
        </div>

        <div className="mb-xl">
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-md">Skill yang Dibutuhkan</h3>
          {task.skills && task.skills.length > 0 ? (
            <div className="flex flex-wrap gap-xs">
              {task.skills.map((skill) => (
                <div key={skill.id_skill} className="flex items-center gap-1.5 px-sm py-1 bg-primary-container/30 text-primary font-body-sm text-body-sm rounded-full border border-primary/20">
                  {renderIcon(skill.icon ?? null, "w-3.5 h-3.5 shrink-0")}
                  <span>{skill.nama_skill}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-body-sm text-body-sm text-on-surface-variant italic">Tidak ada spesifikasi skill khusus.</p>
          )}
        </div>
      </div>

      {/* Bottom CTA Fixed */}
      <div className="p-lg pb-24 sm:pb-lg bg-surface border-t border-outline-variant shadow-[0_-4px_12px_rgba(0,0,0,0.02)] flex flex-col gap-sm">
        {isApplied ? (
          <div className="flex flex-col gap-xs p-sm bg-surface-container-low border border-outline-variant/60 rounded-xl">
            <div className="flex items-center gap-xs text-primary font-bold font-label-sm text-xs">
              <span className="material-symbols-outlined text-[16px]">info</span>
              Status Lamaran Anda:
            </div>
            <p className="font-body-sm text-[12px] text-on-surface leading-relaxed">
              {applicationStatus === "accepted" ? (
                task.status === "open" ? (
                  "Anda sudah diterima, sedang melakukan pencarian untuk worker tambahan"
                ) : (
                  "Anda sudah diterima, tugas siap/sedang dikerjakan"
                )
              ) : (
                "Anda sudah melamar, menunggu jawaban dari requester"
              )}
            </p>
            <Button
              variant="secondary"
              className="w-full py-sm text-xs mt-xs flex items-center justify-center gap-xs"
              onClick={() => router.push(`/task/${task.id_task}`)}
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              Lihat Detail Halaman Tugas
            </Button>
          </div>
        ) : (
          <div className="flex gap-sm">
            <Button 
              variant="secondary"
              className="flex-1 py-md text-[16px] flex items-center justify-center gap-xs"
              onClick={handleInitChat}
              disabled={isStartingChat}
            >
              {isStartingChat ? (
                <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              ) : (
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">chat</span>
              )}
              {isStartingChat ? "Memproses..." : "Chat"}
            </Button>
            <Button 
              variant="primary"
              className="flex-1 py-md text-[16px]"
              onClick={onApply}
            >
              Ambil tugas ini
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
