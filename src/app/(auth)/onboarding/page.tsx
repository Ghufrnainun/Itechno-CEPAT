"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { SKILL_CATEGORIES } from "@/constants/skills";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { RoleCard } from "@/features/auth/components/RoleCard";

const BIO_TEMPLATES = [
  "Siap bantu tugas harian, admin, dan data entry.",
  "Spesialis fotografi, videografi, dan desain promo.",
  "Siap bantu kurir, antar barang, dan helper event.",
  "Siap les privat, tutoring, dan bantuan riset.",
];

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const [role, setRole] = useState<"worker" | "requester">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cepat_role");
      if (saved === "requester" || saved === "worker") return saved;
    }
    return "worker";
  });
  const [bio, setBio] = useState("");
  const [univ, setUniv] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleSkill = (value: string) => {
    if (selectedSkills.includes(value)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== value));
    } else {
      setSelectedSkills([...selectedSkills, value]);
    }
  };

  const handleTemplateClick = (template: string) => {
    setBio(template);
  };

  const isFormValid = phone.trim().length >= 8 && bio.trim().length >= 5 && selectedSkills.length > 0;

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    try {
      const response = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio,
          pendidikan_terakhir: univ,
          no_telpon: phone,
          skills: selectedSkills,
          role,
        }),
      });

      await response.json().catch(() => ({}));

      localStorage.setItem("cepat_role", role);
      localStorage.setItem("cepat_user_bio", bio);
      localStorage.setItem("cepat_user_univ", univ);
      localStorage.setItem("cepat_user_skills", JSON.stringify(selectedSkills));

      router.push(redirectParam || "/feed");
    } catch (err) {
      console.error("Gagal update onboarding profile:", err);
      router.push(redirectParam || "/feed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full min-h-screen bg-layout-bg flex items-center justify-center p-md font-sans">
      <div className="w-full max-w-[620px] bg-white border border-outline-variant/70 rounded-2xl p-lg md:p-xl flex flex-col gap-lg shadow-md">
        {/* Progress bar header */}
        <div className="space-y-xs">
          <div className="flex items-center justify-between font-label-xs text-label-xs text-on-surface-variant">
            <span className="font-semibold text-primary">LANGKAH TERAKHIR</span>
            <span>Profil &amp; Keahlian</span>
          </div>
          <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
            <div className="bg-primary h-full w-full rounded-full transition-all duration-300" />
          </div>
        </div>

        {/* Header */}
        <div className="text-center">
          <Image src="/logo.svg" alt="CEPAT" width={100} height={32} className="logo-img mx-auto mb-sm" priority />
          <h1 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Lengkapi Profil Anda</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
            Hanya butuh 1 menit agar akun Anda siap menerima &amp; memposting tugas di sekitar.
          </p>
        </div>

        <form onSubmit={handleOnboardingSubmit} className="space-y-xl">
          {/* Section 0: Role Selection */}
          <div className="space-y-sm">
            <label className="font-body-sm text-body-sm font-medium text-on-surface block">
              Pilih Peran Utama Anda di CEPAT <span className="text-error">*</span>
            </label>
            <div className="grid grid-cols-2 gap-md">
              <RoleCard
                isSelected={role === "worker"}
                onClick={() => setRole("worker")}
                title="Cari tugas"
                description="Ambil pekerjaan fleksibel terdekat."
                iconName="work"
              />
              <RoleCard
                isSelected={role === "requester"}
                onClick={() => setRole("requester")}
                title="Post tugas"
                description="Cari bantuan dari mahasiswa sekitar."
                iconName="add_task"
              />
            </div>
          </div>

          {/* Section 1: Data Kontak & Profil */}
          <div className="space-y-md border-t border-outline-variant/50 pt-lg">
            {/* WhatsApp */}
            <div>
              <div className="flex items-center justify-between mb-xs">
                <label className="font-body-sm text-body-sm font-medium text-on-surface">
                  Nomor WhatsApp <span className="text-error">*</span>
                </label>
                <span className="font-label-xs text-label-xs px-xs py-0.5 rounded bg-error-container/20 text-error font-semibold">
                  Wajib
                </span>
              </div>
              <Input
                type="tel"
                placeholder="Contoh: 081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <p className="font-body-xs text-body-xs text-on-surface-variant mt-xs">
                Digunakan untuk notifikasi &amp; koordinasi cepat tugas terdekat.
              </p>
            </div>

            {/* Instansi / Univ / Usaha */}
            <div>
              <div className="flex items-center justify-between mb-xs">
                <label className="font-body-sm text-body-sm font-medium text-on-surface">
                  Instansi / Universitas / Usaha
                </label>
                <span className="font-label-xs text-label-xs px-xs py-0.5 rounded bg-surface-container-highest text-on-surface-variant">
                  Opsional
                </span>
              </div>
              <Input
                type="text"
                placeholder="Contoh: UGM / UMKM Lokal / Freelancer / Umum"
                value={univ}
                onChange={(e) => setUniv(e.target.value)}
              />
            </div>

            {/* Bio Singkat */}
            <div>
              <div className="flex items-center justify-between mb-xs">
                <label className="font-body-sm text-body-sm font-medium text-on-surface">
                  Bio Singkat &amp; Pengalaman <span className="text-error">*</span>
                </label>
                <span className="font-label-xs text-label-xs text-on-surface-variant">
                  {bio.length}/200
                </span>
              </div>
              <textarea
                className="input-field min-h-[85px] font-body-sm custom-scrollbar w-full p-sm rounded-lg border border-outline-variant focus:outline-none focus:border-primary"
                placeholder="Tulis singkat keahlian atau jenis bantuan yang Anda berikan..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={200}
                required
              />

              {/* Template Bio Chips */}
              <div className="mt-xs">
                <p className="font-label-xs text-label-xs text-on-surface-variant mb-xs">Pilih contoh cepat:</p>
                <div className="flex flex-wrap gap-xs">
                  {BIO_TEMPLATES.map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleTemplateClick(tpl)}
                      className="font-label-xs text-label-xs px-sm py-1 rounded-full bg-surface-container-high hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-colors border border-outline-variant/40"
                    >
                      + {tpl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Skill Selector */}
          <div className="space-y-sm border-t border-outline-variant/50 pt-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-body-md text-body-md font-semibold text-on-surface">
                  Kategori Keahlian / Minat <span className="text-error">*</span>
                </h2>
                <p className="font-body-xs text-body-xs text-on-surface-variant">
                  Pilih minimal 1 kategori untuk mendapatkan rekomendasi tugas.
                </p>
              </div>
              <span
                className={`font-label-xs text-label-xs px-sm py-1 rounded-full font-semibold ${
                  selectedSkills.length > 0
                    ? "bg-primary-container/20 text-primary-container"
                    : "bg-error-container/20 text-error"
                }`}
              >
                {selectedSkills.length > 0 ? `${selectedSkills.length} Terpilih` : "Pilih Min. 1"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-sm pt-sm">
              {SKILL_CATEGORIES.map((skill) => {
                const isSelected = selectedSkills.includes(skill.value);
                return (
                  <button
                    key={skill.value}
                    type="button"
                    onClick={() => toggleSkill(skill.value)}
                    className={`p-sm rounded-xl border flex flex-col items-center gap-xs text-center cursor-pointer transition-all duration-150 text-[12px] font-medium font-sans ${
                      isSelected
                        ? "bg-primary-container/10 border-primary-container text-primary-container font-semibold shadow-sm ring-1 ring-primary-container"
                        : "bg-white border-outline-variant/60 hover:bg-surface-container-low text-on-surface-variant"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[24px] ${
                        isSelected ? "text-primary-container" : "text-on-surface-variant"
                      }`}
                    >
                      {skill.icon}
                    </span>
                    <span>{skill.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <div className="space-y-xs pt-xs">
            <Button type="submit" fullWidth disabled={loading || !isFormValid}>
              {loading ? "Menyimpan Profil..." : "Selesai & Masuk Dashboard"}
            </Button>
            {!isFormValid && (
              <p className="font-body-xs text-body-xs text-center text-on-surface-variant">
                Lengkapi nomor WhatsApp, bio, dan minimal 1 kategori keahlian untuk melanjutkan.
              </p>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-layout-bg font-sans">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
