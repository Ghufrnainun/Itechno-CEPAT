"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ArrowRight, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";

const ROTATING_WORDS = ["foto produk", "input data", "jaga booth", "survei lapangan"];

export function AHeroSection() {
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
    <section className="relative min-h-[100dvh] flex flex-col justify-center px-4 md:px-8 lg:px-16 pt-32 pb-24 overflow-hidden bg-surface">
      {/* Background Ambient Effect */}
      <div className="absolute top-0 right-0 w-full md:w-1/2 h-full opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-primary-container,#ccfbf1),transparent_70%)]" />
      </div>

      <div className="relative z-10 w-full max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 items-center">
        
        {/* Left Typography Block */}
        <div className="col-span-1 lg:col-span-6 flex flex-col items-start text-left gap-8">
          <div
            className="animate-appear"
            style={{ animationDelay: "0ms" }}
          >
            <Link
              href="#dampak-sdg"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-outline-variant bg-surface-container-lowest/80 backdrop-blur-md text-xs text-on-surface-variant hover:bg-surface-container-low transition-colors duration-300 group shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-semibold text-on-surface">ITechno Cup 2026</span>
              <span className="text-outline-variant">•</span>
              <span>SDG 8 Project</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true" />
            </Link>
          </div>

          <div
            className="animate-appear"
            style={{ animationDelay: "150ms" }}
          >
            <h1 className="font-headline text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-[1.05] text-on-surface max-w-4xl">
              Tugas kecil di sekitar kampus,
              <br />
              <span className="relative inline-block mt-2">
                mulai dari{" "}
                <span className="relative inline-flex overflow-hidden align-bottom h-[1.15em] text-primary">
                  <span className="invisible whitespace-nowrap opacity-0 pointer-events-none">
                    survei lapangan
                  </span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={ROTATING_WORDS[wordIndex]}
                      initial={reduce ? false : { y: 40, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={reduce ? undefined : { y: -40, opacity: 0 }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute left-0 whitespace-nowrap"
                    >
                      {ROTATING_WORDS[wordIndex]}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </span>
            </h1>
          </div>

          <p
            className="animate-appear text-base md:text-lg text-on-surface-variant max-w-[500px] leading-relaxed font-sans"
            style={{ animationDelay: "300ms" }}
          >
            CEPAT menghubungkan mahasiswa dengan UMKM lokal yang butuh bantuan cepat — langsung di sekitar kampus, tanpa perlu buang waktu di jalan.
          </p>

          <div
            className="animate-appear flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-4"
            style={{ animationDelay: "500ms" }}
          >
            <Link href="/task/new" className="block w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full min-h-[56px] px-8 text-base rounded-full"
                icon={<Plus className="w-5 h-5" aria-hidden="true" />}
              >
                Post Tugas UMKM
              </Button>
            </Link>
            <Link href="/feed" className="block w-full sm:w-auto">
              <Button
                variant="secondary"
                size="lg"
                className="w-full min-h-[56px] px-8 text-base rounded-full"
                icon={<Search className="w-5 h-5" aria-hidden="true" />}
              >
                Cari Tugas Terdekat
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Image/Asset Block - High End Visual */}
        <div 
          className="col-span-1 lg:col-span-6 relative w-full h-[500px] lg:h-[640px] rounded-[2.5rem] overflow-hidden bg-surface-container-low border border-outline-variant shadow-2xl animate-appear transform-gpu"
          style={{ animationDelay: "700ms" }}
        >
          {/* Real Photography Placeholder */}
          <img 
            src="https://picsum.photos/seed/mahasiswa-umkm-kolaborasi/1000/1200" 
            alt="Mahasiswa berkolaborasi dengan UMKM lokal" 
            className="absolute inset-0 w-full h-full object-cover filter contrast-110 saturate-[1.1]"
            loading="lazy"
          />
          {/* Cinematic Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-transparent" />
          
          {/* Subtle Floating Element inside Image (Double Bezel aesthetics) */}
          <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 p-1 rounded-3xl bg-white/10 backdrop-blur-2xl shadow-lg ring-1 ring-white/20">
            <div className="rounded-[1.375rem] bg-black/40 px-5 py-4 border border-white/10 text-white flex items-center justify-between gap-8">
              <div>
                <p className="text-sm font-bold tracking-tight text-white/95">Toko Kelontong Makmur</p>
                <p className="text-[11px] text-white/70 font-mono mt-1">2.5 km dari kampus</p>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-primary text-on-primary text-xs font-bold font-mono shadow-xs border border-primary-container/20">
                +75K PTS
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
