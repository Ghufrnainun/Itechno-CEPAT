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

  useEffect(() => {
    if (!isInView || !ref.current) return;
    if (reduce) {
      ref.current.textContent = target + suffix;
      return;
    }

    const numericTarget = parseFloat(target.replace(/[^0-9.]/g, ""));
    const isInteger = !target.includes(".");
    const prefix = target.replace(/[0-9.<]/g, "").replace(".", "");
    const duration = 1200;
    const startTime = performance.now();
    let animationFrameId: number;

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4); // ease-out-quart
      const current = numericTarget * eased;

      let val = "";
      if (target.startsWith("<")) {
        val = "<" + (isInteger ? Math.round(current).toString() : current.toFixed(1));
      } else {
        val = prefix + (isInteger ? Math.round(current).toString() : current.toFixed(1));
      }

      if (ref.current) {
        ref.current.textContent = val + suffix;
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(tick);
      } else if (ref.current) {
        ref.current.textContent = target + suffix;
      }
    }

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isInView, target, suffix, reduce]);

  return (
    <div className="flex flex-col items-center gap-1.5 px-3 py-2 md:py-0">
      <span ref={ref} className="text-3xl md:text-4xl font-extrabold text-primary font-headline tracking-tight tabular-nums">
        0{suffix}
      </span>
      <span className="text-xs text-on-surface-variant font-medium text-center leading-snug max-w-[160px]">
        {label}
      </span>
    </div>
  );
}

export function TrustStrip() {
  const reduce = useReducedMotion();

  return (
    <section className="w-full border-y border-card-border/80 bg-surface-container-lowest/90 backdrop-blur-md relative z-10 py-6 md:py-8">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl mx-auto px-4 flex flex-wrap justify-center items-center gap-y-6 md:gap-y-0"
      >
        <AnimatedCounter target="73" suffix="%" label="mahasiswa ingin penghasilan tambahan" />
        <span className="hidden md:block w-px h-10 bg-card-border/80 mx-2" />
        <AnimatedCounter target="97" suffix="%" label="tenaga kerja terserap UMKM nasional" />
        <span className="hidden md:block w-px h-10 bg-card-border/80 mx-2" />
        <AnimatedCounter target="<5" suffix=" mnt" label="rata-rata waktu respons tugas" />
        <span className="hidden md:block w-px h-10 bg-card-border/80 mx-2" />
        <AnimatedCounter target="<1" suffix=" hr" label="rata-rata waktu penyelesaian" />
      </motion.div>
    </section>
  );
}
