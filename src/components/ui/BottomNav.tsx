"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useNotifications } from "@/hooks/useNotifications";
import { useUnreadChat } from "@/hooks/useUnreadChat";
import { useCurrentRole } from "@/app/(main)/layout";
import { Home, ClipboardList, ListFilter, Bell, MessageSquare, User, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  role: "worker" | "requester";
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useCurrentRole();
  const { unreadCount } = useNotifications();
  const { unreadCount: chatUnreadCount } = useUnreadChat();

  // Hide BottomNav when inside task detail, task new, dispute detail, or active chat conversation
  const isInsideActiveChatRoom = pathname === "/chat" && Boolean(searchParams.get("room"));
  const isInsideTaskSubpage = pathname.startsWith("/task/");
  const isInsideDisputeDetailPage = pathname.startsWith("/disputes/") && pathname !== "/disputes";

  if (isInsideActiveChatRoom || isInsideTaskSubpage || isInsideDisputeDetailPage) {
    return null;
  }

  const isMyProfileActive =
    pathname === "/profile" ||
    pathname === "/profile/me" ||
    (Boolean(user?.id_user) && pathname === `/profile/${user?.id_user}`);

  return (
    <nav
      aria-label="Navigasi Bawah Mobile"
      className="lg:hidden fixed bottom-0 left-0 right-0 h-[calc(4rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] bg-surface-container-lowest/95 backdrop-blur-md border-t border-card-border flex items-center justify-around z-50 px-2 shadow-lg"
    >
      <Link
        href="/dashboard"
        aria-label="Beranda"
        className={cn(
          "flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-2 rounded-lg text-[11px] font-medium transition-[color,transform] duration-150 active:scale-90 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none",
          pathname === "/dashboard"
            ? "text-primary font-bold scale-105"
            : "text-on-surface-variant hover:text-on-surface"
        )}
      >
        <Home className="w-5 h-5 mb-0.5" />
        Beranda
      </Link>

      {role === "requester" ? (
        <Link
          href="/tugas"
          aria-label="Kelola Tugas"
          className={cn(
            "flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-2 rounded-lg text-[11px] font-medium transition-[color,transform] duration-150 active:scale-90 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none",
            pathname === "/tugas"
              ? "text-primary font-bold scale-105"
              : "text-on-surface-variant hover:text-on-surface"
          )}
        >
          <ClipboardList className="w-5 h-5 mb-0.5" />
          Kelola
        </Link>
      ) : (
        <Link
          href="/cari-tugas"
          aria-label="Cari Tugas"
          className={cn(
            "flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-2 rounded-lg text-[11px] font-medium transition-[color,transform] duration-150 active:scale-90 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none",
            pathname === "/cari-tugas" || pathname === "/feed"
              ? "text-primary font-bold scale-105"
              : "text-on-surface-variant hover:text-on-surface"
          )}
        >
          <ListFilter className="w-5 h-5 mb-0.5" />
          Cari Tugas
        </Link>
      )}

      <Link
        href="/chat"
        aria-label="Chat"
        className={cn(
          "flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-2 rounded-lg text-[11px] font-medium relative transition-[color,transform] duration-150 active:scale-90 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none",
          pathname === "/chat"
            ? "text-primary font-bold scale-105"
            : "text-on-surface-variant hover:text-on-surface"
        )}
      >
        <MessageSquare className="w-5 h-5 mb-0.5" />
        Chat
        {chatUnreadCount > 0 && (
          <span className="absolute top-1 right-2.5 w-4 h-4 bg-primary text-white text-[9px] font-bold flex items-center justify-center rounded-full font-mono tabular-nums animate-badge-pop">
            {chatUnreadCount}
          </span>
        )}
      </Link>

      <Link
        href="/notifications"
        aria-label="Notifikasi"
        className={cn(
          "flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-2 rounded-lg text-[11px] font-medium relative transition-[color,transform] duration-150 active:scale-90 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none",
          pathname === "/notifications"
            ? "text-primary font-bold scale-105"
            : "text-on-surface-variant hover:text-on-surface"
        )}
      >
        <Bell className="w-5 h-5 mb-0.5" />
        Notif
        {unreadCount > 0 && (
          <span className="absolute top-1 right-2.5 w-4 h-4 bg-primary text-white text-[9px] font-bold flex items-center justify-center rounded-full font-mono tabular-nums animate-badge-pop">
            {unreadCount}
          </span>
        )}
      </Link>

      <Link
        href="/profile/me"
        aria-label="Profil Saya"
        className={cn(
          "flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-2 rounded-lg text-[11px] font-medium transition-[color,transform] duration-150 active:scale-90 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none",
          isMyProfileActive
            ? "text-primary font-bold scale-105"
            : "text-on-surface-variant hover:text-on-surface"
        )}
      >
        <User className="w-5 h-5 mb-0.5" />
        Profil
      </Link>
    </nav>
  );
}
