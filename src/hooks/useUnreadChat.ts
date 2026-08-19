"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export function useUnreadChat() {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/chat");
      if (!res.ok) {
        if (res.status === 401) {
          setIsLoading(false);
          return;
        }
        return;
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const total = data.data.reduce(
          (acc: number, room: { unreadCount?: number }) => acc + (room.unreadCount || 0),
          0
        );
        setUnreadCount(total);
      }
    } catch (err) {
      console.warn("Gagal mengambil status unread chat:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();

    const handleCustomUpdate = () => {
      fetchUnreadCount();
    };

    window.addEventListener("chat-unread-updated", handleCustomUpdate);

    const supabase = createClient();
    let channel: RealtimeChannel | null = null;
    let isMounted = true;

    async function initRealtime() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !isMounted) return;

      const uniqueChannelName = `global-chat-unread-${user.id}-${Math.random().toString(36).substring(2, 9)}`;
      channel = supabase
        .channel(uniqueChannelName)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "Message",
          },
          () => {
            if (isMounted) {
              fetchUnreadCount();
            }
          }
        )
        .subscribe();
    }

    initRealtime();

    return () => {
      isMounted = false;
      window.removeEventListener("chat-unread-updated", handleCustomUpdate);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchUnreadCount]);

  return {
    unreadCount,
    isLoading,
    refetch: fetchUnreadCount,
  };
}
