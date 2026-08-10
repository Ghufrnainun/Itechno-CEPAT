'use client';

import { Search, Bell } from 'lucide-react';

interface AdminTopbarProps {
  title?: string;
}

export default function AdminTopbar({ title = 'Dashboard' }: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-6 bg-white border-b border-[#E2E8F0]">
      {/* Title / Breadcrumb */}
      <div className="flex items-center gap-3">
        <h1 className="font-headline font-bold text-lg text-[#0C1F16] tracking-tight">
          {title}
        </h1>
        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-[#E6F4F1] text-[#0F766E] border border-[#0F766E]/20">
          Super Admin
        </span>
      </div>

      {/* Right Tools & Profile */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Cari task, user, atau kategori..."
            className="w-full pl-9 pr-3 py-1.5 text-xs font-sans bg-[#F8FAFC] text-[#0C1F16] placeholder-[#94A3B8] rounded-lg border border-[#E2E8F0] focus:border-[#0F766E] focus:bg-white outline-none transition-all"
          />
        </div>

        {/* Notifications */}
        <button
          type="button"
          className="relative p-2 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0C1F16] transition-colors"
          title="Notifikasi Admin"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#0F766E] ring-2 ring-white" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-[#E2E8F0]" />

        {/* Admin User Info */}
        <div className="flex items-center gap-2.5">
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"
            alt="Admin Profile"
            className="w-8 h-8 rounded-full object-cover ring-2 ring-[#0F766E]/20"
          />
          <div className="hidden lg:flex flex-col">
            <span className="font-sans font-bold text-xs text-[#0C1F16]">
              Admin ITechno
            </span>
            <span className="font-mono text-[10px] text-[#64748B]">
              admin@itechno.id
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
