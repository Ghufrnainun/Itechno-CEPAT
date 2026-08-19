import { useEffect, useRef } from "react";

export function usePresencePing(pingIntervalMs = 60000) {
  const pingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const doPing = async () => {
      try {
        await fetch("/api/users/ping", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
      } catch (error) {
        console.error("Failed to ping presence", error);
      }
    };

    // Initial ping
    doPing();

    // Set up periodic ping
    pingTimeoutRef.current = setInterval(doPing, pingIntervalMs);

    // Also ping when window becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        doPing();
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
