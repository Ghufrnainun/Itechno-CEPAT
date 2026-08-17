"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Globe,
  AlertCircle,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BanDetails {
  type: "TEMPORARY" | "PERMANENT";
  reason: string;
  banned_at?: string | null;
  banned_until?: string | null;
}

function safeDecode(val: string | null): string | null {
  if (!val) return null;
  try {
    return decodeURIComponent(val);
  } catch {
    return val;
  }
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const isBannedParam = searchParams.get("banned");
  const banTypeParam = searchParams.get("type");
  const banReasonParam = searchParams.get("reason");
  const banUntilParam = searchParams.get("until");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [banDetails, setBanDetails] = useState<BanDetails | null>(null);

  React.useEffect(() => {
    if (isBannedParam === "true") {
      setBanDetails({
        type: (banTypeParam as "TEMPORARY" | "PERMANENT") === "TEMPORARY" ? "TEMPORARY" : "PERMANENT",
        reason: safeDecode(banReasonParam) || "",
        banned_until: safeDecode(banUntilParam),
      });
    }
  }, [isBannedParam, banTypeParam, banReasonParam, banUntilParam]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBanDetails(null);
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json().catch(() => ({}));

      if (result.is_banned && result.ban_details) {
        setError("");
        setBanDetails(result.ban_details);
        return;
      }

      if (!response.ok) {
        throw new Error(
          result.message || "Email atau password tidak cocok. Silakan periksa kembali."
        );
      }

      if (result.data?.user?.role === "Admin") {
        router.replace("/admin/dashboard");
        return;
      }

      if (result.data?.user?.is_onboarded === false) {
        const onboardingTarget = redirectParam
          ? `/onboarding?redirect=${encodeURIComponent(redirectParam)}`
          : "/onboarding";
        router.replace(onboardingTarget);
      } else {
        router.replace(redirectParam || "/feed");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setBanDetails(null);
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

      if (googleError) {
        throw googleError;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login dengan Google gagal.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-surface font-sans flex flex-col md:flex-row relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,oklch(0.48_0.10_175_/_0.06),transparent_50%)] pointer-events-none" />

      {/* Ban Details Modal */}
      {banDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-xl border border-card-border space-y-4 relative">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-error-container/30 text-error shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-lg text-on-surface">
                  Akun Anda Ditangguhkan
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Akses ke platform CEPAT dibatasi oleh Admin
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low border border-card-border space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-on-surface-variant">Jenis Penangguhan:</span>
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded font-mono font-bold uppercase text-[10px]",
                    banDetails.type === "PERMANENT"
                      ? "bg-error-container/50 text-error"
                      : "bg-amber-500/20 text-amber-600"
                  )}
                >
                  {banDetails.type === "PERMANENT" ? "Permanen" : "Sementara"}
                </span>
              </div>

              <div>
                <span className="font-semibold text-on-surface-variant block mb-1">Alasan:</span>
                <p className="text-on-surface bg-surface-container-lowest p-2.5 rounded-lg border border-card-border">
                  {banDetails.reason ? (
                    banDetails.reason
                  ) : (
                    <span className="italic text-on-surface-variant/70">(Tidak ada rincian alasan yang dicantumkan)</span>
                  )}
                </p>
              </div>

              {banDetails.type === "TEMPORARY" && banDetails.banned_until && (
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span>Berlaku Hingga:</span>
                  <span className="font-mono font-bold text-on-surface">
                    {new Date(banDetails.banned_until).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Jika Anda merasa ini adalah kekeliruan, silakan hubungi{" "}
              <span className="font-semibold text-primary font-mono">admin@itechno.id</span> untuk
              pengajuan banding.
            </p>

            <Button onClick={() => setBanDetails(null)} fullWidth size="md">
              Saya Mengerti
            </Button>
          </div>
        </div>
      )}

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
              Kembali Berkontribusi &amp; Raih Peluang Nyata.
            </h1>
            <p className="text-on-surface-variant text-sm leading-relaxed font-body-sm">
              Masuk untuk melanjutkan eksplorasi tugas mikro kampus, kelola saldo dompet PTS yang aman dengan escrow, atau delegasikan pekerjaan ke mahasiswa terpercaya di sekitarmu.
            </p>
          </div>

          {/* Value Pillars */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-surface-container-low border border-card-border">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="font-headline text-xs font-bold text-on-surface">
                  Pencarian Tugas Terdekat &amp; Fleksibel
                </h4>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Akses feed tugas berbasis lokasi di sekitar kampus dan sesuaikan dengan jadwal kuliahmu.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-surface-container-low border border-card-border">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="font-headline text-xs font-bold text-on-surface">
                  Sistem Escrow Terlindungi 100%
                </h4>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Saldo kompensasi otomatis diamankan dan langsung cair seketika hasil pekerjaan disetujui.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-surface-container-low border border-card-border">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="font-headline text-xs font-bold text-on-surface">
                  Reputasi &amp; Portofolio Terverifikasi
                </h4>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Bangun Trust Score dan ulasan rating bintang lima untuk meningkatkan peluang kerjamu.
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

      {/* ───────────── RIGHT: LOGIN FORM ───────────── */}
      <section className="flex-1 flex items-center justify-center p-6 md:p-10 lg:p-12 xl:p-16 bg-surface overflow-y-auto relative z-10">
        <div className="w-full max-w-md space-y-6 my-auto">
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
              Selamat Datang Kembali
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              Belum punya akun?{" "}
              <Link href="/register" className="text-primary font-bold hover:underline">
                Daftar sekarang
              </Link>
            </p>
          </div>

          {/* Error Alert Box */}
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
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email atau Username"
              type="text"
              placeholder="nama@email.com atau username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              disabled={loading}
              autoComplete="username"
              required
            />

            <Input
              label="Kata Sandi"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
              disabled={loading}
              autoComplete="current-password"
              required
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-on-surface-variant hover:text-on-surface transition-colors select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-card-border text-primary focus:ring-primary/30 accent-primary cursor-pointer"
                />
                <span>Ingat saya di perangkat ini</span>
              </label>
              <Link
                href="/bantuan"
                className="text-primary font-bold hover:underline transition-colors"
              >
                Bantuan login
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading || !email || !password}
              fullWidth
              size="lg"
              className="mt-2 text-sm font-bold shadow-xs"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  <span>Memproses Masuk...</span>
                </>
              ) : (
                "Masuk ke Akun"
              )}
            </Button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-card-border" />
              <span className="mx-4 text-[10px] text-on-surface-variant/60 font-mono font-bold uppercase tracking-widest">
                atau
              </span>
              <div className="flex-grow border-t border-card-border" />
            </div>

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
              Masuk dengan Google
            </Button>
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
        <div className="min-h-screen flex items-center justify-center bg-surface font-sans">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
