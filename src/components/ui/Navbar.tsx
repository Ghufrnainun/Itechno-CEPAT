"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "./Button";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDarkMode = document.documentElement.classList.contains("dark");
      setIsDark(isDarkMode);
    }
  }, []);

  const toggleDarkMode = () => {
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      if (isDark) {
        root.classList.remove("dark");
        setIsDark(false);
      } else {
        root.classList.add("dark");
        setIsDark(true);
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant">
      <nav
        aria-label="Navigasi Utama CEPAT"
        className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between transition-colors duration-200"
      >
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group"
            aria-label="Halaman Utama CEPAT"
          >
            <Image
              src="/logo.svg"
              alt="CEPAT Logo"
              width={100}
              height={32}
              className="logo-img"
              priority
            />
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex gap-1 items-center">
            <a
              href="#cara-kerja"
              className="text-on-surface-variant hover:text-primary hover:bg-surface-container-low font-medium text-sm px-3.5 py-2 rounded-lg transition-colors"
            >
              Cara Kerja
            </a>
            <a
              href="#fitur"
              className="text-on-surface-variant hover:text-primary hover:bg-surface-container-low font-medium text-sm px-3.5 py-2 rounded-lg transition-colors"
            >
              Fitur
            </a>
            <a
              href="#untuk-umkm"
              className="text-on-surface-variant hover:text-primary hover:bg-surface-container-low font-medium text-sm px-3.5 py-2 rounded-lg transition-colors"
            >
              Untuk UMKM
            </a>
            <a
              href="#dampak-sdg"
              className="text-on-surface-variant hover:text-primary hover:bg-surface-container-low font-medium text-sm px-3.5 py-2 rounded-lg transition-colors"
            >
              Dampak SDG 8
            </a>
          </div>
        </div>

        {/* Right CTA + Theme Toggle */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggleDarkMode}
            aria-label={isDark ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
            className="w-10 h-10 rounded-lg bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors active:scale-95 border border-outline-variant/60"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              {isDark ? "light_mode" : "dark_mode"}
            </span>
          </button>

          <Link href="/login">
            <Button variant="secondary" size="sm">
              Post Tugas
            </Button>
          </Link>
          <Link href="/login">
            <Button
              variant="primary"
              size="sm"
              icon={
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                  arrow_forward
                </span>
              }
            >
              Mulai Cari Tugas
            </Button>
          </Link>
        </div>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={toggleDarkMode}
            aria-label={isDark ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
            className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface border border-outline-variant/60"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              {isDark ? "light_mode" : "dark_mode"}
            </span>
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            aria-label="Buka/Tutup Menu Navigasi Mobile"
            className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface border border-outline-variant/60 active:scale-95 min-h-[44px] min-w-[44px]"
          >
            <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
              {isOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div
          id="mobile-menu"
          className="md:hidden border-t border-outline-variant bg-surface-container-lowest p-4 flex flex-col gap-2 shadow-lg"
        >
          <a
            href="#cara-kerja"
            onClick={() => setIsOpen(false)}
            className="text-on-surface-variant hover:text-primary font-medium text-base px-4 py-2.5 rounded-lg hover:bg-surface-container-low transition-colors"
          >
            Cara Kerja
          </a>
          <a
            href="#fitur"
            onClick={() => setIsOpen(false)}
            className="text-on-surface-variant hover:text-primary font-medium text-base px-4 py-2.5 rounded-lg hover:bg-surface-container-low transition-colors"
          >
            Fitur
          </a>
          <a
            href="#untuk-umkm"
            onClick={() => setIsOpen(false)}
            className="text-on-surface-variant hover:text-primary font-medium text-base px-4 py-2.5 rounded-lg hover:bg-surface-container-low transition-colors"
          >
            Untuk UMKM
          </a>
          <div className="pt-2 border-t border-outline-variant flex flex-col gap-2">
            <Link href="/login" onClick={() => setIsOpen(false)}>
              <Button variant="primary" fullWidth>
                Mulai Cari Tugas
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
