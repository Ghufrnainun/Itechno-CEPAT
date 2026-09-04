'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminTopbar from '@/components/admin/AdminTopbar';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Avatar } from '@/components/ui/Avatar';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Paperclip,
  MessageSquare,
  Scale,
  Send,
  Loader2,
  ExternalLink,
  ArrowLeft,
  RefreshCw,
  Maximize2,
  X,
  FileText,
} from 'lucide-react';

interface DisputeUser {
  id_user: string;
  nama_lengkap: string;
  email: string;
  avatar_url?: string | null;
  username?: string;
  no_telpon?: string;
  rating_avg?: number;
}

interface DisputeDetailData {
  id_dispute: string;
  id_task: string;
  id_reporter: string;
  id_respondent: string;
  reason: string;
  description: string;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED_FAVOR_WORKER' | 'RESOLVED_FAVOR_REQUESTER' | 'CLOSED';
  resolution: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  task: {
    id_tasks: string;
    judul_tugas: string;
    deskripsi_tugas?: string;
    kompensasi: number;
    is_bidding?: boolean;
    status_task: { nama_status: string };
    kategori?: { nama_kategori: string };
  };
  kompensasi_dispute?: number;
  reporter: DisputeUser;
  respondent: DisputeUser;
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
  relatedDisputes?: Array<{
    id_dispute: string;
    status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED_FAVOR_WORKER' | 'RESOLVED_FAVOR_REQUESTER' | 'CLOSED';
    reason: string;
    created_at: string;
    reporter: DisputeUser;
    respondent: DisputeUser;
  }>;
}

interface Toast {
  type: 'success' | 'error';
  message: string;
}

