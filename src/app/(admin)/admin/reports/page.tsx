'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AdminTopbar from '@/components/admin/AdminTopbar';
import DataTable, { Column } from '@/components/admin/DataTable';
import AdminDrawer from '@/components/admin/AdminDrawer';
import KPICard from '@/components/admin/KPICard';
import StatusBadge from '@/components/admin/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Flag,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mail,
  Tag,
  ShieldCheck,
  XCircle,
  FileText,
  Loader2,
  Briefcase,
  ExternalLink,
} from 'lucide-react';

interface ReportUser {
  id: string;
  nama_lengkap: string;
  email: string;
  username: string;
  avatar_url?: string;
  no_telpon?: string;
  role: string;
}

interface UserReportItem {
  id: string;
  kategori: string;
  subjek: string;
  deskripsi: string;
  status: string;
  created_at: string;
  updated_at: string;
  user: ReportUser;
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

function ReportStatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, string> = {
    pending: 'menunggu',
    reviewed: 'diproses',
    resolved: 'selesai',
    rejected: 'ditolak',
  };
  return <StatusBadge status={statusMap[status] || status} />;
}

interface ParsedTaskInfo {
  taskId: string;
  taskTitle: string;
  isExplicitTag: boolean;
}

function extractTaskFromReport(deskripsi: string, subjek: string): ParsedTaskInfo | null {
  if (!deskripsi && !subjek) return null;

  // 1. Format standar ReportModal: [Terkait Task: Judul (ID: uuid)]
  const explicitMatch = deskripsi?.match(/\[Terkait Task:\s*(.*?)\s*\(ID:\s*([a-f0-9\-]+)\)\]/i);
  if (explicitMatch) {
    return {
      taskTitle: explicitMatch[1].trim(),
      taskId: explicitMatch[2].trim(),
      isExplicitTag: true,
    };
  }

  // 2. Pattern (ID: uuid) atau ID: uuid
  const combined = `${subjek || ''} ${deskripsi || ''}`;
  const idMatch =
    combined.match(/\(ID:\s*([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\)/i) ||
    combined.match(/ID:\s*([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);

  if (idMatch) {
    const titleMatch = subjek?.match(/\[Pelanggaran Task\]\s*(.*)/i);
    return {
      taskTitle: titleMatch ? titleMatch[1].trim() : 'Tugas Terkait',
      taskId: idMatch[1].trim(),
      isExplicitTag: false,
    };
  }

  // 3. Fallback UUID 36-char
  const rawUuidMatch = combined.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
  if (rawUuidMatch) {
    return {
      taskTitle: 'Tugas Terkait',
      taskId: rawUuidMatch[1].trim(),
      isExplicitTag: false,
    };
  }

  return null;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<UserReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ totalAll: 0, pending: 0, reviewed: 0, resolved: 0 });

  const [selectedReport, setSelectedReport] = useState<UserReportItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const fetchReports = useCallback(async (reportIdTarget?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        status: statusFilter,
        page: String(page),
        limit: '10',
      });
      if (reportIdTarget) {
        params.set('id', reportIdTarget);
      }

      const res = await fetch(`/api/admin/reports?${params}`);
      const json = await res.json();
      if (json.success) {
        setReports(json.data);
        if (json.stats) setStats(json.stats);
        if (json.meta) {
          setTotalPages(json.meta.totalPages);
          setTotal(json.meta.total);
        }

        // Auto open target report if ID specified in URL
        if (reportIdTarget && json.data.length > 0) {
          const target = json.data.find((r: UserReportItem) => r.id === reportIdTarget) || json.data[0];
          setSelectedReport(target);
        }
      }
    } catch (err) {
      console.error('[AdminReports] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, page]);

  useEffect(() => {
    let reportIdFromUrl = '';
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      reportIdFromUrl = urlParams.get('id') || '';
      const initialSearch = urlParams.get('search') || '';
      if (initialSearch) {
        setSearchTerm(initialSearch);
      }
    }

    fetchReports(reportIdFromUrl);
  }, [fetchReports]);

  const handleUpdateStatus = async (newStatus: 'reviewed' | 'resolved' | 'rejected') => {
    if (!selectedReport) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/admin/reports/${selectedReport.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();
      if (json.success) {
        setToast({ type: 'success', message: json.message });
        setSelectedReport((prev) => (prev ? { ...prev, status: newStatus } : null));
        fetchReports();
      } else {
        setToast({ type: 'error', message: json.message || 'Gagal memperbarui status.' });
      }
    } catch (err) {
      console.error('[AdminReports] Update status error:', err);
      setToast({ type: 'error', message: 'Terjadi kesalahan server.' });
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<UserReportItem>[] = [
    {
      header: 'Pelapor',
      cell: (row) => (
        <div className="flex items-center gap-3">
          {row.user.avatar_url ? (
            <img
              src={row.user.avatar_url}
              alt={row.user.nama_lengkap}
              className="w-8 h-8 rounded-full object-cover shrink-0 border border-card-border"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
              {row.user.nama_lengkap.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="truncate">
            <p className="text-xs font-bold text-on-surface font-headline truncate">{row.user.nama_lengkap}</p>
            <p className="text-[11px] text-on-surface-variant font-mono truncate">{row.user.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Kategori',
      cell: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-surface-container-low text-on-surface border border-card-border">
          {row.kategori}
        </span>
      ),
    },
    {
      header: 'Subjek Laporan',
      cell: (row) => {
        const taskInfo = extractTaskFromReport(row.deskripsi, row.subjek);
        return (
          <div className="max-w-xs truncate">
            <div className="flex items-center gap-1.5 truncate">
              {taskInfo && (
                <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 font-mono text-[9px] font-bold shrink-0">
                  Task
                </span>
              )}
              <p className="text-xs font-bold text-on-surface truncate">{row.subjek}</p>
            </div>
            <p className="text-[11px] text-on-surface-variant truncate">{row.deskripsi}</p>
          </div>
        );
      },
    },
    {
      header: 'Status',
      cell: (row) => <ReportStatusBadge status={row.status} />,
    },
    {
      header: 'Tanggal',
      cell: (row) => (
        <span className="font-mono text-xs text-on-surface-variant tabular-nums">
          {new Date(row.created_at).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      header: 'Aksi',
      cell: (row) => (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setSelectedReport(row)}
        >
          Detail
        </Button>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 font-sans">
      <AdminTopbar title="Laporan &amp; Aduan Pengguna" />

      <main className="flex-1 px-4 sm:px-8 py-8 lg:py-12 space-y-8 max-w-[1400px] w-full mx-auto font-sans">
        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Laporan"
            value={stats.totalAll}
            change="semua laporan"
            isPositive={true}
            icon={<Flag className="w-4 h-4 text-primary" />}
          />
          <KPICard
            title="Laporan Pending"
            value={stats.pending}
            change="perlu respon"
            isPositive={false}
            icon={<Clock className="w-4 h-4 text-tertiary" />}
          />
          <KPICard
            title="Sedang Ditinjau"
            value={stats.reviewed}
            change="proses investigasi"
            isPositive={true}
            icon={<FileText className="w-4 h-4 text-primary" />}
          />
          <KPICard
            title="Selesai Ditangani"
            value={stats.resolved}
            change="laporan tuntas"
            isPositive={true}
            icon={<ShieldCheck className="w-4 h-4 text-primary" />}
          />
        </div>

        {/* Filter Bar & Search */}
        <div className="bg-white border border-card-border rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            {['All', 'pending', 'reviewed', 'resolved', 'rejected'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setStatusFilter(tab);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === tab
                    ? 'bg-primary text-on-primary shadow-xs font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
              >
                {tab === 'All' ? 'Semua Status' : tab}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari subjek, deskripsi, atau nama..."
              className="w-full pl-9 pr-3.5 py-2 text-xs font-sans bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/50 rounded-xl border border-card-border focus:border-primary focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Data Table / Loading Skeleton */}
        {loading ? (
          <div className="bg-white border border-card-border rounded-2xl p-6 shadow-xs space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4 py-2.5 border-b border-card-border/40 last:border-0">
                <div className="flex items-center gap-3 w-1/3 min-w-[180px]">
                  <Skeleton variant="circular" className="w-8 h-8 shrink-0" />
                  <div className="space-y-1.5 w-full">
                    <Skeleton className="h-3.5 w-3/4 rounded" />
                    <Skeleton className="h-2.5 w-1/2 rounded" />
                  </div>
                </div>
                <Skeleton className="h-6 w-24 rounded-md" />
                <Skeleton className="h-3.5 w-1/4 rounded hidden sm:block" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-8 w-16 rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-card-border rounded-2xl shadow-xs overflow-hidden">
            <DataTable
              data={reports}
              columns={columns}
              pageSize={10}
              emptyMessage="Belum ada laporan dari pengguna."
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-3 border-t border-card-border flex items-center justify-between text-xs text-on-surface-variant font-sans">
                <span>
                  Menampilkan halaman <strong className="text-on-surface">{page}</strong> dari{' '}
                  <strong className="text-on-surface">{totalPages}</strong> ({total} total laporan)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Detail Drawer */}
      {selectedReport && (
        <AdminDrawer
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          title="Detail Laporan Pengguna"
        >
          <div className="space-y-6 font-sans text-xs">
            {/* Header User Card */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-card-border flex items-center gap-3">
              {selectedReport.user.avatar_url ? (
                <img
                  src={selectedReport.user.avatar_url}
                  alt={selectedReport.user.nama_lengkap}
                  className="w-12 h-12 rounded-full object-cover border border-card-border"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base shrink-0">
                  {selectedReport.user.nama_lengkap.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="truncate">
                <h4 className="text-sm font-bold text-on-surface font-headline truncate">
                  {selectedReport.user.nama_lengkap}
                </h4>
                <p className="text-xs text-on-surface-variant truncate flex items-center gap-1.5 mt-0.5 font-mono">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  {selectedReport.user.email}
                </p>
                <p className="text-[11px] font-mono text-primary uppercase tracking-wider font-semibold mt-0.5">
                  Role: {selectedReport.user.role}
                </p>
              </div>
            </div>

            {/* Status & Category Info */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-card-border bg-surface-container-low">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-on-surface">
                  {selectedReport.kategori}
                </span>
              </div>
              <ReportStatusBadge status={selectedReport.status} />
            </div>

            {/* Calculate taskInfo if report is associated with a task */}
            {(() => {
              const taskInfo = selectedReport ? extractTaskFromReport(selectedReport.deskripsi, selectedReport.subjek) : null;

              return (
                <>
                  {/* If related to task, show prominent Task Link Card */}
                  {taskInfo && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex flex-col gap-2.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs font-headline">
                          <Briefcase className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Tugas Terkait yang Dilaporkan</span>
                        </div>
                        <span className="font-mono text-[10px] bg-amber-500/20 text-amber-800 px-2 py-0.5 rounded font-bold">
                          #{taskInfo.taskId.substring(0, 8)}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <p className="font-bold text-xs text-on-surface truncate">
                          {taskInfo.taskTitle}
                        </p>
                        <p className="text-[11px] font-mono text-on-surface-variant break-all mt-0.5" title={taskInfo.taskId}>
                          ID: {taskInfo.taskId}
                        </p>
                      </div>

                      <Link
                        href={`/admin/tasks?id=${taskInfo.taskId}&search=${encodeURIComponent(taskInfo.taskTitle !== 'Tugas Terkait' ? taskInfo.taskTitle : taskInfo.taskId)}`}
                        target="_blank"
                        className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary/90 transition-all shadow-xs mt-1"
                      >
                        <span>Buka Detail Tugas di Task Management</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}

                  {/* Subject & Description */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-on-surface-variant">
                        Subjek Laporan
                      </label>
                      <h3 className="text-sm font-bold text-on-surface mt-0.5">
                        {selectedReport.subjek}
                      </h3>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-on-surface-variant">
                        Detail Permasalahan
                      </label>
                      <div className="mt-1 p-3.5 rounded-xl bg-surface-container-low border border-card-border text-xs text-on-surface leading-relaxed">
                        {taskInfo && (
                          <div className="mb-2.5 pb-2.5 border-b border-card-border/70">
                            <Link
                              href={`/admin/tasks?id=${taskInfo.taskId}&search=${encodeURIComponent(taskInfo.taskTitle !== 'Tugas Terkait' ? taskInfo.taskTitle : taskInfo.taskId)}`}
                              target="_blank"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/15 text-amber-800 border border-amber-500/30 hover:bg-amber-500/25 transition-colors font-semibold text-[11px]"
                              title="Klik untuk membuka tugas di Task Management"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span>
                                Terkait Task:{' '}
                                <strong className="underline underline-offset-2">{taskInfo.taskTitle}</strong>{' '}
                                <span className="font-mono text-[10px] opacity-80">(ID: #{taskInfo.taskId.substring(0, 8)})</span>
                              </span>
                            </Link>
                          </div>
                        )}
                        <div className="whitespace-pre-wrap">
                          {taskInfo?.isExplicitTag
                            ? selectedReport.deskripsi.replace(/\[Terkait Task:\s*.*?\s*\(ID:\s*[a-f0-9\-]+\)\]\s*\n*/i, '')
                            : selectedReport.deskripsi}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-on-surface-variant">
                        Waktu Pelaporan
                      </label>
                      <p className="text-xs font-mono text-on-surface-variant mt-0.5 tabular-nums">
                        {new Date(selectedReport.created_at).toLocaleString('id-ID', {
                          dateStyle: 'full',
                          timeStyle: 'medium',
                        })}
                      </p>
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Admin Action Buttons */}
            <div className="pt-4 border-t border-card-border space-y-2">
              <p className="text-xs font-bold text-on-surface">Ubah Status Laporan:</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={actionLoading || selectedReport.status === 'reviewed'}
                  onClick={() => handleUpdateStatus('reviewed')}
                  icon={actionLoading ? undefined : <FileText className="w-3.5 h-3.5" />}
                >
                  {actionLoading ? '...' : 'Ditinjau'}
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={actionLoading || selectedReport.status === 'resolved'}
                  onClick={() => handleUpdateStatus('resolved')}
                  icon={actionLoading ? undefined : <ShieldCheck className="w-3.5 h-3.5" />}
                >
                  {actionLoading ? '...' : 'Selesai'}
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={actionLoading || selectedReport.status === 'rejected'}
                  onClick={() => handleUpdateStatus('rejected')}
                  icon={actionLoading ? undefined : <XCircle className="w-3.5 h-3.5" />}
                >
                  {actionLoading ? '...' : 'Tolak'}
                </Button>
              </div>
            </div>
          </div>
        </AdminDrawer>
      )}

      {/* Toast Notification */}
      {toast && <ToastNotif toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
