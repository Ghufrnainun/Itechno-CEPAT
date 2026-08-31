"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useNotifications, NotificationItem } from "@/hooks/useNotifications";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Wallet,
  CheckCircle2,
  XCircle,
  UserCheck,
  Star,
  MessageSquare,
  Info,
  CheckCheck,
  BellOff,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
        return <Wallet className="w-5 h-5 text-secondary" />;
      case "accept":
        return <CheckCircle2 className="w-5 h-5 text-primary" />;
      case "reject":
      case "cancel":
        return <XCircle className="w-5 h-5 text-error" />;
      case "apply":
        return <UserCheck className="w-5 h-5 text-amber-500" />;
      case "review":
      case "milestone":
        return <Star className="w-5 h-5 text-amber-400 fill-amber-400" />;
      case "chat":
        return <MessageSquare className="w-5 h-5 text-primary" />;
      default:
        return <Info className="w-5 h-5 text-on-surface-variant" />;
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

    if (typeof data.url === "string" && data.url) return data.url;
    if (typeof data.link === "string" && data.link) return data.link;
    if (typeof data.href === "string" && data.href) return data.href;

    const taskId = data.task_id || data.taskId || data.id_tasks || data.id_task;
    if (taskId && typeof taskId === "string") {
      return `/task/${taskId}`;
    }

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
        return "/cari-tugas";
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
          return "/cari-tugas";
        }
        return "/cari-tugas";
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
    <div className="flex flex-col h-full bg-surface font-sans">
      {/* Page Header */}
      <header className="page-header shrink-0 bg-surface-container-lowest border-b border-card-border px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
        <div>
          <h1 className="font-headline text-xl sm:text-2xl text-on-surface font-extrabold tracking-tight">Notifikasi</h1>
          <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant font-medium mt-0.5 hidden sm:block">
            Tinjau pembaruan status lamaran, ulasan, dan transfer poin secara real-time.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkAllAsRead}
            icon={<CheckCheck className="w-4 h-4" />}
          >
            Tandai Dibaca
          </Button>
        )}
      </header>

      {/* Main Content with Scroll Container & Clearance */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto w-full p-4 md:p-6 lg:p-8 flex flex-col gap-5 pb-36 lg:pb-12">
        {/* Filter Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-card-border pb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFilterTab("all")}
              className={cn(
                "tab-underline font-bold text-xs py-1.5 px-2 cursor-pointer transition-colors duration-150",
                filterTab === "all" ? "text-primary active" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              Semua ({notifications.length})
            </button>
            <button
              onClick={() => setFilterTab("unread")}
              className={cn(
                "tab-underline font-bold text-xs py-1.5 px-2 flex items-center gap-1.5 cursor-pointer transition-colors duration-150",
                filterTab === "unread" ? "text-primary active" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              Belum Dibaca
              {unreadCount > 0 && (
                <span className="bg-primary text-on-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono tabular-nums">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilterTab("read")}
              className={cn(
                "tab-underline font-bold text-xs py-1.5 px-2 cursor-pointer transition-colors duration-150",
                filterTab === "read" ? "text-primary active" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              Sudah Dibaca ({readCount})
            </button>
          </div>
        </div>

        {/* Notifications Card List */}
        <div className="bg-surface-container-lowest border border-card-border rounded-xl divide-y divide-card-border overflow-hidden shadow-xs">
          {isLoading ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
              <p className="font-body-sm text-xs text-on-surface-variant font-medium">Memuat notifikasi...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant">
                <BellOff className="w-6 h-6" />
              </div>
              <p className="font-headline text-sm font-bold text-on-surface">Tidak ada notifikasi</p>
              <p className="font-body-sm text-xs text-on-surface-variant max-w-xs">
                {filterTab === "unread" ? "Semua notifikasi sudah Anda baca." : "Tidak ada notifikasi yang sesuai dengan filter ini."}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif: NotificationItem) => (
              <div
                key={notif.id}
                className={cn(
                  "group p-4 flex items-start gap-3.5 transition-[background-color] duration-150 cursor-pointer hover:bg-surface-container-low/60",
                  notif.isRead
                    ? "bg-surface-container-lowest"
                    : "bg-primary/5 border-l-3 border-l-primary"
                )}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-card-border/40",
                  notif.type === "points" ? "bg-secondary-container/40" :
                  notif.type === "accept" ? "bg-primary/10" :
                  notif.type === "apply" ? "bg-amber-500/10" :
                  notif.type === "review" ? "bg-amber-500/10" :
                  "bg-surface-container"
                )}>
                  {getIcon(notif.type)}
                </div>

                <div className="flex-grow flex flex-col gap-1 overflow-hidden min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className={cn(
                      "font-body-md text-xs group-hover:text-primary transition-colors duration-150 leading-snug",
                      notif.isRead ? "font-semibold text-on-surface-variant" : "font-bold text-on-surface"
                    )}>
                      {notif.title}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                      <span className="font-mono text-[10px] text-on-surface-variant shrink-0 tabular-nums">
                        {formatTime(notif.createdAt)}
                      </span>
                    </div>
                  </div>
                  <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                    {notif.message}
                  </p>
                </div>

                <div className="hidden sm:flex items-center text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-[opacity,transform] duration-150 self-center shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
