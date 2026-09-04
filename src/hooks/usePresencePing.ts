import { useEffect, useRef } from "react";

// Default interval: 3 menit (180.000 ms), cooldown minimal: 2 menit (120.000 ms)
export function usePresencePing(pingIntervalMs = 180000) {
  const pingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPingTimeRef = useRef<number>(0);
  const isPingingRef = useRef<boolean>(false);

  useEffect(() => {
    const MIN_PING_COOLDOWN_MS = 120000; // 2 menit

    const doPing = async (force = false) => {
      const now = Date.now();
      // Jangan ping jika jeda dari ping terakhir belum mencapai cooldown (kecuali initial/force)
      if (!force && now - lastPingTimeRef.current < MIN_PING_COOLDOWN_MS) {
        return;
      }
      if (isPingingRef.current) return;

      isPingingRef.current = true;
      lastPingTimeRef.current = now;

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

    // Initial ping
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

