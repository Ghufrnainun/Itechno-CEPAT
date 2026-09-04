"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export function useUnreadChat() {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Debounced version to prevent thundering herd
  const debouncedFetchUnreadCount = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      // Don't refetch if tab is in background
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchUnreadCount();
    }, 800);
  }, [fetchUnreadCount]);

  useEffect(() => {
    // Initial fetch scheduled asynchronously to prevent React 19 cascading renders
    const initialTimer = setTimeout(() => {
      fetchUnreadCount();
    }, 0);

    const handleCustomUpdate = () => {
      debouncedFetchUnreadCount();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        debouncedFetchUnreadCount();
      }
    };

    window.addEventListener("chat-unread-updated", handleCustomUpdate);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const supabase = createClient();
    let channel: RealtimeChannel | null = null;
    let isMounted = true;

    async function initRealtime() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !isMounted) return;

      const uniqueChannelName = `user-chat-unread-${user.id}-${Math.random().toString(36).substring(2, 9)}`;
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
              debouncedFetchUnreadCount();
            }
          }
        )
        .subscribe();
    }

    initRealtime();

    return () => {
      isMounted = false;
      clearTimeout(initialTimer);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      window.removeEventListener("chat-unread-updated", handleCustomUpdate);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchUnreadCount, debouncedFetchUnreadCount]);

  return {
    unreadCount,
    isLoading,
    refetch: fetchUnreadCount,
  };
}
