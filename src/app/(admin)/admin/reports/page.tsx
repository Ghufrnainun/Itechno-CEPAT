'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminTopbar from '@/components/admin/AdminTopbar';
import DataTable, { Column } from '@/components/admin/DataTable';
import AdminDrawer from '@/components/admin/AdminDrawer';
import KPICard from '@/components/admin/KPICard';
import StatusBadge from '@/components/admin/StatusBadge';
import { Button } from '@/components/ui/Button';
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
      cell: (row) => (
        <div className="max-w-xs truncate">
          <p className="text-xs font-bold text-on-surface truncate">{row.subjek}</p>
          <p className="text-[11px] text-on-surface-variant truncate">{row.deskripsi}</p>
        </div>
      ),
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
    <div className="flex-1 flex flex-col min-w-0 bg-surface font-sans">
      <AdminTopbar title="Laporan &amp; Aduan Pengguna" />

      <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto font-sans">
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
        <div className="bg-surface-container-lowest border border-card-border rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
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
              className="w-full pl-9 pr-3.5 py-2 text-xs font-sans bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/50 rounded-xl border border-card-border focus:border-primary focus:bg-surface-container-lowest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all shadow-xs"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-surface-container-lowest border border-card-border rounded-xl shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-on-surface-variant flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <span>Memuat data laporan pengguna...</span>
            </div>
          ) : (
            <DataTable
              data={reports}
              columns={columns}
              pageSize={10}
              emptyMessage="Belum ada laporan dari pengguna."
            />
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
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
                <div className="mt-1 p-3.5 rounded-xl bg-surface-container-low border border-card-border text-xs text-on-surface leading-relaxed whitespace-pre-wrap">
                  {selectedReport.deskripsi}
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
