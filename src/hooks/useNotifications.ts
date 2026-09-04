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

import { triggerHaptic } from "@/lib/utils/haptics";

// Module-level in-memory SWR cache for instant zero-latency page transitions
let cachedNotifications: NotificationItem[] = [];
let cachedUnreadCount = 0;
let cachedTotalCount = 0;
let hasLoadedNotificationsOnce = false;
let activeFetchPromise: Promise<void> | null = null;
let cachedPrismaUserId: string | null = null;

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(cachedNotifications);
  const [unreadCount, setUnreadCount] = useState<number>(cachedUnreadCount);
  const [totalCount, setTotalCount] = useState<number>(cachedTotalCount);
  const [isLoading, setIsLoading] = useState<boolean>(!hasLoadedNotificationsOnce);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (showLoading = false) => {
    if (activeFetchPromise) {
      return activeFetchPromise;
    }

    if (showLoading && !hasLoadedNotificationsOnce) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    activeFetchPromise = (async () => {
      try {
        const res = await fetch("/api/notifications?limit=100");
        if (!res.ok) {
          if (res.status === 401) {
            setIsLoading(false);
            return;
          }
          throw new Error("Gagal mengambil notifikasi.");
        }

        const data = await res.json();
        if (data.success) {
          const items = data.data || [];
          const unread = data.unreadCount || 0;
          const total = data.totalCount || items.length;

          cachedNotifications = items;
          cachedUnreadCount = unread;
          cachedTotalCount = total;
          hasLoadedNotificationsOnce = true;

          setNotifications(items);
          setUnreadCount(unread);
          setTotalCount(total);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
        setError(msg);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        activeFetchPromise = null;
      }
    })();

    return activeFetchPromise;
  }, []);

  const markAsRead = async (id: string) => {
    triggerHaptic("light");
    cachedNotifications = cachedNotifications.map((n) =>
      n.id === id ? { ...n, isRead: true } : n
    );
    cachedUnreadCount = Math.max(0, cachedUnreadCount - 1);
    setNotifications(cachedNotifications);
    setUnreadCount(cachedUnreadCount);

    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    } catch (err) {
      console.warn("Gagal menandai notifikasi dibaca di server:", err);
    }
  };

  const markAllAsRead = async () => {
    triggerHaptic("success");
    cachedNotifications = cachedNotifications.map((n) => ({ ...n, isRead: true }));
    cachedUnreadCount = 0;
    setNotifications(cachedNotifications);
    setUnreadCount(0);

    try {
      await fetch("/api/notifications/read-all", { method: "PATCH" });
    } catch (err) {
      console.warn("Gagal menandai semua notifikasi dibaca di server:", err);
    }
  };

  // Window Focus & Visibility Change Revalidation
  useEffect(() => {
    const handleRevalidate = () => {
      if (document.visibilityState === "visible") {
        fetchNotifications(false);
      }
    };
    window.addEventListener("focus", handleRevalidate);
    document.addEventListener("visibilitychange", handleRevalidate);
    return () => {
      window.removeEventListener("focus", handleRevalidate);
      document.removeEventListener("visibilitychange", handleRevalidate);
    };
  }, [fetchNotifications]);

  // Setup Supabase Realtime Listener
  useEffect(() => {
    fetchNotifications();

    const supabase = createClient();
    let channel: RealtimeChannel | null = null;
    let isMounted = true;

    async function initRealtime() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;

      // Ambil Prisma user_id (berbeda dengan Supabase auth user.id), gunakan cache jika ada
      let prismaUserId: string | null = cachedPrismaUserId;
      if (!prismaUserId) {
        try {
          const res = await fetch("/api/users/me");
          if (res.ok) {
            const json = await res.json();
            prismaUserId = json.data?.id_user || null;
            cachedPrismaUserId = prismaUserId;
          }
        } catch (_) { /* fallback: realtime won't work but app still functional */ }
      }

      if (!prismaUserId || !isMounted) return;

      const channelName = `user-notifications-${prismaUserId}`;
      
      // Hapus channel lama jika ada
      const existingChannel = supabase.getChannels().find((ch: any) => ch.topic === `realtime:${channelName}`);
      if (existingChannel) {
        await supabase.removeChannel(existingChannel);
      }

      if (!isMounted) return;

      const uniqueChannelName = `user-notifications-${prismaUserId}-${Math.random().toString(36).substring(2, 9)}`;
      channel = supabase
        .channel(uniqueChannelName)
        .on(
          "postgres_changes" as any,
          {
            event: "*",
            schema: "public",
            table: "Notifications",
            filter: `user_id=eq.${prismaUserId}`,
          },
          (payload: any) => {
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

              cachedNotifications = [formatted, ...cachedNotifications.filter(n => n.id !== formatted.id)];
              cachedUnreadCount += 1;
              cachedTotalCount += 1;

              setNotifications([...cachedNotifications]);
              setUnreadCount(cachedUnreadCount);
              setTotalCount(cachedTotalCount);
              triggerHaptic("medium");
            } else if (payload.eventType === 'UPDATE') {
              const updated = payload.new as any;
              const targetId = updated.id_notifications || updated.id;
              
              const isCurrentlyUnread = cachedNotifications.find(n => n.id === targetId)?.isRead === false;
              if (isCurrentlyUnread && updated.is_read) {
                cachedUnreadCount = Math.max(0, cachedUnreadCount - 1);
              }

              cachedNotifications = cachedNotifications.map(n => n.id === targetId ? { ...n, isRead: updated.is_read } : n);
              setNotifications([...cachedNotifications]);
              setUnreadCount(cachedUnreadCount);
            }
          }
        );

      channel?.subscribe();
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
    isRefreshing,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
