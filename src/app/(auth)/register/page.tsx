"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { RoleCard } from "@/features/auth/components/RoleCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"worker" | "requester">("worker");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      localStorage.setItem("cepat_role", role);
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          nama_lengkap: fullName,
          username,
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Registrasi gagal. Coba lagi.");
      }

      router.replace("/login");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Registrasi gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (googleError) throw googleError;
    } catch (err: any) {
      setError(err.message || "Gagal mendaftar dengan Google. Pastikan OAuth Google telah dikonfigurasi di Supabase.");
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
            Tumbuh bersama komunitas lokal.
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md mb-xl">
            Registrasi sebagai mahasiswa untuk menambah uang jajan, atau sebagai pemilik usaha lokal untuk mendelegasikan tugas harian.
          </p>
          
          <ul className="space-y-md mt-xl">
            <li className="flex items-start gap-md">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center border border-outline-variant/50">
                <span className="material-symbols-outlined text-primary-container text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  school
                </span>
              </div>
              <div>
                <p className="font-body-md text-body-md font-semibold text-on-surface">Peluang kerja fleksibel</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Pilih pekerjaan mikro yang sesuai dengan jadwal kuliah Anda.</p>
              </div>
            </li>
            <li className="flex items-start gap-md">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center border border-outline-variant/50">
                <span className="material-symbols-outlined text-primary-container text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  storefront
                </span>
              </div>
              <div>
                <p className="font-body-md text-body-md font-semibold text-on-surface">Bantuan on-demand untuk UMKM</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Post lowongan tugas dalam hitungan detik. Mahasiswa terdekat siap membantu.</p>
              </div>
            </li>
          </ul>
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
            <Link href="/login" className="tab-btn">
              Masuk
            </Link>
            <button className="tab-btn active">Daftar</button>
          </div>

          {/* Form */}
          <div className="tab-panel active">
            <div className="mb-lg">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">Buat Akun Baru</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Daftar sekarang untuk mulai mencari atau memposting tugas.</p>
            </div>

            {error && (
              <p role="alert" className="mb-lg rounded border border-error/30 bg-error-container/20 px-md py-sm font-body-sm text-body-sm text-error">
                {error}
              </p>
            )}
            
            <form onSubmit={handleRegister} className="space-y-lg">
              {/* Role Card Selection */}
              <div className="space-y-sm">
                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-sm">
                  Pilih peran utama Anda
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

              <div className="space-y-md">
                <Input
                  label="Nama Lengkap"
                  type="text"
                  placeholder="Budi Santoso"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
                <Input
                  label="Username"
                  type="text"
                  placeholder="budisantoso"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
                <Input
                  label="Email Universitas / Pribadi"
                  type="email"
                  placeholder="budi@student.univ.ac.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="Min. 8 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="flex items-start gap-sm cursor-pointer">
                <input type="checkbox" className="rounded text-primary border-outline-variant focus:ring-primary-container mt-1" required />
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Saya menyetujui <a href="#" className="text-primary hover:underline">Syarat & Ketentuan</a> serta <a href="#" className="text-primary hover:underline">Kebijakan Privasi</a> CEPAT.
                </span>
              </div>

              <Button type="submit" fullWidth disabled={loading}>
                {loading ? "Membuat Akun..." : "Daftar Akun Baru"}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-lg">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/40"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-surface-container-lowest px-md text-on-surface-variant font-label-sm">
                  atau
                </span>
              </div>
            </div>

            {/* Google OAuth Button */}
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-sm inline-block" viewBox="0 0 24 24">
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
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Daftar dengan Google
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