function ToastNotif({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg text-xs font-medium font-sans animate-in slide-in-from-bottom-4 ${
        toast.type === 'success'
          ? 'bg-primary/10 border-primary/25 text-primary'
          : 'bg-error-container/40 border-error/25 text-error'
      }`}
    >
      {toast.type === 'success' ? (
        <CheckCircle2 className="w-4 h-4 shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 shrink-0" />
      )}
      <span>{toast.message}</span>
    </div>
  );
}

function DisputeStatusBadge({ status }: { status: DisputeDetailData['status'] }) {
  switch (status) {
    case 'OPEN':
      return (
        <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-bold font-mono">
          Menunggu Respon
        </span>
      );
    case 'IN_REVIEW':
      return (
        <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 text-xs font-bold font-mono">
          Dalam Mediasi
        </span>
      );
    case 'RESOLVED_FAVOR_WORKER':
      return (
        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-bold font-mono">
          Menang Pekerja
        </span>
      );
    case 'RESOLVED_FAVOR_REQUESTER':
      return (
        <span className="px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 border border-teal-500/20 text-xs font-bold font-mono">
          Menang Pemberi Tugas
        </span>
      );
    case 'CLOSED':
      return (
        <span className="px-3 py-1 rounded-full bg-slate-500/10 text-slate-600 border border-slate-500/20 text-xs font-bold font-mono">
          Ditutup
        </span>
      );
  }
}

export default function AdminDisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const disputeId = resolvedParams.id;
  const router = useRouter();

  const [dispute, setDispute] = useState<DisputeDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  // Admin Resolution State
  const [resolutionFavor, setResolutionFavor] = useState<'WORKER' | 'REQUESTER'>('WORKER');
  const [resolutionNote, setResolutionNote] = useState('');

  // Admin Messaging State
  const [adminMsg, setAdminMsg] = useState('');
  const [sendingAdminMsg, setSendingAdminMsg] = useState(false);

  // Lightbox Image Preview Modal
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const fetchDisputeDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/disputes/${disputeId}`);
      if (!res.ok) throw new Error('Gagal memuat sengketa');
      const json = await res.json();
      if (json.success && json.data) {
        setDispute(json.data);
      } else {
        throw new Error(json.message || 'Sengketa tidak ditemukan');
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Gagal memuat sengketa.' });
    } finally {
      setLoading(false);
    }
  }, [disputeId]);

  useEffect(() => {
    fetchDisputeDetail();
  }, [fetchDisputeDetail]);

  const handleResolveDispute = async () => {
    if (!dispute) return;
    if (!resolutionNote.trim()) {
      setToast({ type: 'error', message: 'Catatan putusan sengketa wajib diisi.' });
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/disputes/${dispute.id_dispute}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          favor: resolutionFavor,
          resolution: resolutionNote.trim(),
        }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setToast({
          type: 'success',
          message: 'Sengketa berhasil diputuskan & mutasi escrow dieksekusi!',
        });
        fetchDisputeDetail();
      } else {
        setToast({ type: 'error', message: json.message || 'Gagal memutuskan sengketa.' });
      }
    } catch {
      setToast({ type: 'error', message: 'Terjadi gangguan jaringan saat memproses sengketa.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendAdminMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispute || !adminMsg.trim()) return;

    setSendingAdminMsg(true);
    try {
      const res = await fetch(`/api/disputes/${dispute.id_dispute}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: adminMsg.trim() }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setAdminMsg('');
        fetchDisputeDetail();
      } else {
        setToast({ type: 'error', message: json.message || 'Gagal mengirim pesan admin.' });
      }
    } catch {
      setToast({ type: 'error', message: 'Gagal mengirim pesan admin.' });
    } finally {
      setSendingAdminMsg(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans text-on-surface">
      <AdminTopbar title="Detail Sengketa &amp; Mediasi Penuh" />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto flex flex-col gap-6">
        
        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/disputes"
              className="p-2 rounded-xl bg-surface-container-low hover:bg-surface-container border border-card-border text-on-surface transition-colors flex items-center gap-2 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Daftar Sengketa</span>
            </Link>

            <span className="text-on-surface-variant/40 hidden sm:inline">|</span>

            <span className="font-mono font-bold text-amber-600 text-xs sm:text-sm">
              ID: #{disputeId}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDisputeDetail()}
              disabled={loading}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Segarkan Data
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && !dispute && (
          <div className="space-y-6">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <Skeleton className="h-96 lg:col-span-7 rounded-2xl" />
              <Skeleton className="h-96 lg:col-span-5 rounded-2xl" />
            </div>
          </div>
        )}

        {/* Loaded Detail Content */}
        {!loading && dispute && (
          <div className="flex flex-col gap-6">
            
            {/* ──── Hero Overview Card ──── */}
            <div className="p-6 rounded-3xl bg-surface-container-lowest border border-card-border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-mono font-bold">
                    Sengketa #{dispute.id_dispute.substring(0, 8)}
                  </span>
                  <DisputeStatusBadge status={dispute.status} />
                  <span className="text-xs text-on-surface-variant">
                    Diajukan pada {formatDate(dispute.created_at)}
                  </span>
                </div>

                <h1 className="font-headline font-extrabold text-xl sm:text-2xl text-on-surface">
                  {dispute.task?.judul_tugas}
                </h1>

                <p className="text-xs text-on-surface-variant flex items-center gap-2">
                  <span>Alasan Sengketa:</span>
                  <span className="font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    {dispute.reason}
                  </span>
                </p>
              </div>

              {/* Escrow Value Badge */}
              <div className="p-4 rounded-2xl bg-surface-container-low border border-card-border flex flex-col items-start sm:items-end justify-center min-w-[220px]">
                <span className="text-[11px] uppercase font-mono font-bold text-on-surface-variant">
                  Nilai Kompensasi Escrow
                </span>
                <span className="text-xl sm:text-2xl font-mono font-extrabold text-primary mt-0.5">
                  {formatCurrency(dispute.kompensasi_dispute ?? dispute.task?.kompensasi ?? 0)}
                </span>
                {dispute.task?.is_bidding && (
                  <span className="text-[10px] font-sans font-semibold text-primary/80">
                    (Penawaran Terpilih)
                  </span>
                )}
                <span className="text-[10px] text-on-surface-variant mt-1">
                  Status Task: <strong className="capitalize">{dispute.task?.status_task?.nama_status || 'Unknown'}</strong>
                </span>
              </div>
            </div>

            {/* ──── Main Grid Layout (2-Columns) ──── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* ── Left Column: Parties & Statements & Evidences (7 Cols) ── */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                
                {/* Parties Involved */}
                <div className="p-6 rounded-3xl bg-surface-container-lowest border border-card-border shadow-xs space-y-4">
                  <h3 className="font-headline font-bold text-sm text-on-surface flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <span>Pihak yang Bersengketa</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Reporter */}
                    <div className="p-4 rounded-2xl bg-surface-container-low border border-card-border flex flex-col gap-2 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-amber-600 uppercase font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                          Pelapor (Reporter)
                        </span>
                        {dispute.reporter?.rating_avg ? (
                          <span className="text-xs font-mono font-bold text-amber-600">
                            ★ {dispute.reporter.rating_avg.toFixed(1)}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-3 mt-1 min-w-0">
                        {dispute.reporter?.avatar_url ? (
                          <img
                            src={dispute.reporter.avatar_url}
                            alt={dispute.reporter.nama_lengkap}
                            className="w-10 h-10 rounded-xl object-cover border border-card-border shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold text-sm shrink-0 border border-amber-500/25">
                            {dispute.reporter?.nama_lengkap?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-on-surface truncate">
                            {dispute.reporter?.nama_lengkap}
                          </p>
                          <p
                            className="text-[11px] text-on-surface-variant font-mono truncate break-all mt-0.5"
                            title={dispute.reporter?.email}
                          >
                            {dispute.reporter?.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Respondent */}
                    <div className="p-4 rounded-2xl bg-surface-container-low border border-card-border flex flex-col gap-2 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase font-mono px-2 py-0.5 rounded bg-surface-container border border-card-border">
                          Terlapor (Respondent)
                        </span>
                        {dispute.respondent?.rating_avg ? (
                          <span className="text-xs font-mono font-bold text-amber-600">
                            ★ {dispute.respondent.rating_avg.toFixed(1)}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-3 mt-1 min-w-0">
                        {dispute.respondent?.avatar_url ? (
                          <img
                            src={dispute.respondent.avatar_url}
                            alt={dispute.respondent.nama_lengkap}
                            className="w-10 h-10 rounded-xl object-cover border border-card-border shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-surface-container text-on-surface flex items-center justify-center font-bold text-sm shrink-0 border border-card-border">
                            {dispute.respondent?.nama_lengkap?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-on-surface truncate">
                            {dispute.respondent?.nama_lengkap}
                          </p>
                          <p
                            className="text-[11px] text-on-surface-variant font-mono truncate break-all mt-0.5"
                            title={dispute.respondent?.email}
                          >
                            {dispute.respondent?.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dispute Statement */}
                <div className="p-6 rounded-3xl bg-surface-container-lowest border border-card-border shadow-xs space-y-3">
                  <h3 className="font-headline font-bold text-sm text-on-surface flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span>Kronologi &amp; Penjelasan Pelapor</span>
                  </h3>
                  <div className="p-4 rounded-2xl bg-surface-container-low border border-card-border text-xs text-on-surface leading-relaxed whitespace-pre-wrap">
                    {dispute.description}
                  </div>
                </div>

                {/* Evidences Attached */}
                <div className="p-6 rounded-3xl bg-surface-container-lowest border border-card-border shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-headline font-bold text-sm text-on-surface flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-primary" />
                      <span>Bukti Pendukung Terlampir ({dispute.evidences?.length || 0})</span>
                    </h3>
                  </div>

                  {dispute.evidences?.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-surface-container-low border border-card-border text-center text-xs text-on-surface-variant italic">
                      Tidak ada foto atau dokumen bukti yang dilampirkan.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {dispute.evidences?.map((ev) => {
                        const isImage = ev.type === 'image' || ev.content.match(/\.(jpeg|jpg|gif|png|webp)/i);
                        const uploaderName =
                          ev.id_user === dispute.id_reporter
                            ? `${dispute.reporter?.nama_lengkap} (Pelapor)`
                            : `${dispute.respondent?.nama_lengkap} (Terlapor)`;

                        return (
                          <div
                            key={ev.id_evidence}
                            className="p-3.5 rounded-2xl bg-surface-container-low border border-card-border flex flex-col gap-2.5"
                          >
                            <div className="flex items-center justify-between text-[10px] font-mono text-on-surface-variant">
                              <span className="truncate max-w-[180px]">Oleh: {uploaderName}</span>
                              <span>{formatDate(ev.created_at)}</span>
                            </div>

                            {isImage ? (
                              <div className="space-y-2">
                                <div
                                  onClick={() => setLightboxImage(ev.content)}
                                  className="relative group rounded-xl overflow-hidden border border-card-border bg-black/5 cursor-zoom-in aspect-video flex items-center justify-center"
                                >
                                  <img
                                    src={ev.content}
                                    alt="Bukti Sengketa"
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold">
                                    <Maximize2 className="w-4 h-4" />
                                    <span>Perbesar</span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between text-[11px] pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setLightboxImage(ev.content)}
                                    className="text-primary font-bold hover:underline cursor-pointer"
                                  >
                                    Pratinjau Foto
                                  </button>
                                  <a
                                    href={ev.content}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-on-surface-variant hover:text-on-surface flex items-center gap-1 font-mono"
                                  >
                                    <span>Buka Asli</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 rounded-xl bg-surface-container-lowest border border-card-border text-xs text-on-surface break-all">
                                <a
                                  href={ev.content}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary font-semibold underline flex items-center gap-1.5"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                  <span className="line-clamp-2">{ev.content}</span>
                                </a>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

              {/* ── Right Column: Mediation Chat & Decision Panel (5 Cols) ── */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                
                {/* Mediation Discussion Room */}
                <div className="p-6 rounded-3xl bg-surface-container-lowest border border-card-border shadow-xs flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-headline font-bold text-sm text-on-surface flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      <span>Ruang Diskusi Mediasi ({dispute.messages?.length || 0})</span>
                    </h3>
                  </div>

                  <div className="h-80 overflow-y-auto custom-scrollbar p-3.5 rounded-2xl bg-surface-container-low border border-card-border flex flex-col gap-3">
                    {dispute.messages?.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-xs text-on-surface-variant italic p-4">
                        Belum ada riwayat pesan dalam mediasi ini.
                      </div>
                    ) : (
                      dispute.messages?.map((m) => {
                        const isReporter = m.id_sender === dispute.id_reporter;
                        const senderName = m.is_admin
                          ? '🛡️ Admin Platform'
                          : isReporter
                          ? `${dispute.reporter?.nama_lengkap} (Pelapor)`
                          : `${dispute.respondent?.nama_lengkap} (Terlapor)`;

                        return (
                          <div
                            key={m.id_message}
                            className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                              m.is_admin
                                ? 'bg-amber-500/15 border border-amber-500/30 shadow-2xs'
                                : 'bg-surface-container-lowest border border-card-border shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] opacity-75 mb-1.5 font-mono">
                              <span className={`font-bold ${m.is_admin ? 'text-amber-700' : 'text-on-surface'}`}>
                                {senderName}
                              </span>
                              <span>{new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-on-surface whitespace-pre-wrap">{m.message}</p>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Send Admin Message Form */}
                  {dispute.status !== 'RESOLVED_FAVOR_WORKER' &&
                    dispute.status !== 'RESOLVED_FAVOR_REQUESTER' && (
                      <form onSubmit={handleSendAdminMessage} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Tulis instruksi atau pesan mediasi resmi..."
                          value={adminMsg}
                          onChange={(e) => setAdminMsg(e.target.value)}
                          disabled={sendingAdminMsg}
                          className="flex-1 px-3.5 py-2.5 text-xs bg-surface-container-low text-on-surface rounded-xl border border-card-border focus:border-primary focus:outline-none"
                        />
                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          disabled={sendingAdminMsg || !adminMsg.trim()}
                          icon={sendingAdminMsg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        >
                          Kirim
                        </Button>
                      </form>
                    )}
                </div>

                {/* ──── Official Resolution Panel (Admin Action) ──── */}
                {dispute.status === 'RESOLVED_FAVOR_WORKER' ||
                dispute.status === 'RESOLVED_FAVOR_REQUESTER' ? (
                  <div className="p-6 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 flex flex-col gap-3 shadow-xs">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                      <ShieldCheck className="w-5 h-5" />
                      <span>Sengketa Telah Resmi Diputuskan</span>
                    </div>
                    
                    <div className="p-4 rounded-2xl bg-surface-container-lowest border border-card-border space-y-1.5">
                      <span className="text-[10px] font-mono uppercase font-bold text-on-surface-variant">
                        Catatan Resmi Putusan Admin:
                      </span>
                      <p className="text-xs text-on-surface leading-relaxed whitespace-pre-wrap font-medium">
                        {dispute.resolution}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-mono pt-1">
                      <span>Waktu Putusan:</span>
                      <span>{dispute.resolved_at ? formatDate(dispute.resolved_at) : '-'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-3xl bg-surface-container-lowest border-2 border-primary/30 flex flex-col gap-4 shadow-xs">
                    <div className="flex items-center gap-2 text-primary font-headline font-bold text-base">
                      <Scale className="w-5 h-5" />
                      <span>Panel Keputusan Sengketa &amp; Escrow</span>
                    </div>

                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Tetapkan keputusan resmi setelah meninjau bukti dan dialog kedua belah pihak. Sistem akan otomatis mengeksekusi mutasi saldo escrow.
                    </p>

                    <div className="space-y-2">
                      <label className="font-bold text-xs text-on-surface">Pilih Pihak Pemenang Escrow:</label>
                      <div className="grid grid-cols-1 gap-2.5">
                        <label
                          className={`p-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition-colors ${
                            resolutionFavor === 'WORKER'
                              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-800 font-bold'
                              : 'bg-surface-container-low border-card-border text-on-surface'
                          }`}
                        >
                          <input
                            type="radio"
                            name="favor"
                            value="WORKER"
                            checked={resolutionFavor === 'WORKER'}
                            onChange={() => setResolutionFavor('WORKER')}
                            className="text-primary focus:ring-primary"
                          />
                          <div className="text-xs">
                            <p className="font-bold">Menangkan Pekerja (Worker)</p>
                            <p className="text-[11px] font-normal opacity-80 mt-0.5">
                              Cairkan seluruh saldo kompensasi escrow ke dompet pekerja.
                            </p>
                          </div>
                        </label>

                        <label
                          className={`p-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition-colors ${
                            resolutionFavor === 'REQUESTER'
                              ? 'bg-teal-500/10 border-teal-500/50 text-teal-800 font-bold'
                              : 'bg-surface-container-low border-card-border text-on-surface'
                          }`}
                        >
                          <input
                            type="radio"
                            name="favor"
                            value="REQUESTER"
                            checked={resolutionFavor === 'REQUESTER'}
                            onChange={() => setResolutionFavor('REQUESTER')}
                            className="text-primary focus:ring-primary"
                          />
                          <div className="text-xs">
                            <p className="font-bold">Menangkan Pembuat Tugas (Requester)</p>
                            <p className="text-[11px] font-normal opacity-80 mt-0.5">
                              Kembalikan dana escrow (refund penuh) ke dompet requester.
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-xs text-on-surface">
                        Alasan &amp; Catatan Putusan Resmi (Wajib):
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Jelaskan alasan dan landasan keputusan admin secara objektif..."
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-surface-container-low rounded-2xl border border-card-border focus:border-primary focus:outline-none"
                      />
                    </div>

                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleResolveDispute}
                      disabled={actionLoading || !resolutionNote.trim()}
                      className="w-full font-bold"
                    >
                      {actionLoading ? 'Mengeksekusi Keputusan...' : 'Tetapkan Keputusan & Eksekusi Escrow'}
                    </Button>
                  </div>
                )}

                {/* Related Disputes Card */}
                {dispute.relatedDisputes && dispute.relatedDisputes.length > 0 && (
                  <div className="p-6 rounded-3xl bg-surface-container-lowest border border-card-border shadow-xs flex flex-col gap-3.5">
                    <div>
                      <h3 className="font-headline font-bold text-sm text-on-surface">
                        Sengketa Lain pada Tugas Ini
                      </h3>
                      <p className="text-[11px] text-on-surface-variant">
                        Terdapat {dispute.relatedDisputes.length} berkas sengketa pekerja lainnya untuk tugas yang sama
                      </p>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {dispute.relatedDisputes.map((rel) => (
                        <Link
                          key={rel.id_dispute}
                          href={`/admin/disputes/${rel.id_dispute}`}
                          className="p-3.5 rounded-2xl bg-surface-container-low hover:bg-surface-container border border-card-border hover:border-primary/40 transition-all flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar
                              src={rel.respondent.avatar_url}
                              name={rel.respondent.nama_lengkap}
                              size="sm"
                              shape="rounded"
                            />
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-on-surface truncate group-hover:text-primary transition-colors">
                                  Terlapor: {rel.respondent.nama_lengkap}
                                </span>
                                <span className="text-[10px] font-mono text-on-surface-variant">
                                  #{rel.id_dispute.substring(0, 6)}
                                </span>
                              </div>
                              <span className="text-[11px] text-on-surface-variant truncate">
                                {rel.reason}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <DisputeStatusBadge status={rel.status} />
                            <ExternalLink className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-primary transition-colors ml-1" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>
        )}

      </main>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-surface-container-lowest rounded-3xl overflow-hidden border border-card-border p-2">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxImage}
              alt="Pratinjau Bukti"
              className="w-full h-full max-h-[80vh] object-contain rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && <ToastNotif toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
