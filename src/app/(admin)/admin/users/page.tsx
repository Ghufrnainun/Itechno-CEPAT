'use client';

import { useState } from 'react';
import AdminTopbar from '@/components/admin/AdminTopbar';
import DataTable, { Column } from '@/components/admin/DataTable';
import AdminDrawer from '@/components/admin/AdminDrawer';
import AdminSelect, { SelectOption } from '@/components/admin/AdminSelect';
import { MOCK_ADMIN_USERS, AdminUser } from '@/lib/admin/mock-data';
import { Search, Star, Ban, RotateCcw, Mail, Phone, MapPin } from 'lucide-react';

export default function UserManagementPage() {
  const [users, setUsers] = useState<AdminUser[]>(MOCK_ADMIN_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const roleOptions: SelectOption[] = [
    { value: 'All', label: 'All Roles' },
    { value: 'Worker', label: 'Worker Only' },
    { value: 'Requester', label: 'Requester Only' },
    { value: 'Dual-Role', label: 'Dual-Role' },
    { value: 'Admin', label: 'Admin Only' },
  ];

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'All' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const columns: Column<AdminUser>[] = [
    {
      header: 'User Info',
      cell: (user) => (
        <div className="flex items-center gap-3">
          <img
            src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
            alt={user.nama_lengkap}
            className="w-8 h-8 rounded-full object-cover border border-[#E2E8F0]"
          />
          <div>
            <div className="font-bold text-[#0C1F16] font-sans">{user.nama_lengkap}</div>
            <div className="text-[11px] font-mono text-[#64748B]">@{user.username}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Email',
      accessorKey: 'email',
      cell: (user) => <span className="text-xs font-mono text-[#0C1F16]">{user.email}</span>,
    },
    {
      header: 'Role',
      cell: (user) => {
        let badgeStyle = 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]';
        if (user.role === 'Worker') badgeStyle = 'bg-[#E6F4F1] text-[#0F766E] border border-[#0F766E]/20';
        if (user.role === 'Requester') badgeStyle = 'bg-sky-50 text-sky-700 border border-sky-200';
        if (user.role === 'Dual-Role') badgeStyle = 'bg-amber-50 text-amber-700 border border-amber-200';
        if (user.role === 'Admin') badgeStyle = 'bg-rose-50 text-rose-700 border border-rose-200';

        return (
          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${badgeStyle}`}>
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
      header: 'Joined Date',
      accessorKey: 'joined_at',
      cell: (user) => <span className="text-xs font-mono text-[#64748B]">{user.joined_at}</span>,
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

          {/* Polished Custom Role Dropdown */}
          <div className="w-full sm:w-48">
            <AdminSelect
              options={roleOptions}
              value={roleFilter}
              onChange={setRoleFilter}
            />
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredUsers}
          onRowClick={(user) => setSelectedUser(user)}
          pageSize={5}
          emptyMessage="Tidak ada user yang sesuai dengan pencarian"
        />

        {/* Slide-over User Detail Drawer */}
        <AdminDrawer
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title="Detail Profil Pengguna"
          subtitle={`ID: ${selectedUser?.id}`}
        >
          {selectedUser && (
            <div className="space-y-6 text-xs font-sans">
              {/* Header Card */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <img
                  src={selectedUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt={selectedUser.nama_lengkap}
                  className="w-12 h-12 rounded-full object-cover border border-[#E2E8F0]"
                />
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

              {/* Bio & Information */}
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

              {/* Bio snippet */}
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
                    {selectedUser.total_balance} PTS
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-700">
                    Escrow Ditahan
                  </span>
                  <p className="font-mono text-base font-extrabold text-amber-800">
                    {selectedUser.held_balance} PTS
                  </p>
                </div>
              </div>

              {/* Skills Tags */}
              {selectedUser.skills && selectedUser.skills.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                    Skills Terverifikasi
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUser.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md bg-[#F8FAFC] text-[11px] font-semibold text-[#0C1F16] border border-[#E2E8F0]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Admin Actions */}
              <div className="pt-4 border-t border-[#E2E8F0] space-y-2">
                <h5 className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                  Aksi Moderasi Admin
                </h5>
                <div className="flex gap-2">
                  <button
                    onClick={() => alert(`Link reset password dikirim ke ${selectedUser.email}`)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-[#F8FAFC] hover:bg-[#E2E8F0] text-[#0C1F16] transition-colors border border-[#E2E8F0]"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#64748B]" />
                    Reset Password
                  </button>
                  <button
                    onClick={() => alert(`User ${selectedUser.nama_lengkap} di-suspend.`)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    Suspend User
                  </button>
                </div>
              </div>
            </div>
          )}
        </AdminDrawer>
      </main>
    </div>
  );
}
