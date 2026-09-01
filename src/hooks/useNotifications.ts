"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface NotificationItem {
  id: string;
  userId: string;
  type: "apply" | "accept" | "reject" | "cancel" | "progress" | "points" | "review" | "system" | "welcome" | "escrow" | "chat" | "reminder" | "milestone" | "topup";
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/notifications?limit=100");
      if (!res.ok) {
        if (res.status === 401) {
          // User tidak logged in, stop silently
          setIsLoading(false);
          return;
        }
        throw new Error("Gagal mengambil notifikasi.");
      }

      const data = await res.json();
      if (data.success) {
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
        setTotalCount(data.totalCount || (data.data || []).length);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    } catch (err) {
      console.warn("Gagal menandai notifikasi dibaca di server:", err);
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await fetch("/api/notifications/read-all", { method: "PATCH" });
    } catch (err) {
      console.warn("Gagal menandai semua notifikasi dibaca di server:", err);
    }
  };

  // Setup Supabase Realtime Listener
  useEffect(() => {
    fetchNotifications();

    const supabase = createClient();
    let channel: RealtimeChannel | null = null;
    let isMounted = true;

    async function initRealtime() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;

      // Ambil Prisma user_id (berbeda dengan Supabase auth user.id)
      let prismaUserId: string | null = null;
      try {
        const res = await fetch("/api/users/me");
        if (res.ok) {
          const json = await res.json();
          prismaUserId = json.data?.id_user || null;
        }
      } catch (_) { /* fallback: realtime won't work but app still functional */ }

      if (!prismaUserId || !isMounted) return;

      const channelName = `user-notifications-${prismaUserId}`;
      
      // Hapus channel lama jika ada
      const existingChannel = supabase.getChannels().find((ch) => ch.topic === `realtime:${channelName}`);
      if (existingChannel) {
        await supabase.removeChannel(existingChannel);
      }

      if (!isMounted) return;

      const uniqueChannelName = `user-notifications-${prismaUserId}-${Math.random().toString(36).substring(2, 9)}`;
      channel = supabase
        .channel(uniqueChannelName)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "Notifications",
            filter: `user_id=eq.${prismaUserId}`,
          },
          (payload) => {
            if (!isMounted) return;
            
            if (payload.eventType === 'INSERT') {
              const newNotif = payload.new as any;
              const formatted: NotificationItem = {
                id: newNotif.id_notifications || newNotif.id,
                userId: newNotif.user_id,
                type: newNotif.type || "system",
                title: newNotif.title,
                message: newNotif.message,
                data: newNotif.data,
                isRead: newNotif.is_read || false,
                createdAt: newNotif.created_at || new Date().toISOString(),
              };

              setNotifications((prev) => [formatted, ...prev]);
              setUnreadCount((prev) => prev + 1);
            } else if (payload.eventType === 'UPDATE') {
              const updated = payload.new as any;
              const targetId = updated.id_notifications || updated.id;
              
              setNotifications((prev) => {
                const isCurrentlyUnread = prev.find(n => n.id === targetId)?.isRead === false;
                
                // Jika dari belum dibaca menjadi dibaca
                if (isCurrentlyUnread && updated.is_read) {
                  setUnreadCount((count) => Math.max(0, count - 1));
                }
                
                return prev.map(n => n.id === targetId ? { ...n, isRead: updated.is_read } : n);
              });
            }
          }
        );

      channel.subscribe();
    }

    initRealtime();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    totalCount,
    readCount: Math.max(0, totalCount - unreadCount),
    isLoading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
