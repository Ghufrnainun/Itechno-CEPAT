"use client";

import React, { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import {
  AlertTriangle,
  AppWindow,
  ArrowRightLeft,
  ExternalLink,
  UserCircle,
  CheckCircle2,
  Lock,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientInfo {
  name?: string;
  icon_uri?: string;
  website_uri?: string;
  client_id?: string;
}

interface AuthDetails {
  client?: ClientInfo;
  scope?: string | string[];
  user?: {
    email?: string;
    id?: string;
  };
}

function OAuthConsentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const authorizationId = searchParams.get("authorization_id");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<"approve" | "deny" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<AuthDetails | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!authorizationId) {
      setError("Parameter 'authorization_id' tidak ditemukan dalam URL. Permintaan otorisasi tidak valid.");
      setLoading(false);
      return;
    }

    async function init() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          const currentUrl = window.location.pathname + window.location.search;
          router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
          return;
        }

        setUserEmail(user.email ?? null);

        const res = await fetch(`/api/oauth/consent?authorization_id=${encodeURIComponent(authorizationId ?? "")}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.message || "Gagal memuat informasi otorisasi OAuth.");
        } else {
          setDetails(data.data);
        }
      } catch (err: any) {
        setError("Terjadi kesalahan sistem saat memproses permintaan otorisasi.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [authorizationId, router]);

  const handleApprove = async () => {
    if (!authorizationId) return;
    setActionLoading("approve");
    try {
      const res = await fetch("/api/oauth/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorization_id: authorizationId, decision: "approve" }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.data?.redirect_uri) {
        window.location.href = data.data.redirect_uri;
      } else {
        setError(data.message || "Pemberian izin gagal diproses.");
        setActionLoading(null);
      }
    } catch {
      setError("Gagal menghubungi server OAuth.");
      setActionLoading(null);
    }
  };

  const handleDeny = async () => {
    if (!authorizationId) return;
    setActionLoading("deny");
    try {
      const res = await fetch("/api/oauth/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorization_id: authorizationId, decision: "deny" }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.data?.redirect_uri) {
        window.location.href = data.data.redirect_uri;
      } else {
        router.push("/");
      }
    } catch {
      router.push("/");
    }
  };

  const getScopeDescription = (scope: string) => {
    switch (scope) {
      case "profile":
        return "Melihat informasi profil publik Anda (nama, username, reputasi rating, avatar).";
      case "email":
        return "Melihat alamat email yang terdaftar di akun Anda.";
      case "phone":
        return "Melihat nomor kontak yang terhubung dengan akun Anda.";
      case "tasks:read":
        return "Membaca data riwayat dan status tugas yang Anda ikuti atau posting.";
      case "tasks:write":
        return "Membuat, melamar, atau mengubah status pengerjaan tugas atas nama Anda.";
      default:
        return `Mengakses cakupan izin '${scope}'.`;
    }
  };

  const scopesList = Array.isArray(details?.scope)
    ? details?.scope
    : (details?.scope || "profile email").split(" ").filter(Boolean);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface p-4 font-sans">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
        <p className="font-body-sm text-xs text-on-surface-variant">Memuat rincian otorisasi OAuth...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-4 font-sans">
        <div className="w-full max-w-md p-6 rounded-2xl bg-surface-container-lowest border border-card-border shadow-md text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-error-container/30 text-error flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="font-headline text-lg font-bold text-on-surface mb-1">Otorisasi Gagal</h1>
          <p className="font-body-sm text-xs text-on-surface-variant mb-4 leading-relaxed">{error}</p>
          <Link href="/">
            <Button variant="secondary" fullWidth size="sm">
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const clientName = details?.client?.name || "Aplikasi Pihak Ketiga";
  const clientIcon = details?.client?.icon_uri;
  const clientWebsite = details?.client?.website_uri;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-surface p-4 font-sans">
      {/* Container Box */}
      <div className="w-full max-w-[460px] p-6 sm:p-8 rounded-2xl bg-surface-container-lowest border border-card-border shadow-md">
        {/* Header Branding Connection */}
        <div className="flex items-center justify-center gap-4 mb-6 pt-1">
          <div className="w-12 h-12 rounded-xl bg-surface-container border border-card-border flex items-center justify-center overflow-hidden relative shadow-xs">
            {clientIcon ? (
              <Image src={clientIcon} alt={clientName} width={48} height={48} className="object-cover" />
            ) : (
              <AppWindow className="w-6 h-6 text-primary" />
            )}
          </div>

          <div className="flex items-center justify-center text-on-surface-variant">
            <ArrowRightLeft className="w-4 h-4" />
          </div>

          <div className="w-12 h-12 rounded-xl bg-surface-container border border-card-border flex items-center justify-center shadow-xs">
            <Image src="/logo.svg" alt="CEPAT" width={38} height={32} className="object-contain" />
          </div>
        </div>

        {/* Title & Client info */}
        <div className="text-center mb-5">
          <h1 className="font-headline text-lg font-bold text-on-surface mb-1">
            Hubungkan ke {clientName}
          </h1>
          <p className="font-body-sm text-xs text-on-surface-variant">
            Aplikasi ini meminta izin untuk mengakses akun CEPAT Anda.
          </p>
          {clientWebsite && (
            <a
              href={clientWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline mt-1 font-mono"
            >
              <span>{clientWebsite}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* User Badge */}
        {userEmail && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-card-border mb-5">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <UserCircle className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-[10px] font-semibold text-on-surface-variant font-mono uppercase">Masuk sebagai</p>
                <p className="text-xs font-bold text-on-surface truncate font-sans">{userEmail}</p>
              </div>
            </div>
            <Link
              href={`/login?redirect=${encodeURIComponent(
                typeof window !== "undefined" ? window.location.pathname + window.location.search : ""
              )}`}
              className="text-xs font-bold text-primary hover:underline flex-shrink-0 ml-2"
            >
              Ganti
            </Link>
          </div>
        )}

        {/* Permissions / Scopes list */}
        <div className="mb-6">
          <h2 className="text-[11px] font-mono font-bold uppercase tracking-wider text-on-surface-variant mb-2.5">
            Izin yang Diminta:
          </h2>
          <ul className="space-y-2">
            {scopesList.map((scope, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-lg bg-surface-container-low border border-card-border"
              >
                <CheckCircle2 className="w-4 h-4 text-primary fill-primary/20 shrink-0 mt-0.5" />
                <div>
                  <p className="font-headline text-xs font-bold text-on-surface">{scope}</p>
                  <p className="font-body-sm text-[11px] text-on-surface-variant leading-relaxed">{getScopeDescription(scope)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            size="md"
            onClick={handleDeny}
            disabled={actionLoading !== null}
          >
            {actionLoading === "deny" ? "Menolak..." : "Tolak"}
          </Button>

          <Button
            type="button"
            fullWidth
            size="md"
            onClick={handleApprove}
            disabled={actionLoading !== null}
          >
            {actionLoading === "approve" ? "Memproses..." : "Izinkan Akses"}
          </Button>
        </div>

        {/* Security Footer */}
        <div className="mt-5 text-center pt-3 border-t border-card-border flex items-center justify-center gap-1.5 text-on-surface-variant">
          <Lock className="w-3 h-3" />
          <span className="font-mono text-[10px]">
            Diotorisasi secara aman oleh CEPAT OAuth Server (OAuth 2.1)
          </span>
        </div>
      </div>
    </main>
  );
}

export default function OAuthConsentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-surface p-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
          <p className="font-sans text-xs text-on-surface-variant">Menyiapkan halaman otorisasi...</p>
        </div>
      }
    >
      <OAuthConsentContent />
    </Suspense>
  );
}
