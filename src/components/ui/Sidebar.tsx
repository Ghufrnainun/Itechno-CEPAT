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
      className="hidden lg:flex flex-col h-screen py-lg px-md gap-lg border-r border-outline-variant bg-surface-container-lowest w-72 sticky top-0 shrink-0"
    >
      {/* Brand / Header — logo.svg */}
      <div className="flex items-center gap-sm px-xs mb-md">
        <Link href="/dashboard" aria-label="Kembali ke dashboard" className="flex items-center gap-sm">
          <Image
            src="/logo.svg"
            alt="CEPAT"
            width={32}
            height={32}
            className="rounded-lg shrink-0"
            style={{ objectFit: "contain" }}
          />
          <span className="font-headline-md text-headline-md text-primary font-bold tracking-tight">
            CEPAT
          </span>
        </Link>
      </div>

      {/* User Profile Card */}
      <div className="flex flex-col gap-sm px-md py-sm mb-sm bg-surface-container-low rounded-xl border border-outline-variant/30">
        <div className="flex items-center gap-md">
          <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-sm shrink-0">
            BS
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-label-md text-label-md font-semibold text-on-surface truncate flex items-center gap-xs">
              Budi Santoso
              <span
                className="material-symbols-outlined text-primary-container text-[14px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
            </span>
            <span
              className="font-label-sm text-label-sm text-on-surface-variant truncate"
              style={{ fontFamily: "'JetBrains Mono'" }}
            >
              Saldo: 250k pts
            </span>
          </div>
        </div>

        {/* Role switcher */}
        <button
          onClick={onRoleToggle}
          className="mt-xs w-full py-1 px-2 text-xs font-semibold rounded-lg bg-primary-container/10 hover:bg-primary-container/20 text-primary-container flex items-center justify-center gap-xs cursor-pointer transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
          Mode: {role === "worker" ? "Pekerja" : "Pemberi Kerja"}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-xs overflow-y-auto custom-scrollbar">
        {/* Dashboard — new */}
        <Link
          href="/dashboard"
          className={`sidebar-link ${pathname === "/dashboard" ? "active" : ""}`}
        >
          <span
            className="material-symbols-outlined"
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
              className={`sidebar-link ${pathname === "/cari-tugas" ? "active" : ""}`}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: pathname === "/cari-tugas" ? "'FILL' 1" : "'FILL' 0" }}
              >
                explore
              </span>
              Cari Tugas
            </Link>

            <Link
              href="/feed"
              className={`sidebar-link ${pathname === "/feed" ? "active" : ""}`}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: pathname === "/feed" ? "'FILL' 1" : "'FILL' 0" }}
              >
                list_alt
              </span>
              Feeds
            </Link>

            <Link
              href="/chat"
              className={`sidebar-link ${pathname === "/chat" ? "active" : ""}`}
            >
              <span
                className="material-symbols-outlined"
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
              className={`sidebar-link ${pathname === "/task/new" ? "active" : ""}`}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: pathname === "/task/new" ? "'FILL' 1" : "'FILL' 0" }}
              >
                add_box
              </span>
              Post Tugas Baru
            </Link>

            <Link
              href="/feed"
              className={`sidebar-link ${pathname === "/feed" ? "active" : ""}`}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: pathname === "/feed" ? "'FILL' 1" : "'FILL' 0" }}
              >
                assignment_ind
              </span>
              Kelola Tugas
            </Link>

            <Link
              href="/chat"
              className={`sidebar-link ${pathname === "/chat" ? "active" : ""}`}
            >
              <span
                className="material-symbols-outlined"
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
          className={`sidebar-link justify-between ${pathname === "/notifications" ? "active" : ""}`}
        >
          <div className="flex items-center gap-md">
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: pathname === "/notifications" ? "'FILL' 1" : "'FILL' 0" }}
            >
              notifications
            </span>
            Notifikasi
          </div>
          <span className="bg-primary text-on-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            3
          </span>
        </Link>

        <Link
          href="/wallet"
          className={`sidebar-link ${pathname === "/wallet" ? "active" : ""}`}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: pathname === "/wallet" ? "'FILL' 1" : "'FILL' 0" }}
          >
            account_balance_wallet
          </span>
          Dompet Poin
        </Link>

        <Link
          href="/profile/budi"
          className={`sidebar-link ${pathname.includes("/profile/") ? "active" : ""}`}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: pathname.includes("/profile/") ? "'FILL' 1" : "'FILL' 0" }}
          >
            person
          </span>
          Profil Saya
        </Link>
      </nav>

      {/* CTA + Footer */}
      <div className="flex flex-col gap-sm pt-md border-t border-outline-variant/50">
        {role === "requester" && (
          <Link
            href="/task/new"
            className="w-full bg-primary-container hover:bg-primary text-on-primary font-label-md text-label-md font-bold py-3 rounded-lg flex items-center justify-center gap-sm transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Post Tugas Baru
          </Link>
        )}
        <div className="flex flex-col gap-xs">
          <a href="#" className="sidebar-link text-on-surface-variant">
            <span className="material-symbols-outlined">help</span>
            Bantuan
          </a>
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-left text-error hover:bg-error-container/20"
          >
            <span className="material-symbols-outlined">logout</span>
            Keluar
          </button>
        </div>
      </div>
    </aside>
  );
}
