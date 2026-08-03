"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();
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
                  Saya menyetujui <a href="#" className="text-primary hover:underline">Syarat &amp; Ketentuan</a> serta <a href="#" className="text-primary hover:underline">Kebijakan Privasi</a> CEPAT.
                </span>
              </div>

              <Button type="submit" fullWidth disabled={loading}>
                {loading ? "Membuat Akun..." : "Daftar Akun Baru"}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
