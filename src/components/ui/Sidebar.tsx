"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/useNotifications";
import { useUnreadChat } from "@/hooks/useUnreadChat";
import {
  Menu,
  MenuSquare,
  Briefcase,
  PlusCircle,
  Home,
  Compass,
  ListFilter,
  History,
  MessageSquare,
  Bell,
  Wallet,
  User,
  LogOut,
  Trophy,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Flag,
  Calendar,
  ShieldAlert,
  Bookmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ReportModal } from "@/components/ui/ReportModal";

interface SidebarProps {
  role: "worker" | "requester";
  onRoleToggle: () => void;
  user?: {
    nama_lengkap?: string;
    username?: string;
    email?: string;
    avatar_url?: string | null;
    total_balance?: number;
  } | null;
}

export function Sidebar({ role, onRoleToggle, user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const { unreadCount: chatUnreadCount } = useUnreadChat();
  const [loggingOut, setLoggingOut] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const displayName = user?.nama_lengkap || user?.username || "Pengguna CEPAT";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
    }
  };

  return (
    <aside
      id="sidebar"
      aria-label="Navigasi Utama Aplikasi"
      className={cn(
        "hidden lg:flex flex-col h-screen py-5 gap-5 border-r border-card-border bg-surface-container-lowest sticky top-0 shrink-0 shadow-xs overflow-x-hidden transition-[width,padding] duration-200 ease-out",
        isExpanded ? "w-64 px-3.5" : "w-20 px-2 items-center"
      )}
    >
      {/* Brand / Header */}
      <div className={cn("flex items-center px-1 mb-1 w-full", isExpanded ? "justify-between" : "justify-center flex-col gap-3")}>
        {isExpanded ? (
          <Link
            href="/dashboard"
            aria-label="Kembali ke dashboard CEPAT"
            className="flex items-center gap-2.5 group"
          >
            <Image
              src="/logo.svg"
              alt="CEPAT Logo"
              width={32}
              height={32}
              className="rounded-lg shrink-0 transition-transform group-hover:scale-105 object-contain"
            />
            <span className="font-headline font-extrabold text-xl text-primary tracking-tight">
              CEPAT
            </span>
          </Link>
        ) : (
          <Link href="/dashboard" className="flex items-center justify-center">
            <Image
              src="/logo.svg"
              alt="CEPAT Logo"
              width={32}
              height={32}
              className="rounded-lg shrink-0 transition-transform hover:scale-105 object-contain"
            />
          </Link>
        )}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? "Tutup Sidebar" : "Buka Sidebar"}
          className="w-8 h-8 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none cursor-pointer"
          title={isExpanded ? "Tutup Sidebar" : "Buka Sidebar"}
        >
          {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* User Profile Card */}
      <div className={cn("flex flex-col gap-2.5 p-3 bg-surface-container-low border border-card-border rounded-xl shadow-xs w-full", !isExpanded && "items-center px-1")}>
        <div className={cn("flex items-center", isExpanded ? "gap-2.5" : "justify-center")}>
          <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold text-xs shrink-0 shadow-xs relative overflow-hidden" title={!isExpanded ? displayName : undefined}>
            {user?.avatar_url ? (
              <Image src={user.avatar_url} alt={displayName} fill className="object-cover" sizes="36px" />
            ) : (
              initials
            )}
          </div>
          {isExpanded && (
            <div className="flex flex-col overflow-hidden min-w-0">
              <span className="font-sans font-bold text-xs text-on-surface truncate">
                {displayName}
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-primary tabular-nums">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block shrink-0" />
                Saldo: {user?.total_balance ?? 0} pts
              </span>
            </div>
          )}
        </div>

        {/* Segmented Control Role Switcher */}
        <div className={cn("flex w-full bg-surface-container rounded-lg border border-card-border/60", isExpanded ? "p-0.5" : "flex-col p-1 gap-1 border-none bg-transparent")}>
          <button
            type="button"
            onClick={() => role !== "worker" && onRoleToggle()}
            aria-label="Mode Pekerja"
            className={cn(
              "flex-1 py-1.5 px-2 text-xs font-semibold rounded-md transition-colors duration-150 flex items-center justify-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none active:scale-[0.96]",
              role === "worker"
                ? "bg-primary text-on-primary shadow-xs font-bold"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest",
              !isExpanded && "w-9 h-9 rounded-lg p-0"
            )}
            title={!isExpanded ? "Mode Pekerja" : undefined}
          >
            <Briefcase className="w-3.5 h-3.5 shrink-0" />
            {isExpanded && "Pekerja"}
          </button>
          <button
            type="button"
            onClick={() => role !== "requester" && onRoleToggle()}
            aria-label="Mode Pemberi Kerja"
            className={cn(
              "flex-1 py-1.5 px-2 text-xs font-semibold rounded-md transition-colors duration-150 flex items-center justify-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none active:scale-[0.96]",
              role === "requester"
                ? "bg-primary text-on-primary shadow-xs font-bold"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest",
              !isExpanded && "w-9 h-9 rounded-lg p-0"
            )}
            title={!isExpanded ? "Mode Pemberi" : undefined}
          >
            <PlusCircle className="w-3.5 h-3.5 shrink-0" />
            {isExpanded && "Pemberi"}
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className={cn("flex-1 flex flex-col gap-1 overflow-y-auto overflow-x-hidden custom-scrollbar w-full", !isExpanded && "items-center px-1")}>
        <Link
          href="/dashboard"
          title={!isExpanded ? "Dashboard" : undefined}
          aria-current={pathname === "/dashboard" ? "page" : undefined}
          className={cn("sidebar-link flex items-center gap-3", pathname === "/dashboard" && "active", !isExpanded && "justify-center w-10 h-10 rounded-lg p-0")}
        >
          <Home className="w-4 h-4 shrink-0" />
          {isExpanded && "Dashboard"}
        </Link>

        <Link
          href="/leaderboard"
          title={!isExpanded ? "Peringkat" : undefined}
          aria-current={pathname === "/leaderboard" ? "page" : undefined}
          className={cn("sidebar-link flex items-center gap-3", pathname === "/leaderboard" && "active", !isExpanded && "justify-center w-10 h-10 rounded-lg p-0")}
        >
          <Trophy className="w-4 h-4 shrink-0" />
          {isExpanded && "Peringkat"}
        </Link>

        <Link
          href="/schedule"
          title={!isExpanded ? "Jadwal" : undefined}
          aria-current={pathname === "/schedule" ? "page" : undefined}
          className={cn("sidebar-link flex items-center gap-3", pathname === "/schedule" && "active", !isExpanded && "justify-center w-10 h-10 rounded-lg p-0")}
        >
          <Calendar className="w-4 h-4 shrink-0" />
          {isExpanded && "Jadwal"}
        </Link>

        {role === "worker" ? (
          <>
            <Link
              href="/cari-tugas"
              title={!isExpanded ? "Cari Tugas" : undefined}
              aria-current={pathname === "/cari-tugas" ? "page" : undefined}
              className={cn("sidebar-link flex items-center gap-3", pathname === "/cari-tugas" && "active", !isExpanded && "justify-center w-10 h-10 rounded-lg p-0")}
            >
              <Compass className="w-4 h-4 shrink-0" />
              {isExpanded && "Cari Tugas"}
            </Link>

            <Link
              href="/feed"
              title={!isExpanded ? "Feeds" : undefined}
              aria-current={pathname === "/feed" ? "page" : undefined}
              className={cn("sidebar-link flex items-center gap-3", pathname === "/feed" && "active", !isExpanded && "justify-center w-10 h-10 rounded-lg p-0")}
            >
              <ListFilter className="w-4 h-4 shrink-0" />
              {isExpanded && "Feeds"}
            </Link>

            <Link
              href="/history/riwayat"
              title={!isExpanded ? "Riwayat" : undefined}
              aria-current={pathname === "/history/riwayat" ? "page" : undefined}
              className={cn("sidebar-link flex items-center gap-3", pathname === "/history/riwayat" && "active", !isExpanded && "justify-center w-10 h-10 rounded-lg p-0")}
            >
              <History className="w-4 h-4 shrink-0" />
              {isExpanded && "Riwayat"}
            </Link>

            <Link
              href="/saved"
              title={!isExpanded ? "Tersimpan" : undefined}
              aria-current={pathname === "/saved" ? "page" : undefined}
              className={cn("sidebar-link flex items-center gap-3", pathname === "/saved" && "active", !isExpanded && "justify-center w-10 h-10 rounded-lg p-0")}
            >
              <Bookmark className="w-4 h-4 shrink-0" />
              {isExpanded && "Tersimpan"}
            </Link>

            <Link
              href="/chat"
              title={!isExpanded ? "Chat" : undefined}
              aria-current={pathname === "/chat" ? "page" : undefined}
              className={cn("sidebar-link flex items-center gap-3", pathname === "/chat" && "active", isExpanded ? "justify-between" : "justify-center w-10 h-10 rounded-lg p-0 relative")}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 shrink-0" />
                {isExpanded && "Chat"}
              </div>
              {chatUnreadCount > 0 && (
                <span className={cn(
                  isExpanded
                    ? "bg-primary text-on-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono tabular-nums"
                    : "absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-surface-container-lowest"
                )}>
                  {isExpanded ? chatUnreadCount : ""}
                </span>
              )}
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/task/new"
              title={!isExpanded ? "Post Tugas Baru" : undefined}
              aria-current={pathname === "/task/new" ? "page" : undefined}
              className={cn("sidebar-link flex items-center gap-3", pathname === "/task/new" && "active", !isExpanded && "justify-center w-10 h-10 rounded-lg p-0")}
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              {isExpanded && "Post Tugas Baru"}
            </Link>

            <Link
              href="/tugas"
              title={!isExpanded ? "Kelola Tugas" : undefined}
              aria-current={pathname === "/tugas" ? "page" : undefined}
              className={cn("sidebar-link flex items-center gap-3", pathname === "/tugas" && "active", !isExpanded && "justify-center w-10 h-10 rounded-lg p-0")}
            >
              <ClipboardList className="w-4 h-4 shrink-0" />
              {isExpanded && "Kelola Tugas"}
            </Link>

            <Link
              href="/chat"
              title={!isExpanded ? "Chat" : undefined}
              aria-current={pathname === "/chat" ? "page" : undefined}
              className={cn("sidebar-link flex items-center gap-3", pathname === "/chat" && "active", isExpanded ? "justify-between" : "justify-center w-10 h-10 rounded-lg p-0 relative")}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 shrink-0" />
                {isExpanded && "Chat"}
              </div>
              {chatUnreadCount > 0 && (
                <span className={cn(
                  isExpanded
                    ? "bg-primary text-on-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono tabular-nums"
                    : "absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-surface-container-lowest"
                )}>
                  {isExpanded ? chatUnreadCount : ""}
                </span>
              )}
            </Link>
          </>
        )}

        <Link
          href="/notifications"
          title={!isExpanded ? "Notifikasi" : undefined}
          aria-current={pathname === "/notifications" ? "page" : undefined}
          className={cn("sidebar-link flex items-center gap-3", pathname === "/notifications" && "active", isExpanded ? "justify-between" : "justify-center w-10 h-10 rounded-lg p-0 relative")}
        >
          <div className="flex items-center gap-3">
            <Bell className="w-4 h-4 shrink-0" />
            {isExpanded && "Notifikasi"}
          </div>
          {unreadCount > 0 && (
            <span className={cn(
              isExpanded
                ? "bg-primary text-on-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono tabular-nums"
                : "absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-surface-container-lowest"
            )}>
              {isExpanded ? unreadCount : ""}
            </span>
          )}
        </Link>

        <Link
          href="/wallet"
          title={!isExpanded ? "Dompet Poin" : undefined}
          aria-current={pathname === "/wallet" ? "page" : undefined}
          className={cn("sidebar-link flex items-center gap-3", pathname === "/wallet" && "active", !isExpanded && "justify-center w-10 h-10 rounded-lg p-0")}
        >
          <Wallet className="w-4 h-4 shrink-0" />
          {isExpanded && "Dompet Poin"}
        </Link>

        <Link
          href="/disputes"
          title={!isExpanded ? "Pusat Sengketa" : undefined}
          aria-current={pathname.startsWith("/disputes") ? "page" : undefined}
          className={cn("sidebar-link flex items-center gap-3", pathname.startsWith("/disputes") && "active", !isExpanded && "justify-center w-10 h-10 rounded-lg p-0")}
        >
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
          {isExpanded && "Pusat Sengketa"}
        </Link>

        <Link
          href="/profile"
          title={!isExpanded ? "Profil Saya" : undefined}
          aria-current={pathname.includes("/profile") ? "page" : undefined}
          className={cn("sidebar-link flex items-center gap-3", pathname.includes("/profile") && "active", !isExpanded && "justify-center w-10 h-10 rounded-lg p-0")}
        >
          <User className="w-4 h-4 shrink-0" />
          {isExpanded && "Profil Saya"}
        </Link>
      </nav>

      {/* Footer */}
      <div className={cn("flex flex-col gap-2 pt-3 border-t border-card-border w-full", !isExpanded && "items-center px-1")}>
        {/* Tombol Laporan ke Admin */}
        <button
          type="button"
          onClick={() => setIsReportModalOpen(true)}
          title={!isExpanded ? "Laporkan Masalah" : undefined}
          aria-label="Laporkan masalah ke Admin"
          className={cn(
            "sidebar-link flex items-center gap-3 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30 transition-colors rounded-lg focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none cursor-pointer",
            isExpanded ? "w-full text-left" : "justify-center w-10 h-10 p-0"
          )}
        >
          <Flag className="w-4 h-4 shrink-0 text-rose-600" aria-hidden="true" />
          {isExpanded && "Laporkan Masalah"}
        </button>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title={!isExpanded ? "Keluar" : undefined}
          aria-label="Keluar dari akun"
          className={cn(
            "sidebar-link flex items-center gap-3 text-error hover:bg-error-container/30 rounded-lg disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-error/40 focus-visible:outline-none cursor-pointer",
            isExpanded ? "w-full text-left" : "justify-center w-10 h-10 p-0"
          )}
        >
          <LogOut className="w-4 h-4 shrink-0 text-error" />
          {isExpanded && (loggingOut ? "Keluar..." : "Keluar")}
        </button>
      </div>

      {/* Modal Laporan */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </aside>
  );
}
