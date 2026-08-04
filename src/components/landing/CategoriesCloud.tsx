"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { 
  Camera, Keyboard, Storefront, ChartLineUp, 
  PaintBrush, PenNib, Megaphone, Truck,
  Code, Wrench, Broom, Package
} from "@phosphor-icons/react";

const CATEGORIES = [
  { id: "c1", label: "Foto Produk", icon: Camera, color: "bg-blue-50 text-blue-600 border-blue-100", size: "lg", delay: 0 },
  { id: "c2", label: "Input Data", icon: Keyboard, color: "bg-emerald-50 text-emerald-600 border-emerald-100", size: "md", delay: 100 },
  { id: "c3", label: "Jaga Booth", icon: Storefront, color: "bg-orange-50 text-orange-600 border-orange-100", size: "lg", delay: 200 },
  { id: "c4", label: "Survei Pasar", icon: ChartLineUp, color: "bg-purple-50 text-purple-600 border-purple-100", size: "sm", delay: 150 },
  { id: "c5", label: "Desain Banner", icon: PaintBrush, color: "bg-pink-50 text-pink-600 border-pink-100", size: "md", delay: 50 },
  { id: "c6", label: "Copywriting", icon: PenNib, color: "bg-slate-50 text-slate-600 border-slate-200", size: "sm", delay: 250 },
  { id: "c7", label: "Sebar Brosur", icon: Megaphone, color: "bg-red-50 text-red-600 border-red-100", size: "md", delay: 120 },
  { id: "c8", label: "Kurir Lokal", icon: Truck, color: "bg-cyan-50 text-cyan-600 border-cyan-100", size: "sm", delay: 80 },
  { id: "c9", label: "Bantu Coding", icon: Code, color: "bg-zinc-50 text-zinc-600 border-zinc-200", size: "md", delay: 180 },
  { id: "c10", label: "Bantu Pindahan", icon: Package, color: "bg-amber-50 text-amber-600 border-amber-100", size: "lg", delay: 220 },
];

export function CategoriesCloud() {
  const reduce = useReducedMotion();

  return (
    <section className="w-full max-w-5xl mx-auto px-4 md:px-6 py-20 overflow-hidden">
      <div className="flex flex-col md:flex-row gap-12 items-center">
        {/* Left: Text */}
        <motion.div 
          initial={reduce ? false : { opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          className="flex-1 md:max-w-[40%]"
        >
          <h2 className="font-headline-lg text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight leading-tight mb-4">
            Bukan cuma<br/>pekerjaan kantoran
          </h2>
          <p className="text-base text-on-surface-variant leading-relaxed mb-6">
            Dari yang butuh skill khusus sampai yang cuma butuh tenaga ekstra. Semua tugas berdurasi pendek, bayaran jelas, dan dekat denganmu.
          </p>
          <a href="/login" className="inline-flex items-center gap-1.5 text-primary font-semibold hover:underline">
            Lihat semua kategori
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </a>
        </motion.div>

        {/* Right: Cloud */}
        <div className="flex-[1.5] w-full flex flex-wrap justify-center md:justify-end content-center gap-3 md:gap-4 relative p-4">
          {CATEGORIES.map((cat) => {
            const sizeClasses = 
              cat.size === "lg" ? "px-5 py-3 text-base" :
              cat.size === "md" ? "px-4 py-2.5 text-sm" :
              "px-3 py-2 text-xs";
              
            const iconSize = 
              cat.size === "lg" ? 22 :
              cat.size === "md" ? 18 :
              16;

            return (
              <motion.div
                key={cat.id}
                initial={reduce ? false : { opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ delay: cat.delay / 1000, duration: 0.4 }}
                whileHover={reduce ? undefined : { scale: 1.05, y: -4 }}
                className={`animate-float cursor-default`}
                style={{ animationDelay: `${cat.delay * 2}ms` }}
              >
                <div className={`flex items-center gap-2 rounded-full border border-white/50 ${cat.color} ${sizeClasses} shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.04)] ring-1 ring-black/5 backdrop-blur-sm transition-all hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_6px_16px_rgba(0,0,0,0.08)]`}>
                  <cat.icon size={iconSize} weight="duotone" />
                  <span className="font-bold tracking-tight whitespace-nowrap">{cat.label}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
