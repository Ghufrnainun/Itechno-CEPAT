'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminTopbar from '@/components/admin/AdminTopbar';
import DataTable, { Column } from '@/components/admin/DataTable';
import AdminDrawer from '@/components/admin/AdminDrawer';
import StatusBadge from '@/components/admin/StatusBadge';
import AdminModal from '@/components/admin/AdminModal';
import { Search, Clock, CheckCircle, XCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger } from '@/components/motion/tabs';

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
          ? 'bg-primary/10 border-primary/30 text-primary'
          : 'bg-error-container/40 border-error/30 text-error'
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
      if (!res.ok) {
        setTasks([]);
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (json.success && Array.isArray(json.data)) {
        setTasks(json.data);
        setTotalPages(json.meta?.totalPages || 1);
        setTotal(json.meta?.total || 0);
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
  }, [page, statusFilter, searchTerm, fetchTasks]);

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
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        showToast('success', data.message);
        setSelectedTask(null);
        fetchTasks(); // Refresh list
      } else {
        showToast('error', data.message || 'Gagal memproses aksi.');
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
          <div className="font-bold text-on-surface truncate font-headline text-sm" title={task.judul_tugas}>
            {task.judul_tugas}
          </div>
          <div className="text-[11px] text-on-surface-variant font-medium">{task.kategori}</div>
        </div>
      ),
    },
    {
      header: 'Requester',
      cell: (task) => (
        <div>
          <div className="text-xs font-bold text-on-surface">{task.requester.nama_lengkap}</div>
          <div className="text-[11px] text-on-surface-variant font-mono">{task.requester.email}</div>
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
        <span className="text-xs font-extrabold text-primary font-mono tabular-nums">
          +{task.kompensasi} PTS
        </span>
      ),
    },
    {
      header: 'Applicants',
      cell: (task) => (
        <span className="text-xs font-medium text-on-surface tabular-nums">
          {task.applicants_count} applicants
        </span>
      ),
    },
    {
      header: 'Created Date',
      cell: (task) => (
        <span className="text-xs text-on-surface-variant">
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
    <div className="flex-1 flex flex-col min-w-0 bg-surface">
      <AdminTopbar title="Task Management" />

      <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto font-sans">
        {/* Search & Status Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-container-lowest p-4 rounded-xl border border-card-border shadow-xs">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Cari task berdasarkan judul, kategori, atau requester..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 min-h-[44px] text-base sm:text-xs bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/50 rounded-xl border border-card-border focus:border-primary focus:bg-surface-container-lowest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 transition-all shadow-xs"
            />
          </div>

          {/* Motion Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <Tabs
              value={statusFilter}
              onValueChange={(val) => { setStatusFilter(val); setPage(1); }}
              variant="segment"
            >
              <TabsList className="w-fit">
                {STATUS_TABS.map((st) => (
                  <TabsTrigger key={st} value={st} className="capitalize text-[11px] py-1 px-3">
                    {st === 'in_progress' ? 'In Progress' : st}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <span className="text-[11px] font-mono text-on-surface-variant shrink-0 tabular-nums">
              {total} tasks
            </span>
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="bg-surface-container-lowest border border-card-border rounded-xl p-8 flex justify-center shadow-xs">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={tasks}
              onRowClick={(task) => setSelectedTask(task)}
              pageSize={10}
              emptyMessage="Tidak ada tugas yang cocok dengan filter Anda."
            />
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
            <div className="space-y-6 text-xs font-sans">
              {/* Header Title Card */}
              <div className="space-y-2 p-4 rounded-xl bg-surface-container-low border border-card-border">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-primary font-mono uppercase tracking-wider">
                    {selectedTask.kategori}
                  </span>
                  <StatusBadge status={selectedTask.status} />
                </div>
                <h4 className="text-sm font-bold text-on-surface font-headline leading-snug">
                  {selectedTask.judul_tugas}
                </h4>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-sm font-extrabold text-primary font-mono tabular-nums">
                    +{selectedTask.kompensasi} PTS
                  </span>
                  {selectedTask.estimasi_waktu && (
                    <>
                      <span className="text-xs text-on-surface-variant">•</span>
                      <span className="text-xs text-on-surface-variant flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Est. {selectedTask.estimasi_waktu}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Task Description */}
              <div className="space-y-1.5">
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant select-none">
                  Full Description
                </h5>
                <p className="text-xs text-on-surface leading-relaxed bg-surface-container-low p-3.5 rounded-lg border border-card-border whitespace-pre-wrap">
                  {selectedTask.deskripsi_tugas}
                </p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg bg-surface-container-low border border-card-border">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">Dibuat</span>
                  <p className="text-xs font-bold text-on-surface mt-0.5">
                    {new Date(selectedTask.created_at).toLocaleDateString('id-ID', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-surface-container-low border border-card-border">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">Applicants</span>
                  <p className="text-xs font-bold text-on-surface mt-0.5 tabular-nums">{selectedTask.applicants_count} orang</p>
                </div>
              </div>

              {/* People Involved */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Requester */}
                <div className="p-3 rounded-lg bg-surface-container-low border border-card-border">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Requester
                  </span>
                  <p className="text-xs font-bold text-on-surface mt-0.5">
                    {selectedTask.requester.nama_lengkap}
                  </p>
                  <p className="text-[11px] text-on-surface-variant font-mono truncate">{selectedTask.requester.email}</p>
                </div>

                {/* Worker Assigned */}
                <div className="p-3 rounded-lg bg-surface-container-low border border-card-border">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Worker Assigned
                  </span>
                  <p className="text-xs font-bold text-on-surface mt-0.5">
                    {selectedTask.worker_assigned?.nama_lengkap || 'None assigned yet'}
                  </p>
                  {selectedTask.worker_assigned && (
                    <p className="text-[11px] text-on-surface-variant font-mono truncate">
                      {selectedTask.worker_assigned.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Admin Governance Controls */}
              <div className="pt-4 border-t border-card-border space-y-2">
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant select-none">
                  Task Moderation Actions
                </h5>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    fullWidth
                    onClick={() =>
                      !['cancelled', 'completed'].includes(selectedTask.status) &&
                      setConfirmModal({ action: 'takedown', task: selectedTask })
                    }
                    disabled={
                      ['cancelled', 'completed'].includes(selectedTask.status) ||
                      actionLoading === 'takedown-' + selectedTask.id
                    }
                    icon={actionLoading === 'takedown-' + selectedTask.id ? undefined : <XCircle className="w-3.5 h-3.5" />}
                  >
                    Take Down Task
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={() =>
                      selectedTask.status !== 'completed' &&
                      selectedTask.status !== 'cancelled' &&
                      setConfirmModal({ action: 'force-complete', task: selectedTask })
                    }
                    disabled={
                      ['completed', 'cancelled'].includes(selectedTask.status) ||
                      actionLoading === 'force-complete-' + selectedTask.id
                    }
                    icon={actionLoading === 'force-complete-' + selectedTask.id ? undefined : <CheckCircle className="w-3.5 h-3.5" />}
                  >
                    Force Complete
                  </Button>
                </div>
                {['cancelled', 'completed'].includes(selectedTask.status) && (
                  <p className="text-[10px] text-on-surface-variant text-center">
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
            className={`flex items-start gap-3 p-3.5 rounded-lg border text-xs font-sans ${
              confirmModal?.action === 'takedown'
                ? 'bg-error-container/40 border-error/25 text-error'
                : 'bg-primary/10 border-primary/25 text-primary'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                {confirmModal?.action === 'takedown'
                  ? `Apakah kamu yakin ingin meng-takedown "${confirmModal?.task.judul_tugas}"?`
                  : `Apakah kamu yakin ingin force-complete "${confirmModal?.task.judul_tugas}"?`}
              </p>
              <p className="mt-1 text-[11px] opacity-90 leading-relaxed">
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
