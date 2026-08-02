"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

const TABS = [
  {
    id: "worker",
    label: "Sebagai Worker",
    sublabel: "Mahasiswa",
    icon: "school",
    steps: [
      { title: "Register & isi profil skill", desc: "Email + username. Isi skill: fotografi, desain, data entry, dan lainnya." },
      { title: "Buka feed task terdekat", desc: "Lihat peta & list tugas di area sekitarmu. Filter by skill & kompensasi." },
      { title: "Apply, kerjakan, terima poin", desc: "Kirim bukti kerja → requester konfirmasi → poin masuk otomatis." },
    ],
    cta: "Cari Tugas Sekarang",
    ctaIcon: "search",
  },
  {
    id: "requester",
    label: "Sebagai Requester",
    sublabel: "UMKM",
    icon: "storefront",
    steps: [
      { title: "Post task dengan detail lokasi", desc: "Isi judul, deskripsi, skill yang dibutuhkan, estimasi waktu, dan kompensasi." },
      { title: "Terima notifikasi & pilih worker", desc: "Lihat profil & rating applicant. Escrow mengunci dana saat task aktif." },
      { title: "Konfirmasi selesai & kasih rating", desc: "Setujui hasil kerja → dana escrow cair ke worker. Rating membangun reputasi." },
    ],
    cta: "Post Tugas Sekarang",
    ctaIcon: "add_task",
  },
];

export function HowItWorks() {
  const [activeTab, setActiveTab] = useState(0);
  const reduce = useReducedMotion();
  const tab = TABS[activeTab];

  return (
    <section id="cara-kerja" className="w-full max-w-5xl mx-auto px-4 md:px-6 py-24 md:py-32">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header — left-aligned */}
        <div className="mb-10 md:mb-14">
          <h2 className="font-headline-lg text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight leading-tight mb-3">
            Cara kerja CEPAT
          </h2>
          <p className="text-base md:text-lg text-on-surface-variant max-w-[50ch] leading-relaxed">
            Dua peran, satu platform. Satu akun bisa jadi Requester dan Worker sekaligus.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="relative flex gap-1 p-1 bg-surface-container rounded-xl w-fit mb-10">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(i)}
              className={`relative z-10 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === i
                  ? "text-on-primary"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="relative z-10 flex items-center gap-2">
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {t.icon}
                </span>
                {t.label}
              </span>
              {activeTab === i && (
                <motion.div
                  layoutId="tab-bg"
                  className="absolute inset-0 bg-primary rounded-lg"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab.id}
            initial={reduce ? false : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-2xl border border-outline-variant p-6 md:p-8"
          >
            {/* Steps */}
            <div className="flex flex-col gap-6 mb-8">
              {tab.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-4">
                  {/* Step indicator */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                        activeTab === 0
                          ? "bg-primary text-on-primary"
                          : "bg-secondary text-on-secondary"
                      }`}
                    >
                      {i + 1}
                    </div>
                    {i < tab.steps.length - 1 && (
                      <div className="w-px h-8 bg-outline-variant" />
                    )}
                  </div>
                  {/* Step content */}
                  <div className="pt-1.5">
                    <p className="text-base font-semibold text-on-surface mb-1">{step.title}</p>
                    <p className="text-sm text-on-surface-variant leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link
              href="/login"
              className={`inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-lg transition-colors text-sm ${
                activeTab === 0
                  ? "bg-primary text-on-primary hover:bg-primary-container"
                  : "bg-secondary text-on-secondary hover:brightness-95"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.ctaIcon}</span>
              {tab.cta}
            </Link>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
