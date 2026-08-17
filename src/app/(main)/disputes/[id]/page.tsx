"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCurrentRole } from "@/app/(main)/layout";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { useToast } from "@/components/ui/Toast";
import {
  ShieldAlert,
  ShieldCheck,
  ArrowLeft,
  Paperclip,
  Send,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Image as ImageIcon,
  Plus,
  UploadCloud,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  compressImage,
  formatFileSize,
  CompressImageResult,
} from "@/lib/utils/image-compression";

interface DisputeDetailData {
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
    deskripsi_tugas: string;
    kompensasi: number;
    status_task: { nama_status: string };
    kategori: { nama_kategori: string; icon: string | null };
    requester: { id_user: string; nama_lengkap: string; avatar_url: string | null };
  };
  reporter: {
    id_user: string;
    nama_lengkap: string;
    avatar_url: string | null;
    rating_avg: number;
    total_completed: number;
  };
  respondent: {
    id_user: string;
    nama_lengkap: string;
    avatar_url: string | null;
    rating_avg: number;
    total_completed: number;
  };
  evidences: Array<{
    id_evidence: string;
    id_user: string;
    type: string;
    content: string;
    created_at: string;
  }>;
  messages: Array<{
    id_message: string;
    id_sender: string;
    message: string;
    is_admin: boolean;
    created_at: string;
  }>;
}

