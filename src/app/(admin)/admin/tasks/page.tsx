'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminTopbar from '@/components/admin/AdminTopbar';
import DataTable, { Column } from '@/components/admin/DataTable';
import AdminDrawer from '@/components/admin/AdminDrawer';
import StatusBadge from '@/components/admin/StatusBadge';
import AdminModal from '@/components/admin/AdminModal';
import { Search, MapPin, Clock, CheckCircle, XCircle, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AdminTask {
  id: string;
  judul_tugas: string;
  deskripsi_tugas: string;
  kompensasi: number;
  estimasi_waktu?: string;
  created_at: string;
  status: string;
  kategori: string;
  kategori_icon?: string;
  applicants_count: number;
  requester: {
    id: string;
    nama_lengkap: string;
    email: string;
    avatar_url?: string;
  };
  worker_assigned?: {
    id: string;
    nama_lengkap: string;
    email: string;
  } | null;
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
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg text-xs font-medium font-sans ${
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

const STATUS_TABS = ['All', 'open', 'accepted', 'in_progress', 'completed', 'cancelled'];

export default function TaskManagementPage() {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedTask, setSelectedTask] = useState<AdminTask | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    action: 'takedown' | 'force-complete';
    task: AdminTask;
  } | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        status: statusFilter,
        page: String(page),
        limit: '10',
      });
      const res = await fetch(`/api/admin/tasks?${params}`);
      const json = await res.json();
      if (json.success) {
        setTasks(json.data);
        setTotalPages(json.meta.totalPages);
        setTotal(json.meta.total);
      }
    } catch (err) {
      console.error('Fetch tasks error:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, page]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchTasks();
  }, [page, statusFilter, searchTerm]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal) return;
    const { action, task } = confirmModal;
    setConfirmModal(null);
    setActionLoading(action + '-' + task.id);

    try {
      const endpoint =
        action === 'takedown'
          ? `/api/admin/tasks/${task.id}/takedown`
          : `/api/admin/tasks/${task.id}/force-complete`;

      const res = await fetch(endpoint, { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        showToast('success', data.message);
        setSelectedTask(null);
        fetchTasks(); // Refresh list
      } else {
        showToast('error', data.message);
      }
    } catch {
      showToast('error', 'Gagal menghubungi server.');
    } finally {
      setActionLoading(null);
    }
  };

  const columns: Column<AdminTask>[] = [
    {
      header: 'Task Title & Category',
      cell: (task) => (
        <div className="max-w-xs">
          <div className="font-bold text-[#111111] truncate" title={task.judul_tugas}>
            {task.judul_tugas}
          </div>
          <div className="text-[11px] text-[#787774]">{task.kategori}</div>
        </div>
      ),
    },
    {
      header: 'Requester',
      cell: (task) => (
        <div>
          <div className="text-xs font-bold text-[#111111]">{task.requester.nama_lengkap}</div>
          <div className="text-[11px] text-[#787774] font-mono">{task.requester.email}</div>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (task) => <StatusBadge status={task.status} />,
    },
    {
      header: 'Compensation',
      cell: (task) => (
        <span className="text-xs font-extrabold text-[#0F766E] font-mono">
          +{task.kompensasi} PTS
        </span>
      ),
    },
    {
      header: 'Applicants',
      cell: (task) => (
        <span className="text-xs font-medium text-[#2F3437]">
          {task.applicants_count} applicants
        </span>
      ),
    },
    {
      header: 'Created Date',
      cell: (task) => (
        <span className="text-xs text-[#787774]">
          {new Date(task.created_at).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <AdminTopbar title="Task Management" />

      <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Search & Status Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#EAEAEA]">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#787774]" />
            <input
              type="text"
              placeholder="Search task by title, category, or requester..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#F7F6F3] text-[#111111] placeholder-[#787774] rounded-md border border-[#EAEAEA] focus:border-[#111111] focus:bg-white outline-none transition-all"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {STATUS_TABS.map((st) => (
              <button
                key={st}
                onClick={() => { setStatusFilter(st); setPage(1); }}
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold capitalize transition-colors whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-[#111111] text-white'
                    : 'bg-[#F7F6F3] text-[#787774] hover:text-[#111111] hover:bg-[#EAEAEA]'
                }`}
              >
                {st === 'in_progress' ? 'In Progress' : st}
              </button>
            ))}
            <span className="ml-2 text-[11px] font-mono text-[#787774] shrink-0">
              {total} tasks
            </span>
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 flex justify-center">
            <div className="w-8 h-8 border-4 border-[#0F766E] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={tasks}
              onRowClick={(task) => setSelectedTask(task)}
              pageSize={10}
              emptyMessage="No micro-tasks found matching your filters"
            />
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[#E2E8F0] bg-white text-[#0C1F16] hover:bg-[#F8FAFC] disabled:opacity-40 transition-colors"
                >
                  ← Prev
                </button>
                <span className="text-xs font-mono text-[#64748B]">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[#E2E8F0] bg-white text-[#0C1F16] hover:bg-[#F8FAFC] disabled:opacity-40 transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}

        {/* Slide-over Task Detail Drawer */}
        <AdminDrawer
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          title="Task Details"
          subtitle={`Task ID: ${selectedTask?.id}`}
        >
          {selectedTask && (
            <div className="space-y-6 text-xs">
              {/* Header Title Card */}
              <div className="space-y-2 p-4 rounded-xl bg-[#FBFBFA] border border-[#EAEAEA]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#0F766E]">
                    {selectedTask.kategori}
                  </span>
                  <StatusBadge status={selectedTask.status} />
                </div>
                <h4 className="text-sm font-bold text-[#111111] font-sans leading-snug">
                  {selectedTask.judul_tugas}
                </h4>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-sm font-extrabold text-[#0F766E] font-mono">
                    +{selectedTask.kompensasi} PTS
                  </span>
                  {selectedTask.estimasi_waktu && (
                    <>
                      <span className="text-xs text-[#787774]">•</span>
                      <span className="text-xs text-[#787774] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Est. {selectedTask.estimasi_waktu}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Task Description */}
              <div className="space-y-1.5">
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#787774]">
                  Full Description
                </h5>
                <p className="text-xs text-[#2F3437] leading-relaxed bg-[#F7F6F3] p-3 rounded-md border border-[#EAEAEA]">
                  {selectedTask.deskripsi_tugas}
                </p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-md bg-[#FBFBFA] border border-[#EAEAEA]">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#787774]">Dibuat</span>
                  <p className="text-xs font-bold text-[#111111]">
                    {new Date(selectedTask.created_at).toLocaleDateString('id-ID', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="p-2.5 rounded-md bg-[#FBFBFA] border border-[#EAEAEA]">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#787774]">Applicants</span>
                  <p className="text-xs font-bold text-[#111111]">{selectedTask.applicants_count} orang</p>
                </div>
              </div>

              {/* People Involved */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Requester */}
                <div className="p-3 rounded-md bg-[#FBFBFA] border border-[#EAEAEA]">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#787774]">
                    Requester
                  </span>
                  <p className="text-xs font-bold text-[#111111]">
                    {selectedTask.requester.nama_lengkap}
                  </p>
                  <p className="text-[11px] text-[#787774] font-mono">{selectedTask.requester.email}</p>
                </div>

                {/* Worker Assigned */}
                <div className="p-3 rounded-md bg-[#FBFBFA] border border-[#EAEAEA]">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#787774]">
                    Worker Assigned
                  </span>
                  <p className="text-xs font-bold text-[#111111]">
                    {selectedTask.worker_assigned?.nama_lengkap || 'None assigned yet'}
                  </p>
                  {selectedTask.worker_assigned && (
                    <p className="text-[11px] text-[#787774] font-mono">
                      {selectedTask.worker_assigned.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Admin Governance Controls */}
              <div className="pt-4 border-t border-[#EAEAEA] space-y-2">
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#787774]">
                  Task Moderation Actions
                </h5>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      !['cancelled', 'completed'].includes(selectedTask.status) &&
                      setConfirmModal({ action: 'takedown', task: selectedTask })
                    }
                    disabled={
                      ['cancelled', 'completed'].includes(selectedTask.status) ||
                      actionLoading === 'takedown-' + selectedTask.id
                    }
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-md bg-[#FDEBEC] hover:bg-[#F8D2D4] text-[#9F2F2D] border border-[#F8D2D4]/60 transition-colors disabled:opacity-40"
                  >
                    {actionLoading === 'takedown-' + selectedTask.id ? (
                      <span className="w-3 h-3 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                    Take Down Task
                  </button>
                  <button
                    onClick={() =>
                      selectedTask.status !== 'completed' &&
                      selectedTask.status !== 'cancelled' &&
                      setConfirmModal({ action: 'force-complete', task: selectedTask })
                    }
                    disabled={
                      ['completed', 'cancelled'].includes(selectedTask.status) ||
                      actionLoading === 'force-complete-' + selectedTask.id
                    }
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-md bg-[#EDF3EC] hover:bg-[#D5E5D3] text-[#346538] border border-[#D5E5D3]/60 transition-colors disabled:opacity-40"
                  >
                    {actionLoading === 'force-complete-' + selectedTask.id ? (
                      <span className="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5" />
                    )}
                    Force Complete
                  </button>
                </div>
                {['cancelled', 'completed'].includes(selectedTask.status) && (
                  <p className="text-[10px] text-[#94A3B8] text-center">
                    Task ini sudah dalam status final ({selectedTask.status}).
                  </p>
                )}
              </div>
            </div>
          )}
        </AdminDrawer>

        {/* Confirmation Modal */}
        <AdminModal
          isOpen={!!confirmModal}
          onClose={() => setConfirmModal(null)}
          title={
            confirmModal?.action === 'takedown'
              ? 'Konfirmasi Take Down Task'
              : 'Konfirmasi Force Complete'
          }
          onConfirm={handleConfirmAction}
          confirmLabel={
            confirmModal?.action === 'takedown' ? 'Ya, Take Down' : 'Ya, Force Complete'
          }
          confirmVariant={confirmModal?.action === 'takedown' ? 'danger' : 'primary'}
        >
          <div
            className={`flex items-start gap-3 p-3 rounded-lg border text-xs font-sans ${
              confirmModal?.action === 'takedown'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-[#E6F4F1] border-[#0F766E]/20 text-[#0C4A45]'
            }`}
          >
            <AlertCircle
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                confirmModal?.action === 'takedown' ? 'text-rose-600' : 'text-[#0F766E]'
              }`}
            />
            <div>
              <p className="font-bold">
                {confirmModal?.action === 'takedown'
                  ? `Apakah kamu yakin ingin meng-takedown "${confirmModal?.task.judul_tugas}"?`
                  : `Apakah kamu yakin ingin force-complete "${confirmModal?.task.judul_tugas}"?`}
              </p>
              <p className="mt-1 text-[11px] opacity-90">
                {confirmModal?.action === 'takedown'
                  ? 'Task akan dibatalkan. Escrow akan dikembalikan ke requester dan notifikasi akan dikirim.'
                  : 'Task akan ditandai selesai. Kompensasi akan ditransfer ke worker (jika ada) dan notifikasi akan dikirim.'}
              </p>
            </div>
          </div>
        </AdminModal>
      </main>

      {/* Toast Notification */}
      {toast && <ToastNotif toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
