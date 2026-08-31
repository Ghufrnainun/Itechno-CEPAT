'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { ToastProvider } from '@/components/ui/Toast';

interface AdminUser {
  id: string;
  email: string;
  nama_lengkap: string;
  avatar_url?: string;
  username: string;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setChecking(false);
      return;
    }

    // Verifikasi session admin
    fetch('/api/admin/auth/me', { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) return { success: false };
        return res.json().catch(() => ({ success: false }));
      })
      .then((data) => {
        if (data.success && data.data) {
          setAdmin(data.data);
        } else {
          router.replace('/admin/login');
        }
      })
      .catch(() => {
        router.replace('/admin/login');
      })
      .finally(() => {
        setChecking(false);
      });
  }, [pathname, isLoginPage, router]);

  // Halaman login — render tanpa sidebar
  if (isLoginPage) {
    return <ToastProvider>{children}</ToastProvider>;
  }

  // Loading state saat cek session
  if (checking) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-on-surface-variant font-sans">Memeriksa sesi admin...</p>
        </div>
      </div>
    );
  }

  // Jika belum authenticated (redirect sudah dipicu di useEffect)
  if (!admin) {
    return null;
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-surface text-on-surface font-sans flex antialiased">
        {/* Sidebar Navigation */}
        <AdminSidebar adminUser={admin} />

        {/* Main Workspace Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          {children}
        </div>
      </div>
    </ToastProvider>
  );
}
