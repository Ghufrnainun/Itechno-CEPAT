import React from "react";
import Link from "next/link";
import { Compass, Home, Search, HelpCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-surface text-on-surface flex flex-col justify-between font-sans relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,oklch(0.48_0.10_175_/_0.08),transparent_60%)] pointer-events-none" />

      {/* Top Simple Brand Bar */}
      <header className="p-6 max-w-7xl mx-auto w-full flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center font-headline font-extrabold text-lg shadow-xs group-hover:scale-105 transition-transform">
            C
          </div>
          <span className="font-headline font-extrabold text-xl tracking-tight text-on-surface">
            CEPAT
          </span>
        </Link>
        <Link href="/bantuan" className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5 font-mono">
          <HelpCircle className="w-4 h-4" />
          Bantuan
        </Link>
      </header>

      {/* Main 404 Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        <div className="max-w-md w-full bg-surface-container-lowest border border-card-border rounded-2xl p-6 sm:p-8 shadow-lg text-center space-y-6 animate-fadeIn">
          {/* Double-Bezel Icon Container */}
          <div className="mx-auto w-20 h-20 rounded-2xl bg-surface-container-low border border-card-border p-2 flex items-center justify-center shadow-xs">
            <div className="w-full h-full rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: "12s" }} />
            </div>
          </div>

          {/* Heading & Status Code */}
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20 tracking-wider">
              ERROR 404
            </span>
            <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              Halaman Tidak Ditemukan
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              Tautan yang Anda tuju mungkin sudah dipindahkan, dihapus, atau alamat URL yang Anda masukkan salah.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <Link href="/dashboard" className="flex-1">
              <Button variant="primary" fullWidth size="md" icon={<Home className="w-4 h-4" />}>
                Ke Dashboard
              </Button>
            </Link>
            <Link href="/feed" className="flex-1">
              <Button variant="secondary" fullWidth size="md" icon={<Search className="w-4 h-4" />}>
                Cari Tugas
              </Button>
            </Link>
          </div>

          {/* Footnote Recovery Link */}
          <div className="pt-4 border-t border-card-border">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke Halaman Utama
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-5 text-center text-xs text-on-surface-variant font-mono relative z-10">
        © 2026 CEPAT — Empowering Campus Micro-Freelancing
      </footer>
    </div>
  );
}
