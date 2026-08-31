'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Tags,
  Flag,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminUser {
  id: string;
  email: string;
  nama_lengkap: string;
  avatar_url?: string;
  username: string;
}

interface AdminSidebarProps {
  adminUser?: AdminUser | null;
}

export default function AdminSidebar({ adminUser }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'User Management', href: '/admin/users', icon: Users },
    { label: 'Task Management', href: '/admin/tasks', icon: ClipboardList },
    { label: 'Pusat Sengketa', href: '/admin/disputes', icon: ShieldAlert },
    { label: 'Category & Skills', href: '/admin/categories', icon: Tags },
    { label: 'Laporan User', href: '/admin/reports', icon: Flag },
  ];

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } catch {
      // Ignore error - proceed to redirect
    } finally {
      router.replace('/admin/login');
    }
  };

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen flex flex-col bg-surface-container-lowest text-on-surface border-r border-card-border",
        "transition-[width] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] z-30 shrink-0",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header / Brand */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-card-border w-full shrink-0">
        {collapsed ? (
          <div className="flex items-center justify-between w-full">
            <Link href="/admin/dashboard" className="flex items-center justify-center mx-auto">
              <Image
                src="/logo.svg"
                alt="CEPAT Logo"
                width={32}
                height={32}
                className="rounded-lg object-contain transition-transform hover:scale-105"
              />
            </Link>
            <button
              onClick={() => setCollapsed(false)}
              className="w-9 h-9 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer"
              title="Expand Sidebar"
              aria-label="Expand Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <Link href="/admin/dashboard" className="flex items-center gap-3 overflow-hidden">
              <Image
                src="/logo.svg"
                alt="CEPAT Logo"
                width={34}
                height={34}
                className="rounded-lg object-contain shrink-0"
              />
              <div className="flex flex-col truncate">
                <span className="font-headline font-bold text-base text-on-surface tracking-tight">
                  CEPAT
                </span>
                <span className="font-mono text-[10px] font-semibold tracking-wider uppercase text-primary">
                  Admin Console
                </span>
              </div>
            </Link>

            <button
              onClick={() => setCollapsed(true)}
              className="w-9 h-9 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 shrink-0 cursor-pointer"
              title="Collapse Sidebar"
              aria-label="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Admin User Badge */}
      {adminUser && !collapsed && (
        <div className="mx-3 mt-3 px-3 py-2.5 bg-surface-container-low border border-card-border rounded-lg shrink-0">
          <div className="flex items-center gap-2.5">
            {adminUser.avatar_url ? (
              <Image
                src={adminUser.avatar_url}
                alt={adminUser.nama_lengkap}
                width={28}
                height={28}
                className="w-7 h-7 rounded-full object-cover border border-card-border shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                {adminUser.nama_lengkap.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="truncate">
              <p className="text-[11px] font-bold text-on-surface truncate">{adminUser.nama_lengkap}</p>
              <p className="text-[10px] font-mono text-primary uppercase tracking-wider font-semibold">Admin</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-sans font-semibold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                isActive
                  ? "bg-primary text-on-primary shadow-xs font-bold"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-on-primary" : "text-on-surface-variant")} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Quick Actions */}
      <div className="p-3 border-t border-card-border bg-surface-container-lowest shrink-0">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-sans font-semibold text-error hover:bg-error-container/30 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:opacity-50 cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40",
            collapsed && "justify-center px-0"
          )}
          title={collapsed ? 'Logout Admin' : undefined}
          aria-label="Logout Admin"
        >
          <LogOut className="w-4 h-4 shrink-0 text-error" />
          {!collapsed && <span>{loggingOut ? 'Logging out...' : 'Logout Admin'}</span>}
        </button>
      </div>
    </aside>
  );
}
