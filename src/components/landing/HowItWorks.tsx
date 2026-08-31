"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { GraduationCap, Store, Search, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const TABS = [
  {
    id: "worker",
    label: "Sebagai Worker",
    sublabel: "Mahasiswa",
    icon: GraduationCap,
    steps: [
      { title: "Register & isi profil skill", desc: "Email + username. Isi skill: fotografi, desain, data entry, dan lainnya." },
      { title: "Buka feed task terdekat", desc: "Lihat peta & list tugas di area sekitarmu. Filter by skill & kompensasi." },
      { title: "Apply, kerjakan, terima poin", desc: "Kirim bukti kerja, tunggu konfirmasi requester, dan saldo poin masuk otomatis." },
    ],
    cta: "Cari Tugas Sekarang",
    ctaIcon: Search,
  },
  {
    id: "requester",
    label: "Sebagai Requester",
    sublabel: "UMKM",
    icon: Store,
    steps: [
      { title: "Post task dengan detail lokasi", desc: "Isi judul, deskripsi, skill yang dibutuhkan, estimasi waktu, dan kompensasi." },
      { title: "Terima notifikasi & pilih worker", desc: "Lihat profil & rating applicant. Escrow mengunci dana saat task aktif." },
      { title: "Konfirmasi selesai & kasih rating", desc: "Setujui hasil kerja agar dana escrow cair ke worker dan bangun reputasi." },
    ],
    cta: "Post Tugas Sekarang",
    ctaIcon: PlusCircle,
  },
];

export function HowItWorks() {
  const [activeTab, setActiveTab] = useState(0);
  const reduce = useReducedMotion();
  const tab = TABS[activeTab];
  const CtaIcon = tab.ctaIcon;

  return (
    <section id="cara-kerja" className="w-full max-w-5xl mx-auto px-4 md:px-6 py-24 md:py-32 font-sans">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header: left-aligned */}
        <div className="mb-10 md:mb-14">
          <h2 className="font-headline text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight leading-tight mb-3">
            Cara kerja CEPAT
          </h2>
          <p className="text-sm md:text-base text-on-surface-variant max-w-[50ch] leading-relaxed">
            Dua peran, satu platform. Satu akun bisa jadi Requester dan Worker sekaligus.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="relative flex gap-1 p-1 bg-surface-container rounded-xl w-fit mb-8 border border-card-border">
          {TABS.map((t, i) => {
            const IconComp = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(i)}
                className={cn(
                  "relative z-10 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                  activeTab === i
                    ? "text-on-primary"
                    : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <IconComp className="w-4 h-4" />
                  {t.label}
                </span>
                {activeTab === i && (
                  <motion.div
                    layoutId="tab-bg"
                    className="absolute inset-0 bg-primary rounded-lg shadow-xs"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab.id}
            initial={reduce ? false : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="bg-surface-container-lowest rounded-2xl border border-card-border p-6 md:p-8 shadow-xs"
          >
            {/* Steps */}
            <div className="flex flex-col gap-6 mb-8">
              {tab.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-4">
                  {/* Step indicator */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs font-mono shadow-xs",
                        activeTab === 0
                          ? "bg-primary text-on-primary"
                          : "bg-secondary text-on-secondary"
                      )}
                    >
                      {i + 1}
                    </div>
                    {i < tab.steps.length - 1 && (
                      <div className="w-px h-8 bg-card-border" />
                    )}
                  </div>
                  {/* Step content */}
                  <div className="pt-1">
                    <p className="font-headline text-sm font-bold text-on-surface mb-0.5">{step.title}</p>
                    <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link href="/register">
              <Button
                variant={activeTab === 0 ? "primary" : "secondary"}
                size="md"
                icon={<CtaIcon className="w-4 h-4" />}
              >
                {tab.cta}
              </Button>
            </Link>
          </motion.div>
        </AnimatePresence>
        </motion.div>
    </section>
  );
}
