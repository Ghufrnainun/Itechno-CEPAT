"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { ShieldAlert, AlertTriangle } from "lucide-react";

interface BanDetails {
  type: 'TEMPORARY' | 'PERMANENT';
  reason: string;
  banned_at?: string | null;
  banned_until?: string | null;
}

function safeDecode(val: string | null): string | null {
  if (!val) return null
  try {
    return decodeURIComponent(val)
  } catch {
    return val
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [banDetails, setBanDetails] = useState<BanDetails | null>(null);

  React.useEffect(() => {
    if (isBannedParam === "true") {
      setBanDetails({
        type: (banTypeParam as 'TEMPORARY' | 'PERMANENT') || 'PERMANENT',
        reason: safeDecode(banReasonParam) ?? 'Akun Anda ditangguhkan oleh admin.',
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
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login dengan Google gagal.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-layout-bg font-sans flex flex-col md:flex-row relative">
      {/* Ban Details Popup Modal */}
      {banDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-outline-variant/30 space-y-5 relative">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-rose-100 text-rose-600 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-lg text-on-surface">Akun Anda Ditangguhkan</h3>
                <p className="text-xs text-on-surface-variant">Akses ke platform CEPAT dibatasi oleh Admin</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-on-surface-variant">Jenis Penangguhan:</span>
                <span className={`px-2.5 py-0.5 rounded font-mono font-bold uppercase text-[10px] ${
                  banDetails.type === 'TEMPORARY' 
                    ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}>
                  {banDetails.type === 'TEMPORARY' ? 'Temporary Ban' : 'Permanent Ban'}
                </span>
              </div>

              {banDetails.type === 'TEMPORARY' && banDetails.banned_until && (
                <div className="flex items-center justify-between border-t border-outline-variant/20 pt-2">
                  <span className="font-semibold text-on-surface-variant">Batas Penangguhan:</span>
                  <span className="font-mono text-on-surface font-bold">
                    {new Date(banDetails.banned_until).toLocaleString('id-ID', {
                      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })} WIB
                  </span>
                </div>
              )}

              <div className="space-y-1 border-t border-outline-variant/20 pt-2">
                <span className="font-semibold text-on-surface-variant block">Alasan Moderasi Admin:</span>
                <p className="p-3 bg-white rounded-lg border border-outline-variant/30 italic text-on-surface leading-relaxed">
                  "{banDetails.reason}"
                </p>
              </div>
            </div>

            <p className="text-[11px] text-on-surface-variant/70 text-center">
              Jika Anda merasa ini adalah kekeliruan, silakan hubungi <span className="font-semibold text-primary">admin@itechno.id</span>
            </p>

            <button
              onClick={() => setBanDetails(null)}
              className="w-full py-2.5 bg-on-surface hover:bg-on-surface/90 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-[0.98]"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}

      {/* Left Section: Hero / Branding */}
      <section className="hidden md:flex flex-1 bg-surface-container-lowest p-8 lg:p-12 flex-col justify-between border-r border-outline-variant/30">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="CEPAT Logo"
              width={40}
              height={40}
              className="rounded-xl object-contain"
            />
            <span className="font-headline font-black text-2xl tracking-tight text-on-surface">
              CEPAT
            </span>
          </Link>
        </div>

        <div className="space-y-4 max-w-lg">
          <h2 className="font-headline text-3xl font-extrabold text-on-surface leading-tight">
            Cari Pekerjaan Entry-Level di Sekitarmu
          </h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            Platform micro-task terkemuka untuk mahasiswa dan pekerja lepasan. Temukan berbagai tugas fleksibel dari UMKM dan pengguna di area lokalmu.
          </p>
        </div>

        <div className="text-xs text-on-surface-variant/60">
          © {new Date().getFullYear()} CEPAT Platform. Hak cipta dilindungi undang-undang.
        </div>
      </section>

      {/* Right Section: Login Form */}
      <section className="flex-1 flex items-center justify-center p-6 md:p-12 bg-white">
        <div className="w-full max-w-md space-y-6">
          <div className="md:hidden mb-4">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image
                src="/logo.svg"
                alt="CEPAT Logo"
                width={36}
                height={36}
                className="rounded-xl object-contain"
              />
              <span className="font-headline font-black text-xl tracking-tight text-on-surface">
                CEPAT
              </span>
            </Link>
          </div>

          <div className="space-y-1">
            <h1 className="font-headline font-bold text-2xl text-on-surface">
              Selamat Datang Kembali
            </h1>
            <p className="text-sm text-on-surface-variant">
              Belum punya akun?{" "}
              <Link href="/register" className="text-primary font-bold hover:underline">
                Daftar sekarang
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary font-bold text-sm rounded py-3 min-h-[48px] hover:bg-primary-container transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? "Memproses..." : "Masuk ke Dashboard"}
            </button>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-outline-variant/40" />
              <span className="mx-4 text-[11px] text-on-surface-variant/60 font-bold uppercase tracking-widest">
                atau
              </span>
              <div className="flex-grow border-t border-outline-variant/40" />
            </div>

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
