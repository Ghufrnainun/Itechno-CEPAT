"use client";

import React, { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

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

    async function initConsent() {
      try {
        const supabase = createClient();

        // 1. Cek sesi user saat ini
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData?.user) {
          // Redirect ke halaman login jika belum terautentikasi
          const currentUrl = window.location.pathname + window.location.search;
          router.replace(`/login?redirect=${encodeURIComponent(currentUrl)}`);
          return;
        }

        setUserEmail(userData.user.email ?? "User");

        // 2. Ambil rincian permintaan otorisasi OAuth dari Supabase
        const { data, error: detailsError } = await (supabase.auth as any).oauth.getAuthorizationDetails(
          authorizationId
        );

        if (detailsError) {
          throw new Error(
            detailsError.message || "Gagal mengambil rincian otorisasi OAuth. Sesi mungkin telah kadaluarsa."
          );
        }

        setDetails(data);
      } catch (err: any) {
        setError(err.message || "Terjadi kesalahan saat memproses permintaan otorisasi.");
      } finally {
        setLoading(false);
      }
    }

    initConsent();
  }, [authorizationId, router]);

  const handleApprove = async () => {
    if (!authorizationId) return;
    setActionLoading("approve");
    setError(null);

    try {
      const supabase = createClient();
      const { data, error } = await (supabase.auth as any).oauth.approveAuthorization(authorizationId);

      if (error) throw error;

      if (data?.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        throw new Error("Redirect URL tidak diterima dari server.");
      }
    } catch (err: any) {
      setError(err.message || "Gagal menyetujui otorisasi.");
      setActionLoading(null);
    }
  };

  const handleDeny = async () => {
    if (!authorizationId) return;
    setActionLoading("deny");
    setError(null);

    try {
      const supabase = createClient();
      const { data, error } = await (supabase.auth as any).oauth.denyAuthorization(authorizationId);

      if (error) throw error;

      if (data?.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        throw new Error("Redirect URL tidak diterima dari server.");
      }
    } catch (err: any) {
      setError(err.message || "Gagal menolak otorisasi.");
      setActionLoading(null);
    }
  };

  // Helper parsing scopes
  const rawScopes = details?.scope;
  const scopesList = Array.isArray(rawScopes)
    ? rawScopes
    : typeof rawScopes === "string"
    ? rawScopes.split(" ").filter(Boolean)
    : ["openid", "profile", "email"];

  const getScopeDescription = (scope: string) => {
    switch (scope.toLowerCase()) {
      case "openid":
        return "Mengonfirmasi identitas unik akun CEPAT Anda";
      case "profile":
        return "Mengakses informasi profil publik (Nama, Foto Profil, Role)";
      case "email":
        return "Melihat alamat email terverifikasi Anda";
      default:
        return `Izin khusus: ${scope}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-layout-bg p-md">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-md" />
        <p className="font-body-md text-on-surface-variant">Memuat rincian otorisasi OAuth...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-layout-bg p-md font-sans">
        <div className="w-full max-w-md p-xl rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-lg text-center">
          <div className="w-12 h-12 mx-auto mb-md rounded-full bg-error-container/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-error text-[28px]">warning</span>
          </div>
          <h1 className="font-headline-sm text-headline-sm text-on-surface mb-xs">Otorisasi Gagal</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-lg">{error}</p>
          <Link href="/">
            <Button variant="secondary" fullWidth>
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
    <main className="min-h-screen flex flex-col items-center justify-center bg-layout-bg p-md font-sans">
      {/* Container Box */}
      <div className="w-full max-w-[480px] p-lg sm:p-xl rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-xl">
        {/* Header Branding Connection */}
        <div className="flex items-center justify-center gap-md mb-xl pt-xs">
          <div className="w-14 h-14 rounded-xl bg-surface-container-high border border-outline-variant/60 flex items-center justify-center overflow-hidden relative">
            {clientIcon ? (
              <Image src={clientIcon} alt={clientName} width={56} height={56} className="object-cover" />
            ) : (
              <span className="material-symbols-outlined text-primary text-[32px]">apps</span>
            )}
          </div>

          <div className="flex items-center justify-center w-8 text-on-surface-variant">
            <span className="material-symbols-outlined text-[24px]">swap_horiz</span>
          </div>

          <div className="w-14 h-14 rounded-xl bg-surface-container-high border border-outline-variant/60 flex items-center justify-center">
            <Image src="/logo.svg" alt="CEPAT" width={44} height={36} className="object-contain" />
          </div>
        </div>

        {/* Title & Client info */}
        <div className="text-center mb-lg">
          <h1 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-xs">
            Hubungkan ke {clientName}
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Aplikasi ini meminta izin untuk mengakses akun CEPAT Anda.
          </p>
          {clientWebsite && (
            <a
              href={clientWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-xs font-label-sm text-label-sm text-primary hover:underline mt-xs"
            >
              <span>{clientWebsite}</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </a>
          )}
        </div>

        {/* User Badge */}
        {userEmail && (
          <div className="flex items-center justify-between p-sm px-md rounded-xl bg-surface-container-high border border-outline-variant/40 mb-lg">
            <div className="flex items-center gap-sm overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-[18px]">account_circle</span>
              </div>
              <div className="truncate">
                <p className="font-label-sm text-label-sm text-on-surface-variant">Masuk sebagai</p>
                <p className="font-body-sm text-body-sm font-semibold text-on-surface truncate">{userEmail}</p>
              </div>
            </div>
            <Link
              href={`/login?redirect=${encodeURIComponent(
                typeof window !== "undefined" ? window.location.pathname + window.location.search : ""
              )}`}
              className="font-label-sm text-label-sm text-primary hover:underline flex-shrink-0 ml-xs"
            >
              Ganti
            </Link>
          </div>
        )}

        {/* Permissions / Scopes list */}
        <div className="mb-xl">
          <h2 className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-sm">
            Izin yang Diminta:
          </h2>
          <ul className="space-y-sm">
            {scopesList.map((scope, idx) => (
              <li
                key={idx}
                className="flex items-start gap-md p-sm rounded-lg bg-surface-container-lowest border border-outline-variant/30"
              >
                <span
                  className="material-symbols-outlined text-primary text-[20px] flex-shrink-0 mt-0.5"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                <div>
                  <p className="font-body-sm text-body-sm font-medium text-on-surface">{scope}</p>
                  <p className="font-body-xs text-body-xs text-on-surface-variant">{getScopeDescription(scope)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-md">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={handleDeny}
            disabled={actionLoading !== null}
          >
            {actionLoading === "deny" ? "Menolak..." : "Tolak"}
          </Button>

          <Button
            type="button"
            fullWidth
            onClick={handleApprove}
            disabled={actionLoading !== null}
          >
            {actionLoading === "approve" ? "Memproses..." : "Izinkan Akses"}
          </Button>
        </div>

        {/* Security Footer */}
        <div className="mt-lg text-center pt-md border-t border-outline-variant/30 flex items-center justify-center gap-xs">
          <span className="material-symbols-outlined text-on-surface-variant text-[16px]">lock</span>
          <span className="font-label-xs text-label-xs text-on-surface-variant">
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
        <div className="min-h-screen flex flex-col items-center justify-center bg-layout-bg p-md">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-md" />
          <p className="font-body-md text-on-surface-variant">Memuat halaman otorisasi...</p>
        </div>
      }
    >
      <OAuthConsentContent />
    </Suspense>
  );
}
