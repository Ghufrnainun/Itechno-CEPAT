"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "motion/react";

export function LandingNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed top-4 left-4 right-4 mx-auto max-w-5xl z-50 transition-all duration-300 rounded-xl ${
          isScrolled 
            ? "bg-white/85 backdrop-blur-md shadow-sm border border-outline-variant/60" 
            : "bg-transparent border-transparent"
        }`}
      >
        <nav className="px-4 py-3 md:px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group z-50">
            <Image
              src="/logo.svg"
              alt="CEPAT Logo"
              width={100}
              height={32}
              className="h-8 w-auto logo-img"
              priority
            />
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#cara-kerja" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">Cara Kerja</a>
            <a href="#fitur" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">Fitur</a>
            <a href="#untuk-umkm" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">Untuk UMKM</a>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-on-surface hover:text-primary transition-colors px-3.5 py-2 rounded-lg">
              Masuk
            </Link>
            <Link href="/register" className="text-sm font-semibold text-on-primary bg-primary px-5 py-2.5 rounded-lg hover:bg-primary-container transition-colors shadow-sm inline-flex items-center justify-center">
              Daftar
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden z-50 w-11 h-11 rounded-lg bg-surface-container flex items-center justify-center text-on-surface cursor-pointer"
            aria-label="Menu"
          >
            <span className="material-symbols-outlined text-[22px]">
              {isOpen ? "close" : "menu"}
            </span>
          </button>
        </nav>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8 px-6"
          >
            <a href="#cara-kerja" onClick={() => setIsOpen(false)} className="text-2xl font-bold text-on-surface">Cara Kerja</a>
            <a href="#fitur" onClick={() => setIsOpen(false)} className="text-2xl font-bold text-on-surface">Fitur</a>
            <a href="#untuk-umkm" onClick={() => setIsOpen(false)} className="text-2xl font-bold text-on-surface">Untuk UMKM</a>
            
            <div className="flex flex-col w-full max-w-xs gap-3 mt-8">
              <Link href="/register" onClick={() => setIsOpen(false)} className="w-full text-center text-lg font-semibold text-on-primary bg-primary px-6 py-4 rounded-lg shadow-sm">
                Daftar
              </Link>
              <Link href="/login" onClick={() => setIsOpen(false)} className="w-full text-center text-lg font-semibold text-on-surface bg-surface-container px-6 py-4 rounded-lg">
                Masuk
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
