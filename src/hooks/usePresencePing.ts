import { useEffect, useRef } from "react";

const PING_STORAGE_KEY = "itechno_last_presence_ping";
const MIN_PING_COOLDOWN_MS = 120000; // 2 menit

// Default interval: 3 menit (180.000 ms), cooldown minimal: 2 menit (120.000 ms)
export function usePresencePing(pingIntervalMs = 180000) {
  const pingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPingTimeRef = useRef<number>(0);
  const isPingingRef = useRef<boolean>(false);

  useEffect(() => {
    const doPing = async (force = false) => {
      const now = Date.now();
      const lastStoredPing = typeof window !== "undefined" 
        ? Number(sessionStorage.getItem(PING_STORAGE_KEY) || 0)
        : 0;
      const effectiveLastPing = Math.max(lastPingTimeRef.current, lastStoredPing);

      // Jangan ping jika jeda dari ping terakhir belum mencapai cooldown
      if (!force && now - effectiveLastPing < MIN_PING_COOLDOWN_MS) {
        return;
      }
      // Bahkan jika force (initial mount), jangan spam jika baru saja ping < 2 menit lalu di session ini
      if (force && effectiveLastPing > 0 && now - effectiveLastPing < MIN_PING_COOLDOWN_MS) {
        return;
      }
      if (isPingingRef.current) return;

      isPingingRef.current = true;
      lastPingTimeRef.current = now;
      if (typeof window !== "undefined") {
        sessionStorage.setItem(PING_STORAGE_KEY, String(now));
      }

      try {
        await fetch("/api/users/ping", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
      } catch (error) {
        console.error("Failed to ping presence", error);
      } finally {
        isPingingRef.current = false;
      }
    };

    // Initial ping (tunduk pada pengecekan cooldown sessionStorage)
    doPing(true);

    // Set up periodic ping
    pingTimeoutRef.current = setInterval(() => doPing(false), pingIntervalMs);

    // Ping saat window kembali visible, namun tetap tunduk pada cooldown 2 menit
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        doPing(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (pingTimeoutRef.current) {
        clearInterval(pingTimeoutRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pingIntervalMs]);
}

