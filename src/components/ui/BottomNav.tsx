"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNotifications } from "@/hooks/useNotifications";

interface BottomNavProps {
  role: "worker" | "requester";
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();

  return (
    <nav
      aria-label="Navigasi Bawah Mobile"
      className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-outline-variant/60 flex items-center justify-around z-50 px-2 shadow-lg"
    >
      <Link
        href="/dashboard"
        aria-label="Dashboard Utama"
        className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-2 rounded-xl text-[11px] font-medium transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
          pathname === "/dashboard"
            ? "text-primary font-bold scale-105"
            : "text-on-surface-variant hover:text-on-surface"
        }`}
      >
        <span
          className="material-symbols-outlined text-[24px]"
          style={{ fontVariationSettings: pathname === "/dashboard" ? "'FILL' 1" : "'FILL' 0" }}
         aria-hidden="true">
          home
        </span>
        Home
      </Link>

      {role === "requester" ? (
        <Link
          href="/task/new"
          aria-label="Post Tugas Baru"
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-2 rounded-xl text-[11px] font-medium transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
            pathname === "/task/new"
              ? "text-primary font-bold scale-105"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={{ fontVariationSettings: pathname === "/task/new" ? "'FILL' 1" : "'FILL' 0" }}
           aria-hidden="true">
            add_box
          </span>
          Post
        </Link>
      ) : (
        <Link
          href="/feed?tab=explore"
          aria-label="Cari Tugas"
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-2 rounded-xl text-[11px] font-medium transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
            pathname.includes("explore")
              ? "text-primary font-bold scale-105"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={{ fontVariationSettings: pathname.includes("explore") ? "'FILL' 1" : "'FILL' 0" }}
           aria-hidden="true">
            explore
          </span>
          Cari
        </Link>
      )}

      <Link
        href="/notifications"
        aria-label="Notifikasi"
        className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-2 rounded-xl text-[11px] font-medium relative transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
          pathname === "/notifications"
            ? "text-primary font-bold scale-105"
            : "text-on-surface-variant hover:text-on-surface"
        }`}
      >
        <span
          className="material-symbols-outlined text-[24px]"
          style={{ fontVariationSettings: pathname === "/notifications" ? "'FILL' 1" : "'FILL' 0" }}
         aria-hidden="true">
          notifications
        </span>
        Notif
        {unreadCount > 0 && (
          <span className="absolute -top-1 right-2 w-4 h-4 bg-primary text-white text-[9px] font-bold flex items-center justify-center rounded-full font-mono">
            {unreadCount}
          </span>
        )}
      </Link>

      <Link
        href="/wallet"
        aria-label="Dompet Poin"
        className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-2 rounded-xl text-[11px] font-medium transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
          pathname === "/wallet"
            ? "text-primary font-bold scale-105"
            : "text-on-surface-variant hover:text-on-surface"
        }`}
      >
        <span
          className="material-symbols-outlined text-[24px]"
          style={{ fontVariationSettings: pathname === "/wallet" ? "'FILL' 1" : "'FILL' 0" }}
         aria-hidden="true">
          account_balance_wallet
        </span>
        Dompet
      </Link>

      <Link
        href="/profile/me"
        aria-label="Profil Saya"
        className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-2 rounded-xl text-[11px] font-medium transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
          pathname.includes("/profile/")
            ? "text-primary font-bold scale-105"
            : "text-on-surface-variant hover:text-on-surface"
        }`}
      >
        <span
          className="material-symbols-outlined text-[24px]"
          style={{ fontVariationSettings: pathname.includes("/profile/") ? "'FILL' 1" : "'FILL' 0" }}
         aria-hidden="true">
          person
        </span>
        Profil
      </Link>
    </nav>
  );
}
