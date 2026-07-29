"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-surface border-b border-outline-variant sticky top-0 z-50">
      <div className="flex justify-between items-center w-full px-gutter py-md max-w-7xl mx-auto">
        <div className="flex items-center gap-xl">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-sm" aria-label="CEPAT home">
            <Image
              src="/logo.svg"
              alt="CEPAT"
              width={100}
              height={32}
              className="logo-img"
              priority
            />
          </Link>
          
          {/* Desktop links */}
          <div className="hidden md:flex gap-xs items-center">
            <a
              href="#cara-kerja"
              className="nav-link text-on-surface-variant hover:text-primary hover:bg-surface-container-low font-label-md text-label-md px-sm py-xs rounded"
            >
              Cara Kerja
            </a>
            <a
              href="#fitur"
              className="nav-link text-on-surface-variant hover:text-primary hover:bg-surface-container-low font-label-md text-label-md px-sm py-xs rounded"
            >
              Fitur
            </a>
            <a
              href="#untuk-umkm"
              className="nav-link text-on-surface-variant hover:text-primary hover:bg-surface-container-low font-label-md text-label-md px-sm py-xs rounded"
            >
              Untuk UMKM
            </a>
            <a
              href="#dampak-sdg"
              className="nav-link text-primary font-bold border-b-2 border-primary font-label-md text-label-md px-sm pb-1 rounded"
            >
              Dampak SDG 8
            </a>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-sm">
          <Link
            href="/login"
            className="font-label-md text-label-md text-primary font-bold px-md py-sm rounded border border-primary hover:bg-surface-container-low transition-colors"
          >
            Post Tugas
          </Link>
          <Link
            href="/login"
            className="font-label-md text-label-md bg-primary-container text-on-primary font-bold px-md py-sm rounded hover:bg-surface-tint transition-colors"
          >
            Mulai Cari Tugas
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-sm rounded hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface">
            {isOpen ? "close" : "menu"}
          </span>
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-outline-variant bg-surface">
          <div className="flex flex-col gap-xs p-md">
            <a
              href="#cara-kerja"
              onClick={() => setIsOpen(false)}
              className="nav-link text-on-surface-variant font-label-md text-label-md px-md py-sm rounded hover:bg-surface-container-low"
            >
              Cara Kerja
            </a>
            <a
              href="#fitur"
              onClick={() => setIsOpen(false)}
              className="nav-link text-on-surface-variant font-label-md text-label-md px-md py-sm rounded hover:bg-surface-container-low"
            >
              Fitur
            </a>
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="bg-primary-container text-on-primary font-label-md text-label-md font-bold px-md py-sm rounded text-center mt-sm"
            >
              Mulai Cari Tugas
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
