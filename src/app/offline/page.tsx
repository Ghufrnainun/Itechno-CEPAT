"use client";

import React from "react";
import Image from "next/image";
import { WifiOff, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function OfflinePage() {
  const handleRetry = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface text-on-surface p-6">
      <div className="w-full max-w-md bg-surface-container-lowest border border-card-border rounded-2xl p-8 shadow-sm text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-6 relative">
          <WifiOff className="w-8 h-8 text-primary" />
          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-error rounded-full border-2 border-surface-container-lowest" />
        </div>

        <div className="flex items-center gap-2 mb-2">
          <Image
            src="/icons/icon-192x192.png"
            alt="CEPAT Logo"
            width={28}
            height={28}
            className="rounded-lg shadow-xs"
          />
          <span className="font-headline font-bold text-lg text-primary tracking-tight">
            CEPAT
          </span>
        </div>

        <h1 className="font-headline font-bold text-2xl text-on-surface mb-2">
          Koneksi Terputus
        </h1>

        <p className="text-on-surface-variant text-sm leading-relaxed mb-8">
          Perangkat Anda saat ini sedang offline. CEPAT memerlukan koneksi internet untuk memuat tugas dan pembaruan realtime di sekitar Anda.
        </p>

        <div className="w-full flex flex-col sm:flex-row gap-3">
          <Button
            variant="primary"
            fullWidth
            onClick={handleRetry}
            icon={<RotateCcw className="w-4 h-4" />}
          >
            Coba Lagi
          </Button>

          <Link href="/dashboard" className="w-full">
            <Button
              variant="secondary"
              fullWidth
              icon={<Home className="w-4 h-4" />}
            >
              Dashboard
            </Button>
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-card-border/60 w-full flex items-center justify-center gap-2 text-xs text-on-surface-variant">
          <span>Hyperlocal Micro-Tasking Platform</span>
          <span>•</span>
          <span className="font-mono text-primary">SDG 8</span>
        </div>
      </div>
    </div>
  );
}
