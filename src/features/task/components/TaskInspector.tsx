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

  return (
    <aside className="w-[440px] bg-surface border-l border-outline-variant flex-shrink-0 h-full flex flex-col relative z-20 shadow-[-4px_0_24px_rgba(0,0,0,0.02)] animate-slide-in">
      {/* Top Nav / Action Bar */}
      <div className="px-lg py-md flex items-center justify-between border-b border-outline-variant/50">
        <button 
          onClick={onClose}
          className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <div className="flex gap-sm">
          <button className="text-on-surface-variant hover:text-primary transition-colors w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">share</span>
          </button>
          <button className="text-on-surface-variant hover:text-primary transition-colors w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">bookmark_border</span>
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
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                {task.description.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-xs">
                  <span className="font-label-md text-label-md font-semibold text-on-surface">
                    {task.description.split("•")[0]?.trim() || "Pemberi Kerja"}
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>
                <div className="flex items-center gap-xs text-outline font-body-sm text-body-sm">
                  <span className="flex items-center gap-[2px]">
                    <span className="material-symbols-outlined text-[14px] text-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }}>star</span> 
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
              <span className="material-symbols-outlined text-outline mb-1">location_on</span>
              <span className="font-label-md text-label-md text-on-surface">
                {task.distance !== undefined ? formatDistance(task.distance) : "-"}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Jarak</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-sm">
              <span className="material-symbols-outlined text-outline mb-1">schedule</span>
              <span className="font-label-md text-label-md text-on-surface">{task.duration_estimate}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Estimasi</span>
            </div>
          </div>
        </div>

        {/* Escrow Box */}
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-lg p-md flex items-start gap-md mb-lg">
          <span className="material-symbols-outlined text-[#D97706]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
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
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-md">Daftar Pekerjaan</h3>
          <ul className="flex flex-col gap-sm">
            <li className="flex items-start gap-md">
              <span className="material-symbols-outlined text-outline mt-xs text-[18px]">radio_button_unchecked</span>
              <span className="font-body-md text-body-md text-on-surface">Datang ke lokasi</span>
            </li>
            <li className="flex items-start gap-md">
              <span className="material-symbols-outlined text-outline mt-xs text-[18px]">radio_button_unchecked</span>
              <span className="font-body-md text-body-md text-on-surface">Lakukan pekerjaan sesuai instruksi</span>
            </li>
            <li className="flex items-start gap-md">
              <span className="material-symbols-outlined text-outline mt-xs text-[18px]">radio_button_unchecked</span>
              <span className="font-body-md text-body-md text-on-surface">Selesai dalam {task.duration_estimate}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom CTA Fixed */}
      <div className="p-lg bg-surface border-t border-outline-variant shadow-[0_-4px_12px_rgba(0,0,0,0.02)] flex gap-sm">
        <Button 
          variant="secondary"
          className="flex-1 py-md text-[16px] flex items-center justify-center gap-xs"
          onClick={() => router.push("/chat")}
        >
          <span className="material-symbols-outlined text-[20px]">chat</span>
          Chat
        </Button>
        <Button 
          variant={isApplied ? "ghost" : "primary"}
          className="flex-1 py-md text-[16px]"
          onClick={onApply}
          disabled={isApplied}
        >
          {isApplied ? (
            <>
              <span className="material-symbols-outlined text-[18px]">check_circle</span> Dilamar
            </>
          ) : (
            "Ambil tugas ini"
          )}
        </Button>
      </div>
    </aside>
  );
}
