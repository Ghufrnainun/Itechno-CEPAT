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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API request
    setTimeout(() => {
      setLoading(false);
      localStorage.setItem("cepat_role", role);
      // Redirect to main feed dashboard
      router.push("/feed");
    }, 1000);
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      localStorage.setItem("cepat_role", role);
      router.push("/feed");
    }, 1000);
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
                  label="Email / Username"
                  type="text"
                  placeholder="name@university.edu atau username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-sm cursor-pointer">
                  <input type="checkbox" className="rounded text-primary border-outline-variant focus:ring-primary-container" />
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Ingat saya</span>
                </label>
                <a href="#" className="font-label-sm text-label-sm text-primary hover:underline">
                  Lupa password?
                </a>
              </div>

              <Button type="submit" fullWidth disabled={loading}>
                {loading ? "Memproses..." : "Masuk ke Dashboard"}
              </Button>

              <div className="relative flex py-sm items-center">
                <div className="flex-grow border-t border-outline-variant/50"></div>
                <span className="flex-shrink mx-md font-label-sm text-label-sm text-on-surface-variant uppercase">
                  atau
                </span>
                <div className="flex-grow border-t border-outline-variant/50"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-md border border-outline-variant rounded py-3 bg-white hover:bg-surface-container-low transition-colors font-label-md text-label-md font-bold text-on-surface-variant cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Masuk dengan Google
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
