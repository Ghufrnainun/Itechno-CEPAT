"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

const ROTATING_WORDS = ["foto produk", "input data", "jaga booth", "survei lapangan"];

export function HeroSection() {
  const [wordIndex, setWordIndex] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [reduce]);

  return (
    <section className="relative min-h-[100dvh] flex flex-col items-center justify-center px-4 md:px-6 pt-24 pb-16 overflow-hidden">
      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center text-center gap-6">
        {/* Announcement badge */}
        <div
          className="animate-appear"
          style={{ animationDelay: "0ms" }}
        >
          <Link
            href="#dampak-sdg"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-outline-variant bg-white/60 backdrop-blur-sm text-sm text-on-surface-variant hover:bg-white/80 transition-colors group"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="font-medium">ITechno Cup 2026</span>
            <span className="text-outline">•</span>
            <span>SDG 8 Project</span>
            <span className="material-symbols-outlined text-[14px] group-hover:translate-x-0.5 transition-transform" aria-hidden="true">
              arrow_forward
            </span>
          </Link>
        </div>

        {/* Headline with word rotator */}
        <div
          className="animate-appear"
          style={{ animationDelay: "150ms" }}
        >
          <h1 className="font-headline-xl text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-[-0.03em] leading-[1.05] text-on-surface">
            Tugas kecil di sekitar kampus,
            <br className="hidden sm:block" />
            <span className="relative inline-block">
              mulai dari{" "}
              <span className="relative inline-flex overflow-hidden align-bottom h-[1.1em]">
                {/* Invisible spacer to perfectly set container width to the longest word without hardcoding pixels */}
                <span className="invisible whitespace-nowrap opacity-0 pointer-events-none">
                  survei lapangan
                </span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={ROTATING_WORDS[wordIndex]}
                    initial={reduce ? false : { y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={reduce ? undefined : { y: -30, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute left-0 text-primary whitespace-nowrap"
                  >
                    {ROTATING_WORDS[wordIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </span>
          </h1>
        </div>

        {/* Subtitle */}
        <p
          className="animate-appear text-base md:text-lg text-on-surface-variant max-w-[560px] leading-relaxed"
          style={{ animationDelay: "300ms" }}
        >
          CEPAT menghubungkan mahasiswa dengan UMKM lokal yang butuh bantuan
          cepat — langsung di sekitar kampus, tanpa perlu buang waktu di jalan.
        </p>

        {/* CTAs */}
        <div
          className="animate-appear flex flex-col sm:flex-row gap-3 w-full sm:w-auto pt-2"
          style={{ animationDelay: "500ms" }}
        >
          <Link href="/task/new" className="block w-full sm:flex-1">
            <button
              type="button"
              className="w-full group bg-primary text-on-primary font-bold px-5 py-3 rounded-lg hover:bg-primary-container transition-colors flex items-center justify-center gap-3 min-h-[52px] shadow-sm cursor-pointer"
            >
              <span className="whitespace-nowrap">Post Tugas UMKM</span>
              <span className="w-8 h-8 rounded-md bg-black/15 flex items-center justify-center group-hover:translate-x-0.5 transition-all shrink-0">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">add</span>
              </span>
            </button>
          </Link>
          <Link href="/feed" className="block w-full sm:flex-1">
            <button
              type="button"
              className="w-full group bg-white border border-outline-variant text-on-surface font-bold px-5 py-3 rounded-lg hover:bg-surface-container-low transition-colors flex items-center justify-center gap-3 min-h-[52px] cursor-pointer shadow-2xs"
            >
              <span className="whitespace-nowrap">Cari Tugas Terdekat</span>
              <span className="w-8 h-8 rounded-md bg-black/5 flex items-center justify-center group-hover:translate-x-0.5 transition-all shrink-0">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">search</span>
              </span>
            </button>
          </Link>
        </div>

        {/* App Mockup Preview - Double Bezel Architecture */}
        <div
          className="animate-appear animate-float w-full max-w-[680px] mt-10"
          style={{ animationDelay: "700ms" }}
        >
          {/* Outer Shell */}
          <div className="p-1.5 md:p-2 rounded-2xl bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 shadow-lg">
            {/* Inner Core */}
            <div className="rounded-xl border border-white/40 dark:border-white/10 bg-white overflow-hidden shadow-[inset_0_1px_2px_rgba(255,255,255,0.8)]">
              {/* App Header */}
              <div className="px-5 py-3.5 border-b border-outline-variant bg-surface-container-lowest flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-primary text-[18px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                   aria-hidden="true">
                    location_on
                  </span>
                  <span className="text-sm font-semibold text-on-surface tracking-tight">Semarang, ID</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-on-surface-variant font-mono">Area Kampus</span>
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center border border-outline-variant shadow-sm">
                    <span className="material-symbols-outlined text-primary text-[16px]" aria-hidden="true">person</span>
                  </div>
                </div>
              </div>
  
              {/* Mini Radar Map */}
              <div className="h-[140px] relative bg-surface-container-high overflow-hidden">
                <svg className="w-full h-full absolute inset-0" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="heroGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#DDE7E1" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="#EEF5EF" />
                  <rect width="100%" height="100%" fill="url(#heroGrid)" />
                  <line x1="0" y1="70" x2="680" y2="70" stroke="#C8D8C4" strokeWidth="6" />
                  <line x1="340" y1="0" x2="340" y2="140" stroke="#C8D8C4" strokeWidth="6" />
                  <circle cx="340" cy="70" r="56" fill="rgba(15,118,110,0.04)" stroke="rgba(15,118,110,0.3)" strokeWidth="1.5" strokeDasharray="4 4" />
                  <circle cx="340" cy="70" r="8" fill="#0F766E" stroke="white" strokeWidth="2.5" />
                  <circle cx="340" cy="70" r="18" fill="rgba(15,118,110,0.15)" />
                  <circle cx="410" cy="40" r="5" fill="#84CC16" stroke="white" strokeWidth="1.5" />
                  <circle cx="260" cy="90" r="5" fill="#0F766E" stroke="white" strokeWidth="1.5" />
                  <circle cx="380" cy="110" r="5" fill="#D97706" stroke="white" strokeWidth="1.5" />
                </svg>
                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md border border-outline-variant rounded-xl px-2.5 py-1.5 flex items-center gap-2 shadow-sm">
                  <span className="pulse-dot w-2 h-2 rounded-full bg-primary inline-block" />
                  <span className="text-[11px] font-bold tracking-wide uppercase text-on-surface">Radar Aktif</span>
                </div>
              </div>
  
              {/* Task Preview Cards */}
              <div className="p-4 flex flex-col gap-3 bg-layout-bg">
                {/* Active Card (Level 2 Interaction / Focus) */}
                <div className="bg-white border-2 border-primary rounded-xl p-4 shadow-[0_4px_16px_rgba(15,118,110,0.12)] ring-4 ring-offset-2 ring-primary/10 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-headline-sm text-on-surface leading-tight">Foto Katalog 15 Menu Makanan</h3>
                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">location_on</span>
                      <span className="text-xs text-on-surface-variant font-mono font-medium">0.8 km</span>
                    </div>
                  </div>
                  <p className="text-sm text-on-surface-variant mb-3">Waroeng Bu Sri • Butuh foto rapi untuk menu online.</p>
                  <div className="flex justify-between items-end border-t border-outline-variant pt-3 mt-1">
                    <span className="text-base font-bold text-on-surface font-mono tracking-tight">Rp75.000</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] font-bold font-mono uppercase tracking-wider">
                      <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">handshake</span>
                      Decent Work
                    </span>
                  </div>
                </div>
  
                {/* Standard Card (Level 1 Surface) */}
                <div className="bg-white border border-outline-variant rounded-xl p-4 opacity-70">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-headline-sm text-on-surface leading-tight">Input 50 Data Stok Barang</h3>
                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant" aria-hidden="true">location_on</span>
                      <span className="text-xs text-on-surface-variant font-mono font-medium">2.5 km</span>
                    </div>
                  </div>
                  <p className="text-sm text-on-surface-variant">Toko Kelontong Makmur</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
