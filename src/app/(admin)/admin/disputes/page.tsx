'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import AdminTopbar from '@/components/admin/AdminTopbar';
import DataTable, { Column } from '@/components/admin/DataTable';
import AdminDrawer from '@/components/admin/AdminDrawer';
import KPICard from '@/components/admin/KPICard';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Avatar } from '@/components/ui/Avatar';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
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
  Maximize2,
  X,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  List,
} from 'lucide-react';

interface DisputeUser {
  id_user: string;
  nama_lengkap: string;
  email: string;
  avatar_url?: string | null;
}

interface DisputeItem {
  id: string;
  id_dispute: string;
  id_task: string;
  id_reporter: string;
  id_respondent: string;
  reason: string;
  description: string;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED_FAVOR_WORKER' | 'RESOLVED_FAVOR_REQUESTER' | 'CLOSED';
  resolution: string | null;
  resolved_at: string | null;
  created_at: string;
  task: {
    id_tasks: string;
    judul_tugas: string;
    kompensasi: number;
    is_bidding?: boolean;
    status_task: { nama_status: string };
  };
  kompensasi_dispute?: number;
  reporter: DisputeUser;
  respondent: DisputeUser;
  _count: {
    evidences: number;
    messages: number;
  };
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

function DisputeStatusBadge({ status }: { status: DisputeItem['status'] }) {
  switch (status) {
    case 'OPEN':
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[11px] font-bold font-mono">
          Menunggu Respon
        </span>
      );
    case 'IN_REVIEW':
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 text-[11px] font-bold font-mono">
          Dalam Mediasi
        </span>
      );
    case 'RESOLVED_FAVOR_WORKER':
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[11px] font-bold font-mono">
          Menang Pekerja
        </span>
      );
    case 'RESOLVED_FAVOR_REQUESTER':
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 border border-teal-500/20 text-[11px] font-bold font-mono">
          Menang Pemberi Tugas
        </span>
      );
    case 'CLOSED':
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-slate-500/10 text-slate-600 border border-slate-500/20 text-[11px] font-bold font-mono">
          Ditutup
        </span>
      );
  }
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, open: 0, inReview: 0, resolvedWorker: 0, resolvedRequester: 0 });
  const [viewMode, setViewMode] = useState<'folder' | 'table'>('folder');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  const groupedDisputes = useMemo(() => {
    const map: Record<
      string,
      {
        taskId: string;
        taskTitle: string;
        taskKompensasi: number;
        taskStatus: string;
        disputes: DisputeItem[];
        activeCount: number;
        resolvedCount: number;
      }
    > = {};

    for (const d of disputes) {
      const tId = d.id_task;
      if (!map[tId]) {
        map[tId] = {
          taskId: tId,
          taskTitle: d.task?.judul_tugas || 'Tugas Tanpa Judul',
          taskKompensasi: d.task?.kompensasi || 0,
          taskStatus: d.task?.status_task?.nama_status || 'in_progress',
          disputes: [],
          activeCount: 0,
          resolvedCount: 0,
        };
      }
      map[tId].disputes.push(d);
      if (d.status === 'OPEN' || d.status === 'IN_REVIEW') {
        map[tId].activeCount += 1;
      } else {
        map[tId].resolvedCount += 1;
      }
    }

    return Object.values(map).sort((a, b) => {
      if (b.activeCount !== a.activeCount) return b.activeCount - a.activeCount;
      return b.disputes.length - a.disputes.length;
    });
  }, [disputes]);

  const toggleFolderCollapse = (taskId: string) => {
    setCollapsedFolders((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  // Admin Resolution State
  const [resolutionFavor, setResolutionFavor] = useState<'WORKER' | 'REQUESTER'>('WORKER');
  const [resolutionNote, setResolutionNote] = useState('');

  // Admin Messaging in Drawer
  const [adminMsg, setAdminMsg] = useState('');
  const [sendingAdminMsg, setSendingAdminMsg] = useState(false);

  // Lightbox Image Preview Modal
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const openDrawer = useCallback(async (disputeId: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/disputes/${disputeId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSelectedDispute(json.data);
          setResolutionNote('');
        }
      }
    } catch {
      setToast({ type: 'error', message: 'Gagal memuat detail sengketa.' });
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const fetchDisputes = useCallback(async (selectTargetId?: string) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        page: String(page),
        limit: '15',
        ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
        ...(searchTerm.trim() ? { search: searchTerm.trim() } : {}),
      });

      const res = await fetch(`/api/admin/disputes?${q.toString()}`);
      if (!res.ok) throw new Error('Gagal memuat sengketa');
      const json = await res.json();

      const items: DisputeItem[] = (json.data || []).map((d: any) => ({
        ...d,
        id: d.id_dispute,
      }));

      setDisputes(items);
      setTotal(json.pagination?.total || 0);
      setTotalPages(json.pagination?.totalPages || 1);
      if (json.stats) {
        setStats(json.stats);
      }

      if (selectTargetId) {
        openDrawer(selectTargetId);
      }
    } catch {
      setToast({ type: 'error', message: 'Gagal mengambil data sengketa.' });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchTerm, openDrawer]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const handleResolveDispute = async () => {
    if (!selectedDispute) return;
    if (!resolutionNote.trim()) {
      setToast({ type: 'error', message: 'Catatan putusan sengketa wajib diisi.' });
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/disputes/${selectedDispute.id_dispute}`, {
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
        openDrawer(selectedDispute.id_dispute);
        fetchDisputes();
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
    if (!selectedDispute || !adminMsg.trim()) return;

    setSendingAdminMsg(true);
    try {
      const res = await fetch(`/api/disputes/${selectedDispute.id_dispute}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: adminMsg.trim() }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setAdminMsg('');
        openDrawer(selectedDispute.id_dispute);
      } else {
        setToast({ type: 'error', message: json.message || 'Gagal mengirim pesan admin.' });
      }
    } catch {
      setToast({ type: 'error', message: 'Gagal mengirim pesan admin.' });
    } finally {
      setSendingAdminMsg(false);
    }
  };

  const columns: Column<DisputeItem>[] = [
    {
      header: 'ID & Tanggal',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-mono font-bold text-xs text-on-surface">
            #{row.id_dispute.substring(0, 8)}
          </span>
          <span className="text-[11px] text-on-surface-variant">
            {formatDate(row.created_at)}
          </span>
        </div>
      ),
    },
    {
      header: 'Tugas & Escrow',
      cell: (row) => (
        <div className="flex flex-col max-w-[200px]">
          <span className="font-semibold text-xs text-on-surface truncate">
            {row.task.judul_tugas}
          </span>
          <span className="font-mono text-[11px] font-bold text-primary">
            {formatCurrency(row.kompensasi_dispute ?? row.task.kompensasi)}
            {row.task.is_bidding && ' (Bid)'}
          </span>
        </div>
      ),
    },
    {
      header: 'Pihak Terkait',
      cell: (row) => (
        <div className="flex flex-col text-xs">
          <span className="text-amber-700 font-semibold truncate max-w-[150px]">
            Pelapor: {row.reporter.nama_lengkap}
          </span>
          <span className="text-on-surface-variant truncate max-w-[150px]">
            Terlapor: {row.respondent.nama_lengkap}
          </span>
        </div>
      ),
    },
    {
      header: 'Alasan Sengketa',
      cell: (row) => (
        <span className="text-xs text-on-surface line-clamp-1 max-w-[180px]">
          {row.reason}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (row) => <DisputeStatusBadge status={row.status} />,
    },
    {
      header: 'Aksi',
      className: 'text-right',
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => openDrawer(row.id_dispute)}
          className="text-xs"
        >
          Tinjau &amp; Putuskan
        </Button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans text-on-surface">
      <AdminTopbar title="Manajemen Sengketa (Disputes & Resolution)" />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto flex flex-col gap-6">
        
        {/* ──── KPI Cards ──── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Sengketa"
            value={stats.total}
            icon={<Scale className="w-5 h-5 text-primary" />}
          />
          <KPICard
            title="Menunggu Mediasi"
            value={stats.open}
            icon={<Clock className="w-5 h-5 text-amber-600" />}
          />
          <KPICard
            title="Dalam Peninjauan"
            value={stats.inReview}
            icon={<ShieldAlert className="w-5 h-5 text-blue-600" />}
          />
          <KPICard
            title="Selesai Diputuskan"
            value={stats.resolvedWorker + stats.resolvedRequester}
            icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
          />
        </div>

        {/* ──── Search & Filter Bar ──── */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-surface-container-lowest p-4 rounded-2xl border border-card-border">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Cari sengketa, tugas, atau nama pengguna..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-surface-container-low text-on-surface rounded-xl border border-card-border focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            {/* View Mode Switcher: Folder vs Table */}
            <div className="inline-flex p-1 rounded-xl bg-surface-container-low border border-card-border">
              <button
                type="button"
                onClick={() => setViewMode('folder')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'folder'
                    ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title="Kelompokkan per Folder Tugas"
              >
                <Folder className="w-3.5 h-3.5" />
                <span>Folder Tugas</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title="Tabel Sengketa Lengkap"
              >
                <List className="w-3.5 h-3.5" />
                <span>Tabel</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-on-surface-variant shrink-0">
                Filter Status:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs bg-surface-container-low text-on-surface rounded-xl border border-card-border focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="OPEN">Menunggu Respon (OPEN)</option>
                <option value="IN_REVIEW">Dalam Mediasi (IN_REVIEW)</option>
                <option value="RESOLVED_FAVOR_WORKER">Menang Pekerja</option>
                <option value="RESOLVED_FAVOR_REQUESTER">Menang Pemberi Tugas</option>
              </select>
            </div>
          </div>
        </div>

        {/* ──── VIEW 1: FOLDER / GROUPED BY TASK ──── */}
        {viewMode === 'folder' && (
          <div className="flex flex-col gap-5">
            {groupedDisputes.length === 0 ? (
              <div className="p-12 rounded-3xl bg-surface-container-lowest border border-card-border text-center flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-surface-container text-on-surface-variant flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="font-headline font-bold text-base text-on-surface">
                  Tidak Ada Sengketa
                </h3>
                <p className="text-xs text-on-surface-variant max-w-sm">
                  Tidak ada sengketa yang sesuai dengan kriteria filter saat ini.
                </p>
              </div>
            ) : (
              groupedDisputes.map((group) => {
                const isCollapsed = collapsedFolders[group.taskId] ?? false;

                return (
                  <div
                    key={group.taskId}
                    className="rounded-3xl bg-surface-container-lowest border border-card-border shadow-xs overflow-hidden transition-all"
                  >
                    {/* Folder Header */}
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
                              Folder Tugas #{group.taskId.substring(0, 8)}
                            </span>
                            <span className="text-[11px] text-on-surface-variant">
                              • Status Task: <strong className="uppercase">{group.taskStatus}</strong>
                            </span>
                            <span className="text-[11px] font-mono font-bold text-primary">
                              • {formatCurrency(group.taskKompensasi)}
                            </span>
                          </div>
                          <h3 className="font-headline font-bold text-base sm:text-lg text-on-surface mt-1 truncate">
                            {group.taskTitle}
                          </h3>
                        </div>
                      </div>

                      {/* Right badge & counters */}
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
                            <span>{group.activeCount} Aktif Menunggu</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-500/10 border border-slate-500/20 text-slate-600 text-xs font-bold font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Semua Selesai</span>
                          </div>
                        )}

                        <button
                          type="button"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
                        >
                          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Folder Items */}
                    {!isCollapsed && (
                      <div className="p-4 sm:p-5 flex flex-col gap-3 bg-surface-container-lowest/60">
                        {group.disputes.map((dispute) => (
                          <div
                            key={dispute.id_dispute}
                            className="p-4 rounded-2xl bg-surface-container-low/60 border border-card-border hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="flex items-start gap-3.5 min-w-0">
                              <Avatar
                                src={dispute.respondent.avatar_url}
                                name={dispute.respondent.nama_lengkap}
                                size="md"
                                shape="rounded"
                              />
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-xs text-on-surface truncate">
                                    Terlapor: {dispute.respondent.nama_lengkap}
                                  </span>
                                  <span className="text-[11px] text-on-surface-variant">
                                    vs Pelapor: <strong>{dispute.reporter.nama_lengkap}</strong>
                                  </span>
                                  <span className="text-[10px] font-mono text-on-surface-variant">
                                    • #{dispute.id_dispute.substring(0, 8)}
                                  </span>
                                  <DisputeStatusBadge status={dispute.status} />
                                  <span className="font-mono text-xs font-bold text-primary tabular-nums">
                                    • {formatCurrency(dispute.kompensasi_dispute ?? dispute.task.kompensasi)}
                                    {dispute.task.is_bidding && ' (Bid)'}
                                  </span>
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

                            {/* Action Buttons & Counters */}
                            <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-card-border/50 w-full sm:w-auto justify-between sm:justify-end">
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

                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openDrawer(dispute.id_dispute)}
                                  className="text-xs"
                                >
                                  Tinjau &amp; Putuskan
                                </Button>
                                <Link
                                  href={`/admin/disputes/${dispute.id_dispute}`}
                                  className="p-1.5 rounded-lg border border-card-border hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
                                  title="Buka Halaman Penuh"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ──── VIEW 2: DATA TABLE ──── */}
        {viewMode === 'table' && (
          <div className="bg-surface-container-lowest rounded-2xl border border-card-border overflow-hidden">
            <DataTable
              columns={columns}
              data={disputes}
              pageSize={15}
              emptyMessage="Tidak ada sengketa yang sesuai dengan kriteria filter."
            />
          </div>
        )}

      </main>

      {/* ──── Dispute Inspector & Resolution Drawer ──── */}
      <AdminDrawer
        isOpen={Boolean(selectedDispute)}
        onClose={() => setSelectedDispute(null)}
        title="Tinjauan & Putusan Sengketa"
        headerActions={
          selectedDispute ? (
            <Link
              href={`/admin/disputes/${selectedDispute.id_dispute}`}
              target="_blank"
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white flex items-center gap-1.5 transition-colors border border-primary/20 cursor-pointer shrink-0"
              title="Buka Halaman Penuh"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lihat Penuh</span>
            </Link>
          ) : undefined
        }
      >
        {loadingDetail || !selectedDispute ? (
          <div className="p-6 flex flex-col gap-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <div className="p-6 flex flex-col gap-6 font-sans text-xs">
            
            {/* Header info */}
            <div className="flex flex-col gap-1 border-b border-card-border pb-4">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-amber-600">
                  Sengketa #{selectedDispute.id_dispute.substring(0, 8)}
                </span>
                <DisputeStatusBadge status={selectedDispute.status} />
              </div>
              <h3 className="font-headline font-bold text-base text-on-surface mt-1">
                {selectedDispute.task?.judul_tugas}
              </h3>
              <div className="flex items-center justify-between mt-2 p-3 bg-surface-container-low rounded-xl border border-card-border font-mono">
                <span className="text-on-surface-variant">Nilai Kompensasi Escrow:</span>
                <span className="text-primary font-bold text-sm">
                  {formatCurrency(selectedDispute.kompensasi_dispute ?? selectedDispute.task?.kompensasi ?? 0)}
                  {selectedDispute.task?.is_bidding && (
                    <span className="ml-1.5 text-[10px] text-primary/70 font-sans font-semibold">(Penawaran)</span>
                  )}
                </span>
              </div>
            </div>

            {/* Parties Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-surface-container-low border border-card-border flex flex-col gap-1 min-w-0">
                <span className="text-[10px] font-bold text-amber-600 uppercase font-mono">
                  Pelapor (Reporter)
                </span>
                <span className="font-bold text-on-surface truncate">
                  {selectedDispute.reporter?.nama_lengkap}
                </span>
                <span
                  className="text-[11px] text-on-surface-variant font-mono truncate break-all leading-snug"
                  title={selectedDispute.reporter?.email}
                >
                  {selectedDispute.reporter?.email}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low border border-card-border flex flex-col gap-1 min-w-0">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase font-mono">
                  Terlapor (Respondent)
                </span>
                <span className="font-bold text-on-surface truncate">
                  {selectedDispute.respondent?.nama_lengkap}
                </span>
                <span
                  className="text-[11px] text-on-surface-variant font-mono truncate break-all leading-snug"
                  title={selectedDispute.respondent?.email}
                >
                  {selectedDispute.respondent?.email}
                </span>
              </div>
            </div>

            {/* Related disputes on same task switchers in Drawer */}
            {selectedDispute.relatedDisputes && selectedDispute.relatedDisputes.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-card-border flex flex-col gap-2">
                <span className="text-[10px] font-mono font-bold uppercase text-primary">
                  Sengketa Lain pada Tugas Ini ({selectedDispute.relatedDisputes.length})
                </span>
                <div className="flex flex-col gap-1.5">
                  {selectedDispute.relatedDisputes.map((rel: any) => (
                    <button
                      key={rel.id_dispute}
                      type="button"
                      onClick={() => openDrawer(rel.id_dispute)}
                      className="p-2 rounded-xl bg-surface-container-lowest hover:bg-surface-container border border-card-border flex items-center justify-between text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar
                          src={rel.respondent?.avatar_url}
                          name={rel.respondent?.nama_lengkap}
                          size="sm"
                          shape="rounded"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-xs text-on-surface truncate">
                            Terlapor: {rel.respondent?.nama_lengkap}
                          </span>
                          <span className="text-[10px] text-on-surface-variant truncate">
                            {rel.reason}
                          </span>
                        </div>
                      </div>
                      <DisputeStatusBadge status={rel.status} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dispute Statement */}
            <div className="flex flex-col gap-2">
              <span className="font-bold text-on-surface">
                Alasan: <span className="text-amber-600">{selectedDispute.reason}</span>
              </span>
              <p className="text-on-surface-variant bg-surface-container-low p-3.5 rounded-xl border border-card-border leading-relaxed whitespace-pre-wrap">
                {selectedDispute.description}
              </p>
            </div>

            {/* Evidences */}
            <div className="flex flex-col gap-2">
              <span className="font-bold text-on-surface flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-primary" />
                Bukti Terlampir ({selectedDispute.evidences?.length || 0})
              </span>
              {selectedDispute.evidences?.length === 0 ? (
                <span className="text-on-surface-variant italic">Tidak ada bukti dilampirkan.</span>
              ) : (
                <div className="flex flex-col gap-2">
                  {selectedDispute.evidences?.map((ev: any) => (
                    <div
                      key={ev.id_evidence}
                      className="p-3 rounded-xl bg-surface-container-low border border-card-border flex flex-col gap-1.5"
                    >
                      <span className="text-[10px] text-on-surface-variant font-mono">
                        Diunggah oleh:{' '}
                        {ev.id_user === selectedDispute.id_reporter
                          ? selectedDispute.reporter?.nama_lengkap
                          : selectedDispute.respondent?.nama_lengkap}
                      </span>
                      {ev.type === 'image' || ev.content.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
                        <div className="space-y-1.5 mt-0.5">
                          <div
                            onClick={() => setLightboxImage(ev.content)}
                            className="relative group rounded-xl overflow-hidden border border-card-border bg-black/5 cursor-zoom-in aspect-video flex items-center justify-center max-h-36"
                          >
                            <img
                              src={ev.content}
                              alt="Bukti Sengketa"
                              className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-150"
                            />
                            <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-[11px] font-semibold">
                              <Maximize2 className="w-3.5 h-3.5" />
                              <span>Perbesar</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[10px]">
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
                        <p className="text-on-surface break-all">{ev.content}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mediation Chat History */}
            <div className="flex flex-col gap-2">
              <span className="font-bold text-on-surface flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-primary" />
                Riwayat Diskusi Mediasi ({selectedDispute.messages?.length || 0})
              </span>
              <div className="h-44 overflow-y-auto custom-scrollbar p-3 rounded-xl bg-surface-container-low border border-card-border flex flex-col gap-2">
                {selectedDispute.messages?.length === 0 ? (
                  <span className="text-on-surface-variant italic text-center py-4">
                    Belum ada riwayat pesan mediasi.
                  </span>
                ) : (
                  selectedDispute.messages?.map((m: any) => (
                    <div
                      key={m.id_message}
                      className={`p-2.5 rounded-xl text-xs leading-relaxed ${
                        m.is_admin
                          ? 'bg-amber-500/15 border border-amber-500/30'
                          : 'bg-surface-container-lowest border border-card-border'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] opacity-70 mb-1 font-mono">
                        <span className="font-bold">
                          {m.is_admin
                            ? '🛡️ Admin Platform'
                            : m.id_sender === selectedDispute.id_reporter
                            ? selectedDispute.reporter?.nama_lengkap
                            : selectedDispute.respondent?.nama_lengkap}
                        </span>
                        <span>{new Date(m.created_at).toLocaleTimeString('id-ID')}</span>
                      </div>
                      <p className="text-on-surface">{m.message}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Admin send message input */}
              {selectedDispute.status !== 'RESOLVED_FAVOR_WORKER' &&
                selectedDispute.status !== 'RESOLVED_FAVOR_REQUESTER' && (
                  <form onSubmit={handleSendAdminMessage} className="flex gap-2 mt-1">
                    <input
                      type="text"
                      placeholder="Kirim pesan mediasi resmi sebagai Admin..."
                      value={adminMsg}
                      onChange={(e) => setAdminMsg(e.target.value)}
                      disabled={sendingAdminMsg}
                      className="flex-1 px-3 py-2 text-xs bg-surface-container-low rounded-xl border border-card-border focus:border-primary focus:outline-none"
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      disabled={sendingAdminMsg || !adminMsg.trim()}
                    >
                      {sendingAdminMsg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Kirim'}
                    </Button>
                  </form>
                )}
            </div>

            {/* ──── Official Resolution Panel (Admin Action) ──── */}
            {selectedDispute.status === 'RESOLVED_FAVOR_WORKER' ||
            selectedDispute.status === 'RESOLVED_FAVOR_REQUESTER' ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sengketa Telah Diputuskan</span>
                </div>
                <p className="text-on-surface bg-surface-container-lowest p-3 rounded-xl border border-card-border">
                  {selectedDispute.resolution}
                </p>
                <span className="text-[10px] text-on-surface-variant font-mono">
                  Diputuskan pada {formatDate(selectedDispute.resolved_at)}
                </span>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-surface-container-low border-2 border-primary/30 flex flex-col gap-3 mt-2">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <Scale className="w-4 h-4" />
                  <span>Panel Putusan Manual Admin</span>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-on-surface">Pilih Pihak Pemenang Escrow:</label>
                  <div className="grid grid-cols-1 gap-2">
                    <label
                      className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-colors ${
                        resolutionFavor === 'WORKER'
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 font-bold'
                          : 'bg-surface-container-lowest border-card-border text-on-surface'
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
                      <span>Menangkan Pekerja (Cairkan Escrow ke Pekerja)</span>
                    </label>

                    <label
                      className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-colors ${
                        resolutionFavor === 'REQUESTER'
                          ? 'bg-teal-500/10 border-teal-500/40 text-teal-700 font-bold'
                          : 'bg-surface-container-lowest border-card-border text-on-surface'
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
                      <span>Menangkan Pembuat Tugas (Kembalikan Saldo/Refund)</span>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-on-surface">
                    Alasan &amp; Catatan Putusan Resmi (Wajib):
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tuliskan pertimbangan admin dan alasan putusan ini..."
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-surface-container-lowest rounded-xl border border-card-border focus:border-primary focus:outline-none"
                  />
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleResolveDispute}
                  disabled={actionLoading || !resolutionNote.trim()}
                  className="w-full mt-2 font-bold"
                >
                  {actionLoading ? 'Mengeksekusi Putusan...' : 'Tetapkan Keputusan & Eksekusi Escrow'}
                </Button>
              </div>
            )}

          </div>
        )}
      </AdminDrawer>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-surface-container-lowest rounded-3xl overflow-hidden border border-card-border p-2">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
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
