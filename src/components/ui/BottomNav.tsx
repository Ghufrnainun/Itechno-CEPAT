"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface BottomNavProps {
  role: "worker" | "requester";
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-container-lowest border-t border-outline-variant flex items-center justify-around z-40 px-sm shadow-md">
      <Link
        href="/feed"
        className={`flex flex-col items-center gap-xs text-[10px] font-medium transition-colors ${pathname === "/feed" ? "text-primary" : "text-on-surface-variant"}`}
      >
        <span
          className="material-symbols-outlined text-[24px]"
          style={{ fontVariationSettings: pathname === "/feed" ? "'FILL' 1" : "'FILL' 0" }}
        >
          dashboard
        </span>
        Feed
      </Link>

      {role === "requester" ? (
        <Link
          href="/task/new"
          className={`flex flex-col items-center gap-xs text-[10px] font-medium transition-colors ${pathname === "/task/new" ? "text-primary" : "text-on-surface-variant"}`}
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={{ fontVariationSettings: pathname === "/task/new" ? "'FILL' 1" : "'FILL' 0" }}
          >
            add_box
          </span>
          Post Tugas
        </Link>
      ) : (
        <Link
          href="/feed?tab=explore"
          className={`flex flex-col items-center gap-xs text-[10px] font-medium transition-colors ${pathname.includes("explore") ? "text-primary" : "text-on-surface-variant"}`}
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={{ fontVariationSettings: pathname.includes("explore") ? "'FILL' 1" : "'FILL' 0" }}
          >
            explore
          </span>
          Cari
        </Link>
      )}

      <Link
        href="/notifications"
        className={`flex flex-col items-center gap-xs text-[10px] font-medium relative transition-colors ${pathname === "/notifications" ? "text-primary" : "text-on-surface-variant"}`}
      >
        <span
          className="material-symbols-outlined text-[24px]"
          style={{ fontVariationSettings: pathname === "/notifications" ? "'FILL' 1" : "'FILL' 0" }}
        >
          notifications
        </span>
        Notif
        <span className="absolute -top-1 right-2 w-4 h-4 bg-primary text-white text-[9px] font-bold flex items-center justify-center rounded-full">
          3
        </span>
      </Link>

      <Link
        href="/wallet"
        className={`flex flex-col items-center gap-xs text-[10px] font-medium transition-colors ${pathname === "/wallet" ? "text-primary" : "text-on-surface-variant"}`}
      >
        <span
          className="material-symbols-outlined text-[24px]"
          style={{ fontVariationSettings: pathname === "/wallet" ? "'FILL' 1" : "'FILL' 0" }}
        >
          account_balance_wallet
        </span>
        Dompet
      </Link>

      <Link
        href="/profile/budi"
        className={`flex flex-col items-center gap-xs text-[10px] font-medium transition-colors ${pathname.includes("/profile/") ? "text-primary" : "text-on-surface-variant"}`}
      >
        <span
          className="material-symbols-outlined text-[24px]"
          style={{ fontVariationSettings: pathname.includes("/profile/") ? "'FILL' 1" : "'FILL' 0" }}
        >
          person
        </span>
        Profil
      </Link>
    </nav>
  );
}
