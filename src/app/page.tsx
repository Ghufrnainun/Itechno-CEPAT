import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/ui/Navbar";

export default function LandingPage() {
  return (
    <div className="bg-layout-bg min-h-screen flex flex-col font-sans">
      <Navbar />

      {/* ───── MAIN CONTENT ───── */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-gutter py-xl md:py-[64px] flex flex-col gap-[72px]">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-xl lg:gap-[64px] items-center">
          {/* Hero Left */}
          <div className="flex flex-col gap-lg items-start">
            <div className="inline-flex items-center gap-xs px-sm py-xs rounded-full bg-surface-container-highest border border-outline-variant">
              <span className="material-symbols-outlined text-[14px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                public
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                SDG 8 • Pekerjaan Layak untuk Mahasiswa
              </span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface leading-tight text-balance">
              Tugas kecil di sekitar kampus, penghasilan fleksibel buat mahasiswa.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[540px]">
              CEPAT menghubungkan mahasiswa dengan UMKM lokal yang butuh bantuan cepat — foto produk, input data, jaga booth, survei, dan tugas mikro lainnya dalam radius terdekat.
            </p>
            <div className="flex flex-wrap gap-md w-full sm:w-auto">
              <Link
                href="/login"
                className="bg-primary-container text-on-primary font-label-md text-label-md font-bold px-xl py-md rounded-lg w-full sm:w-auto hover:bg-primary transition-colors flex items-center justify-center gap-sm shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">search</span>
                Cari Tugas Terdekat
              </Link>
              <Link
                href="/login"
                className="bg-white border-2 border-primary-container text-primary-container font-label-md text-label-md font-bold px-xl py-md rounded-lg w-full sm:w-auto hover:bg-surface-container transition-colors flex items-center justify-center gap-sm"
              >
                <span className="material-symbols-outlined text-[18px]">add_task</span>
                Post Tugas untuk UMKM
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-sm mt-sm">
              <div className="flex items-center gap-xs">
                <span className="w-1 h-1 rounded-full bg-primary-container inline-block"></span>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  2 km radius
                </span>
              </div>
              <span className="w-px h-3 bg-outline-variant"></span>
              <div className="flex items-center gap-xs">
                <span className="w-1 h-1 rounded-full bg-primary-container inline-block"></span>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  escrow aman
                </span>
              </div>
              <span className="w-px h-3 bg-outline-variant"></span>
              <div className="flex items-center gap-xs">
                <span className="w-1 h-1 rounded-full bg-primary-container inline-block"></span>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  rating dua arah
                </span>
              </div>
              <span className="w-px h-3 bg-outline-variant"></span>
              <div className="flex items-center gap-xs">
                <span className="w-1 h-1 rounded-full bg-primary-container inline-block"></span>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  PWA mobile-first
                </span>
              </div>
            </div>
          </div>

          {/* Hero Right (App Preview) */}
          <div
            className="hero-app-preview relative w-full max-w-[480px] mx-auto lg:ml-auto rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden shadow-sm flex flex-col"
            style={{ height: "560px" }}
          >
            {/* App Header */}
            <div className="px-md py-sm border-b border-outline-variant bg-surface flex justify-between items-center shrink-0">
              <div className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  location_on
                </span>
                <span className="font-label-md text-label-md text-on-surface">Yogyakarta, ID</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant">
                <span className="material-symbols-outlined text-primary text-[16px]">person</span>
              </div>
            </div>

            {/* Mini Radar Map */}
            <div className="h-[140px] relative shrink-0 bg-surface-container-high overflow-hidden">
              <svg className="w-full h-full absolute inset-0" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                    <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#DDE7E1" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="#EEF5EF" />
                <rect width="100%" height="100%" fill="url(#grid)" />
                <line x1="0" y1="70" x2="480" y2="70" stroke="#C8D8C4" strokeWidth="6" />
                <line x1="160" y1="0" x2="160" y2="140" stroke="#C8D8C4" strokeWidth="6" />
                <circle cx="240" cy="70" r="55" fill="rgba(15,118,110,0.08)" stroke="rgba(15,118,110,0.35)" strokeWidth="1.5" strokeDasharray="4 3" />
                <circle cx="240" cy="70" r="7" fill="#0F766E" stroke="white" strokeWidth="2" />
                <circle cx="240" cy="70" r="14" fill="rgba(15,118,110,0.15)" />
                <circle cx="290" cy="45" r="5" fill="#84CC16" stroke="white" strokeWidth="1.5" />
                <circle cx="195" cy="92" r="5" fill="#0F766E" stroke="white" strokeWidth="1.5" />
                <circle cx="265" cy="100" r="5" fill="#D97706" stroke="white" strokeWidth="1.5" />
              </svg>
              <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm border border-outline-variant rounded-md px-2 py-1 flex items-center gap-1.5 shadow-sm">
                <span className="pulse-dot w-2 h-2 rounded-full bg-primary inline-block"></span>
                <span className="font-label-sm text-[10px] font-semibold text-on-surface">Radar Aktif</span>
              </div>
              <div className="absolute bottom-1 right-2">
                <span className="font-label-sm text-[9px] text-on-surface-variant">Radius 2km dari kampus</span>
              </div>
            </div>

            {/* Escrow Banner */}
            <div className="escrow-bg border-b border-[#FCD34D] px-md py-sm flex items-center gap-sm shrink-0">
              <span className="material-symbols-outlined escrow-text text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified_user
              </span>
              <p className="font-label-sm text-label-sm escrow-text">Dana ditahan di Escrow • Aman &amp; Terpercaya</p>
            </div>

            {/* Task Preview Cards */}
            <div className="flex-grow p-md flex flex-col gap-sm bg-layout-bg overflow-y-auto custom-scrollbar">
              <div className="bg-white border-2 border-primary-container rounded-lg p-sm cursor-pointer shadow-[2px_2px_0px_0px_rgba(15,118,110,0.6)] task-card">
                <div className="flex justify-between items-start mb-xs">
                  <h3 className="font-headline-sm text-on-surface leading-tight text-[16px]">Foto Katalog 15 Menu Makanan</h3>
                  <div className="flex items-center gap-xs bg-surface-container px-xs py-[2px] rounded shrink-0 ml-2">
                    <span className="material-symbols-outlined text-[12px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                      near_me
                    </span>
                    <span className="font-label-sm text-label-sm text-primary" style={{ fontFamily: "'JetBrains Mono'" }}>0.8 km</span>
                  </div>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-sm">Waroeng Bu Sri • Butuh foto rapi untuk menu online.</p>
                <div className="flex justify-between items-end border-t border-outline-variant pt-sm">
                  <span className="font-label-md text-label-md text-on-surface" style={{ fontFamily: "'JetBrains Mono'" }}>Rp75.000</span>
                  <div className="inline-flex items-center gap-xs px-xs py-[2px] rounded sdg-badge">
                    <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>work</span>
                    <span className="font-label-sm text-[9px]">SDG 8</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-outline-variant rounded-lg p-sm cursor-pointer card-hover">
                <div className="flex justify-between items-start mb-xs">
                  <h3 className="font-headline-sm text-on-surface leading-tight text-[15px]">Input 50 Data Stok Barang</h3>
                  <div className="flex items-center gap-xs bg-surface-container px-xs py-[2px] rounded shrink-0 ml-2">
                    <span className="material-symbols-outlined text-[12px] text-on-surface-variant">near_me</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant" style={{ fontFamily: "'JetBrains Mono'" }}>2.5 km</span>
                  </div>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-sm">Toko Kelontong Makmur</p>
                <div className="flex justify-between items-end border-t border-outline-variant pt-sm">
                  <span className="font-label-md text-label-md text-on-surface-variant" style={{ fontFamily: "'JetBrains Mono'" }}>Rp50.000</span>
                  <span className="font-label-sm text-[9px] text-on-surface-variant bg-surface-container px-xs py-[2px] rounded">Data Entry</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-md">
          <div className="bg-white border border-outline-variant rounded-xl p-md text-center">
            <div className="text-2xl font-bold text-primary mb-xs font-mono">73%</div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">mahasiswa ingin penghasilan tambahan</p>
          </div>
          <div className="bg-white border border-outline-variant rounded-xl p-md text-center">
            <div className="text-2xl font-bold text-primary mb-xs font-mono">97%</div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">tenaga kerja terserap UMKM nasional</p>
          </div>
          <div className="bg-white border border-outline-variant rounded-xl p-md text-center">
            <div className="text-2xl font-bold text-primary mb-xs font-mono">2 km</div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">radius pencarian tugas terdekat</p>
          </div>
          <div className="bg-white border border-outline-variant rounded-xl p-md text-center">
            <div className="text-2xl font-bold text-primary mb-xs font-mono">&lt;1 hr</div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">rata-rata waktu penyelesaian micro-task</p>
          </div>
        </section>

        {/* Cara Kerja Section */}
        <section id="cara-kerja">
          <div className="flex flex-col items-center text-center mb-xl">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-sm">Cara Kerja CEPAT</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
              Dua peran, satu platform. Satu akun bisa jadi Requester dan Worker sekaligus.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <div className="bg-white border border-outline-variant rounded-xl p-lg flex flex-col gap-md">
              <div className="flex items-center gap-md">
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                    school
                  </span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Sebagai Worker (Mahasiswa)</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Cari penghasilan fleksibel dekat kampus</p>
                </div>
              </div>
              <div className="flex flex-col gap-sm">
                <div className="flex items-start gap-md">
                  <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-sm text-[11px] font-bold shrink-0 mt-0.5">1</span>
                  <div>
                    <p className="font-body-md text-body-md font-medium text-on-surface">Register &amp; isi profil skill</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Email + username. Isi skill: fotografi, desain, data entry, dll.</p>
                  </div>
                </div>
                <div className="flex items-start gap-md">
                  <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-sm text-[11px] font-bold shrink-0 mt-0.5">2</span>
                  <div>
                    <p className="font-body-md text-body-md font-medium text-on-surface">Buka feed task terdekat</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Lihat peta &amp; list tugas dalam radius 2 km. Filter by skill &amp; kompensasi.</p>
                  </div>
                </div>
                <div className="flex items-start gap-md">
                  <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-sm text-[11px] font-bold shrink-0 mt-0.5">3</span>
                  <div>
                    <p className="font-body-md text-body-md font-medium text-on-surface">Apply, kerjakan, terima poin</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Kirim bukti kerja → requester konfirmasi → poin masuk otomatis.</p>
                  </div>
                </div>
              </div>
              <Link
                href="/login"
                className="mt-auto bg-primary-container text-on-primary font-label-md text-label-md font-bold px-md py-sm rounded-lg text-center hover:bg-primary transition-colors"
              >
                Cari Tugas Sekarang →
              </Link>
            </div>
            
            <div className="bg-white border border-outline-variant rounded-xl p-lg flex flex-col gap-md">
              <div className="flex items-center gap-md">
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                    storefront
                  </span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Sebagai Requester (UMKM)</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Dapat bantuan cepat tanpa rekrutmen ribet</p>
                </div>
              </div>
              <div className="flex flex-col gap-sm">
                <div className="flex items-start gap-md">
                  <span className="w-6 h-6 rounded-full bg-[#416900]/20 text-[#304f00] flex items-center justify-center font-label-sm text-[11px] font-bold shrink-0 mt-0.5">1</span>
                  <div>
                    <p className="font-body-md text-body-md font-medium text-on-surface">Post task dengan detail lokasi</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Isi judul, deskripsi, skill yang dibutuhkan, estimasi waktu, dan kompensasi.</p>
                  </div>
                </div>
                <div className="flex items-start gap-md">
                  <span className="w-6 h-6 rounded-full bg-[#416900]/20 text-[#304f00] flex items-center justify-center font-label-sm text-[11px] font-bold shrink-0 mt-0.5">2</span>
                  <div>
                    <p className="font-body-md text-body-md font-medium text-on-surface">Terima notifikasi &amp; pilih worker</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Lihat profil &amp; rating applicant. Escrow mengunci dana saat task aktif.</p>
                  </div>
                </div>
                <div className="flex items-start gap-md">
                  <span className="w-6 h-6 rounded-full bg-[#416900]/20 text-[#304f00] flex items-center justify-center font-label-sm text-[11px] font-bold shrink-0 mt-0.5">3</span>
                  <div>
                    <p className="font-body-md text-body-md font-medium text-on-surface">Konfirmasi selesai &amp; kasih rating</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Setujui hasil kerja → dana escrow cair ke worker. Rating membangun reputasi.</p>
                  </div>
                </div>
              </div>
              <Link
                href="/login"
                className="mt-auto bg-white border border-primary-container text-primary-container font-label-md text-label-md font-bold px-md py-sm rounded-lg text-center hover:bg-surface-container transition-colors"
              >
                Post Tugas Sekarang →
              </Link>
            </div>
          </div>
        </section>

        {/* Fitur Unggulan Section */}
        <section id="fitur">
          <div className="flex flex-col items-center text-center mb-xl">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-sm">Fitur Unggulan</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
              Teknologi canggih yang membuat CEPAT berbeda dari platform lain.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            <div className="bg-white border border-outline-variant rounded-xl p-lg flex flex-col gap-sm task-card">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center mb-xs">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>radar</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Geo-radar 2 km</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">Filter otomatis task dalam radius GPS terdekat via PostGIS. Bukan sekadar filter kota.</p>
              <span className="font-label-sm text-[10px] text-primary-container bg-surface-container px-sm py-xs rounded-full w-fit">Leaflet.js + PostGIS</span>
            </div>

            <div className="bg-white border border-outline-variant rounded-xl p-lg flex flex-col gap-sm task-card">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center mb-xs">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Escrow Aman</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">Dana dikunci otomatis saat task diterima. Cair to worker hanya setelah requester konfirmasi selesai.</p>
              <span className="font-label-sm text-[10px] escrow-text bg-amber-50 px-sm py-xs rounded-full w-fit border border-amber-200">Sistem Poin Internal</span>
            </div>

            <div className="bg-white border border-outline-variant rounded-xl p-lg flex flex-col gap-sm task-card">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center mb-xs">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Rating Dua Arah</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">Requester &amp; Worker saling menilai. Reputasi transparan membangun kepercayaan komunitas.</p>
              <span className="font-label-sm text-[10px] text-primary-container bg-surface-container px-sm py-xs rounded-full w-fit">Trust System</span>
            </div>
          </div>
        </section>

        {/* ── KATEGORI ── */}
        <section id="kategori">
          <div className="flex flex-col items-center text-center mb-lg">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-sm">Kategori Tugas</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">12 kategori micro-task yang bisa kamu cari atau posting.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-sm">
            <div className="bg-white border border-outline-variant rounded-lg p-md flex flex-col items-center gap-xs text-center card-hover cursor-pointer"><span className="text-2xl">📸</span><span className="font-body-sm text-body-sm text-on-surface font-medium">Fotografi</span></div>
            <div className="bg-white border border-outline-variant rounded-lg p-md flex flex-col items-center gap-xs text-center card-hover cursor-pointer"><span className="text-2xl">💻</span><span className="font-body-sm text-body-sm text-on-surface font-medium">Data Entry</span></div>
            <div className="bg-white border border-outline-variant rounded-lg p-md flex flex-col items-center gap-xs text-center card-hover cursor-pointer"><span className="text-2xl">🎨</span><span className="font-body-sm text-body-sm text-on-surface font-medium">Desain Grafis</span></div>
            <div className="bg-white border border-outline-variant rounded-lg p-md flex flex-col items-center gap-xs text-center card-hover cursor-pointer"><span className="text-2xl">✍️</span><span className="font-body-sm text-body-sm text-on-surface font-medium">Penulisan</span></div>
            <div className="bg-white border border-outline-variant rounded-lg p-md flex flex-col items-center gap-xs text-center card-hover cursor-pointer"><span className="text-2xl">📦</span><span className="font-body-sm text-body-sm text-on-surface font-medium">Jaga Booth</span></div>
            <div className="bg-white border border-[#DDE7E1] rounded-lg p-md flex flex-col items-center gap-xs text-center card-hover cursor-pointer"><span className="text-2xl">🚚</span><span className="font-body-sm text-body-sm text-on-surface font-medium">Kurir</span></div>
            <div className="bg-white border border-outline-variant rounded-lg p-md flex flex-col items-center gap-xs text-center card-hover cursor-pointer"><span className="text-2xl">🔧</span><span className="font-body-sm text-body-sm text-on-surface font-medium">IT Support</span></div>
            <div className="bg-white border border-outline-variant rounded-lg p-md flex flex-col items-center gap-xs text-center card-hover cursor-pointer"><span className="text-2xl">📱</span><span className="font-body-sm text-body-sm text-on-surface font-medium">Social Media</span></div>
            <div className="bg-white border border-outline-variant rounded-lg p-md flex flex-col items-center gap-xs text-center card-hover cursor-pointer"><span className="text-2xl">📊</span><span className="font-body-sm text-body-sm text-on-surface font-medium">Riset &amp; Survei</span></div>
            <div className="bg-white border border-outline-variant rounded-lg p-md flex flex-col items-center gap-xs text-center card-hover cursor-pointer"><span className="text-2xl">🎓</span><span className="font-body-sm text-body-sm text-on-surface font-medium">Tutoring</span></div>
            <div className="bg-white border border-outline-variant rounded-lg p-md flex flex-col items-center gap-xs text-center card-hover cursor-pointer"><span className="text-2xl">🧹</span><span className="font-body-sm text-body-sm text-on-surface font-medium">Kebersihan</span></div>
            <div className="bg-white border border-outline-variant rounded-lg p-md flex flex-col items-center gap-xs text-center card-hover cursor-pointer"><span className="text-2xl">🛒</span><span className="font-body-sm text-body-sm text-on-surface font-medium">Belanja/Titip</span></div>
          </div>
        </section>

        {/* SDG 8 Section */}
        <section id="dampak-sdg" className="bg-inverse-surface rounded-2xl p-lg md:p-xl text-inverse-on-surface">
          <div className="flex items-center gap-sm mb-lg">
            <span className="material-symbols-outlined text-inverse-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>public</span>
            <span className="font-label-sm text-label-sm text-inverse-primary uppercase tracking-widest">SDG 8 — Decent Work &amp; Economic Growth</span>
          </div>
          <h2 className="font-headline-lg text-headline-lg text-inverse-on-surface mb-md">Dampak Nyata CEPAT</h2>
          <p className="font-body-lg text-body-lg text-inverse-on-surface/70 mb-xl max-w-2xl">
            CEPAT bukan sekadar platform kerja — ini adalah ekosistem yang memberdayakan mahasiswa dan UMKM lokal secara bersamaan.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            <div className="bg-white/10 border border-white/20 rounded-xl p-md">
              <span className="material-symbols-outlined text-inverse-primary text-[24px] mb-sm block" style={{ fontVariationSettings: "'FILL' 1" }}>work_history</span>
              <h3 className="font-headline-sm text-headline-sm text-inverse-on-surface mb-xs">Pekerjaan Layak</h3>
              <p className="font-body-sm text-body-sm text-inverse-on-surface/70">Akses kerja fleksibel bagi mahasiswa tanpa terikat jam kerja tetap. Track record dibangun sejak kuliah.</p>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-xl p-md">
              <span className="material-symbols-outlined text-inverse-primary text-[24px] mb-sm block" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
              <h3 className="font-headline-sm text-headline-sm text-inverse-on-surface mb-xs">Pertumbuhan Ekonomi</h3>
              <p className="font-body-sm text-body-sm text-inverse-on-surface/70">UMKM lokal dapat tenaga kerja on-demand. Sirkulasi poin membangun ekosistem ekonomi komunitas kampus.</p>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-xl p-md">
              <span className="material-symbols-outlined text-inverse-primary text-[24px] mb-sm block" style={{ fontVariationSettings: "'FILL' 1" }}>volunteer_activism</span>
              <h3 className="font-headline-sm text-headline-sm text-inverse-on-surface mb-xs">Inklusif &amp; Lokal</h3>
              <p className="font-body-sm text-body-sm text-inverse-on-surface/70">Tidak perlu transportasi jauh. Radius 2 km = pekerjaan inklusif, mengurangi mismatch UMKM &amp; mahasiswa.</p>
            </div>
          </div>
        </section>

        {/* Untuk UMKM Section */}
        <section id="untuk-umkm" className="grid grid-cols-1 md:grid-cols-2 gap-xl items-center">
          <div>
            <div className="inline-flex items-center gap-xs px-sm py-xs rounded-full bg-surface-container-highest border border-outline-variant mb-md">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Untuk Pemilik UMKM</span>
            </div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-md">Dapat bantuan cepat tanpa ribet rekrutmen</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-lg">Post tugas di pagi hari, mahasiswa terdekat datang membantu di siang hari. Tanpa kontrak panjang.</p>
            <ul className="flex flex-col gap-md mb-lg">
              <li className="flex items-start gap-md">
                <span className="material-symbols-outlined text-primary-container text-[20px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <div>
                  <p className="font-body-md text-body-md font-medium text-on-surface">Mahasiswa terverifikasi</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Profil lengkap dengan rating dari tugas sebelumnya.</p>
                </div>
              </li>
              <li className="flex items-start gap-md">
                <span className="material-symbols-outlined text-primary-container text-[20px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <div>
                  <p className="font-body-md text-body-md font-medium text-on-surface">Bayar hanya saat selesai</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Sistem escrow mengamankan dana. Cair hanya setelah Anda setujui hasilnya.</p>
                </div>
              </li>
              <li className="flex items-start gap-md">
                <span className="material-symbols-outlined text-primary-container text-[20px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <div>
                  <p className="font-body-md text-body-md font-medium text-on-surface">Tugas selesai hari ini</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Rata-rata respons dalam hitungan menit. Micro-task bisa selesai dalam &lt; 2 jam.</p>
                </div>
              </li>
            </ul>
            <Link href="/login" className="inline-flex items-center gap-sm bg-primary-container text-on-primary font-label-md text-label-md font-bold px-xl py-md rounded-lg hover:bg-primary transition-colors">
              Post Tugas Pertama Gratis <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
          <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <div className="px-md py-sm border-b border-outline-variant bg-surface-container-low">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">CEPAT vs Alternatif Lain</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="text-left px-md py-sm font-label-sm text-label-sm text-on-surface-variant">Platform</th>
                  <th className="text-left px-md py-sm font-label-sm text-label-sm text-on-surface-variant">Kelemahan</th>
                  <th className="text-left px-md py-sm font-label-sm text-label-sm text-primary-container">CEPAT ✓</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-outline-variant">
                  <td className="px-md py-sm font-body-sm text-body-sm text-on-surface font-medium">Sribulancer</td>
                  <td className="px-md py-sm font-body-sm text-body-sm text-on-surface-variant">Freelance jangka panjang</td>
                  <td className="px-md py-sm font-body-sm text-body-sm text-primary-container">Micro-task &lt; 1 hari</td>
                </tr>
                <tr className="border-b border-outline-variant">
                  <td className="px-md py-sm font-body-sm text-body-sm text-on-surface font-medium">Fiverr/Upwork</td>
                  <td className="px-md py-sm font-body-sm text-body-sm text-on-surface-variant">Global, mahal, tidak lokal</td>
                  <td className="px-md py-sm font-body-sm text-body-sm text-primary-container">Lokal 2km, terjangkau</td>
                </tr>
                <tr className="border-b border-outline-variant">
                  <td className="px-md py-sm font-body-sm text-body-sm text-on-surface font-medium">Grab/GoJek</td>
                  <td className="px-md py-sm font-body-sm text-body-sm text-on-surface-variant">Fokus delivery saja</td>
                  <td className="px-md py-sm font-body-sm text-body-sm text-primary-container">Skill beragam, exchange</td>
                </tr>
                <tr>
                  <td className="px-md py-sm font-body-sm text-body-sm text-on-surface font-medium">Grup WA Kampus</td>
                  <td className="px-md py-sm font-body-sm text-body-sm text-on-surface-variant">Tidak terstruktur</td>
                  <td className="px-md py-sm font-body-sm text-body-sm text-primary-container">Rating, escrow, tracking</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ── SKENARIO DEMO ── */}
        <section className="bg-surface-container-low border border-outline-variant rounded-2xl p-lg md:p-xl shadow-sm">
          <div className="flex flex-col items-center text-center mb-xl">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-sm">Skenario Demo</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">&quot;UMKM Butuh Foto Produk&quot; — dari posting sampai selesai dalam 3 jam.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-sm md:gap-0 relative">
            <div className="hidden md:block absolute top-7 left-[calc(16.67%+16px)] right-[calc(16.67%+16px)] h-[2px] bg-outline-variant"></div>
            <div className="flex flex-col md:flex-row gap-sm w-full">
              <div className="flex-1 flex flex-col items-center text-center gap-sm md:px-sm">
                <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-bold z-10">1</div>
                <h4 className="font-body-md text-body-md font-semibold text-on-surface">Bu Ani Post Tugas</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Foto 20 produk kue — 50 poin, lokasi pin di map</p>
              </div>
              <div className="flex-1 flex flex-col items-center text-center gap-sm md:px-sm">
                <div className="w-12 h-12 rounded-xl bg-surface-container-high text-primary flex items-center justify-center font-bold z-10 border border-primary/20">2</div>
                <h4 className="font-body-md text-body-md font-semibold text-on-surface">Andi Lihat di Map</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Mahasiswa DKV, jarak 0.8 km — langsung apply</p>
              </div>
              <div className="flex-1 flex flex-col items-center text-center gap-sm md:px-sm">
                <div className="w-12 h-12 rounded-xl bg-surface-container-high text-primary flex items-center justify-center font-bold z-10 border border-primary/20">3</div>
                <h4 className="font-body-md text-body-md font-semibold text-on-surface">Bu Ani Accept</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Lihat profil Andi (rating 4.8, skill fotografi) → accept</p>
              </div>
              <div className="flex-1 flex flex-col items-center text-center gap-sm md:px-sm">
                <div className="w-12 h-12 rounded-xl bg-surface-container-high text-primary flex items-center justify-center font-bold z-10 border border-primary/20">4</div>
                <h4 className="font-body-md text-body-md font-semibold text-on-surface">Andi Kerjakan</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Update status &quot;In Progress&quot; → kirim bukti foto</p>
              </div>
              <div className="flex-1 flex flex-col items-center text-center gap-sm md:px-sm">
                <div className="w-12 h-12 rounded-xl bg-[#84CC16] text-white flex items-center justify-center z-10">
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
                </div>
                <h4 className="font-body-md text-body-md font-semibold text-on-surface">Poin Cair ⭐⭐⭐⭐⭐</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant">50 poin masuk ke wallet Andi. Rating dua arah diberikan.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center flex flex-col items-center gap-lg">
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Mulai sekarang, gratis</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg">Daftar dalam 1 menit. Cari atau post tugas pertama kamu hari ini.</p>
          <div className="flex flex-wrap gap-md justify-center">
            <Link
              href="/register"
              className="bg-primary-container text-on-primary font-label-md text-label-md font-bold px-xl py-md rounded-lg hover:bg-primary transition-colors flex items-center gap-sm"
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              Daftar Gratis
            </Link>
            <Link
              href="/login"
              className="bg-white border border-primary-container text-primary-container font-label-md text-label-md font-bold px-xl py-md rounded-lg hover:bg-surface-container transition-colors flex items-center gap-sm"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              Lihat Tugas Tersedia
            </Link>
          </div>
          <div className="flex items-center gap-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]">shield</span>
            <span className="font-label-sm text-label-sm">Semua transaksi dilindungi sistem escrow</span>
          </div>
        </section>
      </main>

      {/* ───── FOOTER ───── */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant mt-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-md px-gutter py-xl max-w-7xl mx-auto items-start">
          <div className="col-span-2 flex flex-col gap-sm">
            <Link href="/">
              <Image src="/logo.svg" alt="CEPAT" width={100} height={24} className="logo-img-sm" />
            </Link>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              © 2026 CEPAT Hyperlocal Marketplace. Memberdayakan mahasiswa &amp; UMKM lokal.
            </p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              ITechno Cup 2026 — SDG 8 Project
            </p>
          </div>
          <div className="flex flex-col gap-sm">
            <span className="font-label-md text-label-md text-on-surface font-semibold mb-xs">Platform</span>
            <Link href="/" className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary hover:underline">
              Landing Page
            </Link>
            <Link href="/login" className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary hover:underline">
              Cari Tugas
            </Link>
          </div>
          <div className="flex flex-col gap-sm">
            <span className="font-label-md text-label-md text-on-surface font-semibold mb-xs">Tentang</span>
            <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary hover:underline" href="#">
              Tentang Kami
            </a>
            <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary hover:underline" href="#">
              Bantuan
            </a>
          </div>
          <div className="flex flex-col gap-sm">
            <span className="font-label-md text-label-md text-on-surface font-semibold mb-xs">Hukum</span>
            <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary hover:underline" href="#">
              Kebijakan Privasi
            </a>
            <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary hover:underline" href="#">
              Syarat &amp; Ketentuan
            </a>
          </div>
          <div className="flex flex-col gap-sm">
            <span className="font-label-md text-label-md text-on-surface font-semibold mb-xs">Kontak Panitia</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Reza: +62 812-9156-2192</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Yazid: +62 851-6166-1805</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Yuta: +62 878-8838-0517</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
