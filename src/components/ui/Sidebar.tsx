"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/useNotifications";

interface SidebarProps {
  role: "worker" | "requester";
  onRoleToggle: () => void;
  user?: {
    nama_lengkap?: string;
    username?: string;
    email?: string;
    total_balance?: number;
  } | null;
}

export function Sidebar({ role, onRoleToggle, user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const [loggingOut, setLoggingOut] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

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
      className={`hidden lg:flex flex-col h-screen py-6 gap-6 border-r border-outline-variant/60 bg-surface-container-lowest sticky top-0 shrink-0 shadow-sm overflow-x-hidden transition-all duration-300 ease-in-out ${
        isExpanded ? "w-72 px-4" : "w-20 px-2 items-center"
      }`}
    >
      {/* Brand / Header */}
      <div className={`flex items-center ${isExpanded ? "justify-between" : "justify-center flex-col gap-4"} px-2 mb-2 w-full relative`}>
        {isExpanded ? (
          <Link
            href="/dashboard"
            aria-label="Kembali ke dashboard CEPAT"
            className="flex items-center gap-3 group"
          >
            <Image
              src="/logo.svg"
              alt="CEPAT Logo"
              width={36}
              height={36}
              className="rounded-xl shrink-0 transition-transform group-hover:scale-105"
              style={{ objectFit: "contain" }}
            />
            <span className="font-headline font-bold text-xl text-primary tracking-tight">
              CEPAT
            </span>
          </Link>
        ) : (
          <Link href="/dashboard" className="flex items-center justify-center">
            <Image
              src="/logo.svg"
              alt="CEPAT Logo"
              width={36}
              height={36}
              className="rounded-xl shrink-0 transition-transform hover:scale-105"
              style={{ objectFit: "contain" }}
            />
          </Link>
        )}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? "Tutup Sidebar" : "Buka Sidebar"}
          className={`text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
            isExpanded ? "" : "w-8 h-8 bg-surface-container-high rounded-full border border-outline-variant shadow-sm"
          }`}
          title={isExpanded ? "Tutup Sidebar" : "Buka Sidebar"}
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            {isExpanded ? "menu_open" : "menu"}
          </span>
        </button>
      </div>

      {/* User Profile Card */}
      <div className={`flex flex-col gap-3 p-3.5 brand-card-teal rounded-xl shadow-xs transition-all w-full ${!isExpanded && "items-center px-1"}`}>
        <div className={`flex items-center ${isExpanded ? "gap-3" : "justify-center"}`}>
          <div className="w-10 h-10 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold text-sm shrink-0 shadow-xs border border-primary-container" title={!isExpanded ? displayName : undefined}>
            {initials}
          </div>
          {isExpanded && (
            <div className="flex flex-col overflow-hidden">
              <span className="font-sans font-bold text-sm text-on-surface truncate flex items-center gap-1">
                {displayName}
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
                Saldo: {user?.total_balance ?? 0} pts
              </span>
            </div>
          )}
        </div>

        {/* Segmented Control Role Switcher */}
        <div className={`flex w-full bg-surface-container-high rounded border border-outline-variant/40 ${isExpanded ? "p-0.5" : "flex-col p-1 gap-1 border-none bg-transparent"}`}>
          <button
            type="button"
            onClick={() => role !== "worker" && onRoleToggle()}
            aria-label="Mode Pekerja"
            className={`flex-1 py-1.5 px-2 text-xs font-bold rounded transition-colors flex items-center justify-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none active:scale-[0.97] ${
              role === "worker"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface hover:bg-black/5"
            } ${!isExpanded && "w-10 h-10 rounded-lg p-0"}`}
            title={!isExpanded ? "Mode Pekerja" : undefined}
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">work</span>
            {isExpanded && "Pekerja"}
          </button>
          <button
            type="button"
            onClick={() => role !== "requester" && onRoleToggle()}
            aria-label="Mode Pemberi Kerja"
            className={`flex-1 py-1.5 px-2 text-xs font-bold rounded transition-colors flex items-center justify-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none active:scale-[0.97] ${
              role === "requester"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface hover:bg-black/5"
            } ${!isExpanded && "w-10 h-10 rounded-lg p-0"}`}
            title={!isExpanded ? "Mode Pemberi" : undefined}
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">add_task</span>
            {isExpanded && "Pemberi"}
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className={`flex-1 flex flex-col gap-1 overflow-y-auto overflow-x-hidden custom-scrollbar w-full ${!isExpanded && "items-center px-1"}`}>
        <Link
          href="/dashboard"
          title={!isExpanded ? "Dashboard" : undefined}
          aria-current={pathname === "/dashboard" ? "page" : undefined}
          className={`sidebar-link flex items-center gap-3 ${pathname === "/dashboard" ? "active" : ""} ${!isExpanded && "justify-center w-12 h-12 rounded-xl p-0"}`}
        >
          <span
            className="material-symbols-outlined text-[20px]"
            style={{ fontVariationSettings: pathname === "/dashboard" ? "'FILL' 1" : "'FILL' 0" }}
           aria-hidden="true">
            home
          </span>
          {isExpanded && "Dashboard"}
        </Link>

        {role === "worker" ? (
          <>
            <Link
              href="/cari-tugas"
              title={!isExpanded ? "Cari Tugas" : undefined}
              aria-current={pathname === "/cari-tugas" ? "page" : undefined}
              className={`sidebar-link flex items-center gap-3 ${pathname === "/cari-tugas" ? "active" : ""} ${!isExpanded && "justify-center w-12 h-12 rounded-xl p-0"}`}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: pathname === "/cari-tugas" ? "'FILL' 1" : "'FILL' 0" }}
               aria-hidden="true">
                explore
              </span>
              {isExpanded && "Cari Tugas"}
            </Link>

            <Link
              href="/feed"
              title={!isExpanded ? "Feeds" : undefined}
              aria-current={pathname === "/feed" ? "page" : undefined}
              className={`sidebar-link flex items-center gap-3 ${pathname === "/feed" ? "active" : ""} ${!isExpanded && "justify-center w-12 h-12 rounded-xl p-0"}`}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: pathname === "/feed" ? "'FILL' 1" : "'FILL' 0" }}
               aria-hidden="true">
                list_alt
              </span>
              {isExpanded && "Feeds"}
            </Link>

            <Link
              href="/history/riwayat"
              title={!isExpanded ? "Riwayat" : undefined}
              className={`sidebar-link flex items-center gap-3 ${pathname === "/history/riwayat" ? "active" : ""} ${!isExpanded && "justify-center w-12 h-12 rounded-xl p-0"}`}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: pathname === "/history/riwayat" ? "'FILL' 1" : "'FILL' 0" }}
               aria-hidden="true">
                history
              </span>
              {isExpanded && "Riwayat"}
            </Link>

            <Link
              href="/chat"
              title={!isExpanded ? "Chat" : undefined}
              aria-current={pathname === "/chat" ? "page" : undefined}
              className={`sidebar-link flex items-center gap-3 ${pathname === "/chat" ? "active" : ""} ${!isExpanded && "justify-center w-12 h-12 rounded-xl p-0"}`}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: pathname === "/chat" ? "'FILL' 1" : "'FILL' 0" }}
               aria-hidden="true">
                chat
              </span>
              {isExpanded && "Chat"}
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/task/new"
              title={!isExpanded ? "Post Tugas Baru" : undefined}
              aria-current={pathname === "/task/new" ? "page" : undefined}
              className={`sidebar-link flex items-center gap-3 ${pathname === "/task/new" ? "active" : ""} ${!isExpanded && "justify-center w-12 h-12 rounded-xl p-0"}`}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: pathname === "/task/new" ? "'FILL' 1" : "'FILL' 0" }}
               aria-hidden="true">
                add_box
              </span>
              {isExpanded && "Post Tugas Baru"}
            </Link>

            <Link
              href="/tugas"
              title={!isExpanded ? "Kelola Tugas" : undefined}
              aria-current={pathname === "/tugas" ? "page" : undefined}
              className={`sidebar-link flex items-center gap-3 ${pathname === "/tugas" ? "active" : ""} ${!isExpanded && "justify-center w-12 h-12 rounded-xl p-0"}`}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: pathname === "/tugas" ? "'FILL' 1" : "'FILL' 0" }}
               aria-hidden="true">
                assignment_ind
              </span>
              {isExpanded && "Kelola Tugas"}
            </Link>

            <Link
              href="/chat"
              title={!isExpanded ? "Chat" : undefined}
              aria-current={pathname === "/chat" ? "page" : undefined}
              className={`sidebar-link flex items-center gap-3 ${pathname === "/chat" ? "active" : ""} ${!isExpanded && "justify-center w-12 h-12 rounded-xl p-0"}`}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: pathname === "/chat" ? "'FILL' 1" : "'FILL' 0" }}
               aria-hidden="true">
                chat
              </span>
              {isExpanded && "Chat"}
            </Link>
          </>
        )}

        <Link
          href="/notifications"
          title={!isExpanded ? "Notifikasi" : undefined}
          aria-current={pathname === "/notifications" ? "page" : undefined}
          className={`sidebar-link flex items-center gap-3 ${pathname === "/notifications" ? "active" : ""} ${isExpanded ? "justify-between" : "justify-center w-12 h-12 rounded-xl p-0 relative"}`}
        >
          <div className="flex items-center gap-3">
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: pathname === "/notifications" ? "'FILL' 1" : "'FILL' 0" }}
             aria-hidden="true">
              notifications
            </span>
            {isExpanded && "Notifikasi"}
          </div>
          {unreadCount > 0 && (
            <span className={`${isExpanded ? "bg-primary text-on-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono" : "absolute top-2 right-2 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white"}`}>
              {isExpanded ? unreadCount : ""}
            </span>
          )}
        </Link>

        <Link
          href="/wallet"
          title={!isExpanded ? "Dompet Poin" : undefined}
          aria-current={pathname === "/wallet" ? "page" : undefined}
          className={`sidebar-link flex items-center gap-3 ${pathname === "/wallet" ? "active" : ""} ${!isExpanded && "justify-center w-12 h-12 rounded-xl p-0"}`}
        >
          <span
            className="material-symbols-outlined text-[20px]"
            style={{ fontVariationSettings: pathname === "/wallet" ? "'FILL' 1" : "'FILL' 0" }}
           aria-hidden="true">
            account_balance_wallet
          </span>
          {isExpanded && "Dompet Poin"}
        </Link>

        <Link
          href="/profile"
          title={!isExpanded ? "Profil Saya" : undefined}
          aria-current={pathname.includes("/profile") ? "page" : undefined}
          className={`sidebar-link flex items-center gap-3 ${pathname.includes("/profile") ? "active" : ""} ${!isExpanded && "justify-center w-12 h-12 rounded-xl p-0"}`}
        >
          <span
            className="material-symbols-outlined text-[20px]"
            style={{ fontVariationSettings: pathname.includes("/profile") ? "'FILL' 1" : "'FILL' 0" }}
           aria-hidden="true">
            person
          </span>
          {isExpanded && "Profil Saya"}
        </Link>
      </nav>

      {/* Footer */}
      <div className={`flex flex-col gap-2 pt-4 border-t border-outline-variant/50 w-full ${!isExpanded && "items-center px-1"}`}>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title={!isExpanded ? "Keluar" : undefined}
          aria-label="Keluar dari akun"
          className={`sidebar-link flex items-center gap-3 text-error hover:bg-error-container/20 rounded-xl disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-error focus-visible:outline-none ${isExpanded ? "w-full text-left" : "justify-center w-12 h-12 p-0"}`}
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">logout</span>
          {isExpanded && (loggingOut ? "Keluar..." : "Keluar")}
        </button>
      </div>
    </aside>
  );
}

