"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home, MessageSquare, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  useEffect(() => {
    // Log unexpected runtime error
    console.error("[Application Error]:", error);
  }, [error]);

  return (
    <div className="min-h-screen w-full bg-surface text-on-surface flex flex-col justify-between font-sans relative overflow-hidden p-4 sm:p-6">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,oklch(0.52_0.18_25_/_0.06),transparent_60%)] pointer-events-none" />

      {/* Brand Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center font-headline font-extrabold text-base shadow-xs">
            C
          </div>
          <span className="font-headline font-extrabold text-lg tracking-tight text-on-surface">
            CEPAT
          </span>
        </Link>
      </header>

      {/* Main Error Box */}
      <main className="flex-1 flex items-center justify-center relative z-10 py-8">
        <div className="max-w-lg w-full bg-surface-container-lowest border border-card-border rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-6 animate-fadeIn">
          {/* Icon Container */}
          <div className="mx-auto w-18 h-18 rounded-2xl bg-error-container/30 border border-error/25 p-2 flex items-center justify-center shadow-xs">
            <div className="w-full h-full rounded-xl bg-error-container/50 flex items-center justify-center text-error">
              <AlertTriangle className="w-8 h-8" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-error-container/40 text-error border border-error/20 tracking-wider uppercase">
              Terjadi Kesalahan Sistem
            </span>
            <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              Oops, Ada yang Tidak Beres
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed max-w-sm mx-auto">
              Aplikasi mengalami kendala tak terduga saat memproses permintaan Anda. Silakan coba muat ulang halaman.
            </p>
          </div>

          {/* Recovery Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="primary"
              fullWidth
              size="md"
              onClick={() => reset()}
              icon={<RotateCcw className="w-4 h-4" />}
            >
              Coba Lagi
            </Button>
            <Link href="/dashboard" className="flex-1">
              <Button
                variant="secondary"
                fullWidth
                size="md"
                icon={<Home className="w-4 h-4" />}
              >
                Ke Beranda
              </Button>
            </Link>
          </div>

          {/* Technical Details Accordion */}
          <div className="pt-3 border-t border-card-border text-left">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between text-[11px] text-on-surface-variant hover:text-on-surface font-mono py-1.5 transition-colors cursor-pointer"
            >
              <span>Rincian Teknis {error.digest && `(Digest: ${error.digest})`}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDetails ? "rotate-180" : ""}`} />
            </button>

            {showDetails && (
              <div className="mt-2 p-3 rounded-lg bg-surface-container-low border border-card-border font-mono text-[11px] text-error break-all overflow-x-auto max-h-36 custom-scrollbar leading-relaxed">
                {error.message || "An unknown client runtime error occurred."}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Support */}
      <footer className="text-center text-xs text-on-surface-variant font-mono relative z-10 flex items-center justify-center gap-4">
        <span>Butuh bantuan lebih lanjut?</span>
        <Link href="/bantuan" className="text-primary font-bold hover:underline inline-flex items-center gap-1">
          <MessageSquare className="w-3.5 h-3.5" />
          Pusat Bantuan
        </Link>
      </footer>
    </div>
  );
}
