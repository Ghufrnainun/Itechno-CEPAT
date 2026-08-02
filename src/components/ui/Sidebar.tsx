"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

interface SidebarProps {
  role: "worker" | "requester";
  onRoleToggle: () => void;
}

export function Sidebar({ role, onRoleToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    router.push("/");
  };

  return (
    <aside
      id="sidebar"
      aria-label="Navigasi Utama Aplikasi"
      className="hidden lg:flex flex-col h-screen py-6 px-4 gap-6 border-r border-outline-variant/60 bg-surface-container-lowest w-72 sticky top-0 shrink-0 shadow-sm overflow-x-hidden"
    >
      {/* Brand / Header */}
      <div className="flex items-center gap-3 px-2 mb-2">
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
      </div>

      {/* User Profile Card */}
      <div className="flex flex-col gap-3 p-3.5 brand-card-teal rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold text-sm shrink-0 shadow-xs border border-primary-container">
            BS
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-sans font-bold text-sm text-on-surface truncate flex items-center gap-1">
              Budi Santoso
              <span
                className="material-symbols-outlined text-primary text-[15px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
              Saldo: 250k pts
            </span>
          </div>
        </div>

        {/* Segmented Control Role Switcher */}
        <div className="flex bg-surface-container-high p-0.5 rounded border border-outline-variant/40">
          <button
            type="button"
            onClick={() => role !== "worker" && onRoleToggle()}
            aria-label="Mode Pekerja"
            className={`flex-1 py-1.5 px-2 text-xs font-bold rounded transition-all flex items-center justify-center gap-1 cursor-pointer ${
              role === "worker"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">work</span>
            Pekerja
          </button>
          <button
            type="button"
            onClick={() => role !== "requester" && onRoleToggle()}
            aria-label="Mode Pemberi Kerja"
            className={`flex-1 py-1.5 px-2 text-xs font-bold rounded transition-all flex items-center justify-center gap-1 cursor-pointer ${
              role === "requester"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">add_task</span>
            Pemberi
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <Link
          href="/dashboard"
          aria-current={pathname === "/dashboard" ? "page" : undefined}
          className={`sidebar-link ${pathname === "/dashboard" ? "active" : ""}`}
        >
          <span
            className="material-symbols-outlined text-[20px]"
            style={{ fontVariationSettings: pathname === "/dashboard" ? "'FILL' 1" : "'FILL' 0" }}
          >
            home
          </span>
          Dashboard
        </Link>

        {role === "worker" ? (
          <>
            <Link
              href="/cari-tugas"
              aria-current={pathname === "/cari-tugas" ? "page" : undefined}
              className={`sidebar-link ${pathname === "/cari-tugas" ? "active" : ""}`}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: pathname === "/cari-tugas" ? "'FILL' 1" : "'FILL' 0" }}
              >
                explore
              </span>
              Cari Tugas
            </Link>

            <Link
              href="/feed"
              aria-current={pathname === "/feed" ? "page" : undefined}
              className={`sidebar-link ${pathname === "/feed" ? "active" : ""}`}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: pathname === "/feed" ? "'FILL' 1" : "'FILL' 0" }}
              >
                list_alt
              </span>
              Feeds
            </Link>

            <Link
              href="/chat"
              aria-current={pathname === "/chat" ? "page" : undefined}
              className={`sidebar-link ${pathname === "/chat" ? "active" : ""}`}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: pathname === "/chat" ? "'FILL' 1" : "'FILL' 0" }}
              >
                chat
              </span>
              Chat
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/task/new"
              aria-current={pathname === "/task/new" ? "page" : undefined}
              className={`sidebar-link ${pathname === "/task/new" ? "active" : ""}`}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: pathname === "/task/new" ? "'FILL' 1" : "'FILL' 0" }}
              >
                add_box
              </span>
              Post Tugas Baru
            </Link>

            <Link
              href="/feed"
              aria-current={pathname === "/feed" ? "page" : undefined}
              className={`sidebar-link ${pathname === "/feed" ? "active" : ""}`}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: pathname === "/feed" ? "'FILL' 1" : "'FILL' 0" }}
              >
                assignment_ind
              </span>
              Kelola Tugas
            </Link>

            <Link
              href="/chat"
              aria-current={pathname === "/chat" ? "page" : undefined}
              className={`sidebar-link ${pathname === "/chat" ? "active" : ""}`}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: pathname === "/chat" ? "'FILL' 1" : "'FILL' 0" }}
              >
                chat
              </span>
              Chat
            </Link>
          </>
        )}

        <Link
          href="/notifications"
          aria-current={pathname === "/notifications" ? "page" : undefined}
          className={`sidebar-link justify-between ${pathname === "/notifications" ? "active" : ""}`}
        >
          <div className="flex items-center gap-3">
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: pathname === "/notifications" ? "'FILL' 1" : "'FILL' 0" }}
            >
              notifications
            </span>
            Notifikasi
          </div>
          <span className="bg-primary text-on-primary text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs">
            3
          </span>
        </Link>

        <Link
          href="/wallet"
          aria-current={pathname === "/wallet" ? "page" : undefined}
          className={`sidebar-link ${pathname === "/wallet" ? "active" : ""}`}
        >
          <span
            className="material-symbols-outlined text-[20px]"
            style={{ fontVariationSettings: pathname === "/wallet" ? "'FILL' 1" : "'FILL' 0" }}
          >
            account_balance_wallet
          </span>
          Dompet Poin
        </Link>

        <Link
          href="/profile/budi"
          aria-current={pathname.includes("/profile/") ? "page" : undefined}
          className={`sidebar-link ${pathname.includes("/profile/") ? "active" : ""}`}
        >
          <span
            className="material-symbols-outlined text-[20px]"
            style={{ fontVariationSettings: pathname.includes("/profile/") ? "'FILL' 1" : "'FILL' 0" }}
          >
            person
          </span>
          Profil Saya
        </Link>
      </nav>

      {/* Footer */}
      <div className="flex flex-col gap-2 pt-4 border-t border-outline-variant/50">
        <button
          onClick={handleLogout}
          aria-label="Keluar dari akun"
          className="sidebar-link w-full text-left text-error hover:bg-error-container/20 rounded-xl"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Keluar
        </button>
      </div>
    </aside>
  );
}
