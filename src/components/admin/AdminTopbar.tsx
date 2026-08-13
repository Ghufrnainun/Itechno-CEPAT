'use client';

import { Search, Bell } from 'lucide-react';

interface AdminTopbarProps {
  title?: string;
}

export default function AdminTopbar({ title = 'Dashboard' }: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-6 bg-surface-container-lowest border-b border-card-border">
      {/* Title / Breadcrumb */}
      <div className="flex items-center gap-3">
        <h1 className="font-headline font-bold text-lg text-on-surface tracking-tight">
          {title}
        </h1>
        <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20">
          Super Admin
        </span>
      </div>

      {/* Right Tools & Profile */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Cari task, user, atau kategori..."
            className="w-full pl-9 pr-3.5 py-2.5 min-h-[40px] text-xs font-sans bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/50 rounded-xl border border-card-border focus:border-primary focus:bg-surface-container-lowest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 transition-all shadow-xs"
          />
        </div>

        {/* Notifications */}
        <button
          type="button"
          className="relative p-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer"
          title="Notifikasi Admin"
          aria-label="Notifikasi Admin"
        >
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary ring-2 ring-surface-container-lowest" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-card-border" />

        {/* Admin User Info */}
        <div className="flex items-center gap-2.5">
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"
            alt="Admin Profile"
            className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20"
          />
          <div className="hidden lg:flex flex-col">
            <span className="font-sans font-bold text-xs text-on-surface">
              Admin ITechno
            </span>
            <span className="font-mono text-[10px] text-on-surface-variant">
              admin@itechno.id
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
