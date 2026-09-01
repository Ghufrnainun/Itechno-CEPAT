"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { usePwaInstall } from "@/hooks/usePwaInstall";

export function PwaInstallBanner() {
  const { isMounted, isStandalone, isInstalled, hasNativePrompt, promptInstall } = usePwaInstall();
  const [isDismissed, setIsDismissed] = useState(true); // Default true to avoid any flash on render

  useEffect(() => {
    if (!isMounted) return;

    // Check if user dismissed the banner
    try {
      const sessionDismissed = sessionStorage.getItem("cepat_pwa_banner_dismissed");
      const localDismissedAt = localStorage.getItem("cepat_pwa_banner_dismissed_at");

      if (sessionDismissed === "true") {
        setIsDismissed(true);
        return;
      }

      if (localDismissedAt) {
        const days = (Date.now() - parseInt(localDismissedAt, 10)) / (1000 * 60 * 60 * 24);
        if (days < 2) {
          setIsDismissed(true);
          return;
        }
      }

      // If not dismissed, not installed, not standalone, and native prompt is available
      if (!isStandalone && !isInstalled && hasNativePrompt) {
        setIsDismissed(false);
      }
    } catch {
      setIsDismissed(true);
    }
  }, [isMounted, isStandalone, isInstalled, hasNativePrompt]);

  const handleInstallClick = async () => {
    setIsDismissed(true);
    const result = await promptInstall();
    if (result.outcome === "accepted") {
      try {
        localStorage.setItem("cepat_pwa_installed", "true");
      } catch {}
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem("cepat_pwa_banner_dismissed", "true");
      localStorage.setItem("cepat_pwa_banner_dismissed_at", Date.now().toString());
    } catch {}
  };

  // Do not render if not mounted, is standalone PWA, is already installed, is dismissed, or no prompt
  if (!isMounted || isStandalone || isInstalled || isDismissed || !hasNativePrompt) {
    return null;
  }

  return (
    <aside
      aria-label="Pasang Aplikasi CEPAT"
      className="fixed bottom-[88px] lg:bottom-6 left-4 right-4 lg:left-auto lg:right-6 lg:w-96 bg-surface-container-lowest border border-card-border shadow-xl rounded-2xl p-4 z-40 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 font-sans"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-container p-1 shrink-0 flex items-center justify-center border border-card-border/60">
            <Image
              src="/icons/icon-192x192.png"
              alt="CEPAT Icon"
              width={32}
              height={32}
              className="rounded-lg object-contain"
            />
          </div>
          <div>
            <h3 className="font-headline font-bold text-sm text-on-surface flex items-center gap-1.5">
              <Download className="w-4 h-4 text-primary shrink-0" />
              Pasang Aplikasi CEPAT
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5 leading-tight">
              Akses instan dari layar utama tanpa buka browser.
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-on-surface-variant hover:text-on-surface p-1 rounded-md hover:bg-surface-container transition-colors cursor-pointer"
          aria-label="Tutup banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1 border-t border-card-border/40">
        <button
          onClick={handleDismiss}
          className="text-on-surface-variant hover:text-on-surface px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
        >
          Nanti Saja
        </button>
        <Button
          size="sm"
          variant="primary"
          onClick={handleInstallClick}
          icon={<Download className="w-3.5 h-3.5" />}
        >
          Pasang Sekarang
        </Button>
      </div>
    </aside>
  );
}
