"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { RoleCard } from "@/features/auth/components/RoleCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import {
  User,
  AtSign,
  Mail,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  Store,
  ShieldCheck,
  Globe,
  AlertCircle,
  Loader2,
} from "lucide-react";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");

  const [role, setRole] = useState<"worker" | "requester">("worker");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (roleParam === "requester") {
      setRole("requester");
    } else if (roleParam === "worker") {
      setRole("worker");
    }
  }, [roleParam]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError("Silakan setujui Syarat & Ketentuan serta Kebijakan Privasi terlebih dahulu.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      localStorage.setItem("cepat_role", role);
      localStorage.setItem("cepat_user_name", fullName);
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
        throw new Error(result.message || "Registrasi gagal. Silakan coba lagi.");
      }

      router.replace("/onboarding");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Registrasi gagal. Silakan coba lagi."
      );
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
      setError(
        err.message ||
          "Gagal mendaftar dengan Google. Pastikan OAuth Google telah dikonfigurasi di Supabase."
      );
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-surface font-sans flex flex-col md:flex-row relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,oklch(0.48_0.10_175_/_0.06),transparent_50%)] pointer-events-none" />

      {/* ───────────── LEFT: BRAND & VALUE PANEL ───────────── */}
      <section className="hidden md:flex flex-1 bg-surface-container-lowest p-8 lg:p-12 xl:p-16 flex-col justify-between border-r border-card-border relative z-10">
        {/* Top: Logo & Brand */}
        <div>
          <Link href="/" className="inline-flex items-center gap-3 group">
            <Image
              src="/logo.svg"
              alt="CEPAT Logo"
              width={38}
              height={38}
              className="rounded-xl object-contain group-hover:scale-105 transition-transform"
              priority
            />
            <span className="font-headline font-extrabold text-2xl tracking-tight text-on-surface">
              CEPAT
            </span>
          </Link>
        </div>

        {/* Center: Value Proposition & Pillars */}
        <div className="space-y-8 max-w-lg my-auto py-8">
          <div className="space-y-3">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              Campus Micro-Freelancing
            </span>
            <h1 className="font-headline text-3xl lg:text-4xl font-extrabold text-on-surface leading-[1.15] tracking-tight">
              Mulai Langkah Kariermu dari Kampus.
            </h1>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Platform micro-task terpercaya untuk mahasiswa dan UMKM lokal. Temukan tugas fleksibel, bangun reputasi profesional, dan amankan pembayaran dengan sistem escrow otomatis.
            </p>
          </div>

          {/* Value Pillars */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-surface-container-low border border-card-border">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <GraduationCap className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="font-headline text-xs font-bold text-on-surface">
                  Peluang Kerja Fleksibel
                </h4>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Ambil pekerjaan mikro di sekitar kampus yang sesuai dengan jadwal kuliahmu.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-surface-container-low border border-card-border">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="font-headline text-xs font-bold text-on-surface">
                  Garansi Pembayaran Escrow
                </h4>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Poin kompensasi dijamin aman terkunci dan langsung cair setelah tugas disetujui.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-xl bg-surface-container-low border border-card-border">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Store className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="font-headline text-xs font-bold text-on-surface">
                  Bantuan On-Demand UMKM
                </h4>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Pemilik usaha lokal dapat mendelegasikan tugas harian kepada talenta kampus dalam hitungan menit.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Footer Info */}
        <div className="flex items-center justify-between text-xs text-on-surface-variant/70 font-mono pt-4 border-t border-card-border">
          <span>© 2026 CEPAT Platform</span>
          <span className="inline-flex items-center gap-1.5 text-primary font-bold">
            <Globe className="w-3.5 h-3.5" />
            SDG 8 Decent Work
          </span>
        </div>
      </section>

      {/* ───────────── RIGHT: REGISTRATION FORM ───────────── */}
      <section className="flex-1 flex items-center justify-center p-6 md:p-10 lg:p-12 xl:p-16 bg-surface overflow-y-auto relative z-10">
        <div className="w-full max-w-md space-y-5 my-auto">
          {/* Mobile Header Brand */}
          <div className="md:hidden flex flex-col items-center text-center mb-2">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-2">
              <Image
                src="/logo.svg"
                alt="CEPAT Logo"
                width={32}
                height={32}
                className="rounded-xl object-contain"
              />
              <span className="font-headline font-black text-xl tracking-tight text-on-surface">
                CEPAT
              </span>
            </Link>
          </div>

          {/* Form Headline */}
          <div className="space-y-1">
            <h2 className="font-headline text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              Buat Akun Baru
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              Sudah punya akun?{" "}
              <Link href="/login" className="text-primary font-bold hover:underline">
                Masuk di sini
              </Link>
            </p>
          </div>

          {/* Error Message Alert */}
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-error/30 bg-error-container/20 p-3.5 text-xs text-error flex items-start gap-2.5 animate-fadeIn"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                Pilih Peran Utama
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <RoleCard
                  isSelected={role === "worker"}
                  onClick={() => setRole("worker")}
                  title="Pekerja / Worker"
                  description="Cari tugas & penghasilan fleksibel."
                  iconName="worker"
                />
                <RoleCard
                  isSelected={role === "requester"}
                  onClick={() => setRole("requester")}
                  title="Pemberi Tugas"
                  description="Post tugas untuk mahasiswa sekitar."
                  iconName="requester"
                />
              </div>
            </div>

            {/* Input Fields */}
            <Input
              label="Nama Lengkap"
              type="text"
              placeholder="Contoh: Budi Pratama"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              required
            />

            <Input
              label="Username"
              type="text"
              placeholder="budipratama"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              leftIcon={<AtSign className="w-4 h-4" />}
              required
            />

            <Input
              label="Email Universitas / Pribadi"
              type="email"
              placeholder="nama@student.univ.ac.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
              required
            />

            {/* Terms and Privacy Checkbox */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                id="terms-checkbox"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 rounded border-card-border text-primary focus:ring-primary/30 accent-primary mt-0.5 cursor-pointer"
                required
              />
              <label
                htmlFor="terms-checkbox"
                className="text-xs text-on-surface-variant leading-relaxed select-none cursor-pointer"
              >
                Saya menyetujui{" "}
                <Link
                  href="/syarat-ketentuan"
                  className="text-primary font-semibold hover:underline"
                >
                  Syarat &amp; Ketentuan
                </Link>{" "}
                serta{" "}
                <Link
                  href="/kebijakan-privasi"
                  className="text-primary font-semibold hover:underline"
                >
                  Kebijakan Privasi
                </Link>{" "}
                CEPAT.
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              fullWidth
              size="lg"
              className="mt-2 text-sm font-bold shadow-xs"
            >
              {loading ? "Membuat Akun..." : "Daftar Akun Baru"}
            </Button>

            {/* Divider */}
            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-card-border" />
              <span className="mx-4 text-[10px] text-on-surface-variant/60 font-mono font-bold uppercase tracking-widest">
                atau
              </span>
              <div className="flex-grow border-t border-card-border" />
            </div>

            {/* Google OAuth Button */}
            <Button
              type="button"
              variant="secondary"
              fullWidth
              size="lg"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="text-xs font-bold gap-3"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              Daftar dengan Google
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}

