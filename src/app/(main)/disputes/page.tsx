"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useCurrentRole } from "@/app/(main)/layout";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Paperclip,
  ArrowRight,
  ShieldCheck,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DisputeItem {
  id_dispute: string;
  id_task: string;
  id_reporter: string;
  id_respondent: string;
  reason: string;
  description: string;
  status: "OPEN" | "IN_REVIEW" | "RESOLVED_FAVOR_WORKER" | "RESOLVED_FAVOR_REQUESTER" | "CLOSED";
  resolution: string | null;
  resolved_at: string | null;
  created_at: string;
  task: {
    id_tasks: string;
    judul_tugas: string;
    kompensasi: number;
    status_task: { nama_status: string };
  };
  reporter: {
    id_user: string;
    nama_lengkap: string;
    avatar_url: string | null;
  };
  respondent: {
    id_user: string;
    nama_lengkap: string;
    avatar_url: string | null;
  };
  _count: {
    evidences: number;
    messages: number;
  };
}

export default function DisputesListPage() {
  const { user } = useCurrentRole();
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "resolved">("all");

  useEffect(() => {
    async function loadDisputes() {
      setLoading(true);
      try {
        const res = await fetch("/api/disputes");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setDisputes(json.data);
          }
        }
      } catch (e) {
        console.error("Gagal memuat sengketa:", e);
      } finally {
        setLoading(false);
      }
    }
    loadDisputes();
  }, []);

  const filteredDisputes = useMemo(() => {
    if (activeTab === "active") {
      return disputes.filter((d) => d.status === "OPEN" || d.status === "IN_REVIEW");
    }
    if (activeTab === "resolved") {
      return disputes.filter(
        (d) =>
          d.status === "RESOLVED_FAVOR_WORKER" ||
          d.status === "RESOLVED_FAVOR_REQUESTER" ||
          d.status === "CLOSED"
      );
    }
    return disputes;
  }, [disputes, activeTab]);

  const getStatusBadge = (status: DisputeItem["status"]) => {
    switch (status) {
      case "OPEN":
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-bold font-mono">
            Menunggu Respon
          </span>
        );
      case "IN_REVIEW":
        return (
          <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 text-xs font-bold font-mono">
            Dalam Mediasi
          </span>
        );
      case "RESOLVED_FAVOR_WORKER":
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-bold font-mono">
            Selesai (Hak Pekerja)
          </span>
        );
      case "RESOLVED_FAVOR_REQUESTER":
        return (
          <span className="px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-600 border border-teal-500/20 text-xs font-bold font-mono">
            Selesai (Refund Pembuat)
          </span>
        );
      case "CLOSED":
        return (
          <span className="px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-600 border border-slate-500/20 text-xs font-bold font-mono">
            Ditutup
          </span>
        );
    }
  };

  return (
    <div className="min-h-full bg-surface pb-32 lg:pb-16 font-sans text-on-surface">
      {/* Header */}
      <div className="border-b border-card-border/80 bg-surface-container-lowest/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline font-extrabold text-xl sm:text-2xl text-on-surface tracking-tight">
                Pusat Sengketa &amp; Mediasi
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-bold font-mono">
                {disputes.length} Total
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Penyelesaian resmi permasalahan tugas secara transparan dan terawasi Admin
            </p>
          </div>

          {/* Tab Filter */}
          <div className="inline-flex p-1 rounded-xl bg-surface-container-low border border-card-border self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                activeTab === "all"
                  ? "bg-surface-container-lowest text-primary font-bold shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              Semua ({disputes.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("active")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                activeTab === "active"
                  ? "bg-surface-container-lowest text-primary font-bold shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              Aktif ({disputes.filter((d) => d.status === "OPEN" || d.status === "IN_REVIEW").length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("resolved")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                activeTab === "resolved"
                  ? "bg-surface-container-lowest text-primary font-bold shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              Selesai (
              {
                disputes.filter(
                  (d) =>
                    d.status === "RESOLVED_FAVOR_WORKER" ||
                    d.status === "RESOLVED_FAVOR_REQUESTER" ||
                    d.status === "CLOSED"
                ).length
              }
              )
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex flex-col gap-4">
        
        {/* Loading State */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-xs font-medium">Memuat data sengketa...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredDisputes.length === 0 && (
          <div className="p-12 rounded-3xl bg-surface-container-lowest border border-card-border text-center flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="font-headline font-bold text-base text-on-surface">
              Tidak Ada Sengketa
            </h3>
            <p className="text-xs text-on-surface-variant max-w-sm leading-relaxed">
              Semua tugas Anda berjalan lancar tanpa ada sengketa atau pengajuan mediasi aktif.
            </p>
          </div>
        )}

        {/* Disputes Feed List */}
        {!loading && filteredDisputes.length > 0 && (
          <div className="flex flex-col gap-4">
            {filteredDisputes.map((dispute) => {
              const isReporter = user?.id_user === dispute.id_reporter;
              const counterpart = isReporter ? dispute.respondent : dispute.reporter;

              return (
                <div
                  key={dispute.id_dispute}
                  className="p-1 rounded-[1.75rem] bg-gradient-to-b from-card-border/70 to-card-border/30 border border-card-border/60 shadow-xs"
                >
                  <div className="bg-surface-container-lowest rounded-[calc(1.75rem-0.25rem)] p-5 sm:p-6 flex flex-col gap-4">
                    
                    {/* Top Row: Task Title & Status Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-card-border/60 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] uppercase tracking-wider font-bold text-amber-600 font-mono">
                            Sengketa #{dispute.id_dispute.substring(0, 8)}
                          </span>
                          <span className="text-[11px] text-on-surface-variant">
                            • Diajukan pada {formatDate(dispute.created_at)}
                          </span>
                        </div>
                        <h3 className="font-headline font-bold text-base sm:text-lg text-on-surface mt-0.5">
                          {dispute.task.judul_tugas}
                        </h3>
                      </div>

                      <div className="self-start sm:self-auto flex items-center gap-2">
                        {getStatusBadge(dispute.status)}
                      </div>
                    </div>

                    {/* Middle Row: Reason, Description & Counterpart */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                      <div className="md:col-span-8 flex flex-col gap-2">
                        <div className="flex items-center gap-2 font-semibold text-on-surface">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Alasan: {dispute.reason}</span>
                        </div>
                        <p className="text-on-surface-variant line-clamp-2 leading-relaxed bg-surface-container-low p-3 rounded-xl border border-card-border/70">
                          {dispute.description}
                        </p>
                      </div>

                      <div className="md:col-span-4 flex flex-col gap-2 bg-surface-container-low/70 p-3.5 rounded-xl border border-card-border/70 justify-center">
                        <div className="flex items-center justify-between text-on-surface-variant">
                          <span>Kompensasi Escrow:</span>
                          <span className="font-mono font-bold text-primary text-sm">
                            {formatCurrency(dispute.task.kompensasi)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-on-surface-variant pt-1.5 border-t border-card-border/40">
                          <span>Lawan Mediasi:</span>
                          <span className="font-semibold text-on-surface truncate max-w-[120px]">
                            {counterpart.nama_lengkap}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Stats & Open Room Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-card-border/60">
                      <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                        <span className="flex items-center gap-1.5">
                          <Paperclip className="w-3.5 h-3.5 text-primary" />
                          {dispute._count.evidences} Bukti
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-primary" />
                          {dispute._count.messages} Pesan Mediasi
                        </span>
                      </div>

                      <Link
                        href={`/disputes/${dispute.id_dispute}`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary-container transition-all shadow-2xs"
                      >
                        <span>Buka Ruang Mediasi</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