export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useCurrentRole();
  const { showToast } = useToast();
  const disputeId = params?.id as string;

  const [dispute, setDispute] = useState<DisputeDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  // Add evidence state
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [evidenceMode, setEvidenceMode] = useState<"upload" | "url">("upload");
  const [evidenceContent, setEvidenceContent] = useState("");
  const [compressing, setCompressing] = useState(false);
  const [compressedData, setCompressedData] = useState<CompressImageResult | null>(null);
  const [submittingEvidence, setSubmittingEvidence] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/disputes/${disputeId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setDispute(json.data);
        } else {
          showToast(json.message || "Gagal memuat sengketa.");
        }
      } else {
        showToast("Sengketa tidak ditemukan atau Anda tidak memiliki akses.");
      }
    } catch {
      showToast("Terjadi gangguan koneksi.");
    } finally {
      setLoading(false);
    }
  }, [disputeId, showToast]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [dispute?.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSendingMsg(true);
    try {
      const res = await fetch(`/api/disputes/${disputeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage.trim() }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setNewMessage("");
        fetchDetail();
      } else {
        showToast(json.message || "Gagal mengirim pesan.");
      }
    } catch {
      showToast("Terjadi kesalahan jaringan.");
    } finally {
      setSendingMsg(false);
    }
  };

  const handleEvidenceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Harap pilih file gambar (JPG, PNG, WebP).");
      return;
    }

    setCompressing(true);
    try {
      const result = await compressImage(file, {
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.75,
        outputFormat: "image/jpeg",
      });
      setCompressedData(result);
    } catch {
      showToast("Gagal mengompresi gambar.");
    } finally {
      setCompressing(false);
    }
  };

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmittingEvidence(true);
    try {
      let finalContent = evidenceContent.trim();
      let type: "text" | "image" = "text";

      if (evidenceMode === "upload") {
        if (!compressedData) {
          showToast("Silakan pilih foto bukti terlebih dahulu.");
          setSubmittingEvidence(false);
          return;
        }

        const formData = new FormData();
        formData.append("file", compressedData.file);

        const uploadRes = await fetch("/api/upload/dispute-evidence", {
          method: "POST",
          body: formData,
        });

        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok || !uploadJson.success) {
          throw new Error(uploadJson.message || "Gagal mengunggah foto bukti.");
        }

        finalContent = uploadJson.data.url;
        type = "image";
      } else {
        if (!finalContent) {
          showToast("Isi tautan atau keterangan bukti tidak boleh kosong.");
          setSubmittingEvidence(false);
          return;
        }
        type = finalContent.match(/\.(jpeg|jpg|gif|png|webp)/i) ? "image" : "text";
      }

      const res = await fetch(`/api/disputes/${disputeId}/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          content: finalContent,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast("Bukti berhasil diunggah.");
        setEvidenceContent("");
        setCompressedData(null);
        setIsEvidenceModalOpen(false);
        fetchDetail();
      } else {
        showToast(json.message || "Gagal menambahkan bukti.");
      }
    } catch (err: any) {
      showToast(err.message || "Terjadi gangguan koneksi.");
    } finally {
      setSubmittingEvidence(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-on-surface-variant">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs font-medium">Memuat ruang mediasi sengketa...</span>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-error-container/30 text-error flex items-center justify-center">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="font-headline font-bold text-lg text-on-surface">Sengketa Tidak Ditemukan</h2>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Sengketa ini tidak ditemukan atau Anda tidak memiliki akses ke ruang mediasi ini.
        </p>
        <Link
          href="/disputes"
          className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold"
        >
          Kembali ke Daftar Sengketa
        </Link>
      </div>
    );
  }

  const isClosed =
    dispute.status === "RESOLVED_FAVOR_WORKER" ||
    dispute.status === "RESOLVED_FAVOR_REQUESTER" ||
    dispute.status === "CLOSED";

  return (
    <div className="min-h-full bg-surface pb-32 lg:pb-16 font-sans text-on-surface">
      {/* ──── Top Header ──── */}
      <div className="border-b border-card-border/80 bg-surface-container-lowest/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/disputes")}
              className="w-9 h-9 rounded-xl border border-card-border flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-headline font-bold text-lg sm:text-xl text-on-surface">
                  Ruang Mediasi Sengketa
                </h1>
                <span className="font-mono text-xs font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  #{dispute.id_dispute.substring(0, 8)}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Tugas: <span className="font-medium text-on-surface">{dispute.task.judul_tugas}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/task/${dispute.task.id_tasks}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-card-border bg-surface-container-low text-xs font-semibold hover:bg-surface-container transition-colors"
            >
              <span>Detail Tugas</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ──── Main Content ──── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Resolution Outcome Banner (if resolved) */}
        {isClosed && dispute.resolution && (
          <div className="mb-6 p-1 rounded-[1.75rem] bg-gradient-to-b from-emerald-500/40 to-emerald-500/10 border border-emerald-500/30 shadow-xs">
            <div className="bg-surface-container-lowest rounded-[calc(1.75rem-0.25rem)] p-5 sm:p-6 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-emerald-600 font-headline font-bold text-base">
                <ShieldCheck className="w-5 h-5" />
                <span>Putusan Mediasi Resmi oleh Admin</span>
              </div>
              <p className="text-xs font-sans text-on-surface leading-relaxed bg-surface-container-low p-3.5 rounded-xl border border-card-border">
                {dispute.resolution}
              </p>
              <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-mono">
                <span>
                  Hasil Putusan:{" "}
                  <strong className="text-on-surface">
                    {dispute.status === "RESOLVED_FAVOR_WORKER"
                      ? "Dana Escrow Dicairkan ke Pekerja"
                      : "Dana Escrow Dikembalikan ke Pembuat Tugas"}
                  </strong>
                </span>
                {dispute.resolved_at && (
                  <span>Diputuskan pada {formatDate(dispute.resolved_at)}</span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ════════ LEFT COLUMN: Chronology, Evidence Vault, Chat (7 cols) ════════ */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Section 1: Detail Pengajuan Sengketa */}
            <div className="p-1 rounded-[1.75rem] bg-gradient-to-b from-card-border/70 to-card-border/30 border border-card-border/60 shadow-xs">
              <div className="bg-surface-container-lowest rounded-[calc(1.75rem-0.25rem)] p-5 sm:p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-card-border/60 pb-3">
                  <h3 className="font-headline font-bold text-base text-on-surface flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    Kronologi &amp; Alasan
                  </h3>
                  <span className="text-xs text-on-surface-variant">
                    Diajukan oleh: <strong>{dispute.reporter.nama_lengkap}</strong>
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-on-surface">
                    Alasan: <span className="text-amber-600 font-bold">{dispute.reason}</span>
                  </span>
                  <p className="text-xs text-on-surface-variant leading-relaxed bg-surface-container-low p-4 rounded-xl border border-card-border/80 whitespace-pre-wrap">
                    {dispute.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Evidence Vault (Daftar Bukti) */}
            <div className="p-1 rounded-[1.75rem] bg-gradient-to-b from-card-border/70 to-card-border/30 border border-card-border/60 shadow-xs">
              <div className="bg-surface-container-lowest rounded-[calc(1.75rem-0.25rem)] p-5 sm:p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-card-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-primary" />
                    <h3 className="font-headline font-bold text-base text-on-surface">
                      Bukti Pendukung ({dispute.evidences.length})
                    </h3>
                  </div>

                  {!isClosed && (
                    <button
                      type="button"
                      onClick={() => setIsEvidenceModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Bukti</span>
                    </button>
                  )}
                </div>

                {dispute.evidences.length === 0 ? (
                  <p className="text-xs text-on-surface-variant py-4 italic text-center">
                    Belum ada bukti pendukung yang dilampirkan.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {dispute.evidences.map((ev) => {
                      const isImage =
                        ev.type === "image" || ev.content.match(/\.(jpeg|jpg|gif|png|webp)/i);
                      const isUploader = ev.id_user === user?.id_user;

                      return (
                        <div
                          key={ev.id_evidence}
                          className="p-3.5 rounded-xl bg-surface-container-low border border-card-border/90 flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                            <span className="font-semibold text-on-surface">
                              {isUploader ? "Bukti Anda" : "Bukti Lawan"}
                            </span>
                            <span className="font-mono">{formatDate(ev.created_at)}</span>
                          </div>

                          {isImage ? (
                            <a
                              href={ev.content}
                              target="_blank"
                              rel="noreferrer"
                              className="group block relative rounded-lg overflow-hidden border border-card-border aspect-video bg-surface-container-lowest"
                            >
                              <img
                                src={ev.content}
                                alt="Bukti sengketa"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            </a>
                          ) : (
                            <p className="text-xs text-on-surface font-sans bg-surface-container-lowest p-2.5 rounded-lg border border-card-border break-words">
                              {ev.content}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Ruang Pesan Mediasi (Chat Thread) */}
            <div className="p-1 rounded-[1.75rem] bg-gradient-to-b from-card-border/70 to-card-border/30 border border-card-border/60 shadow-xs">
              <div className="bg-surface-container-lowest rounded-[calc(1.75rem-0.25rem)] p-5 sm:p-6 flex flex-col gap-4">
                <div className="border-b border-card-border/60 pb-3">
                  <h3 className="font-headline font-bold text-base text-on-surface">
                    Ruang Diskusi &amp; Mediasi
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Pesan di ruang ini terpantau langsung oleh Admin Platform
                  </p>
                </div>

                {/* Messages Box */}
                <div className="h-[340px] overflow-y-auto custom-scrollbar p-3 rounded-2xl bg-surface-container-low/70 border border-card-border flex flex-col gap-3">
                  {dispute.messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-on-surface-variant p-4">
                      <span className="text-xs">
                        Belum ada pesan mediasi. Gunakan kolom di bawah untuk berdiskusi secara sehat.
                      </span>
                    </div>
                  ) : (
                    dispute.messages.map((msg) => {
                      const isMe = msg.id_sender === user?.id_user;
                      const isAdminMsg = msg.is_admin;

                      return (
                        <div
                          key={msg.id_message}
                          className={cn(
                            "flex flex-col max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed",
                            isAdminMsg
                              ? "self-center bg-amber-500/15 border border-amber-500/30 text-on-surface max-w-[95%] shadow-xs"
                              : isMe
                              ? "self-end bg-primary text-on-primary shadow-xs rounded-br-none"
                              : "self-start bg-surface-container-lowest border border-card-border text-on-surface rounded-bl-none shadow-2xs"
                          )}
                        >
                          <div className="flex items-center justify-between gap-3 mb-1 text-[10px] opacity-80 font-mono">
                            <span className="font-bold">
                              {isAdminMsg
                                ? "🛡️ ADMIN PLATFORM"
                                : isMe
                                ? "Anda"
                                : msg.id_sender === dispute.id_reporter
                                ? dispute.reporter.nama_lengkap
                                : dispute.respondent.nama_lengkap}
                            </span>
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <p className="whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Send Message Input */}
                {!isClosed ? (
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Tulis pesan mediasi atau penjelasan klarifikasi..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={sendingMsg}
                      className="flex-1 px-4 py-2.5 text-xs sm:text-sm font-sans bg-surface-container-low text-on-surface rounded-xl border border-card-border focus:border-primary focus:outline-none min-h-[42px]"
                    />
                    <button
                      type="submit"
                      disabled={sendingMsg || !newMessage.trim()}
                      className="px-4 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-bold disabled:opacity-40 transition-colors flex items-center justify-center cursor-pointer min-h-[42px]"
                    >
                      {sendingMsg ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </form>
                ) : (
                  <p className="text-center text-xs text-on-surface-variant italic py-1">
                    Ruang mediasi telah ditutup karena keputusan admin sudah ditetapkan.
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* ════════ RIGHT COLUMN: Task & Parties Overview (5 cols) ════════ */}
          <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-20">
            
            {/* Task & Escrow Card */}
            <div className="p-1 rounded-[1.75rem] bg-gradient-to-b from-card-border/70 to-card-border/30 border border-card-border/60 shadow-xs">
              <div className="bg-surface-container-lowest rounded-[calc(1.75rem-0.25rem)] p-5 sm:p-6 flex flex-col gap-4">
                <div className="border-b border-card-border/60 pb-3">
                  <h3 className="font-headline font-bold text-sm text-on-surface">
                    Informasi Tugas &amp; Escrow
                  </h3>
                  <span className="text-[11px] text-on-surface-variant">
                    Dana di bawah perlindungan mediasi
                  </span>
                </div>

                <div className="flex flex-col gap-2.5 text-xs font-sans">
                  <div className="flex items-center justify-between text-on-surface-variant">
                    <span>Judul Tugas:</span>
                    <span className="font-semibold text-on-surface truncate max-w-[180px]">
                      {dispute.task.judul_tugas}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-on-surface-variant">
                    <span>Kategori:</span>
                    <span className="font-medium text-on-surface">
                      {dispute.task.kategori?.nama_kategori || "-"}
                    </span>
                  </div>

                  <div className="border-t border-dashed border-card-border my-1" />

                  <div className="flex items-center justify-between text-sm font-bold">
                    <span>Dana Ditahan (Escrow):</span>
                    <span className="font-mono text-primary text-base">
                      {formatCurrency(dispute.task.kompensasi)}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    Selama sengketa berlangsung, pencairan escrow ditangguhkan hingga keputusan manual ditetapkan oleh Admin.
                  </span>
                </div>
              </div>
            </div>

            {/* Parties Card */}
            <div className="p-1 rounded-[1.75rem] bg-gradient-to-b from-card-border/70 to-card-border/30 border border-card-border/60 shadow-xs">
              <div className="bg-surface-container-lowest rounded-[calc(1.75rem-0.25rem)] p-5 sm:p-6 flex flex-col gap-4">
                <div className="border-b border-card-border/60 pb-3">
                  <h3 className="font-headline font-bold text-sm text-on-surface">
                    Pihak Terkait
                  </h3>
                </div>

                {/* Reporter */}
                <div className="p-3.5 rounded-xl bg-surface-container-low border border-card-border flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                      {dispute.reporter.nama_lengkap.charAt(0)}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-600 font-mono block">
                        Pelapor Sengketa
                      </span>
                      <span className="font-bold text-xs text-on-surface">
                        {dispute.reporter.nama_lengkap}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-semibold text-on-surface-variant">
                    ★ {dispute.reporter.rating_avg.toFixed(1)}
                  </span>
                </div>

                {/* Respondent */}
                <div className="p-3.5 rounded-xl bg-surface-container-low border border-card-border flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center font-bold text-sm shrink-0">
                      {dispute.respondent.nama_lengkap.charAt(0)}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-on-surface-variant font-mono block">
                        Pihak Terlapor
                      </span>
                      <span className="font-bold text-xs text-on-surface">
                        {dispute.respondent.nama_lengkap}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-semibold text-on-surface-variant">
                    ★ {dispute.respondent.rating_avg.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ──── Add Evidence Modal ──── */}
      {isEvidenceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="bg-surface-container-lowest border border-card-border rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-card-border pb-3">
              <h3 className="font-headline font-bold text-base text-on-surface">
                Tambah Bukti Mediasi
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsEvidenceModalOpen(false);
                  setCompressedData(null);
                }}
                className="text-on-surface-variant hover:text-on-surface text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEvidence} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface">Pilih Metode Bukti</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEvidenceMode("upload")}
                    className={cn(
                      "py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer",
                      evidenceMode === "upload"
                        ? "bg-primary text-on-primary border-primary font-bold"
                        : "bg-surface-container-low text-on-surface border-card-border"
                    )}
                  >
                    Upload Foto (Otomatis Kompres)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvidenceMode("url")}
                    className={cn(
                      "py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer",
                      evidenceMode === "url"
                        ? "bg-primary text-on-primary border-primary font-bold"
                        : "bg-surface-container-low text-on-surface border-card-border"
                    )}
                  >
                    Tautan Link / Teks
                  </button>
                </div>
              </div>

              {evidenceMode === "upload" ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleEvidenceFileChange}
                    className="hidden"
                    id="evidence-file-input"
                  />

                  {compressing ? (
                    <div className="p-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 flex items-center justify-center gap-2.5 text-xs text-primary font-medium">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengompresi foto...</span>
                    </div>
                  ) : compressedData ? (
                    <div className="p-3 rounded-2xl bg-surface-container-low border border-card-border flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={compressedData.previewUrl}
                          alt="Pratinjau bukti"
                          className="w-14 h-14 rounded-xl object-cover border border-card-border shrink-0 bg-surface-container-lowest"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-xs text-on-surface truncate">
                            {compressedData.file.name}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] font-mono mt-0.5">
                            {compressedData.sizeReductionPercent > 0 ? (
                              <>
                                <span className="text-on-surface-variant line-through opacity-70">
                                  {formatFileSize(compressedData.originalSize)}
                                </span>
                                <span className="font-bold text-primary">
                                  {formatFileSize(compressedData.compressedSize)}
                                </span>
                                <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 font-bold text-[10px] flex items-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  Hemat {compressedData.sizeReductionPercent}%
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="font-bold text-primary">
                                  {formatFileSize(compressedData.compressedSize)}
                                </span>
                                <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary font-bold text-[10px] flex items-center gap-1">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  Ukuran Optimal
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setCompressedData(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-error transition-colors cursor-pointer shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="evidence-file-input"
                      className="p-5 rounded-2xl border-2 border-dashed border-card-border hover:border-primary/50 bg-surface-container-low hover:bg-primary/5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-primary block">
                          Pilih File Foto Bukti
                        </span>
                        <span className="text-[11px] text-on-surface-variant">
                          Kompresi cerdas hemat data &amp; cepat terunggah
                        </span>
                      </div>
                    </label>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface">
                    Tautan Berkas / Keterangan Bukti
                  </label>
                  <textarea
                    rows={3}
                    placeholder="https://drive.google.com/... atau catatan bukti klarifikasi..."
                    value={evidenceContent}
                    onChange={(e) => setEvidenceContent(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-surface-container-low text-on-surface rounded-xl border border-card-border focus:border-primary focus:outline-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-card-border">
                <button
                  type="button"
                  onClick={() => {
                    setIsEvidenceModalOpen(false);
                    setCompressedData(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingEvidence || compressing}
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold disabled:opacity-40 transition-colors"
                >
                  {submittingEvidence ? "Mengunggah..." : "Simpan Bukti"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
