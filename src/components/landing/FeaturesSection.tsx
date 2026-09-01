"use client";

import React, { useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { MapPin, ShieldCheck, Star } from "@phosphor-icons/react";

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
}

function SpotlightCard({ children, className = "" }: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div className={`p-1.5 md:p-2 rounded-2xl bg-black/[0.03] ring-1 ring-black/5 ${className}`}>
      <div
        ref={divRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setOpacity(1)}
        onMouseLeave={() => setOpacity(0)}
        className="relative h-full spotlight-card rounded-xl border border-white/60 bg-white/80 backdrop-blur-xl p-6 md:p-8 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_4px_12px_rgba(0,0,0,0.03)] overflow-hidden"
        style={{
          // @ts-ignore - Custom properties used by CSS
          "--x": `${position.x}px`,
          "--y": `${position.y}px`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-inherit opacity-0 transition-opacity duration-300 z-0"
          style={{
            opacity,
            background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, rgba(15, 118, 110, 0.06), transparent 40%)`,
          }}
        />
        <div className="relative z-10 h-full flex flex-col">{children}</div>
      </div>
    </div>
  );
}

export function FeaturesSection() {
  const reduce = useReducedMotion();

  return (
    <section id="fitur" className="w-full max-w-5xl mx-auto px-4 md:px-6 py-24 md:py-32">
      {/* Header */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.8 }}
        className="mb-12 md:mb-16"
      >
        <h2 className="font-headline text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight leading-tight mb-4">
          Fitur utama untuk kerja
          <br className="hidden md:block" />
          aman dan cepat
        </h2>
        <p className="text-base md:text-lg text-on-surface-variant max-w-[50ch] leading-relaxed">
          Dirancang untuk kemudahan kerja mahasiswa dan kebutuhan harian pemilik usaha lokal.
        </p>
      </motion.div>

      {/* Organic Stacked Layout */}
      <div className="flex flex-col gap-6 md:gap-8 relative z-20">
        {/* Hero Feature (Full Bleed/Wide) */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="w-full"
        >
          <SpotlightCard className="min-h-[380px] bg-transparent">
            <div className="flex flex-col md:flex-row h-full gap-10 items-center">
              <div className="flex-1 shrink-0 flex flex-col items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shadow-sm">
                  <MapPin size={28} weight="duotone" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-outline-variant text-xs font-mono font-semibold text-on-surface-variant mb-4 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Area Sekitar
                  </div>
                  <h3 className="font-headline text-2xl md:text-3xl font-extrabold text-on-surface mb-3 tracking-tight">Geo-Radar Hiperlokal</h3>
                  <p className="text-on-surface-variant text-base md:text-lg leading-relaxed">
                    Tidak perlu menunggu freelancer dari luar kota. CEPAT memindai area di sekitar kampusmu untuk menemukan UMKM atau Worker yang siap sedia dalam hitungan menit.
                  </p>
                </div>
              </div>
              <div className="flex-1 w-full relative h-[280px] md:h-[340px] rounded-xl border border-white bg-layout-bg overflow-hidden flex items-center justify-center shadow-[inset_0_2px_12px_rgba(0,0,0,0.04)]">
                {/* Abstract map visual */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,118,110,0.05)_0%,transparent_70%)]" />
                <div className="relative w-56 h-56 rounded-full border border-primary/10 flex items-center justify-center">
                  <div className="absolute w-full h-full rounded-full border border-primary/20 animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite]" />
                  <div className="w-36 h-36 rounded-full border border-primary/15 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center backdrop-blur-md border border-primary/20 shadow-lg">
                      <div className="w-4 h-4 rounded-full bg-primary" />
                    </div>
                  </div>
                  {/* Floating map pins */}
                  <div className="absolute -top-2 -right-2 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-lg shadow-md border border-outline-variant flex items-center gap-1.5">
                     <span className="w-2.5 h-2.5 rounded-full bg-[#84CC16]" />
                     <span className="text-xs font-bold font-mono">0.4km</span>
                  </div>
                   <div className="absolute bottom-6 -left-6 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-lg shadow-md border border-outline-variant flex items-center gap-1.5">
                     <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                     <span className="text-xs font-bold font-mono">1.2km</span>
                  </div>
                </div>
              </div>
            </div>
          </SpotlightCard>
        </motion.div>

        {/* Overlapping Smaller Features */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 w-full">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex-[1.1]"
          >
            <SpotlightCard className="h-full bg-transparent">
               <div className="flex flex-col gap-5">
                 <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shadow-sm">
                      <ShieldCheck size={24} weight="duotone" />
                    </div>
                    <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200/50 text-xs font-extrabold tracking-widest rounded-md uppercase shadow-sm">Aman</span>
                 </div>
                 <div>
                   <h3 className="font-headline text-xl font-extrabold text-on-surface mb-2 tracking-tight">Escrow Otomatis</h3>
                   <p className="text-base text-on-surface-variant leading-relaxed">
                     Dana dari UMKM dikunci aman oleh sistem saat tugas berjalan, dan otomatis cair ke mahasiswa saat disetujui. Tanpa drama pembayaran telat.
                   </p>
                 </div>
               </div>
            </SpotlightCard>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1"
          >
             <SpotlightCard className="h-full bg-transparent">
               <div className="flex flex-col gap-5">
                 <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-sm">
                      <Star size={24} weight="duotone" />
                    </div>
                 </div>
                 <div>
                   <h3 className="font-headline text-xl font-extrabold text-on-surface mb-2 tracking-tight">Rating & Portofolio</h3>
                   <p className="text-base text-on-surface-variant leading-relaxed">
                     Setiap tugas yang selesai otomatis membangun reputasi publikmu. CV yang terbuat dengan sendirinya berdasarkan performa nyata.
                   </p>
                 </div>
               </div>
            </SpotlightCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
