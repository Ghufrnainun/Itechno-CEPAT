'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Tags,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LogOut,
} from 'lucide-react';

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'User Management', href: '/admin/users', icon: Users },
    { label: 'Task Management', href: '/admin/tasks', icon: ClipboardList },
    { label: 'Category & Skills', href: '/admin/categories', icon: Tags },
  ];

  return (
    <aside
      className={`relative flex flex-col bg-white text-[#0C1F16] border-r border-[#E2E8F0] transition-all duration-300 z-30 min-h-screen shrink-0 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header / Brand */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-[#E2E8F0] w-full">
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
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0C1F16] hover:bg-[#F1F5F9] transition-colors focus:outline-none"
              title="Expand Sidebar"
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
                <span className="font-headline font-bold text-base text-[#0C1F16] tracking-tight">
                  CEPAT
                </span>
                <span className="font-mono text-[10px] font-semibold tracking-wider uppercase text-[#0F766E]">
                  Admin Console
                </span>
              </div>
            </Link>

            <button
              onClick={() => setCollapsed(true)}
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0C1F16] hover:bg-[#F1F5F9] transition-colors focus:outline-none shrink-0"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-sans font-semibold transition-all ${
                isActive
                  ? 'bg-[#0F766E] text-white shadow-xs font-bold'
                  : 'text-[#64748B] hover:text-[#0C1F16] hover:bg-[#F1F5F9]'
              } ${collapsed ? 'justify-center px-0' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#64748B]'}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Quick Actions */}
      <div className="p-3 border-t border-[#E2E8F0] space-y-1">
        <Link
          href="/feed"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-sans font-medium text-[#64748B] hover:text-[#0C1F16] hover:bg-[#F1F5F9] transition-colors ${
            collapsed ? 'justify-center px-0' : ''
          }`}
          title={collapsed ? 'Main App Feed' : undefined}
        >
          <ExternalLink className="w-4 h-4 shrink-0 text-[#64748B]" />
          {!collapsed && <span>Main App Feed</span>}
        </Link>

        <Link
          href="/login"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-sans font-medium text-rose-600 hover:bg-rose-50 transition-colors ${
            collapsed ? 'justify-center px-0' : ''
          }`}
          title={collapsed ? 'Exit Admin' : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0 text-rose-600" />
          {!collapsed && <span>Exit Admin</span>}
        </Link>
      </div>
    </aside>
  );
}
