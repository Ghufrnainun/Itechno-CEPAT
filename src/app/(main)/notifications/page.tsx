"use client";

import React, { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: "apply" | "accept" | "points" | "system";
}

export default function NotificationsPage() {
  const { showToast } = useToast();
  
  const [filterTab, setFilterTab] = useState<"all" | "unread" | "read">("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "notif-1",
      title: "Poin Diterima! 💰",
      message: "Kompensasi sebesar 75.000 pts untuk tugas 'Foto Katalog 15 Menu Makanan' telah masuk ke saldo dompet Anda.",
      time: "10 menit yang lalu",
      isRead: false,
      type: "points",
    },
    {
      id: "notif-2",
      title: "Lamaran Diterima! 🎉",
      message: "Lamaran Anda untuk 'Input 50 Data Stok Barang' diterima oleh Toko Kelontong Makmur. Silakan mulai pengerjaan.",
      time: "2 jam yang lalu",
      isRead: false,
      type: "accept",
    },
    {
      id: "notif-3",
      title: "Pelamar Baru Masuk 📸",
      message: "Andi Wijaya melamar tugas 'Foto Katalog 15 Menu Makanan' yang Anda posting. Tinjau lamarannya sekarang.",
      time: "5 jam yang lalu",
      isRead: true,
      type: "apply",
    },
    {
      id: "notif-4",
      title: "Selamat Datang di CEPAT! 👋",
      message: "Akun Anda berhasil dikonfigurasi. Lengkapi profile untuk mencocokkan keterampilan dengan tugas di sekitar.",
      time: "1 hari yang lalu",
      isRead: true,
      type: "system",
    },
  ]);

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    showToast("Semua notifikasi ditandai sebagai dibaca.");
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "points":
        return <span className="material-symbols-outlined text-secondary text-[24px]">account_balance_wallet</span>;
      case "accept":
        return <span className="material-symbols-outlined text-primary text-[24px]">check_circle</span>;
      case "apply":
        return <span className="material-symbols-outlined text-amber-500 text-[24px]">assignment_ind</span>;
      default:
        return <span className="material-symbols-outlined text-outline text-[24px]">info</span>;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filterTab === "unread") return !n.isRead;
    if (filterTab === "read") return n.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const readCount = notifications.filter((n) => n.isRead).length;

  return (
    <div className="flex flex-col h-full bg-layout-bg font-sans">
      {/* Page Header */}
      <header className="page-header shrink-0">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface font-extrabold">Notifikasi</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant font-medium">
            Tinjau pembaruan status lamaran dan transfer poin.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" className="py-1.5 px-3 text-xs font-bold" onClick={markAllAsRead}>
            <span className="material-symbols-outlined text-[14px]">done_all</span>
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
          {filteredNotifications.length === 0 ? (
            <div className="p-xl text-center flex flex-col items-center gap-sm py-16">
              <span className="material-symbols-outlined text-outline text-[48px]">notifications_off</span>
              <p className="font-headline-sm text-headline-sm text-on-surface font-bold">Tidak ada notifikasi</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {filterTab === "unread" ? "Semua notifikasi sudah Anda baca." : "Tidak ada notifikasi yang sesuai dengan filter ini."}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-md flex items-start gap-md transition-all cursor-pointer hover:bg-surface-container-low/40 ${
                  notif.isRead
                    ? "bg-white"
                    : "bg-surface-container-low border-l-4 border-l-primary-container"
                }`}
                onClick={() => setNotifications(notifications.map((n) => n.id === notif.id ? { ...n, isRead: true } : n))}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  notif.type === "points" ? "bg-secondary-container/20" :
                  notif.type === "accept" ? "bg-primary-container/15" :
                  notif.type === "apply" ? "bg-amber-50" :
                  "bg-surface-container"
                }`}>
                  {getIcon(notif.type)}
                </div>

                <div className="flex-grow flex flex-col gap-xs overflow-hidden">
                  <div className="flex justify-between items-start gap-md">
                    <h3 className={`font-body-md text-body-md ${notif.isRead ? "font-semibold text-on-surface-variant" : "font-bold text-on-surface"}`}>
                      {notif.title}
                    </h3>
                    <div className="flex items-center gap-xs shrink-0">
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0"></span>
                      )}
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                        {notif.time}
                      </span>
                    </div>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {notif.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
