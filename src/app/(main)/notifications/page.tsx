"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useNotifications, NotificationItem } from "@/hooks/useNotifications";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export default function NotificationsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();
  const [filterTab, setFilterTab] = useState<"all" | "unread" | "read">("all");

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    showToast("Semua notifikasi ditandai sebagai dibaca.");
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "points":
      case "escrow":
      case "topup":
        return <span className="material-symbols-outlined text-secondary text-[24px]" aria-hidden="true">account_balance_wallet</span>;
      case "accept":
        return <span className="material-symbols-outlined text-primary text-[24px]" aria-hidden="true">check_circle</span>;
      case "reject":
      case "cancel":
        return <span className="material-symbols-outlined text-error text-[24px]" aria-hidden="true">cancel</span>;
      case "apply":
        return <span className="material-symbols-outlined text-amber-500 text-[24px]" aria-hidden="true">assignment_ind</span>;
      case "review":
      case "milestone":
        return <span className="material-symbols-outlined text-amber-400 text-[24px]" aria-hidden="true">star</span>;
      case "chat":
        return <span className="material-symbols-outlined text-primary text-[24px]" aria-hidden="true">chat</span>;
      default:
        return <span className="material-symbols-outlined text-outline text-[24px]" aria-hidden="true">info</span>;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: idLocale });
    } catch {
      return dateStr;
    }
  };

  const getNotificationLink = (notif: NotificationItem): string | null => {
    const data = notif.data || {};

    // 1. Direct URL/link/href in payload
    if (typeof data.url === "string" && data.url) return data.url;
    if (typeof data.link === "string" && data.link) return data.link;
    if (typeof data.href === "string" && data.href) return data.href;

    // 2. Task ID in payload
    const taskId = data.task_id || data.taskId || data.id_tasks || data.id_task;
    if (taskId && typeof taskId === "string") {
      return `/task/${taskId}`;
    }

    // 3. Fallback based on notification type
    switch (notif.type) {
      case "apply":
      case "accept":
      case "reject":
      case "cancel":
      case "progress":
        return taskId ? `/task/${taskId}` : "/history/riwayat";
      case "points":
      case "escrow":
      case "topup":
        return taskId ? `/task/${taskId}` : "/wallet";
      case "review":
      case "milestone":
        return taskId ? `/task/${taskId}` : "/profile/me";
      case "chat":
        return "/chat";
      case "welcome":
        return "/feed";
      default: {
        const titleLower = (notif.title || "").toLowerCase();
        const msgLower = (notif.message || "").toLowerCase();
        if (
          titleLower.includes("saldo") ||
          titleLower.includes("poin") ||
          titleLower.includes("escrow") ||
          msgLower.includes("escrow") ||
          msgLower.includes("poin")
        ) {
          return "/wallet";
        }
        if (
          titleLower.includes("ulasan") ||
          titleLower.includes("rating") ||
          titleLower.includes("profil")
        ) {
          return "/profile/me";
        }
        if (
          titleLower.includes("tugas") ||
          titleLower.includes("task") ||
          titleLower.includes("lamaran")
        ) {
          return "/feed";
        }
        return "/feed";
      }
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }
    const targetLink = getNotificationLink(notif);
    if (targetLink) {
      router.push(targetLink);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filterTab === "unread") return !n.isRead;
    if (filterTab === "read") return n.isRead;
    return true;
  });

  const readCount = notifications.filter((n) => n.isRead).length;

  return (
    <div className="flex flex-col h-full bg-layout-bg font-sans">
      {/* Page Header */}
      <header className="page-header shrink-0">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface font-extrabold">Notifikasi</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant font-medium">
            Tinjau pembaruan status lamaran, ulasan, dan transfer poin secara real-time.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" className="py-1.5 px-3 text-xs font-bold" onClick={handleMarkAllAsRead}>
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">done_all</span>
            Tandai Dibaca
          </Button>
        )}
      </header>

      <div className="max-w-4xl mx-auto w-full p-lg md:p-xl flex flex-col gap-lg">
        {/* Filter Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-outline-variant/60 pb-xs">
          <div className="flex items-center gap-md">
            <button
              onClick={() => setFilterTab("all")}
              className={`tab-underline font-bold ${filterTab === "all" ? "active" : ""}`}
            >
              Semua ({notifications.length})
            </button>
            <button
              onClick={() => setFilterTab("unread")}
              className={`tab-underline font-bold flex items-center gap-xs ${filterTab === "unread" ? "active" : ""}`}
            >
              Belum Dibaca
              {unreadCount > 0 && (
                <span className="bg-primary text-on-primary text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilterTab("read")}
              className={`tab-underline font-bold ${filterTab === "read" ? "active" : ""}`}
            >
              Sudah Dibaca ({readCount})
            </button>
          </div>
        </div>

        {/* Notifications Card List */}
        <div className="bg-white border border-outline-variant rounded-xl divide-y divide-outline-variant/60 overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-xl text-center py-12 flex flex-col items-center gap-sm">
              <span className="material-symbols-outlined text-primary text-[36px] animate-spin" aria-hidden="true">sync</span>
              <p className="font-body-sm text-on-surface-variant font-medium">Memuat notifikasi...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-xl text-center flex flex-col items-center gap-sm py-16">
              <span className="material-symbols-outlined text-outline text-[48px]" aria-hidden="true">notifications_off</span>
              <p className="font-headline-sm text-headline-sm text-on-surface font-bold">Tidak ada notifikasi</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {filterTab === "unread" ? "Semua notifikasi sudah Anda baca." : "Tidak ada notifikasi yang sesuai dengan filter ini."}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif: NotificationItem) => (
              <div
                key={notif.id}
                className={`group p-md flex items-start gap-md transition-all cursor-pointer hover:bg-surface-container-low/60 ${
                  notif.isRead
                    ? "bg-white"
                    : "bg-surface-container-low/40 border-l-4 border-l-primary"
                }`}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  notif.type === "points" ? "bg-secondary-container/20" :
                  notif.type === "accept" ? "bg-primary-container/15" :
                  notif.type === "apply" ? "bg-amber-50" :
                  notif.type === "review" ? "bg-amber-100/50" :
                  "bg-surface-container"
                }`}>
                  {getIcon(notif.type)}
                </div>

                <div className="flex-grow flex flex-col gap-xs overflow-hidden">
                  <div className="flex justify-between items-start gap-md">
                    <h3 className={`font-body-md text-body-md group-hover:text-primary transition-colors ${notif.isRead ? "font-semibold text-on-surface-variant" : "font-bold text-on-surface"}`}>
                      {notif.title}
                    </h3>
                    <div className="flex items-center gap-xs shrink-0">
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0"></span>
                      )}
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                        {formatTime(notif.createdAt)}
                      </span>
                    </div>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    {notif.message}
                  </p>
                </div>

                <div className="hidden sm:flex items-center text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all self-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">chevron_right</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

