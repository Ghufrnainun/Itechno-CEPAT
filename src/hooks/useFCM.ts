"use client";

import { useEffect, useState } from "react";
import { requestFcmToken, onFcmForegroundMessage } from "@/lib/firebase/client";
import { useToast } from "@/components/ui/Toast";

export function useFCM() {
  const { showToast } = useToast();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // Register Service Worker untuk FCM
    navigator.serviceWorker
      .register("/firebase-messaging-sw.js")
      .then((registration) => {
        console.log("[FCM SW Registered]:", registration.scope);
      })
      .catch((err) => {
        console.warn("[FCM SW Registration Failed]:", err);
      });

    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    async function syncToken() {
      const token = await requestFcmToken();
      if (token) {
        setFcmToken(token);
        setPermission(Notification.permission);

        // Send token to backend API to save in user profile
        try {
          await fetch("/api/users/me/fcm-token", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fcm_token: token }),
          });
        } catch (err) {
          console.warn("[useFCM] Failed to sync FCM token to server:", err);
        }
      }
    }

    syncToken();
  }, []);

  // Listen to foreground FCM messages
  useEffect(() => {
    const unsubscribe = onFcmForegroundMessage((payload: any) => {
      const title = payload?.notification?.title || payload?.data?.title || "Notifikasi Baru";
      const body = payload?.notification?.body || payload?.data?.body || "";
      showToast(`${title}: ${body}`);
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [showToast]);

  return {
    fcmToken,
    permission,
  };
}
