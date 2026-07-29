"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SKILL_CATEGORIES } from "@/constants/skills";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function OnboardingPage() {
  const router = useRouter();
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

  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      localStorage.setItem("cepat_user_bio", bio);
      localStorage.setItem("cepat_user_univ", univ);
      localStorage.setItem("cepat_user_skills", JSON.stringify(selectedSkills));
      // Default to worker role upon first sign up
      localStorage.setItem("cepat_role", "worker");
      router.push("/feed");
    }, 1000);
  };

  return (
    <main className="w-full min-h-screen bg-layout-bg flex items-center justify-center p-md font-sans">
      <div className="w-full max-w-[600px] bg-white border border-outline-variant rounded-xl p-lg md:p-xl flex flex-col gap-lg shadow-sm">
        {/* Header */}
        <div className="text-center">
          <Image src="/logo.svg" alt="CEPAT" width={100} height={32} className="logo-img mx-auto mb-sm" />
          <h2 className="font-headline-md text-headline-md text-on-surface">Lengkapi Profil Anda</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Langkah terakhir untuk mencocokkan Anda dengan tugas mikro di dekat Anda.
          </p>
        </div>

        <form onSubmit={handleOnboardingSubmit} className="space-y-lg">
          {/* Basic info */}
          <div className="space-y-md">
            <Input
              label="Universitas / Instansi"
              type="text"
              placeholder="Universitas Gadjah Mada"
              value={univ}
              onChange={(e) => setUniv(e.target.value)}
              required
            />
            <Input
              label="Nomor Telepon (WhatsApp)"
              type="tel"
              placeholder="0812XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <div className="flex flex-col gap-xs">
              <label className="font-body-sm text-body-sm text-on-surface-variant font-medium">Bio Singkat</label>
              <textarea
                className="input-field min-h-[80px] font-body-sm custom-scrollbar"
                placeholder="Ceritakan singkat tentang dirimu, contoh: Mahasiswa DKV UGM yang tertarik dengan fotografi katalog makanan."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={200}
                required
              />
            </div>
          </div>

          {/* Skill Tag selector */}
          <div className="space-y-sm border-t border-outline-variant/50 pt-md">
            <div>
              <label className="font-body-md text-body-md font-semibold text-on-surface">Pilih Keahlian Utama Anda</label>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Pilih minimal 1 kategori agar tugas di sekitar sesuai minat Anda.
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-sm pt-sm">
              {SKILL_CATEGORIES.map((skill) => {
                const isSelected = selectedSkills.includes(skill.value);
                return (
                  <button
                    key={skill.value}
                    type="button"
                    onClick={() => toggleSkill(skill.value)}
                    className={`p-sm rounded border flex flex-col items-center gap-xs text-center cursor-pointer transition-all duration-150 text-[12px] font-medium font-sans ${isSelected ? "bg-primary-container/10 border-primary-container text-primary-container font-semibold" : "bg-white border-outline-variant hover:bg-surface-container-low"}`}
                  >
                    <span className="text-xl">{skill.emoji}</span>
                    <span>{skill.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Button type="submit" fullWidth disabled={loading || selectedSkills.length === 0}>
            {loading ? "Menyimpan Profil..." : "Selesai & Masuk Dashboard"}
          </Button>
        </form>
      </div>
    </main>
  );
}
