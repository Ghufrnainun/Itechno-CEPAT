'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import AdminTopbar from '@/components/admin/AdminTopbar';
import DataTable, { Column } from '@/components/admin/DataTable';
import AdminDrawer from '@/components/admin/AdminDrawer';
import AdminModal from '@/components/admin/AdminModal';
import AdminSelect, { SelectOption } from '@/components/admin/AdminSelect';
import { Search, Star, Ban, RotateCcw, Mail, Phone, MapPin, CheckCircle, AlertCircle, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

interface AdminUser {
  id: string;
  nama_lengkap: string;
  username: string;
  email: string;
  avatar_url?: string;
  no_telpon?: string;
  alamat?: string;
  bio?: string;
  rating_avg: number;
  total_completed: number;
  total_balance: number;
  held_balance: number;
  auth_id?: string;
  is_banned?: boolean;
  ban_type?: 'TEMPORARY' | 'PERMANENT' | null;
  ban_reason?: string | null;
  banned_at?: string | null;
  banned_until?: string | null;
  role: string;
  skills: string[];
  total_tasks_posted: number;
  total_applications: number;
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
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg text-xs font-medium font-sans transition-all animate-in slide-in-from-bottom-4 ${
        toast.type === 'success'
          ? 'bg-primary/10 border-primary/30 text-primary'
          : 'bg-error-container/40 border-error/30 text-error'
      }`}
    >
      {toast.type === 'success' ? (
        <CheckCircle className="w-4 h-4 shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 shrink-0" />
      )}
      <span>{toast.message}</span>
    </div>
  );
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchFromUrl = new URLSearchParams(window.location.search).get('search');
      if (searchFromUrl) {
        setSearchTerm(searchFromUrl);
      }
    }
  }, []);

  // Modals state
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [banType, setBanType] = useState<'TEMPORARY' | 'PERMANENT'>('TEMPORARY');
  const [banDurationPreset, setBanDurationPreset] = useState('24');
  const [customBanHours, setCustomBanHours] = useState('24');
  const [banReason, setBanReason] = useState('');

  const [isUnsuspendModalOpen, setIsUnsuspendModalOpen] = useState(false);

  const roleOptions: SelectOption[] = [
    { value: 'All', label: 'All Roles' },
    { value: 'Worker', label: 'Worker Only' },
    { value: 'Requester', label: 'Requester Only' },
    { value: 'Admin', label: 'Admin Only' },
  ];

  const durationOptions: SelectOption[] = [
    { value: '24', label: '1 Hari (24 Jam)' },
    { value: '72', label: '3 Hari (72 Jam)' },
    { value: '168', label: '7 Hari (168 Jam)' },
    { value: '336', label: '14 Hari (336 Jam)' },
    { value: '720', label: '30 Hari (720 Jam)' },
    { value: 'custom', label: 'Custom Jam' },
  ];

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        role: roleFilter,
        page: String(page),
        limit: '10',
      });
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) {
        setUsers([]);
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (json.success && Array.isArray(json.data)) {
        setUsers(json.data);
        setTotalPages(json.meta?.totalPages || 1);
        setTotal(json.meta?.total || 0);

        // Update selectedUser if currently open in drawer
        setSelectedUser((prev) => {
          if (!prev) return null;
          const updated = json.data.find((u: AdminUser) => u.id === prev.id);
          return updated || prev;
        });
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, roleFilter, page]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      setPage(1);
      fetchUsers();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  };

  // Warning Handler
  const handleSendWarning = async () => {
    if (!selectedUser || !warningMessage.trim()) return;
    setActionLoading('warning');
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/warning`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: warningMessage }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        showToast('success', data.message);
        setIsWarningModalOpen(false);
        setWarningMessage('');
      } else {
        showToast('error', data.message || 'Gagal mengirim peringatan.');
      }
    } catch {
      showToast('error', 'Gagal menghubungi server.');
    } finally {
      setActionLoading(null);
    }
  };

  // Suspend Handler
  const handleSuspendSubmit = async () => {
    if (!selectedUser || !banReason.trim()) return;
    setActionLoading('suspend');

    let durationHours = 24;
    if (banType === 'TEMPORARY') {
      durationHours = banDurationPreset === 'custom'
        ? Math.max(1, parseInt(customBanHours) || 24)
        : parseInt(banDurationPreset);
    }

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: banType,
          duration_hours: durationHours,
          reason: banReason,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        showToast('success', data.message);
        setIsSuspendModalOpen(false);
        setBanReason('');
        fetchUsers();
      } else {
        showToast('error', data.message || 'Gagal menangguhkan akun.');
      }
    } catch {
      showToast('error', 'Gagal menghubungi server.');
    } finally {
      setActionLoading(null);
    }
  };

  // Unsuspend Handler
  const handleUnsuspendSubmit = async () => {
    if (!selectedUser) return;
    setActionLoading('unsuspend');
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/unsuspend`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        showToast('success', data.message);
        setIsUnsuspendModalOpen(false);
        fetchUsers();
      } else {
        showToast('error', data.message || 'Gagal mencabut penangguhan.');
      }
    } catch {
      showToast('error', 'Gagal menghubungi server.');
    } finally {
      setActionLoading(null);
    }
  };

  // Reset Password Handler
  const handleResetPassword = async (user: AdminUser) => {
    setActionLoading('reset-' + user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        showToast('success', `Link reset password dikirim ke ${user.email}`);
      } else {
        showToast('error', data.message || 'Gagal mereset password.');
      }
    } catch {
      showToast('error', 'Gagal menghubungi server.');
    } finally {
      setActionLoading(null);
    }
  };

  const columns: Column<AdminUser>[] = [
    {
      header: 'User Info',
      cell: (user) => (
        <div className="flex items-center gap-3">
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt={user.nama_lengkap}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover border border-card-border"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center shrink-0">
              {user.nama_lengkap.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-on-surface font-headline text-sm">{user.nama_lengkap}</span>
              {user.is_banned && (
                <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded-full uppercase ${
                  user.ban_type === 'TEMPORARY'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-error-container text-error border border-error/30'
                }`}>
                  {user.ban_type === 'TEMPORARY' ? 'Banned (Temp)' : 'Banned (Perm)'}
                </span>
              )}
            </div>
            <div className="text-[11px] font-mono text-on-surface-variant">@{user.username}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Email',
      cell: (user) => <span className="text-xs font-mono text-on-surface">{user.email}</span>,
    },
    {
      header: 'Role',
      cell: (user) => {
        const styles: Record<string, string> = {
          Worker: 'bg-primary/10 text-primary border border-primary/20',
          Requester: 'bg-sky-50 text-sky-700 border border-sky-200',
          Admin: 'bg-error-container/40 text-error border border-error/25',
        };
        const style = styles[user.role] ?? 'bg-surface-container text-on-surface-variant border border-card-border';
        return (
          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${style}`}>
            {user.role}
          </span>
        );
      },
    },
    {
      header: 'Rating',
      cell: (user) => (
        <div className="flex items-center gap-1 text-xs font-bold text-on-surface font-sans">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="tabular-nums font-mono">{user.rating_avg.toFixed(1)}</span>
        </div>
      ),
    },
    {
      header: 'Completed',
      cell: (user) => (
        <span className="text-xs font-medium text-on-surface font-sans tabular-nums">
          {user.total_completed} Tasks
        </span>
      ),
    },
    {
      header: 'Balance',
      cell: (user) => (
        <span className="text-xs font-extrabold text-primary font-mono tabular-nums">
          {user.total_balance.toLocaleString('id-ID')} PTS
        </span>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 font-sans">
      <AdminTopbar title="User Management" />

      <main className="flex-1 px-4 sm:px-8 py-8 lg:py-12 space-y-8 max-w-[1400px] w-full mx-auto">
        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-card-border shadow-xs">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Cari user (nama, email, username)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 min-h-[40px] text-xs font-sans bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/50 rounded-xl border border-card-border focus:border-primary focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-full sm:w-48">
              <AdminSelect options={roleOptions} value={roleFilter} onChange={setRoleFilter} />
            </div>
            <span className="text-xs text-on-surface-variant font-mono shrink-0 tabular-nums">
              {total} users
            </span>
          </div>
        </div>

        {/* Data Table / Loading Skeleton */}
        {loading ? (
          <div className="bg-white border border-card-border rounded-2xl p-6 shadow-xs space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4 py-2.5 border-b border-card-border/40 last:border-0">
                <div className="flex items-center gap-3 w-1/3 min-w-[180px]">
                  <Skeleton variant="circular" className="w-8 h-8 shrink-0" />
                  <div className="space-y-1.5 w-full">
                    <Skeleton className="h-3.5 w-3/4 rounded" />
                    <Skeleton className="h-2.5 w-1/2 rounded" />
                  </div>
                </div>
                <Skeleton className="h-3.5 w-1/4 rounded hidden sm:block" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-3.5 w-20 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={users}
            onRowClick={(user) => setSelectedUser(user)}
            pageSize={10}
            emptyMessage="Tidak ada user yang sesuai dengan pencarian"
          />
        )}

        {/* Slide-over User Detail Drawer */}
        <AdminDrawer
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title="Detail Profil Pengguna"
          subtitle={`ID: ${selectedUser?.id}`}
        >
          {selectedUser && (
            <div className="space-y-6 text-xs font-sans">
              {/* Ban Banner if user is banned */}
              {selectedUser.is_banned && (
                <div className="p-3.5 rounded-xl bg-error-container/40 border border-error/25 text-error space-y-2">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4" />
                      Status: {selectedUser.ban_type === 'TEMPORARY' ? 'Temporary Ban' : 'Permanent Ban'}
                    </span>
                    {selectedUser.ban_type === 'TEMPORARY' && selectedUser.banned_until && (
                      <span className="text-[10px] font-mono font-normal">
                        s/d {new Date(selectedUser.banned_until).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] bg-surface-container-lowest p-2 rounded-lg border border-error/20 italic">
                    Alasan: "{selectedUser.ban_reason}"
                  </p>
                </div>
              )}

              {/* Header Card */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low border border-card-border">
                {selectedUser.avatar_url ? (
                  <Image
                    src={selectedUser.avatar_url}
                    alt={selectedUser.nama_lengkap}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover border border-card-border"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary text-on-primary text-lg font-bold flex items-center justify-center shrink-0">
                    {selectedUser.nama_lengkap.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="font-headline font-bold text-sm text-on-surface">
                    {selectedUser.nama_lengkap}
                  </h4>
                  <p className="font-mono text-[11px] text-on-surface-variant">
                    @{selectedUser.username} • {selectedUser.role}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-xs font-bold text-amber-600">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-mono tabular-nums">{selectedUser.rating_avg.toFixed(1)} / 5.0 Rating</span>
                  </div>
                </div>
              </div>

              {/* Contact & Location */}
              <div className="space-y-3">
                <h5 className="font-mono text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Kontak &amp; Lokasi
                </h5>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2.5 text-on-surface">
                    <Mail className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
                    <span className="font-mono">{selectedUser.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-on-surface">
                    <Phone className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
                    <span>{selectedUser.no_telpon || 'Belum diisi'}</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-on-surface">
                    <MapPin className="w-3.5 h-3.5 text-on-surface-variant shrink-0 mt-0.5" />
                    <span>{selectedUser.alamat || 'Alamat belum disimpan'}</span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {selectedUser.bio && (
                <div className="space-y-1.5">
                  <h5 className="font-mono text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Bio</h5>
                  <p className="text-xs text-on-surface bg-surface-container-low p-3.5 rounded-lg border border-card-border italic leading-relaxed">
                    "{selectedUser.bio}"
                  </p>
                </div>
              )}

              {/* Balances & Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg bg-primary/10 border border-primary/20">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                    Total Poin
                  </span>
                  <p className="font-mono text-base font-extrabold text-primary tabular-nums mt-0.5">
                    {selectedUser.total_balance.toLocaleString('id-ID')} PTS
                  </p>
                </div>
                <div className="p-3.5 rounded-lg bg-tertiary-container/40 border border-tertiary/25">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-tertiary">
                    Escrow Ditahan
                  </span>
                  <p className="font-mono text-base font-extrabold text-tertiary tabular-nums mt-0.5">
                    {selectedUser.held_balance.toLocaleString('id-ID')} PTS
                  </p>
                </div>
              </div>

              {/* Quick Admin Governance Actions */}
              <div className="pt-4 border-t border-card-border space-y-3">
                <h5 className="font-mono text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Aksi Moderasi Admin
                </h5>

                {selectedUser.role === 'Admin' ? (
                  <p className="text-[10px] text-on-surface-variant text-center">
                    Aksi moderasi tidak tersedia untuk akun Admin.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      {/* Tombol Warning */}
                      <Button
                        variant="secondary"
                        size="sm"
                        fullWidth
                        onClick={() => setIsWarningModalOpen(true)}
                        icon={<AlertTriangle className="w-3.5 h-3.5 text-tertiary" />}
                      >
                        Kirim Peringatan
                      </Button>

                      {/* Tombol Reset Password */}
                      <Button
                        variant="secondary"
                        size="sm"
                        fullWidth
                        onClick={() => handleResetPassword(selectedUser)}
                        disabled={actionLoading === 'reset-' + selectedUser.id}
                        icon={actionLoading === 'reset-' + selectedUser.id ? undefined : <RotateCcw className="w-3.5 h-3.5" />}
                      >
                        {actionLoading === 'reset-' + selectedUser.id ? 'Memproses...' : 'Reset Password'}
                      </Button>
                    </div>

                    {/* Tombol Suspend atau Unban */}
                    {selectedUser.is_banned ? (
                      <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        onClick={() => setIsUnsuspendModalOpen(true)}
                        icon={<CheckCircle2 className="w-4 h-4" />}
                      >
                        Cabut Penangguhan (Unban User)
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        fullWidth
                        onClick={() => setIsSuspendModalOpen(true)}
                        icon={<Ban className="w-3.5 h-3.5" />}
                      >
                        Penangguhan Akun (Suspend/Ban)
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </AdminDrawer>

        {/* Modal 1: Kirim Pesan Peringatan (Warning) */}
        <AdminModal
          isOpen={isWarningModalOpen}
          onClose={() => setIsWarningModalOpen(false)}
          title="Kirim Pesan Peringatan (Warning)"
          onConfirm={handleSendWarning}
          confirmLabel={actionLoading === 'warning' ? 'Mengirim...' : 'Kirim Notifikasi Peringatan'}
          confirmVariant="primary"
        >
          <div className="space-y-4 text-xs font-sans">
            <div className="p-3.5 rounded-lg bg-tertiary-container/30 border border-tertiary/25 text-tertiary flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                Pesan ini akan langsung dikirimkan ke kotak <strong>Notifikasi User</strong> sebagai peringatan resmi dari platform CEPAT.
              </span>
            </div>

            <div>
              <label className="block font-bold text-on-surface mb-1.5">
                Isi Pesan Peringatan Admin <span className="text-error">*</span>
              </label>
              <textarea
                rows={3}
                value={warningMessage}
                onChange={(e) => setWarningMessage(e.target.value)}
                placeholder="misal: Harap perhatikan norma kesopanan saat berkomunikasi dengan pengguna lain..."
                className="w-full p-3 bg-surface-container-low border border-card-border rounded-xl text-base sm:text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:bg-surface-container-lowest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 transition-all"
              />
            </div>
          </div>
        </AdminModal>

        {/* Modal 2: Suspend / Ban User (Temp or Permanent) */}
        <AdminModal
          isOpen={isSuspendModalOpen}
          onClose={() => setIsSuspendModalOpen(false)}
          title={`Penangguhan Akun ${selectedUser?.nama_lengkap}`}
          onConfirm={handleSuspendSubmit}
          confirmLabel={actionLoading === 'suspend' ? 'Memproses...' : 'Terapkan Penangguhan'}
          confirmVariant="danger"
        >
          <div className="space-y-4 text-xs font-sans">
            {/* Pilihan Jenis Ban */}
            <div>
              <label className="block font-bold text-on-surface mb-2">
                Kategori Penangguhan
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBanType('TEMPORARY')}
                  className={`p-3.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    banType === 'TEMPORARY'
                      ? 'border-tertiary bg-tertiary-container/30 ring-2 ring-tertiary/20'
                      : 'border-card-border bg-surface-container-low hover:bg-surface-container'
                  }`}
                >
                  <span className="font-bold text-on-surface">Temporary Ban</span>
                  <span className="text-[10px] text-on-surface-variant">Batas waktu tertentu (jam/hari)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBanType('PERMANENT')}
                  className={`p-3.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    banType === 'PERMANENT'
                      ? 'border-error bg-error-container/40 ring-2 ring-error/20'
                      : 'border-card-border bg-surface-container-low hover:bg-surface-container'
                  }`}
                >
                  <span className="font-bold text-error">Permanent Ban</span>
                  <span className="text-[10px] text-on-surface-variant">Tanpa batasan waktu</span>
                </button>
              </div>
            </div>

            {/* Pilihan Durasi (Khusus Temporary Ban) */}
            {banType === 'TEMPORARY' && (
              <div>
                <AdminSelect
                  label="Durasi Penangguhan"
                  options={durationOptions}
                  value={banDurationPreset}
                  onChange={setBanDurationPreset}
                />

                {banDurationPreset === 'custom' && (
                  <div className="mt-2">
                    <label className="block text-[11px] font-bold text-on-surface-variant mb-1 font-mono">
                      Jumlah Jam
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={customBanHours}
                      onChange={(e) => setCustomBanHours(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 bg-surface-container-low border border-card-border rounded-xl text-base sm:text-xs text-on-surface focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Input Alasan Ban */}
            <div>
              <label className="block font-bold text-on-surface mb-1.5">
                Alasan Penangguhan Akun <span className="text-error">*</span>
              </label>
              <textarea
                rows={3}
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Alasan ini akan ditampilkan di popup modal saat user mencoba login..."
                className="w-full p-3 bg-surface-container-low border border-card-border rounded-xl text-base sm:text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:border-error focus:bg-surface-container-lowest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/25 transition-all"
              />
              <p className="text-[10px] text-on-surface-variant mt-1">
                Catatan: Alasan ini tidak masuk ke notifikasi user, melainkan muncul saat user login.
              </p>
            </div>
          </div>
        </AdminModal>

        {/* Modal 3: Unsuspend / Cabut Ban User */}
        <AdminModal
          isOpen={isUnsuspendModalOpen}
          onClose={() => setIsUnsuspendModalOpen(false)}
          title="Cabut Penangguhan Akun"
          onConfirm={handleUnsuspendSubmit}
          confirmLabel={actionLoading === 'unsuspend' ? 'Memproses...' : 'Ya, Cabut Ban User'}
          confirmVariant="primary"
        >
          <div className="flex items-start gap-3 p-3.5 bg-primary/10 rounded-xl border border-primary/25 text-xs text-primary font-sans">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Apakah kamu yakin ingin mengaktifkan kembali akun "{selectedUser?.nama_lengkap}"?</p>
              <p className="mt-1 text-[11px] opacity-90 leading-relaxed">
                Akses login user akan dibuka kembali dan batasan akun akan dicabut di seluruh platform.
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
