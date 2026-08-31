"use client";

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

// Global reference for the beforeinstallprompt event
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notifyListeners();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    try {
      localStorage.setItem("cepat_pwa_installed", "true");
    } catch {}
    notifyListeners();
  });
}

export function usePwaInstall() {
  const [isMounted, setIsMounted] = useState(false);
  const [hasPrompt, setHasPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const checkStatus = useCallback(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes("android-app://");

    let installed = false;
    try {
      installed = localStorage.getItem("cepat_pwa_installed") === "true";
    } catch {}

    setIsStandalone(standalone);
    setIsInstalled(installed || standalone);
    setHasPrompt(Boolean(deferredPrompt));
  }, []);

  useEffect(() => {
    setIsMounted(true);
    checkStatus();

    const handlePromptChange = () => {
      checkStatus();
    };

    listeners.add(handlePromptChange);

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleMediaChange = () => checkStatus();
    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      listeners.delete(handlePromptChange);
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, [checkStatus]);

  const promptInstall = async (): Promise<{ outcome: "accepted" | "dismissed" | "unsupported" }> => {
    if (!deferredPrompt) {
      return { outcome: "unsupported" };
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        deferredPrompt = null;
        try {
          localStorage.setItem("cepat_pwa_installed", "true");
        } catch {}
        setIsInstalled(true);
        notifyListeners();
      }
      return choiceResult;
    } catch (err) {
      console.error("[PWA] Installation prompt error:", err);
      return { outcome: "dismissed" };
    }
  };

  return {
    isMounted,
    isStandalone,
    isInstalled,
    canInstall: isMounted && !isStandalone && !isInstalled,
    hasNativePrompt: hasPrompt,
    promptInstall,
  };
}
