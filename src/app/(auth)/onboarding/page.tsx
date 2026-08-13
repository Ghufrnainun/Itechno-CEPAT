"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { renderIcon } from "@/lib/icon-map";

const BIO_TEMPLATES = [
  "Siap bantu tugas harian, admin, dan data entry.",
  "Spesialis fotografi, videografi, dan desain promo.",
  "Siap bantu kurir, antar barang, dan helper event.",
  "Siap les privat, tutoring, dan bantuan riset.",
];

// ─────────────────────────────────────────────────────────────
// STEP 1 — Nomor WA + Instansi
// ─────────────────────────────────────────────────────────────
function StepContact({
  phone,
  setPhone,
  univ,
  setUniv,
  onNext,
  error,
}: {
  phone: string;
  setPhone: (v: string) => void;
  univ: string;
  setUniv: (v: string) => void;
  onNext: () => void;
  error: string;
}) {
  return (
    <div className="animate-fadeIn w-full max-w-lg mx-auto">
      <p className="text-xs font-bold text-primary/70 uppercase tracking-widest mb-3">
        Langkah 1 dari 2
      </p>
      <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight mb-2">
        Cara dihubungi?
      </h2>
      <p className="text-sm text-on-surface-variant mb-10">
        Nomor telepon kamu untuk keperluan kontak darurat atau verifikasi. Koordinasi tugas tetap lewat chat in-app.
      </p>

      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-error/5 border border-error/20 text-xs text-error font-medium">
          {error}
        </div>
      )}

      <div className="space-y-5 mb-10">
        <div>
          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
            Nomor Telepon{" "}
            <span className="text-error normal-case font-normal tracking-normal">*</span>
          </label>
          <Input
            type="tel"
            placeholder="Contoh: 08123456789"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
            Instansi / Kampus{" "}
            <span className="text-on-surface-variant/40 normal-case font-normal tracking-normal">
              (opsional)
            </span>
          </label>
          <Input
            type="text"
            placeholder="Contoh: UGM / UMKM Lokal / Freelancer"
            value={univ}
            onChange={(e) => setUniv(e.target.value)}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full bg-on-surface text-surface font-bold text-sm rounded-xl py-4 hover:bg-on-surface/80 transition-colors active:scale-[0.98] cursor-pointer shadow-sm"
      >
        Lanjut →
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STEP 2 — Bio + Skills
// ─────────────────────────────────────────────────────────────
function StepProfile({
  bio,
  setBio,
  availableSkills,
  selectedSkills,
  toggleSkill,
  updateSkillDetail,
  onBack,
  onSubmit,
  loading,
  error,
}: {
  bio: string;
  setBio: (v: string) => void;
  availableSkills: { id_skill_master: string; nama_skill: string; icon: string | null }[];
  selectedSkills: { id_skill_master: string; nama_skill: string; icon: string | null; deskripsi_pengalaman: string; certificate_url: string }[];
  toggleSkill: (skill: { id_skill_master: string; nama_skill: string; icon: string | null }) => void;
  updateSkillDetail: (skillId: string, field: 'deskripsi_pengalaman' | 'certificate_url', val: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
  error: string;
}) {
  return (
    <div className="animate-fadeIn w-full max-w-lg mx-auto">
      <p className="text-xs font-bold text-primary/70 uppercase tracking-widest mb-3">
        Langkah 2 dari 2
      </p>
      <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight mb-2">
        Ceritakan tentang kamu.
      </h2>
      <p className="text-sm text-on-surface-variant mb-8">
        Bio singkat dan keahlian membantu sistem merekomendasikan kamu ke tugas yang tepat.
      </p>

      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-error/5 border border-error/20 text-xs text-error font-medium">
          {error}
        </div>
      )}

      <div className="space-y-6 mb-10">
        {/* Bio */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              Bio singkat{" "}
              <span className="text-error normal-case font-normal tracking-normal">*</span>
            </label>
            <span className="text-[11px] text-on-surface-variant/50 font-mono">
              {bio.length}/200
            </span>
          </div>
          <textarea
            className="w-full min-h-[100px] p-3.5 text-sm rounded-xl border-2 border-outline-variant bg-white focus:outline-none focus:border-primary focus:ring-0 transition-all font-sans resize-none"
            placeholder="Tulis singkat keahlian atau jenis bantuan yang kamu berikan..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={200}
          />
          {/* Quick fill chips */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {BIO_TEMPLATES.map((tpl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setBio(tpl)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-surface-container hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-colors border border-outline-variant/50 cursor-pointer"
              >
                {tpl.slice(0, 28)}…
              </button>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              Keahlian / Minat{" "}
              <span className="text-error normal-case font-normal tracking-normal">*</span>
            </label>
            <span className="text-[11px] text-primary font-bold font-mono">
              {selectedSkills.length} terpilih
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {availableSkills.map((skill) => {
              const sel = selectedSkills.some(s => s.id_skill_master === skill.id_skill_master);
              return (
                <button
                  key={skill.id_skill_master}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 text-center cursor-pointer transition-all duration-150 ${
                    sel
                      ? "border-primary bg-primary/5 text-primary shadow-sm"
                      : "border-outline-variant/60 bg-white hover:bg-surface-container-low text-on-surface-variant hover:border-primary/30"
                  }`}
                >
                  {renderIcon(skill.icon, "w-6 h-6 mb-1 text-primary/80")}
                  <span className="text-[12px] font-bold leading-tight capitalize tracking-wide font-sans text-on-surface-variant">
                    {skill.nama_skill}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedSkills.length > 0 && (
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mt-2">
                Detail Keahlian{" "}
                <span className="text-on-surface-variant/40 normal-case font-normal tracking-normal">
                  (opsional)
                </span>
              </label>
              {selectedSkills.map((skill) => {
                return (
                  <div key={skill.id_skill_master} className="p-3 border border-outline-variant rounded-xl bg-surface-container-lowest flex flex-col gap-2">
                    <p className="text-sm font-bold text-primary flex items-center gap-2 capitalize font-sans tracking-wide">
                      {renderIcon(skill.icon, "w-4 h-4 text-primary")}
                      {skill.nama_skill}
                    </p>
                    <textarea
                      className="w-full p-2.5 text-[13px] rounded-lg border border-outline-variant bg-white focus:outline-none focus:border-primary transition-all resize-none min-h-[60px]"
                      placeholder="Ceritakan pengalamanmu..."
                      value={skill.deskripsi_pengalaman}
                      onChange={(e) => updateSkillDetail(skill.id_skill_master, 'deskripsi_pengalaman', e.target.value)}
                    />
                    <Input
                      type="url"
                      placeholder="Link Sertifikat / Portofolio"
                      value={skill.certificate_url}
                      onChange={(e) => updateSkillDetail(skill.id_skill_master, 'certificate_url', e.target.value)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-none px-5 py-4 rounded-xl border-2 border-outline-variant text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer"
        >
          ←
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="flex-1 bg-primary text-on-primary font-bold text-sm rounded-xl py-4 hover:bg-primary/90 transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          {loading ? "Menyimpan..." : "Selesai & Masuk Dashboard"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN CONTENT
// ─────────────────────────────────────────────────────────────
function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  // Read role saved by register page — onboarding does NOT re-ask
  const role = (() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cepat_role");
      if (saved === "requester" || saved === "worker") return saved;
    }
    return "worker";
  })();

  const [step, setStep] = useState<1 | 2>(1);
  const [bio, setBio] = useState("");
  const [univ, setUniv] = useState("");
  const [phone, setPhone] = useState("");
  const [availableSkills, setAvailableSkills] = useState<{ id_skill_master: string; nama_skill: string; icon: string | null }[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<{ id_skill_master: string; nama_skill: string; icon: string | null; deskripsi_pengalaman: string; certificate_url: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const res = await fetch('/api/skills');
        const json = await res.json();
        if (json.success && json.data) {
          setAvailableSkills(json.data);
        }
      } catch (err) {
        console.error("Gagal mengambil master skills", err);
      }
    };
    fetchSkills();
  }, []);

  const toggleSkill = (skill: { id_skill_master: string; nama_skill: string; icon: string | null }) => {
    setSelectedSkills(prev => {
      const exists = prev.find(s => s.id_skill_master === skill.id_skill_master);
      if (exists) {
        if (prev.length > 1) {
          return prev.filter(s => s.id_skill_master !== skill.id_skill_master);
        }
        return prev;
      } else {
        return [...prev, { ...skill, deskripsi_pengalaman: "", certificate_url: "" }];
      }
    });
  };

  const updateSkillDetail = (skillId: string, field: 'deskripsi_pengalaman' | 'certificate_url', val: string) => {
    setSelectedSkills(prev => prev.map(s => s.id_skill_master === skillId ? { ...s, [field]: val } : s));
  };

  const goToStep2 = () => {
    setError("");
    if (phone.trim().length < 8) {
      setError("Nomor WhatsApp minimal 8 digit.");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    setError("");
    if (bio.trim().length < 5) {
      setError("Bio singkat minimal 5 karakter.");
      return;
    }
    if (selectedSkills.length === 0) {
      setError("Pilih minimal 1 kategori keahlian.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio,
          pendidikan_terakhir: univ,
          no_telpon: phone,
          role,
        }),
      });

      await response.json().catch(() => ({}));

      // POST to the new skill endpoint
      await fetch("/api/users/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills: selectedSkills
        }),
      });

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

  const progressMap: Record<number, string> = { 1: "50%", 2: "100%" };

  return (
    <main className="min-h-screen w-full flex flex-col bg-white font-sans">
      {/* ── TOP NAV — logo only, no auth links ── */}
      <header className="flex items-center justify-center px-6 py-4 border-b border-outline-variant/30">
        <Link href="/" aria-label="Beranda">
          <Image
            src="/logo.svg"
            alt="CEPAT"
            width={100}
            height={28}
            className="logo-img h-7 w-auto"
            priority
          />
        </Link>
      </header>

      {/* ── PROGRESS BAR ── */}
      <div className="w-full h-1 bg-surface-container-high">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: progressMap[step] }}
        />
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {step === 1 && (
          <StepContact
            phone={phone}
            setPhone={setPhone}
            univ={univ}
            setUniv={setUniv}
            onNext={goToStep2}
            error={error}
          />
        )}
        {step === 2 && (
          <StepProfile
            bio={bio}
            setBio={setBio}
            availableSkills={availableSkills}
            selectedSkills={selectedSkills}
            toggleSkill={toggleSkill}
            updateSkillDetail={updateSkillDetail}
            onBack={() => {
              setError("");
              setStep(1);
            }}
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
          />
        )}
      </div>

      {/* ── FOOTER ── */}
      <footer className="text-center py-4 border-t border-outline-variant/20">
        <p className="text-[11px] text-on-surface-variant/40 font-mono">
          © 2026 CEPAT Marketplace · SDG 8 — Decent Work
        </p>
      </footer>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white font-sans">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
