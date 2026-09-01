"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ArrowRight, Plus, Search, MapPin, User, Handshake } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Cursor } from "@/components/ui/Cursor";
import { cn } from "@/lib/utils";

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
      {/* Ambient Background Glows */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-start justify-center">
        <div className="absolute top-[-10%] w-[800px] h-[600px] bg-primary/10 rounded-full blur-[100px] opacity-60" />
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[80px] opacity-40" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] opacity-50" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center text-center gap-6">
        {/* Announcement badge */}
        <div
          className="animate-appear"
          style={{ animationDelay: "0ms" }}
        >
          <a
            href="#dampak-sdg"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-card-border bg-surface-container-lowest/80 backdrop-blur-sm text-xs text-on-surface-variant hover:bg-surface-container-low transition-colors duration-150 group shadow-xs"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="font-semibold text-on-surface">ITechno Cup 2026</span>
            <span className="text-outline-variant">•</span>
            <span>SDG 8 Project</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150" aria-hidden="true" />
          </a>
        </div>

        {/* Headline with word rotator */}
        <div
          className="animate-appear"
          style={{ animationDelay: "150ms" }}
        >
          <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.08] text-on-surface">
            Tugas kecil di sekitar kampus,
            <br className="hidden sm:block" />
            <span className="relative inline-block mt-1 sm:mt-0">
              mulai dari{" "}
              <span className="relative inline-flex overflow-hidden align-bottom h-[1.15em]">
                {/* Invisible spacer to perfectly set container width */}
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
          className="animate-appear text-sm md:text-base text-on-surface-variant max-w-[560px] leading-relaxed font-sans"
          style={{ animationDelay: "300ms" }}
        >
          CEPAT menghubungkan mahasiswa dengan UMKM lokal yang butuh bantuan
          cepat, langsung di sekitar kampus, tanpa perlu buang waktu di jalan.
        </p>

        {/* CTAs */}
        <div
          className="animate-appear flex flex-col sm:flex-row gap-3 w-full sm:w-auto pt-2"
          style={{ animationDelay: "500ms" }}
        >
          <Link href="/register?role=requester" className="block w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              className="w-full min-h-[48px] px-6 text-sm"
              icon={<Plus className="w-4 h-4" aria-hidden="true" />}
            >
              Post Tugas UMKM
            </Button>
          </Link>
          <Link href="/register?role=worker" className="block w-full sm:w-auto">
            <Button
              variant="secondary"
              size="lg"
              className="w-full min-h-[48px] px-6 text-sm"
              icon={<Search className="w-4 h-4" aria-hidden="true" />}
            >
              Cari Tugas Terdekat
            </Button>
          </Link>
        </div>

        {/* App Mockup Preview - Double Bezel Architecture */}
        <div
          className="animate-appear animate-float w-full max-w-[680px] mt-6 md:mt-10"
          style={{ animationDelay: "700ms" }}
        >
          {/* Outer Shell */}
          <Link href="/register" className="relative block p-1.5 md:p-2 rounded-2xl bg-surface-container-low border border-card-border shadow-md cursor-none overflow-hidden group">
            
            <Cursor
              attachToParent
              variants={{
                initial: { scale: 0.3, opacity: 0 },
                animate: { scale: 1, opacity: 1 },
                exit: { scale: 0.3, opacity: 0 },
              }}
              transition={{
                ease: 'easeInOut',
                duration: 0.15,
              }}
            >
              <div className="bg-primary/90 text-on-primary text-xs font-mono px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap backdrop-blur-md border border-primary-container font-semibold flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" />
                <span>Cari Tugas</span>
              </div>
            </Cursor>

            {/* Inner Core */}
            <div className="rounded-xl border border-card-border bg-surface-container-lowest overflow-hidden shadow-xs">
              {/* App Header */}
              <div className="px-5 py-3 border-b border-card-border bg-surface-container-low flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary fill-primary/20" aria-hidden="true" />
                  <span className="text-xs font-bold text-on-surface tracking-tight font-sans">Semarang, ID</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-on-surface-variant font-mono">Area Kampus</span>
                  <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center border border-card-border">
                    <User className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                  </div>
                </div>
              </div>
  
              {/* Mini Radar Map */}
              <div className="h-[140px] relative bg-surface-container overflow-hidden">
                <svg className="w-full h-full absolute inset-0" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="heroGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" className="text-card-border" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="currentColor" className="text-surface-container-low" />
                  <rect width="100%" height="100%" fill="url(#heroGrid)" />
                  <line x1="0" y1="70" x2="680" y2="70" stroke="currentColor" className="text-card-border" strokeWidth="4" />
                  <line x1="340" y1="0" x2="340" y2="140" stroke="currentColor" className="text-card-border" strokeWidth="4" />
                  <circle cx="340" cy="70" r="56" fill="rgba(15,118,110,0.05)" stroke="rgba(15,118,110,0.3)" strokeWidth="1.5" strokeDasharray="4 4" />
                  <circle cx="340" cy="70" r="8" fill="var(--primary, #0F766E)" stroke="white" strokeWidth="2.5" />
                  <circle cx="340" cy="70" r="18" fill="rgba(15,118,110,0.15)" />
                  <circle cx="410" cy="40" r="5" fill="var(--secondary, #3B82F6)" stroke="white" strokeWidth="1.5" />
                  <circle cx="260" cy="90" r="5" fill="var(--primary, #0F766E)" stroke="white" strokeWidth="1.5" />
                  <circle cx="380" cy="110" r="5" fill="#D97706" stroke="white" strokeWidth="1.5" />
                </svg>
                <div className="absolute top-3 left-3 bg-surface-container-lowest/95 backdrop-blur-md border border-card-border rounded-lg px-2.5 py-1 flex items-center gap-1.5 shadow-xs">
                  <span className="pulse-dot w-2 h-2 rounded-full bg-primary inline-block" />
                  <span className="text-xs font-bold tracking-wide uppercase text-on-surface font-mono">Radar Aktif</span>
                </div>
              </div>
  
              {/* Task Preview Cards */}
              <div className="p-3.5 flex flex-col gap-2.5 bg-surface-container-low text-left">
                {/* Active Card */}
                <div className="bg-surface-container-lowest border-2 border-primary rounded-xl p-3.5 shadow-xs">
                  <div className="flex justify-between items-start mb-1.5">
                    <h3 className="font-headline text-sm font-bold text-on-surface leading-tight">Foto Katalog 15 Menu Makanan</h3>
                    <div className="flex items-center gap-1 shrink-0 ml-3 text-on-surface-variant">
                      <MapPin className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                      <span className="text-xs font-mono font-medium tabular-nums">0.8 km</span>
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant mb-2.5">Waroeng Bu Sri • Butuh foto rapi untuk menu online.</p>
                  <div className="flex justify-between items-end border-t border-card-border pt-2">
                    <span className="font-mono text-sm font-bold text-primary tabular-nums">Rp75.000</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary-container/40 text-secondary text-xs font-bold font-mono uppercase tracking-wider border border-secondary/20">
                      <Handshake className="w-3 h-3" aria-hidden="true" />
                      Decent Work
                    </span>
                  </div>
                </div>
  
                {/* Standard Card */}
                <div className="bg-surface-container-lowest border border-card-border rounded-xl p-3.5 opacity-75">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-headline text-sm font-bold text-on-surface leading-tight">Input 50 Data Stok Barang</h3>
                    <div className="flex items-center gap-1 shrink-0 ml-3 text-on-surface-variant">
                      <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                      <span className="text-xs font-mono font-medium tabular-nums">2.5 km</span>
                    </div>
                  </div>
                  <p className="font-body-sm text-xs text-on-surface-variant">Toko Kelontong Makmur</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
