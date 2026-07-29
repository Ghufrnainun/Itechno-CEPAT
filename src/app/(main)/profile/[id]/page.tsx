"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SKILL_CATEGORIES } from "@/constants/skills";
import { SdgBadge } from "@/components/ui/SdgBadge";
import { Button } from "@/components/ui/Button";

export default function UserProfilePage() {
  const router = useRouter();

  // Local storage profile values or defaults
  const [name, setName] = useState("Budi Santoso");
  const [univ, setUniv] = useState("Universitas Gadjah Mada");
  const [bio, setBio] = useState("Mahasiswa Ilmu Komputer UGM angkatan 2023 yang berfokus pada administrasi data entry dan IT support.");
  const [skills, setSkills] = useState<string[]>(["data_entry", "teknis"]);
  const [rating, setRating] = useState(4.8);
  const [completedCount, setCompletedCount] = useState(12);

  // Load from local storage if available
  useEffect(() => {
    const savedName = localStorage.getItem("cepat_user_name");
    const savedUniv = localStorage.getItem("cepat_user_univ");
    const savedBio = localStorage.getItem("cepat_user_bio");
    const savedSkills = localStorage.getItem("cepat_user_skills");

    if (savedName) setName(savedName);
    if (savedUniv) setUniv(savedUniv);
    if (savedBio) setBio(savedBio);
    if (savedSkills) {
      try {
        setSkills(JSON.parse(savedSkills));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  return (
    <div className="flex flex-col h-full bg-layout-bg font-sans">
      {/* Page Header */}
      <header className="page-header">
        <div className="flex items-center gap-md">
          <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-lg font-mono shadow shrink-0">
            BS
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md text-on-surface flex items-center gap-xs">
              {name}
              <span className="material-symbols-outlined text-primary-container text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{univ}</p>
          </div>
        </div>
        <div className="flex items-center gap-md">
          <div className="flex items-center gap-xs text-amber-500 font-bold font-mono text-sm">
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            {rating.toFixed(1)}
            <span className="text-on-surface-variant text-label-sm font-label-sm font-normal">/ 5.0</span>
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant">•</span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">{completedCount} tugas selesai</span>
          <Button variant="secondary" className="py-2 ml-sm" onClick={() => router.push("/wallet")}>
            <span className="material-symbols-outlined text-[18px]">wallet</span> Dompet
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto w-full p-lg md:p-xl flex flex-col gap-lg overflow-y-auto custom-scrollbar">
        {/* Bio & Skills */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
          {/* Left Column */}
          <div className="md:col-span-2 flex flex-col gap-md">
            <div className="bg-white border border-outline-variant rounded-xl p-md md:p-lg flex flex-col gap-sm shadow-sm">
              <h3 className="font-headline-sm text-headline-sm text-on-surface border-b border-outline-variant pb-sm mb-xs">Bio Singkat</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                {bio}
              </p>
            </div>

            {/* Ulasan list */}
            <div className="bg-white border border-outline-variant rounded-xl p-md md:p-lg flex flex-col gap-sm shadow-sm">
              <h3 className="font-headline-sm text-headline-sm text-on-surface border-b border-outline-variant pb-sm mb-xs">Ulasan Dari Pengguna Lain</h3>
              
              <div className="divide-y divide-outline-variant/50">
                <div className="py-md flex flex-col gap-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-body-sm text-body-sm font-semibold text-on-surface">Waroeng Bu Sri</span>
                    <div className="flex items-center gap-xs text-amber-500 text-sm font-bold font-mono">
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      5.0
                    </div>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant italic">
                    &quot;Hasil foto makanan sangat bagus, pengerjaan cepat dan komunikatif. Recommended!&quot;
                  </p>
                </div>

                <div className="py-md flex flex-col gap-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-body-sm text-body-sm font-semibold text-on-surface">Toko Kelontong Makmur</span>
                    <div className="flex items-center gap-xs text-amber-500 text-sm font-bold font-mono">
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      4.8
                    </div>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant italic">
                    &quot;Data entry stok barang rapi, pengerjaan cepat.&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Skills & SDG) */}
          <div className="flex flex-col gap-md">
            <div className="bg-white border border-outline-variant rounded-xl p-md flex flex-col gap-sm shadow-sm">
              <h3 className="font-headline-sm text-headline-sm text-on-surface border-b border-outline-variant pb-sm mb-xs">Daftar Keahlian</h3>
              
              <div className="flex flex-wrap gap-xs pt-xs">
                {skills.map((skillVal) => {
                  const skillInfo = SKILL_CATEGORIES.find((s) => s.value === skillVal);
                  if (!skillInfo) return null;
                  return (
                    <span
                      key={skillVal}
                      className="inline-flex items-center gap-xs bg-surface-container px-sm py-xs rounded-lg border border-outline-variant text-[11px] font-semibold text-primary font-sans"
                    >
                      <span>{skillInfo.emoji}</span>
                      <span>{skillInfo.label}</span>
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-outline-variant rounded-xl p-md flex flex-col gap-sm shadow-sm">
              <h3 className="font-headline-sm text-headline-sm text-on-surface border-b border-outline-variant pb-sm mb-xs flex items-center gap-xs">
                <span className="material-symbols-outlined text-[18px]">public</span> Dampak SDG 8
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Setiap tugas selesai berkontribusi pada penyediaan lapangan kerja layak dan pertumbuhan ekonomi lokal.
              </p>
              <div className="pt-sm">
                <SdgBadge />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
