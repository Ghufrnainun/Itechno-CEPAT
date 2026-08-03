"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { RoleCard } from "@/features/auth/components/RoleCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"worker" | "requester">("worker");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Login gagal. Coba lagi.");
      }

      localStorage.setItem("cepat_role", role);
      router.replace("/feed");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full min-h-screen flex flex-col lg:flex-row overflow-hidden bg-layout-bg font-sans">
      {/* Left brand panel */}
      <section className="hidden lg:flex w-1/2 flex-col justify-between p-[80px] bg-layout-bg border-r border-outline-variant/30">
        <div>
          <Link href="/" className="flex items-center mb-xl" aria-label="Kembali ke beranda">
            <Image
              src="/logo.svg"
              alt="CEPAT"
              width={140}
              height={40}
              className="logo-img-lg"
              priority
            />
          </Link>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-md max-w-lg mt-xl">
            Mulai dari tugas kecil di sekitar kamu.
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md mb-xl">
            Cari penghasilan fleksibel atau post bantuan cepat untuk UMKM dan kegiatan kampus dalam radius terdekat.
          </p>
          
          <ul className="space-y-md mt-xl">
            <li className="flex items-start gap-md">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center border border-outline-variant/50">
                <span className="material-symbols-outlined text-primary-container text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  radar
                </span>
              </div>
              <div>
                <p className="font-body-md text-body-md font-semibold text-on-surface">Radius terdekat — default 2km</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">GPS otomatis atau pin manual di peta Leaflet + OpenStreetMap.</p>
              </div>
            </li>
            <li className="flex items-start gap-md">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center border border-outline-variant/50">
                <span className="material-symbols-outlined text-primary-container text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified_user
                </span>
              </div>
              <div>
                <p className="font-body-md text-body-md font-semibold text-on-surface">Escrow aman</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Dana terkunci, cair hanya setelah pekerjaan disetujui.</p>
              </div>
            </li>
            <li className="flex items-start gap-md">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center border border-outline-variant/50">
                <span className="material-symbols-outlined text-primary-container text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
              </div>
              <div>
                <p className="font-body-md text-body-md font-semibold text-on-surface">Rating dua arah</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Bangun reputasi sejak kuliah. Histori kerja transparan.</p>
              </div>
            </li>
          </ul>
          
          <div className="mt-xl inline-flex items-center gap-sm px-md py-sm rounded-full bg-surface-container-highest border border-outline-variant">
            <span className="material-symbols-outlined text-primary text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              public
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              SDG 8 — Pekerjaan Layak &amp; Pertumbuhan Ekonomi
            </span>
          </div>
        </div>
        <div className="font-label-sm text-label-sm text-on-surface-variant">
          © 2026 CEPAT Marketplace. Praktis. Transparan. ITechno Cup 2026.
        </div>
      </section>

      {/* Right auth panel */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-md bg-surface-container-lowest min-h-screen overflow-y-auto">
        <div className="w-full max-w-[460px] py-xl">
          {/* Mobile Brand */}
          <div className="lg:hidden mb-xl text-center">
            <Link href="/" className="inline-block">
              <Image src="/logo.svg" alt="CEPAT" width={120} height={32} className="logo-img mx-auto" />
            </Link>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">Satu akun untuk semua.</p>
          </div>

          {/* Auth Tabs */}
          <div className="flex border-b border-outline-variant mb-xl">
            <button className="tab-btn active">Masuk</button>
            <Link href="/register" className="tab-btn">
              Daftar
            </Link>
          </div>

          {/* Form */}
          <div className="tab-panel active">
            <div className="mb-lg">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">Masuk ke CEPAT</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Satu akun untuk cari tugas dan post tugas.</p>
            </div>

            {error && (
              <p role="alert" className="mb-lg rounded border border-error/30 bg-error-container/20 px-md py-sm font-body-sm text-body-sm text-error">
                {error}
              </p>
            )}
            
            <form onSubmit={handleLogin} className="space-y-lg">
              {/* Role Card Selection */}
              <div className="space-y-sm">
                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-sm">
                  Pilih peran utama saat ini
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

              {/* Form Input fields */}
              <div className="space-y-md">
                <Input
                  label="Email"
                  type="email"
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-sm cursor-pointer">
                  <input type="checkbox" className="rounded text-primary border-outline-variant focus:ring-primary-container" />
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Ingat saya</span>
                </label>
              </div>

              <Button type="submit" fullWidth disabled={loading}>
                {loading ? "Memproses..." : "Masuk ke Dashboard"}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
