'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminTopbar from '@/components/admin/AdminTopbar';
import DataTable, { Column } from '@/components/admin/DataTable';
import AdminDrawer from '@/components/admin/AdminDrawer';
import KPICard from '@/components/admin/KPICard';
import {
  Flag,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  User as UserIcon,
  Mail,
  Phone,
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
          ? 'bg-[#E6F4F1] border-[#0F766E]/30 text-[#0F766E]'
          : 'bg-rose-50 border-rose-200 text-rose-700'
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
  let badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
  let label = 'PENDING';

  if (status === 'reviewed') {
    badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
    label = 'DITINJAU';
  } else if (status === 'resolved') {
    badgeStyle = 'bg-[#E6F4F1] text-[#0F766E] border-[#0F766E]/30';
    label = 'SELESAI';
  } else if (status === 'rejected') {
    badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
    label = 'DITOLAK';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${badgeStyle}`}
    >
      {label}
    </span>
  );
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
              className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-[#0F766E]/20"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#E6F4F1] text-[#0F766E] flex items-center justify-center font-bold text-xs shrink-0">
              {row.user.nama_lengkap.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="truncate">
            <p className="text-xs font-bold text-[#0C1F16] truncate">{row.user.nama_lengkap}</p>
            <p className="text-[11px] text-[#64748B] truncate">{row.user.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Kategori',
      cell: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#F1F5F9] text-[#0C1F16]">
          {row.kategori}
        </span>
      ),
    },
    {
      header: 'Subjek Laporan',
      cell: (row) => (
        <div className="max-w-xs truncate">
          <p className="text-xs font-bold text-[#0C1F16] truncate">{row.subjek}</p>
          <p className="text-[11px] text-[#64748B] truncate">{row.deskripsi}</p>
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
        <span className="font-mono text-xs text-[#64748B]">
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
        <button
          type="button"
          onClick={() => setSelectedReport(row)}
          className="px-3 py-1 text-xs font-bold text-[#0F766E] hover:bg-[#E6F4F1] rounded-lg transition-colors border border-[#0F766E]/20"
        >
          Lihat Detail
        </button>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <AdminTopbar title="Laporan & Aduan Pengguna" />

      <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto font-sans">
        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Laporan"
            value={stats.totalAll}
            change="semua laporan"
            isPositive={true}
            icon={<Flag className="w-4 h-4" />}
          />
          <KPICard
            title="Laporan Pending"
            value={stats.pending}
            change="perlu respon"
            isPositive={false}
            icon={<Clock className="w-4 h-4" />}
          />
          <KPICard
            title="Sedang Ditinjau"
            value={stats.reviewed}
            change="proses investigasi"
            isPositive={true}
            icon={<FileText className="w-4 h-4" />}
          />
          <KPICard
            title="Selesai Ditangani"
            value={stats.resolved}
            change="laporan tuntas"
            isPositive={true}
            icon={<ShieldCheck className="w-4 h-4" />}
          />
        </div>

        {/* Filter Bar & Search */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
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
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap ${
                  statusFilter === tab
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0C1F16]'
                }`}
              >
                {tab === 'All' ? 'Semua Status' : tab}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari subjek, deskripsi, atau nama..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F8FAFC] text-[#0C1F16] placeholder-[#94A3B8] rounded-lg border border-[#E2E8F0] focus:border-[#0F766E] outline-none transition-all"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-[#64748B] flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-[#0F766E] animate-spin" />
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
            <div className="px-5 py-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
              <span>
                Menampilkan halaman <strong className="text-[#0C1F16]">{page}</strong> dari{' '}
                <strong className="text-[#0C1F16]">{totalPages}</strong> ({total} total laporan)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] disabled:opacity-50 font-bold"
                >
                  Sebelumnya
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] disabled:opacity-50 font-bold"
                >
                  Selanjutnya
                </button>
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
          <div className="space-y-6 font-sans">
            {/* Header User Card */}
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-3">
              {selectedReport.user.avatar_url ? (
                <img
                  src={selectedReport.user.avatar_url}
                  alt={selectedReport.user.nama_lengkap}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-[#0F766E]/20"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#E6F4F1] text-[#0F766E] flex items-center justify-center font-bold text-base">
                  {selectedReport.user.nama_lengkap.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="truncate">
                <h4 className="text-sm font-bold text-[#0C1F16] truncate">
                  {selectedReport.user.nama_lengkap}
                </h4>
                <p className="text-xs text-[#64748B] truncate flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-[#0F766E]" />
                  {selectedReport.user.email}
                </p>
                <p className="text-[11px] font-mono text-[#0F766E] uppercase tracking-wider mt-0.5">
                  Role: {selectedReport.user.role}
                </p>
              </div>
            </div>

            {/* Status & Category Info */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-[#E2E8F0] bg-white">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#0F766E]" />
                <span className="text-xs font-bold text-[#0C1F16]">
                  {selectedReport.kategori}
                </span>
              </div>
              <ReportStatusBadge status={selectedReport.status} />
            </div>

            {/* Subject & Description */}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B]">
                  Subjek Laporan
                </label>
                <h3 className="text-sm font-bold text-[#0C1F16] mt-0.5">
                  {selectedReport.subjek}
                </h3>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B]">
                  Detail Permasalahan
                </label>
                <div className="mt-1 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0C1F16] leading-relaxed whitespace-pre-wrap">
                  {selectedReport.deskripsi}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B]">
                  Waktu Pelaporan
                </label>
                <p className="text-xs font-mono text-[#64748B] mt-0.5">
                  {new Date(selectedReport.created_at).toLocaleString('id-ID', {
                    dateStyle: 'full',
                    timeStyle: 'medium',
                  })}
                </p>
              </div>
            </div>

            {/* Admin Action Buttons */}
            <div className="pt-4 border-t border-[#E2E8F0] space-y-2">
              <p className="text-xs font-bold text-[#0C1F16]">Ubah Status Laporan:</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={actionLoading || selectedReport.status === 'reviewed'}
                  onClick={() => handleUpdateStatus('reviewed')}
                  className="py-2 px-3 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                  Ditinjau
                </button>

                <button
                  type="button"
                  disabled={actionLoading || selectedReport.status === 'resolved'}
                  onClick={() => handleUpdateStatus('resolved')}
                  className="py-2 px-3 rounded-xl text-xs font-bold bg-[#0F766E] text-white hover:bg-[#0D645E] shadow-xs transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  Selesai
                </button>

                <button
                  type="button"
                  disabled={actionLoading || selectedReport.status === 'rejected'}
                  onClick={() => handleUpdateStatus('rejected')}
                  className="py-2 px-3 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  Tolak
                </button>
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
