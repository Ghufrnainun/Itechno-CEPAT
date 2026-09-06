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
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  Users,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";

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
    is_bidding?: boolean;
    status_task: { nama_status: string };
    kategori?: { nama_kategori: string; icon: string | null };
  };
  kompensasi_dispute?: number;
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

// Module-level SWR Cache for Disputes
let cachedDisputes: DisputeItem[] = [];
let hasDisputesLoadedOnce = false;

interface TaskDisputeGroup {
  taskId: string;
  taskTitle: string;
  taskKompensasi: number;
  taskStatus: string;
  kategoriNama?: string;
  kategoriIcon?: string | null;
  disputes: DisputeItem[];
  activeCount: number;
  resolvedCount: number;
}

export default function DisputesListPage() {
  const { user } = useCurrentRole();
  const [disputes, setDisputes] = useState<DisputeItem[]>(cachedDisputes);
  const [loading, setLoading] = useState(!hasDisputesLoadedOnce);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "resolved">("all");
  const [viewMode, setViewMode] = useState<"folder" | "list">("folder");
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadDisputes() {
      if (!hasDisputesLoadedOnce) setLoading(true);
      try {
        const res = await fetch("/api/disputes");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setDisputes(json.data);
            cachedDisputes = json.data;
            hasDisputesLoadedOnce = true;
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

  // Grouping per Task (Folder View)
  const groupedDisputes = useMemo<TaskDisputeGroup[]>(() => {
    const map: Record<string, TaskDisputeGroup> = {};

    for (const d of filteredDisputes) {
      const tId = d.id_task;
      if (!map[tId]) {
        map[tId] = {
          taskId: tId,
          taskTitle: d.task?.judul_tugas || "Tugas Tanpa Judul",
          taskKompensasi: d.task?.kompensasi || 0,
          taskStatus: d.task?.status_task?.nama_status || "in_progress",
          kategoriNama: d.task?.kategori?.nama_kategori,
          kategoriIcon: d.task?.kategori?.icon,
          disputes: [],
          activeCount: 0,
          resolvedCount: 0,
        };
      }
      map[tId].disputes.push(d);
      if (d.status === "OPEN" || d.status === "IN_REVIEW") {
        map[tId].activeCount += 1;
      } else {
        map[tId].resolvedCount += 1;
      }
    }

    return Object.values(map).sort((a, b) => {
      // Sort tasks with active disputes first
      if (b.activeCount !== a.activeCount) return b.activeCount - a.activeCount;
      return b.disputes.length - a.disputes.length;
    });
  }, [filteredDisputes]);

  const toggleFolderCollapse = (taskId: string) => {
    setCollapsedFolders((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const getStatusBadge = (status: DisputeItem["status"]) => {
    switch (status) {
      case "OPEN":
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[11px] font-bold font-mono">
            Menunggu Respon
          </span>
        );
      case "IN_REVIEW":
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 text-[11px] font-bold font-mono">
            Dalam Mediasi
          </span>
        );
      case "RESOLVED_FAVOR_WORKER":
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[11px] font-bold font-mono">
            Selesai (Hak Pekerja)
          </span>
        );
      case "RESOLVED_FAVOR_REQUESTER":
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 border border-teal-500/20 text-[11px] font-bold font-mono">
            Selesai (Refund Pembuat)
          </span>
        );
      case "CLOSED":
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-slate-500/10 text-slate-600 border border-slate-500/20 text-[11px] font-bold font-mono">
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
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Penyelesaian resmi sengketa tugas secara transparan dan terawasi Admin
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* View Mode Switcher: Folder vs List */}
            <div className="inline-flex p-1 rounded-xl bg-surface-container-low border border-card-border">
              <button
                type="button"
                onClick={() => setViewMode("folder")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  viewMode === "folder"
                    ? "bg-surface-container-lowest text-primary shadow-xs font-bold"
                    : "text-on-surface-variant hover:text-on-surface"
                )}
                title="Kelompokkan per Folder Tugas"
              >
                <Folder className="w-3.5 h-3.5" />
                <span>Folder Tugas</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  viewMode === "list"
                    ? "bg-surface-container-lowest text-primary shadow-xs font-bold"
                    : "text-on-surface-variant hover:text-on-surface"
                )}
                title="Daftar Langsung Semua Tiket"
              >
                <List className="w-3.5 h-3.5" />
                <span>Semua Tiket</span>
              </button>
            </div>

            {/* Tab Filter: Semua, Aktif, Selesai */}
            <div className="inline-flex p-1 rounded-xl bg-surface-container-low border border-card-border">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
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
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
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
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
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
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex flex-col gap-4">
        {/* Loading State */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-xs font-medium">Memuat berkas sengketa...</span>
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

        {/* ── VIEW 1: FOLDER VIEW (GROUPED BY TASK) ── */}
        {!loading && filteredDisputes.length > 0 && viewMode === "folder" && (
          <div className="flex flex-col gap-5">
            {groupedDisputes.map((group) => {
              const isCollapsed = collapsedFolders[group.taskId] ?? false;

              return (
                <div
                  key={group.taskId}
                  className="rounded-3xl bg-surface-container-lowest border border-card-border shadow-xs overflow-hidden transition-all"
                >
                  {/* Folder Group Header */}
                  <div
                    onClick={() => toggleFolderCollapse(group.taskId)}
                    className="p-5 sm:p-6 bg-surface-container-low/50 border-b border-card-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-surface-container-low/80 transition-colors"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-2xs">
                        {isCollapsed ? (
                          <Folder className="w-5 h-5" />
                        ) : (
                          <FolderOpen className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                            Folder Tugas
                          </span>
                          {group.kategoriNama && (
                            <span className="text-[11px] text-on-surface-variant font-medium">
                              • {group.kategoriNama}
                            </span>
                          )}
                          <span className="text-[11px] text-on-surface-variant">
                            • Status Tugas: <span className="font-semibold uppercase">{group.taskStatus}</span>
                          </span>
                        </div>
                        <h3 className="font-headline font-bold text-base sm:text-lg text-on-surface mt-1 truncate">
                          {group.taskTitle}
                        </h3>
                      </div>
                    </div>

                    {/* Right side: Badge Count & Collapse Trigger */}
                    <div className="flex items-center gap-2.5 sm:gap-3 self-start sm:self-auto shrink-0 flex-wrap sm:flex-nowrap">
                      {group.resolvedCount > 0 && (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 text-xs font-bold font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{group.resolvedCount}/{group.disputes.length} Selesai</span>
                        </div>
                      )}
                      {group.activeCount > 0 ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-600 text-xs font-bold font-mono">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>{group.activeCount} Aktif</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-500/10 border border-slate-500/20 text-slate-600 text-xs font-bold font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Semua Selesai</span>
                        </div>
                      )}

                      {/* Avatars of counterpart participants */}
                      <div className="flex -space-x-2 overflow-hidden items-center pl-1">
                        {group.disputes.map((d) => {
                          const counterpart = user?.id_user === d.id_reporter ? d.respondent : d.reporter;
                          return (
                            <div key={d.id_dispute} title={counterpart.nama_lengkap} className="ring-2 ring-surface-container-lowest rounded-full">
                              <Avatar
                                src={counterpart.avatar_url}
                                name={counterpart.nama_lengkap}
                                size="sm"
                              />
                            </div>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
                      >
                        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Folder Content: Dispute Items */}
                  {!isCollapsed && (
                    <div className="p-4 sm:p-5 flex flex-col gap-3.5 bg-surface-container-lowest/60">
                      {group.disputes.map((dispute) => {
                        const isReporter = user?.id_user === dispute.id_reporter;
                        const counterpart = isReporter ? dispute.respondent : dispute.reporter;

                        return (
                          <div
                            key={dispute.id_dispute}
                            className="p-4 rounded-2xl bg-surface-container-low/60 border border-card-border hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="flex items-start gap-3.5 min-w-0">
                              <Avatar
                                src={counterpart.avatar_url}
                                name={counterpart.nama_lengkap}
                                size="md"
                                shape="rounded"
                              />
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-xs text-on-surface">
                                    Terlapor: <span className="text-primary">{dispute.respondent.nama_lengkap}</span>
                                    {user?.id_user === dispute.id_respondent && (
                                      <span className="ml-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">Anda</span>
                                    )}
                                  </span>
                                  <span className="text-[11px] text-on-surface-variant">
                                    • Pelapor: <span className="font-semibold text-on-surface">{dispute.reporter.nama_lengkap}</span>
                                    {user?.id_user === dispute.id_reporter && (
                                      <span className="ml-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">Anda</span>
                                    )}
                                  </span>
                                  <span className="text-[10px] font-mono text-on-surface-variant">
                                    • #{dispute.id_dispute.substring(0, 8)}
                                  </span>
                                  {getStatusBadge(dispute.status)}
                                </div>

                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs font-mono font-bold text-primary tabular-nums">
                                    {formatCurrency(dispute.kompensasi_dispute ?? dispute.task.kompensasi)}
                                  </span>
                                  {dispute.task.is_bidding && (
                                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                                      Penawaran
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 text-xs text-on-surface mt-1 font-semibold">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span className="truncate">{dispute.reason}</span>
                                </div>
                                <p className="text-[11px] text-on-surface-variant mt-0.5 line-clamp-1">
                                  {dispute.description}
                                </p>
                              </div>
                            </div>

                            {/* Action Link & Counters */}
                            <div className="flex items-center gap-4 self-end sm:self-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-card-border/50 w-full sm:w-auto justify-between sm:justify-end">
                              <div className="flex items-center gap-3 text-[11px] text-on-surface-variant font-mono">
                                <span className="flex items-center gap-1">
                                  <Paperclip className="w-3 h-3 text-primary" />
                                  {dispute._count.evidences}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3 text-primary" />
                                  {dispute._count.messages}
                                </span>
                              </div>

                              <Link
                                href={`/disputes/${dispute.id_dispute}`}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary-container transition-all shadow-2xs"
                              >
                                <span>Buka Mediasi</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── VIEW 2: FLAT LIST VIEW ── */}
        {!loading && filteredDisputes.length > 0 && viewMode === "list" && (
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
                          <span>{dispute.task.is_bidding ? 'Penawaran Worker:' : 'Kompensasi Escrow:'}</span>
                          <span className="font-mono font-bold text-primary text-sm">
                            {formatCurrency(dispute.kompensasi_dispute ?? dispute.task.kompensasi)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-on-surface-variant pt-1.5 border-t border-card-border/40 text-[11px]">
                          <span>Terlapor:</span>
                          <span className="font-semibold text-on-surface truncate max-w-[140px]">
                            {dispute.respondent.nama_lengkap}
                            {user?.id_user === dispute.id_respondent && ' (Anda)'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-on-surface-variant pt-1 border-t border-card-border/20 text-[11px]">
                          <span>Pelapor:</span>
                          <span className="font-semibold text-on-surface truncate max-w-[140px]">
                            {dispute.reporter.nama_lengkap}
                            {user?.id_user === dispute.id_reporter && ' (Anda)'}
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
