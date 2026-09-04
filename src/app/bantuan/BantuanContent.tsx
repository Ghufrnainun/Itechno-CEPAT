"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { ReportModal } from "@/components/ui/ReportModal";
import { Button } from "@/components/ui/Button";
import {
  UserPlus,
  CheckSquare,
  Coins,
  Star,
  Wrench,
  HelpCircle,
  Mail,
  ArrowLeft,
  Flag,
  Copy,
  Check,
  LogIn,
  ShieldCheck,
  LayoutDashboard,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const FAQ_CATEGORIES = [
  {
    id: "memulai",
    icon: UserPlus,
    title: "Memulai di CEPAT",
    items: [
      {
        q: "Siapa yang bisa daftar di CEPAT?",
        a: "Siapa saja yang berusia 17 tahun ke atas. CEPAT dirancang untuk mahasiswa dan pelaku UMKM lokal, tapi tidak ada batasan ketat soal profil pengguna.",
      },
      {
        q: "Bagaimana cara daftar?",
        a: "Buka halaman Daftar, masukkan nama lengkap, email, dan password. Kamu juga perlu memilih apakah bergabung sebagai Pekerja (worker) atau Pemberi Tugas (requester). Setelah daftar, kamu langsung diarahkan ke halaman onboarding untuk melengkapi profil.",
      },
      {
        q: "Apakah bisa punya dua peran sekaligus?",
        a: "Tentu saja! Satu akun CEPAT mendukung dual-role. Kamu dapat beralih antara peran Pekerja (Worker) untuk mencari penghasilan dan Pemberi Tugas (Requester) untuk memposting lowongan kapan saja melalui tombol pengalih peran di sidebar atau menu profil.",
      },
      {
        q: "Kenapa saya perlu mengizinkan akses lokasi?",
        a: "Fitur utama CEPAT adalah menampilkan tugas terdekat dari posisimu. Tanpa akses lokasi, kamu tidak akan bisa melihat tugas berdasarkan jarak. Lokasi hanya dibaca saat aplikasi aktif, tidak dilacak terus-menerus di background.",
      },
    ],
  },
  {
    id: "tugas",
    icon: CheckSquare,
    title: "Posting & Mencari Tugas",
    items: [
      {
        q: "Bagaimana cara posting tugas?",
        a: "Masuk ke akun Pemberi Tugas, klik tombol 'Post Tugas Baru', lalu isi judul, deskripsi, kategori skill, lokasi, estimasi waktu, dan kompensasi. Tugas yang deskripsinya jelas cenderung lebih cepat dapat pekerja.",
      },
      {
        q: "Tugas apa saja yang bisa diposting?",
        a: "Kategori yang tersedia antara lain: Fotografi, Input Data, Desain, Survei, Jaga Booth, Editing, Administrasi, dan beberapa kategori lainnya. Tugas harus legal, jelas cakupannya, dan bisa diselesaikan dalam waktu singkat (biasanya hitungan jam sampai beberapa hari).",
      },
      {
        q: "Bagaimana cara menemukan tugas terdekat?",
        a: "Buka halaman Feed atau Cari Tugas. Tugas ditampilkan berdasarkan jarak dari posisimu saat ini. Kamu bisa filter berdasarkan radius (1 km, 3 km, 5 km, atau lebih) dan kategori skill.",
      },
      {
        q: "Apa yang terjadi setelah saya apply tugas?",
        a: "Pemberi tugas akan mendapat notifikasi dan melihat profilmu. Mereka bisa menerima atau melewati lamaranmu. Kalau diterima, kamu dapat notifikasi dan bisa langsung mulai koordinasi lewat chat in-app.",
      },
      {
        q: "Bisakah saya membatalkan apply yang sudah terkirim?",
        a: "Bisa, selama pemberi tugas belum menerima lamaranmu. Buka detail tugas dan pilih opsi batalkan lamaran.",
      },
    ],
  },
  {
    id: "poin",
    icon: Coins,
    title: "Poin & Kompensasi",
    items: [
      {
        q: "Apa itu poin CEPAT?",
        a: "Poin adalah unit kompensasi internal di platform. Pemberi tugas menetapkan jumlah poin saat posting tugas, dan poin itu masuk ke saldo pekerja setelah tugas dikonfirmasi selesai.",
      },
      {
        q: "Kapan poin masuk ke saldo saya?",
        a: "Poin masuk setelah pemberi tugas menekan tombol konfirmasi selesai. Kalau pemberi tugas tidak mengkonfirmasi dalam 72 jam setelah kamu tandai selesai, silakan hubungi kami.",
      },
      {
        q: "Bagaimana cara melihat saldo poin saya?",
        a: "Saldo poin terlihat di halaman Profil dan di pojok kiri sidebar (versi desktop). Rincian riwayat transaksi bisa dilihat di halaman Dompet.",
      },
      {
        q: "Apakah poin bisa dicairkan ke uang?",
        a: "Sistem penukaran poin masih dalam pengembangan. Untuk saat ini, poin berfungsi sebagai catatan kompensasi internal. Kami akan mengumumkan mekanisme penukaran ketika sudah siap.",
      },
    ],
  },
  {
    id: "rating",
    icon: Star,
    title: "Rating & Reputasi",
    items: [
      {
        q: "Bagaimana sistem rating bekerja?",
        a: "Setelah tugas selesai dan dikonfirmasi, kedua pihak bisa saling memberi rating dari 1 sampai 5 bintang beserta ulasan singkat. Rating rata-rata ditampilkan di profil publik kamu.",
      },
      {
        q: "Apakah rating bisa dihapus?",
        a: "Rating tidak bisa dihapus sendiri. Jika kamu yakin ada rating yang tidak adil atau palsu, hubungi kami dengan menyertakan ID tugas. Kami akan meninjau kasusnya.",
      },
      {
        q: "Kenapa rating penting?",
        a: "Rating tinggi membuat profilmu lebih menarik bagi calon pemberi tugas atau pekerja. Pemberi tugas sering mempertimbangkan rating sebelum menerima lamaran, terutama untuk tugas dengan kompensasi lebih besar.",
      },
    ],
  },
  {
    id: "teknis",
    icon: Wrench,
    title: "Masalah Teknis",
    items: [
      {
        q: "Aplikasi tidak bisa akses lokasi saya, kenapa?",
        a: "Periksa pengaturan izin lokasi di browser atau perangkat kamu. Pastikan izin untuk situs ini disetel ke 'Izinkan'. Kalau sudah diizinkan tapi tetap tidak bisa, coba refresh halaman atau clear cache browser.",
      },
      {
        q: "Notifikasi tidak masuk padahal sudah mengizinkan.",
        a: "Notifikasi push memerlukan browser yang mendukung service worker (Chrome, Firefox, Edge). Browser Safari di iOS memiliki keterbatasan. Coba reload halaman setelah mengizinkan notifikasi, atau gunakan Chrome untuk pengalaman terbaik.",
      },
      {
        q: "Saya tidak bisa login padahal password sudah benar.",
        a: "Coba gunakan fitur 'Lupa Password' untuk reset password. Kalau masih bermasalah, pastikan kamu menggunakan email yang sama saat mendaftar dan coba dari browser lain.",
      },
      {
        q: "Halaman lambat atau tidak termuat.",
        a: "Periksa koneksi internet kamu. CEPAT membutuhkan koneksi yang stabil terutama untuk fitur peta. Kalau koneksi stabil tapi masih lambat, hubungi kami karena mungkin ada gangguan dari sisi server.",
      },
    ],
  },
  {
    id: "lainnya",
    icon: HelpCircle,
    title: "Lainnya",
    items: [
      {
        q: "Bagaimana cara melaporkan pengguna yang bermasalah?",
        a: "Di halaman profil pengguna tersebut, cari opsi 'Laporkan'. Sertakan alasan dan detail kejadian. Tim kami akan meninjau laporan dalam 2 hari kerja.",
      },
      {
        q: "Bagaimana cara hapus akun saya?",
        a: "Buka menu Laporkan Masalah ke Admin (atau gunakan fitur Laporan di aplikasi) dengan kategori 'Lainnya' dan subjek 'Permintaan Hapus Akun'. Tim Admin kami akan memverifikasi dan memproses permohonan penghapusan data akun dalam 30 hari kerja.",
      },
      {
        q: "Apakah CEPAT tersedia di semua kota?",
        a: "Saat ini CEPAT sedang dalam tahap awal dengan fokus di area Semarang. Ekspansi ke kota lain sedang dipertimbangkan berdasarkan antusiasme pengguna.",
      },
    ],
  },
];

export function BantuanContent() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getUser().then((res: any) => {
        setIsLoggedIn(Boolean(res?.data?.user));
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
        setIsLoggedIn(Boolean(session?.user));
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch (e) {
      console.error("[BantuanContent] Auth check error:", e);
      setIsLoggedIn(false);
    }
  }, []);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("bantuan@cepat.id");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="landing-page min-h-screen bg-surface font-sans">
      <LandingNavbar />

      <main className="max-w-3xl mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-20">
        {/* Navigation Bar */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            href={isLoggedIn ? "/dashboard" : "/"}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container border border-card-border text-on-surface font-bold text-xs transition-colors cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4 text-primary" />
            {isLoggedIn ? "Kembali ke Dashboard" : "Kembali ke Beranda"}
          </Link>

          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Buka Dashboard
            </Link>
          ) : (
            <Link
              href="/login?redirect=/bantuan"
              className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
            >
              <LogIn className="w-3.5 h-3.5" />
              Masuk Akun
            </Link>
          )}
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-headline text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight mb-2.5">
            Pusat Bantuan
          </h1>
          <p className="font-body-sm text-sm sm:text-base text-on-surface-variant leading-relaxed max-w-prose">
            Temukan jawaban atas pertanyaan umum tentang sistem CEPAT. Jika Anda mengalami kendala teknis atau transaksi, sampaikan langsung kepada tim Admin.
          </p>
        </div>

        {/* Quick Contact / Report Banner */}
        <div className="mb-10 p-5 rounded-2xl bg-surface-container-lowest border border-card-border shadow-xs flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <p className="text-sm font-bold text-on-surface">
                  Butuh Bantuan atau Ada Kendala?
                </p>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Tim Admin kami siap membantu kendala teknis, akun, verifikasi, maupun sengketa tugas.
              </p>
            </div>

            {isLoggedIn ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsReportModalOpen(true)}
                icon={<Flag className="w-3.5 h-3.5" />}
                className="shrink-0 shadow-xs"
              >
                Laporkan ke Admin
              </Button>
            ) : (
              <Link href="/login?redirect=/bantuan" className="shrink-0">
                <Button variant="primary" size="sm" icon={<LogIn className="w-3.5 h-3.5" />}>
                  Masuk untuk Lapor
                </Button>
              </Link>
            )}
          </div>

          {/* Email Info as Placeholder Notice */}
          <div className="pt-3 border-t border-card-border flex flex-wrap items-center justify-between gap-2 text-xs text-on-surface-variant">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-[11px] sm:text-xs">
                Email Dukungan:{" "}
                <strong className="font-mono text-on-surface select-all">
                  bantuan@cepat.id
                </strong>
                <span className="ml-1.5 text-[10px] text-on-surface-variant/70 font-normal">
                  (Placeholder — Layanan aktif diproses via Laporan Aplikasi)
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyEmail}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer ml-auto"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-600">Disalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Salin Email</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-10">
          {FAQ_CATEGORIES.map((cat) => {
            const IconComp = cat.icon;
            return (
              <section key={cat.id} id={cat.id}>
                <div className="flex items-center gap-3 mb-5 pb-2.5 border-b border-card-border">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <h2 className="font-headline text-lg font-bold text-on-surface">{cat.title}</h2>
                </div>

                <div className="space-y-3.5">
                  {cat.items.map((item, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-xl bg-surface-container-lowest border border-card-border shadow-xs">
                      <div className="pt-0.5 shrink-0">
                        <div className="w-5 h-5 rounded-full bg-surface-container border border-card-border flex items-center justify-center">
                          <span className="text-[10px] font-bold text-on-surface-variant font-mono">
                            {i + 1}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-headline text-sm font-bold text-on-surface mb-1">
                          {item.q}
                        </h3>
                        <p className="font-body-sm text-xs md:text-sm text-on-surface-variant leading-relaxed">
                          {item.a}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Back link */}
        <div className="mt-14 pt-6 border-t border-card-border flex items-center justify-between text-xs font-semibold">
          <Link
            href={isLoggedIn ? "/dashboard" : "/"}
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {isLoggedIn ? "Kembali ke Dashboard" : "Kembali ke Beranda"}
          </Link>
          <Link
            href="/kebijakan-privasi"
            className="text-on-surface-variant hover:text-primary transition-colors"
          >
            Kebijakan Privasi →
          </Link>
        </div>
      </main>

      {/* Report Modal In-App */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        defaultCategory="Kendala Teknis / Bug"
      />
    </div>
  );
}
