"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface NotificationItem {
  id: string;
  userId: string;
  type: "apply" | "accept" | "points" | "review" | "system";
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/notifications");
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

      const channelName = `user-notifications-${user.id}`;
      
      // Hapus channel lama jika ada
      const existingChannel = supabase.getChannels().find((ch) => ch.topic === `realtime:${channelName}`);
      if (existingChannel) {
        await supabase.removeChannel(existingChannel);
      }

      if (!isMounted) return;

      const channelName = `user-notifications-${user.id}-${Math.random().toString(36).substring(2, 9)}`;
      channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "Notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (!isMounted) return;
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
    isLoading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
