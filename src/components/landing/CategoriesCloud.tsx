"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { 
  Camera, 
  Keyboard, 
  Store, 
  TrendingUp, 
  Palette, 
  PenTool, 
  Megaphone, 
  Truck,
  Code, 
  Package,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "c1", label: "Foto Produk", icon: Camera, color: "bg-blue-500/10 text-blue-600 border-blue-500/20", size: "lg", delay: 0 },
  { id: "c2", label: "Input Data", icon: Keyboard, color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", size: "md", delay: 100 },
  { id: "c3", label: "Jaga Booth", icon: Store, color: "bg-amber-500/10 text-amber-600 border-amber-500/20", size: "lg", delay: 200 },
  { id: "c4", label: "Survei Pasar", icon: TrendingUp, color: "bg-purple-500/10 text-purple-600 border-purple-500/20", size: "sm", delay: 150 },
  { id: "c5", label: "Desain Banner", icon: Palette, color: "bg-pink-500/10 text-pink-600 border-pink-500/20", size: "md", delay: 50 },
  { id: "c6", label: "Copywriting", icon: PenTool, color: "bg-slate-500/10 text-slate-600 border-slate-500/20", size: "sm", delay: 250 },
  { id: "c7", label: "Sebar Brosur", icon: Megaphone, color: "bg-red-500/10 text-red-600 border-red-500/20", size: "md", delay: 120 },
  { id: "c8", label: "Kurir Lokal", icon: Truck, color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20", size: "sm", delay: 80 },
  { id: "c9", label: "Bantu Coding", icon: Code, color: "bg-teal-500/10 text-teal-600 border-teal-500/20", size: "md", delay: 180 },
  { id: "c10", label: "Bantu Pindahan", icon: Package, color: "bg-amber-500/10 text-amber-600 border-amber-500/20", size: "lg", delay: 220 },
];

export function CategoriesCloud() {
  const reduce = useReducedMotion();

  return (
    <section className="w-full max-w-5xl mx-auto px-4 md:px-6 py-20 overflow-hidden font-sans">
      <div className="flex flex-col md:flex-row gap-12 items-center">
        {/* Left: Text */}
        <motion.div 
          initial={reduce ? false : { opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          className="flex-1 md:max-w-[40%]"
        >
          <h2 className="font-headline text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight leading-tight mb-4">
            Ragam tugas<br/>di sekitar kampus
          </h2>
          <p className="text-sm md:text-base text-on-surface-variant leading-relaxed mb-6">
            Mulai dari foto produk UMKM, entri data, jaga booth, hingga bantuan logistik harian. Durasi terukur, kompensasi transparan, dan lokasi dekat.
          </p>
          <Link href="/login" className="inline-flex items-center gap-1.5 text-primary text-xs font-bold hover:underline">
            Lihat semua kategori
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>

        {/* Right: Cloud */}
        <div className="flex-[1.5] w-full flex flex-wrap justify-center md:justify-end content-center gap-2.5 md:gap-3.5 relative p-4">
          {CATEGORIES.map((cat) => {
            const sizeClasses = 
              cat.size === "lg" ? "px-4 py-2.5 text-sm" :
              cat.size === "md" ? "px-3.5 py-2 text-xs" :
              "px-3 py-1.5 text-xs";
              
            const IconComp = cat.icon;

            return (
              <motion.div
                key={cat.id}
                initial={reduce ? false : { opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ delay: cat.delay / 1000, duration: 0.4 }}
                whileHover={reduce ? undefined : { scale: 1.05, y: -4 }}
                className="animate-float cursor-default"
                style={{ animationDelay: `${cat.delay * 2}ms` }}
              >
                <div className={cn(
                  "flex items-center gap-2 rounded-xl border shadow-xs backdrop-blur-sm transition-all duration-150",
                  cat.color,
                  sizeClasses
                )}>
                  <IconComp className="w-4 h-4 shrink-0" />
                  <span className="font-bold tracking-tight whitespace-nowrap font-sans">{cat.label}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
