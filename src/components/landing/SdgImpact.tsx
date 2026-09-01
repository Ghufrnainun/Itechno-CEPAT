"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { Leaf, Handshake, TrendUp } from "@phosphor-icons/react";

export function SdgImpact() {
  const reduce = useReducedMotion();

  return (
    <section id="dampak-sdg" className="w-full bg-[#0A0A0A] text-white py-32 md:py-40 relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" style={{ animation: 'glow-pulse 8s ease-in-out infinite' }} />
      
      <div className="max-w-5xl mx-auto px-4 md:px-6 relative z-10 flex flex-col items-center text-center">
        {/* Badge */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-lg border border-white/10 bg-white/5 mb-8"
        >
          <Leaf size={14} weight="duotone" className="text-primary" />
          <span className="text-xs font-semibold tracking-widest uppercase text-white/70">Misi Kami</span>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mb-20"
        >
          <h2 className="font-headline text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
            Mendukung <span className="text-shimmer">SDG 8</span> untuk
            <br />
            ekonomi yang inklusif.
          </h2>
          <p className="text-lg md:text-xl text-white/60 max-w-[600px] mx-auto leading-relaxed">
            CEPAT lahir sebagai inisiatif untuk ITechno Cup 2026. Kami percaya pekerjaan layak dan pertumbuhan ekonomi harus dimulai dari komunitas lokal terkecil.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          {[
            {
              icon: Handshake,
              title: "Pemberdayaan Mahasiswa",
              desc: "Memberikan akses ke penghasilan tambahan yang fleksibel tanpa mengganggu jadwal kuliah."
            },
            {
              icon: TrendUp,
              title: "Digitalisasi UMKM",
              desc: "Membantu usaha kecil mendapatkan tenaga kerja terampil dengan harga terjangkau."
            },
            {
              icon: Leaf,
              title: "Ekonomi Sirkular",
              desc: "Menjaga perputaran uang tetap berada di dalam radius komunitas lokal."
            }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={reduce ? false : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + (i * 0.1) }}
              className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-6">
                <item.icon size={24} weight="duotone" />
              </div>
              <h3 className="font-headline text-xl font-bold mb-3 text-white/90">{item.title}</h3>
              <p className="text-white/50 leading-relaxed text-sm md:text-base">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
