"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { CheckCircle, XCircle } from "@phosphor-icons/react";

const COMPARISONS = [
  {
    name: "Platform Freelance Global",
    weakness: "Terlalu mahal, persaingan ketat, tidak relevan untuk tugas fisik.",
  },
  {
    name: "Grup WhatsApp/Telegram",
    weakness: "Rawan penipuan, tidak ada rekaman portofolio, susah filter kandidat.",
  },
  {
    name: "Agency Lokal",
    weakness: "Biaya overhead tinggi, kurang fleksibel untuk tugas per-jam.",
  }
];

export function ComparisonSection() {
  const reduce = useReducedMotion();

  return (
    <section id="untuk-umkm" className="w-full max-w-5xl mx-auto px-4 md:px-6 py-24 md:py-32">
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
        {/* Left: Text */}
        <motion.div 
          initial={reduce ? false : { opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          className="flex-1 text-center lg:text-left"
        >
          <h2 className="font-headline-lg text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight leading-tight mb-6">
            Solusi paling masuk akal buat UMKM.
          </h2>
          <p className="text-base md:text-lg text-on-surface-variant leading-relaxed">
            UMKM butuh bantuan yang cepat, dekat, dan sesuai budget. CEPAT memotong perantara dan langsung menghubungkanmu dengan mahasiswa di sekitar tempat usahamu.
          </p>
        </motion.div>

        {/* Right: Comparison Chips */}
        <div className="flex-[1.2] w-full flex flex-col gap-4">
          {/* CEPAT Chip (Highlighted) */}
          <motion.div
            initial={reduce ? false : { opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative bg-white rounded-2xl p-5 md:p-6 border-2 border-primary shadow-[0_0_24px_rgba(15,118,110,0.15)] z-10"
          >
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle size={24} weight="fill" className="text-primary" />
              <h3 className="text-lg font-bold text-on-surface">CEPAT (Pilihan Cerdas)</h3>
            </div>
            <p className="text-on-surface-variant text-sm md:text-base leading-relaxed pl-9">
              Pekerja hiperlokal dari area sekitarmu, sistem escrow aman, harga transparan, dan rating berbasis performa nyata.
            </p>
          </motion.div>

          {/* Competitor Chips */}
          {COMPARISONS.map((comp, i) => (
            <motion.div
              key={i}
              initial={reduce ? false : { opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * (i + 1) }}
              whileHover={reduce ? undefined : { x: -4 }}
              className="bg-surface-container-lowest rounded-2xl p-5 md:p-6 border border-outline-variant/60 opacity-60 hover:opacity-100 transition-opacity"
            >
              <div className="flex items-center gap-3 mb-2">
                <XCircle size={20} weight="fill" className="text-outline" />
                <h3 className="text-base font-semibold text-on-surface-variant">{comp.name}</h3>
              </div>
              <p className="text-on-surface-variant/80 text-sm leading-relaxed pl-8">
                {comp.weakness}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
