"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

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
        throw new Error(result.message || "Email atau password tidak cocok. Silakan periksa kembali.");
      }

      if (result.data?.user?.is_onboarded === false) {
        const onboardingTarget = redirectParam
          ? `/onboarding?redirect=${encodeURIComponent(redirectParam)}`
          : "/onboarding";
        router.replace(onboardingTarget);
      } else {
        router.replace(redirectParam || "/feed");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const callbackNext = redirectParam ? `?next=${encodeURIComponent(redirectParam)}` : "";
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback${callbackNext}`,
        },
      });
      if (googleError) throw googleError;
    } catch (err: any) {
      setError(err.message || "Gagal masuk dengan Google. Pastikan OAuth Google telah dikonfigurasi di Supabase.");
      setLoading(false);
    }
  };

  const registerHref = redirectParam
    ? `/register?redirect=${encodeURIComponent(redirectParam)}`
    : "/register";

  return (
    <main className="w-full min-h-screen flex flex-col lg:flex-row overflow-hidden bg-white font-sans">
      {/* ───────────── LEFT: BRAND PANEL ───────────── */}
      <section
        className="relative hidden lg:flex w-[50%] xl:w-[45%] flex-col justify-between overflow-hidden bg-[#072e29]"
      >
        {/* Grain texture overlay */}
        <div
          className="absolute inset-0 z-[1] opacity-[0.15] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full justify-between p-12 lg:p-14 xl:p-18 pr-16 lg:pr-24 xl:pr-28">
          {/* Top: Logo */}
          <Link href="/" className="flex items-center" aria-label="Kembali ke beranda">
            <Image
              src="/logo.svg"
              alt="CEPAT"
              width={120}
              height={34}
              className="logo-img brightness-0 invert"
              priority
            />
          </Link>

          {/* Center: Value Proposition */}
          <div className="flex-1 flex flex-col justify-center max-w-lg -mt-8">
            <h1 className="text-[clamp(2rem,3.2vw,3rem)] font-extrabold text-white leading-[1.1] tracking-tight mb-6">
              Mulai dari tugas
              <br />
              kecil di sekitarmu.
            </h1>
            <p className="text-base text-white/60 leading-relaxed mb-10 max-w-sm">
              Cari penghasilan fleksibel atau post bantuan cepat untuk UMKM dan kegiatan kampus — langsung dari daerah terdekat.
            </p>

            {/* Trust Stats */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/10 max-w-sm">
              <div>
                <p className="text-2xl font-extrabold text-white font-mono tracking-tight">500+</p>
                <p className="text-[11px] text-white/40 uppercase tracking-wider font-semibold mt-0.5">Mahasiswa</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-white font-mono tracking-tight">1.2k</p>
                <p className="text-[11px] text-white/40 uppercase tracking-wider font-semibold mt-0.5">Tugas Selesai</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#84CC16] font-mono tracking-tight">&lt;5m</p>
                <p className="text-[11px] text-white/40 uppercase tracking-wider font-semibold mt-0.5">Respons</p>
              </div>
            </div>
          </div>

          {/* Bottom: Footer */}
          <div className="flex flex-col gap-4">
            {/* Trust Badges */}
            <div className="flex items-center gap-6">
              {[
                { icon: "verified_user", label: "Escrow Aman" },
                { icon: "star", label: "Rating 2-Arah" },
                { icon: "radar", label: "Radius GPS" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <span
                    className="material-symbols-outlined text-[16px] text-[#84CC16]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                   aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="text-xs text-white/50 font-semibold">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-[11px] text-white/40 font-mono pt-3 border-t border-white/5">
              <span>© 2026 CEPAT Marketplace</span>
              <span className="flex items-center gap-1.5">
                <span
                  className="material-symbols-outlined text-[14px] text-[#84CC16]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                 aria-hidden="true">
                  public
                </span>
                SDG 8 — Decent <span className="text-[#84CC16] font-bold tracking-wider">Work</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── RIGHT: AUTH FORM ───────────── */}
      <section className="relative w-full lg:flex-1 flex items-center justify-center p-6 md:p-10 lg:p-16 min-h-screen">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative w-full max-w-[420px]">
          {/* Mobile Brand */}
          <div className="lg:hidden mb-10 text-center">
            <Link href="/" className="inline-block">
              <Image src="/logo.svg" alt="CEPAT" width={100} height={28} className="logo-img mx-auto" />
            </Link>
            <p className="text-sm text-on-surface-variant mt-2">Satu akun untuk semua.</p>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-on-surface tracking-tight mb-1">
              Masuk ke CEPAT
            </h2>
            <p className="text-sm text-on-surface-variant">
              Belum punya akun?{" "}
              <Link href={registerHref} className="text-primary font-semibold hover:underline">
                Daftar gratis
              </Link>
            </p>
          </div>

          {error && (
            <p role="alert" className="mb-5 rounded-lg border border-error/30 bg-error-container/20 p-3.5 text-xs text-error font-medium">
              {error}
            </p>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Inputs */}
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

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/30"
                />
                <span className="text-sm text-on-surface-variant">Ingat saya</span>
              </label>
              <a href="#" className="text-xs text-primary font-semibold hover:underline">
                Lupa password?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary font-bold text-sm rounded py-3 min-h-[48px] hover:bg-primary-container transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? "Memproses..." : "Masuk ke Dashboard"}
            </button>

            {/* Divider */}
            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-outline-variant/40" />
              <span className="mx-4 text-[11px] text-on-surface-variant/60 font-bold uppercase tracking-widest">
                atau
              </span>
              <div className="flex-grow border-t border-outline-variant/40" />
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 border border-outline-variant rounded py-3 min-h-[48px] bg-white hover:bg-surface-container-low transition-colors text-sm font-bold text-on-surface cursor-pointer active:scale-[0.98] disabled:opacity-60"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Masuk dengan Google
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-layout-bg font-sans">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
