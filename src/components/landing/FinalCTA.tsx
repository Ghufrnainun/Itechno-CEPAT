"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

export function FinalCTA() {
  const reduce = useReducedMotion();
  const headline = "Siap mulai tugas pertamamu hari ini?";
  const words = headline.split(" ");

  return (
    <section className="w-full relative py-32 md:py-48 overflow-hidden bg-layout-bg flex flex-col items-center text-center px-4">
      {/* Decorative floating shapes */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-[80px] animate-float" style={{ animationDuration: '7s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-[100px] animate-float" style={{ animationDuration: '11s', animationDelay: '2s' }} />

      <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
        <h2 className="font-headline-lg text-4xl md:text-5xl lg:text-6xl font-extrabold text-on-surface tracking-tighter leading-tight mb-8">
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="inline-block mr-[0.25em]"
            >
              {word}
            </motion.span>
          ))}
        </h2>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-lg md:text-xl text-on-surface-variant mb-12 max-w-[500px]"
        >
          Ribuan mahasiswa dan UMKM di sekitarmu sudah bergabung. Jangan sampai ketinggalan.
        </motion.p>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <Link href="/register">
            <motion.button
              whileHover={reduce ? undefined : { scale: 1.02 }}
              whileTap={reduce ? undefined : { scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="w-full sm:w-auto bg-primary text-on-primary font-semibold px-8 py-4 rounded hover:bg-primary-container transition-colors flex items-center justify-center gap-2 min-h-[56px] text-lg shadow-[0_4px_16px_rgba(15,118,110,0.2)] cursor-pointer"
            >
              Daftar Sekarang
            </motion.button>
          </Link>
          <Link href="/login">
            <motion.button
              whileHover={reduce ? undefined : { scale: 1.02 }}
              whileTap={reduce ? undefined : { scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="w-full sm:w-auto bg-white border-2 border-outline-variant text-on-surface font-semibold px-8 py-4 rounded hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2 min-h-[56px] text-lg cursor-pointer"
            >
              Masuk
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
