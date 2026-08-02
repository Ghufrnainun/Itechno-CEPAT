"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, useReducedMotion, useInView } from "motion/react";

interface CounterProps {
  target: string;
  suffix?: string;
  label: string;
}

function AnimatedCounter({ target, suffix = "", label }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!isInView) return;
    if (reduce) {
      setDisplay(target);
      return;
    }

    const numericTarget = parseFloat(target.replace(/[^0-9.]/g, ""));
    const isInteger = !target.includes(".");
    const prefix = target.replace(/[0-9.<]/g, "").replace(".", "");
    const duration = 1200;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4); // ease-out-quart
      const current = numericTarget * eased;

      if (target.startsWith("<")) {
        setDisplay("<" + (isInteger ? Math.round(current).toString() : current.toFixed(1)));
      } else {
        setDisplay(prefix + (isInteger ? Math.round(current).toString() : current.toFixed(1)));
      }

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setDisplay(target);
      }
    }

    requestAnimationFrame(tick);
  }, [isInView, target, reduce]);

  return (
    <div className="flex flex-col items-center gap-1 px-4 md:px-8">
      <span ref={ref} className="text-2xl md:text-3xl font-extrabold text-on-surface font-mono tracking-tight">
        {display}{suffix}
      </span>
      <span className="text-xs md:text-sm text-on-surface-variant text-center leading-snug max-w-[140px]">
        {label}
      </span>
    </div>
  );
}

export function TrustStrip() {
  const reduce = useReducedMotion();

  return (
    <section className="w-full border-y border-outline-variant bg-white/50 backdrop-blur-sm">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-5xl mx-auto px-4 py-8 md:py-10 flex flex-wrap justify-center items-center gap-y-6"
      >
        <AnimatedCounter target="73" suffix="%" label="mahasiswa ingin penghasilan tambahan" />
        <span className="hidden md:block w-px h-10 bg-outline-variant" />
        <AnimatedCounter target="97" suffix="%" label="tenaga kerja terserap UMKM nasional" />
        <span className="hidden md:block w-px h-10 bg-outline-variant" />
        <AnimatedCounter target="<5" suffix=" mnt" label="rata-rata waktu respons tugas" />
        <span className="hidden md:block w-px h-10 bg-outline-variant" />
        <AnimatedCounter target="<1" suffix=" hr" label="rata-rata waktu penyelesaian" />
      </motion.div>
    </section>
  );
}
