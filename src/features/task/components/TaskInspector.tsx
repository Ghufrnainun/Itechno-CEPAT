"use client";

import React, { useState } from "react";
import { Task } from "@/types/database";
import { formatCurrency, formatDistance } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Share2,
  Bookmark,
  BadgeCheck,
  Star,
  MapPin,
  Clock,
  Users,
  Lock,
  MessageSquare,
  Eye,
  Info,
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

export function TaskInspector({
  task,
  onClose,
  onApply,
  isApplied,
  applicationStatus,
}: TaskInspectorProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isStartingChat, setIsStartingChat] = useState(false);

  const handleInitChat = async () => {
    try {
      setIsStartingChat(true);
      const resMe = await fetch("/api/users/me");
      const dataMe = await resMe.json();
      if (!dataMe.success) throw new Error("Gagal mendapatkan data user");

      const resInit = await fetch("/api/chat/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_tasks: task.id_task,
          id_worker: dataMe.data.id_user,
        }),
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

  const requesterName =
    task.requester_name || task.requester?.nama_lengkap || "Pemberi Kerja";

  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="w-full sm:w-[440px] fixed inset-y-0 right-0 sm:relative bg-surface-container-lowest border-l border-card-border flex-shrink-0 h-full flex flex-col z-50 sm:z-20 shadow-xl sm:shadow-md"
    >
      {/* Top Nav / Action Bar */}
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-card-border bg-surface-container-low/40">
        <button
          onClick={onClose}
          aria-label="Tutup panel"
          className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer w-10 h-10 -ml-2 rounded-lg hover:bg-surface-container flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1">
          <button
            aria-label="Bagikan tugas"
            className="text-on-surface-variant hover:text-primary transition-colors w-10 h-10 rounded-lg hover:bg-surface-container flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            aria-label="Simpan tugas"
            className="text-on-surface-variant hover:text-primary transition-colors w-10 h-10 rounded-lg hover:bg-surface-container flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Bookmark className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar flex flex-col gap-5">
        {/* Header Info */}
        <div className="flex flex-col gap-3">
          <h2 className="font-headline text-xl font-bold text-on-surface leading-tight text-balance">
            {task.title}
          </h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 min-w-[40px] rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold shrink-0 uppercase">
                {requesterName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-headline text-sm font-semibold text-on-surface">
                    {requesterName}
                  </span>
                  <BadgeCheck className="w-4 h-4 text-primary fill-primary/15" />
                </div>
                <div className="flex items-center gap-1.5 text-on-surface-variant font-body-sm text-xs">
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-mono font-semibold tabular-nums">4.8</span>
                  </span>
                  <span>•</span>
                  <span>Pemberi Kerja</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-0.5 mt-1">
            <span className="font-headline text-2xl font-extrabold text-on-surface font-mono tabular-nums">
              {formatCurrency(task.compensation)}{" "}
              <span className="text-xs font-normal text-on-surface-variant font-sans">
                / worker
              </span>
            </span>
            {task.max_applicants && (
              <span className="font-mono text-xs text-on-surface-variant tabular-nums">
                Total Escrow: {formatCurrency(task.compensation * task.max_applicants)} (
                {task.max_applicants} worker)
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 bg-surface-container-low border border-card-border rounded-lg p-3">
            <div className="flex flex-col items-center justify-center border-r border-card-border pr-2 text-center">
              <MapPin className="w-4 h-4 text-on-surface-variant mb-1" />
              <span className="font-mono text-xs font-bold text-on-surface tabular-nums">
                {task.distance !== undefined ? formatDistance(task.distance) : "-"}
              </span>
              <span className="text-[11px] text-on-surface-variant">Jarak</span>
            </div>
            <div className="flex flex-col items-center justify-center border-r border-card-border px-2 text-center">
              <Clock className="w-4 h-4 text-on-surface-variant mb-1" />
              <span className="font-mono text-xs font-bold text-on-surface tabular-nums">
                {task.duration_estimate || "-"}
              </span>
              <span className="text-[11px] text-on-surface-variant">Estimasi</span>
            </div>
            <div className="flex flex-col items-center justify-center pl-2 text-center">
              <Users className="w-4 h-4 text-on-surface-variant mb-1" />
              <span className="font-mono text-xs font-bold text-on-surface tabular-nums">
                {task.max_applicants ?? 1} Orang
              </span>
              <span className="text-[11px] text-on-surface-variant">Max Worker</span>
            </div>
          </div>
        </div>

        {/* Escrow Box */}
        <div className="bg-tertiary-container/30 border border-tertiary/25 rounded-lg p-3.5 flex items-start gap-3">
          <Lock className="w-4.5 h-4.5 text-tertiary shrink-0 mt-0.5" />
          <p className="font-body-sm text-xs text-tertiary leading-relaxed">
            Dana{" "}
            <span className="font-mono font-bold tabular-nums">
              {formatCurrency(task.compensation)} / worker
            </span>{" "}
            ditahan aman di Escrow dan cair setelah bukti kerja disetujui.
          </p>
        </div>

        {/* Task Description */}
        <div className="flex flex-col gap-1.5">
          <h3 className="font-headline text-sm font-bold text-on-surface">
            Deskripsi
          </h3>
          <p className="font-body-sm text-sm text-on-surface-variant whitespace-pre-wrap leading-relaxed">
            {task.description}
          </p>
        </div>

        {/* Skills */}
        <div className="flex flex-col gap-2">
          <h3 className="font-headline text-sm font-bold text-on-surface">
            Skill yang Dibutuhkan
          </h3>
          {task.skills && task.skills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {task.skills.map((skill) => (
                <div
                  key={skill.id_skill}
                  className="px-3 py-1 bg-primary/10 text-primary font-body-sm text-xs font-medium rounded-full border border-primary/20"
                >
                  {skill.nama_skill}
                </div>
              ))}
            </div>
          ) : (
            <p className="font-body-sm text-xs text-on-surface-variant italic">
              Tidak ada spesifikasi skill khusus.
            </p>
          )}
        </div>
      </div>

      {/* Bottom CTA Fixed */}
      <div className="p-4 pb-20 sm:pb-4 bg-surface-container-lowest border-t border-card-border shadow-xs flex flex-col gap-2">
        {isApplied ? (
          <div className="flex flex-col gap-1.5 p-3 bg-surface-container-low border border-card-border rounded-lg">
            <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
              <Info className="w-4 h-4" />
              Status Lamaran Anda:
            </div>
            <p className="font-body-sm text-xs text-on-surface leading-relaxed">
              {applicationStatus === "accepted"
                ? task.status === "open"
                  ? "Anda sudah diterima, sedang melakukan pencarian untuk worker tambahan"
                  : "Anda sudah diterima, tugas siap/sedang dikerjakan"
                : "Anda sudah melamar, menunggu jawaban dari requester"}
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="w-full mt-1 flex items-center justify-center gap-1.5"
              onClick={() => router.push(`/task/${task.id_task}`)}
            >
              <Eye className="w-3.5 h-3.5" />
              Lihat Detail Halaman Tugas
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1 flex items-center justify-center gap-2"
              onClick={handleInitChat}
              disabled={isStartingChat}
            >
              {isStartingChat ? (
                <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
              {isStartingChat ? "Memproses..." : "Chat"}
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={onApply}
            >
              Ambil tugas ini
            </Button>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
