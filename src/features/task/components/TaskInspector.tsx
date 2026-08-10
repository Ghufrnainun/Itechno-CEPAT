import React, { useState } from "react";
import { Task } from "@/types/database";
import { formatCurrency, formatDistance } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useCurrentRole } from "@/app/(main)/layout";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

interface TaskInspectorProps {
  task: Task & { distance?: number; status?: string };
  onClose: () => void;
  onApply?: () => void;
  isApplied?: boolean;
}

export function TaskInspector({ task, onClose, onApply, isApplied }: TaskInspectorProps) {
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
              <div className="w-10 h-10 min-w-[40px] rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0">
                {task.description.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-xs">
                  <span className="font-label-md text-label-md font-semibold text-on-surface">
                    {task.description.split("•")[0]?.trim() || "Pemberi Kerja"}
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">verified</span>
                </div>
                <div className="flex items-center gap-xs text-outline font-body-sm text-body-sm">
                  <span className="flex items-center gap-[2px]">
                    <span className="material-symbols-outlined text-[14px] text-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">star</span> 
                    4.8 Rating
                  </span>
                  <span>•</span>
                  <span>12 Tugas Selesai</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-end gap-sm mb-lg">
            <span className="font-headline-xl text-headline-xl font-bold text-on-surface font-label-sm font-mono">{formatCurrency(task.compensation)}</span>
          </div>

          <div className="flex gap-md bg-surface-container-lowest border border-outline-variant rounded-lg p-sm">
            <div className="flex-1 flex flex-col items-center justify-center p-sm border-r border-outline-variant/50">
              <span className="material-symbols-outlined text-outline mb-1" aria-hidden="true">location_on</span>
              <span className="font-label-md text-label-md text-on-surface">
                {task.distance !== undefined ? formatDistance(task.distance) : "-"}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Jarak</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-sm">
              <span className="material-symbols-outlined text-outline mb-1" aria-hidden="true">schedule</span>
              <span className="font-label-md text-label-md text-on-surface">{task.duration_estimate}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Estimasi</span>
            </div>
          </div>
        </div>

        {/* Escrow Box */}
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-lg p-md flex items-start gap-md mb-lg">
          <span className="material-symbols-outlined text-[#D97706]" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">lock</span>
          <p className="font-body-sm text-body-sm text-[#92400E]">
            Dana <span className="font-label-md text-label-md font-bold font-mono">{formatCurrency(task.compensation)}</span> ditahan aman dan cair setelah bukti kerja disetujui.
          </p>
        </div>

        {/* Task Description */}
        <div className="mb-lg">
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs">Deskripsi</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant whitespace-pre-wrap">
            {task.description.split("•")[1]?.trim() || task.description}
          </p>
        </div>

        <div className="mb-xl">
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-md">Skill yang Dibutuhkan</h3>
          {task.skills && task.skills.length > 0 ? (
            <div className="flex flex-wrap gap-xs">
              {task.skills.map((skill) => (
                <div key={skill.id_skill} className="px-sm py-1 bg-primary-container/30 text-primary font-body-sm text-body-sm rounded-full border border-primary/20">
                  {skill.nama_skill}
                </div>
              ))}
            </div>
          ) : (
            <p className="font-body-sm text-body-sm text-on-surface-variant italic">Tidak ada spesifikasi skill khusus.</p>
          )}
        </div>
      </div>

      {/* Bottom CTA Fixed */}
      <div className="p-lg pb-24 sm:pb-lg bg-surface border-t border-outline-variant shadow-[0_-4px_12px_rgba(0,0,0,0.02)] flex gap-sm">
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
          variant={isApplied ? "ghost" : "primary"}
          className="flex-1 py-md text-[16px]"
          onClick={onApply}
          disabled={isApplied}
        >
          {isApplied ? (
            <>
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">check_circle</span> Dilamar
            </>
          ) : (
            "Ambil tugas ini"
          )}
        </Button>
      </div>
    </aside>
  );
}
