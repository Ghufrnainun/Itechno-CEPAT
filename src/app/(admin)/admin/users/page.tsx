'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import AdminTopbar from '@/components/admin/AdminTopbar';
import DataTable, { Column } from '@/components/admin/DataTable';
import AdminDrawer from '@/components/admin/AdminDrawer';
import AdminModal from '@/components/admin/AdminModal';
import AdminSelect, { SelectOption } from '@/components/admin/AdminSelect';
import { Search, Star, Ban, RotateCcw, Mail, Phone, MapPin, CheckCircle, AlertCircle, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

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
          ? 'bg-[#E6F4F1] border-[#0F766E]/30 text-[#0F766E]'
          : 'bg-rose-50 border-rose-200 text-rose-700'
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
  const [banDurationPreset, setBanDurationPreset] = useState('24'); // jam
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
      const json = await res.json();
      if (json.success) {
        setUsers(json.data);
        setTotalPages(json.meta.totalPages);
        setTotal(json.meta.total);

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
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message);
        setIsWarningModalOpen(false);
        setWarningMessage('');
      } else {
        showToast('error', data.message);
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
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message);
        setIsSuspendModalOpen(false);
        setBanReason('');
        fetchUsers();
      } else {
        showToast('error', data.message);
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
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message);
        setIsUnsuspendModalOpen(false);
        fetchUsers();
      } else {
        showToast('error', data.message);
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
      const data = await res.json();
      if (data.success) {
        showToast('success', `Link reset password dikirim ke ${user.email}`);
      } else {
        showToast('error', data.message);
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
              className="w-8 h-8 rounded-full object-cover border border-[#E2E8F0]"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#0F766E] text-white text-xs font-bold flex items-center justify-center shrink-0">
              {user.nama_lengkap.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#0C1F16] font-sans">{user.nama_lengkap}</span>
              {user.is_banned && (
                <span className={`px-1.5 py-0.2 text-[9px] font-mono font-bold rounded uppercase ${
                  user.ban_type === 'TEMPORARY'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}>
                  {user.ban_type === 'TEMPORARY' ? 'Banned (Temp)' : 'Banned (Perm)'}
                </span>
              )}
            </div>
            <div className="text-[11px] font-mono text-[#64748B]">@{user.username}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Email',
      cell: (user) => <span className="text-xs font-mono text-[#0C1F16]">{user.email}</span>,
    },
    {
      header: 'Role',
      cell: (user) => {
        const styles: Record<string, string> = {
          Worker: 'bg-[#E6F4F1] text-[#0F766E] border border-[#0F766E]/20',
          Requester: 'bg-sky-50 text-sky-700 border border-sky-200',
          Admin: 'bg-rose-50 text-rose-700 border border-rose-200',
        };
        const style = styles[user.role] ?? 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]';
        return (
          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${style}`}>
            {user.role}
          </span>
        );
      },
    },
    {
      header: 'Rating',
      cell: (user) => (
        <div className="flex items-center gap-1 text-xs font-bold text-[#0C1F16] font-sans">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{user.rating_avg.toFixed(1)}</span>
        </div>
      ),
    },
    {
      header: 'Completed',
      cell: (user) => (
        <span className="text-xs font-medium text-[#0C1F16] font-sans">
          {user.total_completed} Tasks
        </span>
      ),
    },
    {
      header: 'Balance',
      cell: (user) => (
        <span className="text-xs font-extrabold text-[#0F766E] font-mono">
          {user.total_balance.toLocaleString('id-ID')} PTS
        </span>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 font-sans">
      <AdminTopbar title="User Management" />

      <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <input
              type="text"
              placeholder="Cari user (nama, email, username)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-sans bg-[#F8FAFC] text-[#0C1F16] placeholder-[#94A3B8] rounded-lg border border-[#E2E8F0] focus:border-[#0F766E] focus:bg-white outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-full sm:w-48">
              <AdminSelect options={roleOptions} value={roleFilter} onChange={setRoleFilter} />
            </div>
            <span className="text-xs text-[#64748B] font-mono shrink-0">
              {total} users
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
              data={users}
              onRowClick={(user) => setSelectedUser(user)}
              pageSize={10}
              emptyMessage="Tidak ada user yang sesuai dengan pencarian"
            />
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[#E2E8F0] bg-white text-[#0C1F16] hover:bg-[#F8FAFC] disabled:opacity-40 transition-colors cursor-pointer"
                >
                  ← Prev
                </button>
                <span className="text-xs font-mono text-[#64748B]">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[#E2E8F0] bg-white text-[#0C1F16] hover:bg-[#F8FAFC] disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Next →
                </button>
              </div>
            )}
          </>
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
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      Status: {selectedUser.ban_type === 'TEMPORARY' ? 'Temporary Ban' : 'Permanent Ban'}
                    </span>
                    {selectedUser.ban_type === 'TEMPORARY' && selectedUser.banned_until && (
                      <span className="text-[10px] font-mono font-normal">
                        s/d {new Date(selectedUser.banned_until).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] bg-white p-2 rounded border border-rose-200 italic">
                    Alasan: "{selectedUser.ban_reason}"
                  </p>
                </div>
              )}

              {/* Header Card */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                {selectedUser.avatar_url ? (
                  <Image
                    src={selectedUser.avatar_url}
                    alt={selectedUser.nama_lengkap}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover border border-[#E2E8F0]"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#0F766E] text-white text-lg font-bold flex items-center justify-center shrink-0">
                    {selectedUser.nama_lengkap.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="font-headline font-bold text-sm text-[#0C1F16]">
                    {selectedUser.nama_lengkap}
                  </h4>
                  <p className="font-mono text-[11px] text-[#64748B]">
                    @{selectedUser.username} • {selectedUser.role}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-xs font-bold text-amber-600">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{selectedUser.rating_avg.toFixed(1)} / 5.0 Rating</span>
                  </div>
                </div>
              </div>

              {/* Contact & Location */}
              <div className="space-y-3">
                <h5 className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                  Kontak & Lokasi
                </h5>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2.5 text-[#0C1F16]">
                    <Mail className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                    <span className="font-mono">{selectedUser.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#0C1F16]">
                    <Phone className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                    <span>{selectedUser.no_telpon || 'Belum diisi'}</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-[#0C1F16]">
                    <MapPin className="w-3.5 h-3.5 text-[#64748B] shrink-0 mt-0.5" />
                    <span>{selectedUser.alamat || 'Alamat belum disimpan'}</span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {selectedUser.bio && (
                <div className="space-y-1.5">
                  <h5 className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Bio</h5>
                  <p className="text-xs text-[#0C1F16] bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0] italic leading-relaxed">
                    "{selectedUser.bio}"
                  </p>
                </div>
              )}

              {/* Balances & Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[#E6F4F1] border border-[#0F766E]/20">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#0F766E]">
                    Total Poin
                  </span>
                  <p className="font-mono text-base font-extrabold text-[#0F766E]">
                    {selectedUser.total_balance.toLocaleString('id-ID')} PTS
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-700">
                    Escrow Ditahan
                  </span>
                  <p className="font-mono text-base font-extrabold text-amber-800">
                    {selectedUser.held_balance.toLocaleString('id-ID')} PTS
                  </p>
                </div>
              </div>

              {/* Quick Admin Governance Actions */}
              <div className="pt-4 border-t border-[#E2E8F0] space-y-3">
                <h5 className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                  Aksi Moderasi Admin
                </h5>

                {selectedUser.role === 'Admin' ? (
                  <p className="text-[10px] text-[#94A3B8] text-center">
                    Aksi moderasi tidak tersedia untuk akun Admin.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      {/* Tombol Warning */}
                      <button
                        onClick={() => setIsWarningModalOpen(true)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Kirim Peringatan
                      </button>

                      {/* Tombol Reset Password */}
                      <button
                        onClick={() => handleResetPassword(selectedUser)}
                        disabled={actionLoading === 'reset-' + selectedUser.id}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-[#F8FAFC] hover:bg-[#E2E8F0] text-[#0C1F16] transition-colors border border-[#E2E8F0] disabled:opacity-40 cursor-pointer"
                      >
                        {actionLoading === 'reset-' + selectedUser.id ? (
                          <span className="w-3 h-3 border-2 border-[#64748B] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5 text-[#64748B]" />
                        )}
                        Reset Password
                      </button>
                    </div>

                    {/* Tombol Suspend atau Unban */}
                    {selectedUser.is_banned ? (
                      <button
                        onClick={() => setIsUnsuspendModalOpen(true)}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-[#E6F4F1] hover:bg-[#BDE3DC] text-[#0F766E] border border-[#0F766E]/30 transition-colors cursor-pointer shadow-2xs"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Cabut Penangguhan (Unban User)
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsSuspendModalOpen(true)}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        Penangguhan Akun (Suspend/Ban)
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </AdminDrawer>

        {/* Modal 1: Kirim Peringatan (Warning) */}
        <AdminModal
          isOpen={isWarningModalOpen}
          onClose={() => setIsWarningModalOpen(false)}
          title="Kirim Pesan Peringatan (Warning)"
          onConfirm={handleSendWarning}
          confirmLabel={actionLoading === 'warning' ? 'Mengirim...' : 'Kirim Notifikasi Peringatan'}
          confirmVariant="primary"
        >
          <div className="space-y-4 text-xs font-sans">
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Pesan ini akan langsung dikirimkan ke kotak <strong>Notifikasi User</strong> sebagai peringatan dari platform CEPAT. Akun user tidak akan di-suspend.
              </span>
            </div>

            <div>
              <label className="block font-bold text-[#0C1F16] mb-1.5">
                Isi Pesan Peringatan Admin <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={warningMessage}
                onChange={(e) => setWarningMessage(e.target.value)}
                placeholder="misal: Harap perhatikan norma kesopanan saat berkomunikasi dengan pengguna lain..."
                className="w-full p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0C1F16] placeholder-[#94A3B8] outline-none focus:border-[#0F766E] focus:bg-white transition-all"
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
              <label className="block font-bold text-[#0C1F16] mb-2">
                Kategori Penangguhan
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBanType('TEMPORARY')}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    banType === 'TEMPORARY'
                      ? 'border-amber-400 bg-amber-50/60 ring-2 ring-amber-400/20'
                      : 'border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#F1F5F9]'
                  }`}
                >
                  <span className="font-bold text-[#0C1F16]">Temporary Ban</span>
                  <span className="text-[10px] text-[#64748B]">Batas waktu tertentu (jam/hari)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBanType('PERMANENT')}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    banType === 'PERMANENT'
                      ? 'border-rose-400 bg-rose-50/60 ring-2 ring-rose-400/20'
                      : 'border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#F1F5F9]'
                  }`}
                >
                  <span className="font-bold text-rose-700">Permanent Ban</span>
                  <span className="text-[10px] text-[#64748B]">Tanpa batasan waktu</span>
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
                    <label className="block text-[11px] font-bold text-[#64748B] mb-1">
                      Jumlah Jam
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={customBanHours}
                      onChange={(e) => setCustomBanHours(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0C1F16] outline-none focus:border-[#0F766E]"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Input Alasan Ban */}
            <div>
              <label className="block font-bold text-[#0C1F16] mb-1.5">
                Alasan Penangguhan Akun <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Alasan ini akan ditampilkan di popup modal saat user mencoba login..."
                className="w-full p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#0C1F16] placeholder-[#94A3B8] outline-none focus:border-rose-500 focus:bg-white transition-all"
              />
              <p className="text-[10px] text-[#64748B] mt-1">
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
          <div className="flex items-start gap-3 p-3.5 bg-[#E6F4F1] rounded-xl border border-[#0F766E]/20 text-xs text-[#0C4A45] font-sans">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-[#0F766E] mt-0.5" />
            <div>
              <p className="font-bold">Apakah kamu yakin ingin mengaktifkan kembali akun "{selectedUser?.nama_lengkap}"?</p>
              <p className="mt-1 text-[11px] opacity-90">
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
