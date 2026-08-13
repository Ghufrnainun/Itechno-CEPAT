"use client";

import { useEffect, useState, useCallback } from "react";
import { requestFcmToken, onFcmForegroundMessage } from "@/lib/firebase/client";
import { useToast } from "@/components/ui/Toast";

export function useFCM() {
  const { showToast } = useToast();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // Register Service Worker untuk FCM
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    const configString = encodeURIComponent(JSON.stringify(firebaseConfig));

    navigator.serviceWorker
      .register(`/firebase-messaging-sw.js?firebaseConfig=${configString}`)
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

  const requestPermission = useCallback(async () => {
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
    } else {
      setPermission(Notification.permission);
    }
  }, []);

  // Listen to foreground FCM messages
  useEffect(() => {
    const unsubscribe = onFcmForegroundMessage((payload: any) => {
      const title = payload?.notification?.title || payload?.data?.title || "Notifikasi Baru";
      const body = payload?.notification?.body || payload?.data?.body || "";
      if (showToast) {
        showToast(`${title}: ${body}`);
      }
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [showToast]);

  return {
    fcmToken,
    permission,
    requestPermission,
  };
}
