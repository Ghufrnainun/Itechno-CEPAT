"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "motion/react";
import { Menu, X, LayoutDashboard, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export function LandingNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

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
    } catch {
      setIsLoggedIn(false);
    }
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "fixed top-4 left-4 right-4 mx-auto max-w-5xl z-50 transition-all duration-300 rounded-xl",
          isScrolled 
            ? "bg-surface-container-lowest/90 backdrop-blur-md shadow-xs border border-card-border" 
            : "bg-transparent border-transparent"
        )}
      >
        <nav className="px-4 py-3 md:px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group z-50">
            <Image
              src="/logo.svg"
              alt="CEPAT Logo"
              width={32}
              height={32}
              className="h-8 w-8 object-contain rounded-lg group-hover:scale-105 transition-transform"
              priority
            />
            <span className="font-headline font-extrabold text-xl text-primary tracking-tight">
              CEPAT
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-6 font-sans">
            <Link href="/#cara-kerja" className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors duration-150">Cara Kerja</Link>
            <Link href="/#fitur" className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors duration-150">Fitur</Link>
            <Link href="/#untuk-umkm" className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors duration-150">Untuk UMKM</Link>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-2.5">
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button variant="primary" size="sm" className="gap-2 font-bold shadow-xs">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Buka Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Masuk
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">
                    Daftar
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden z-50 w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface cursor-pointer active:scale-95 transition-transform"
            aria-label="Menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
            className="fixed inset-0 z-40 bg-surface/98 backdrop-blur-xl flex flex-col items-center justify-center gap-6 px-6 font-sans"
          >
            <Link href="/#cara-kerja" onClick={() => setIsOpen(false)} className="text-xl font-bold text-on-surface">Cara Kerja</Link>
            <Link href="/#fitur" onClick={() => setIsOpen(false)} className="text-xl font-bold text-on-surface">Fitur</Link>
            <Link href="/#untuk-umkm" onClick={() => setIsOpen(false)} className="text-xl font-bold text-on-surface">Untuk UMKM</Link>
            
            <div className="flex flex-col w-full max-w-xs gap-3 mt-6">
              {isLoggedIn ? (
                <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                  <Button variant="primary" fullWidth size="lg" className="gap-2 justify-center">
                    <LayoutDashboard className="w-4 h-4" />
                    Buka Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/register" onClick={() => setIsOpen(false)}>
                    <Button variant="primary" fullWidth size="lg">
                      Daftar
                    </Button>
                  </Link>
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="secondary" fullWidth size="lg">
                      Masuk
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

