"use client";

import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-[#0d1514] text-[#e2e8e7] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-[#162120] border border-[#233533] rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-red-950/40 border border-red-800/30 flex items-center justify-center text-red-400">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-red-950/50 text-red-400 border border-red-800/30 tracking-wider">
              CRITICAL SYSTEM ERROR
            </span>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Terjadi Kesalahan Kritis
            </h1>
            <p className="text-xs text-[#95a5a3] leading-relaxed">
              Platform mengalami gangguan fatal pada layout utama. Silakan muat ulang aplikasi.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => reset()}
              className="w-full py-3 px-4 bg-[#0F766E] hover:bg-[#115e59] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md active:scale-98"
            >
              <RotateCcw className="w-4 h-4" />
              Muat Ulang Aplikasi
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
