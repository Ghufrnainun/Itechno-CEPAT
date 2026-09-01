"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Sidebar } from "@/components/ui/Sidebar";
import { BottomNav } from "@/components/ui/BottomNav";
import { ToastProvider } from "@/components/ui/Toast";
import { useFCM } from "@/hooks/useFCM";
import { usePresencePing } from "@/hooks/usePresencePing";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PwaInstallBanner } from "@/components/ui/PwaInstallBanner";

type Role = "worker" | "requester";

export interface UserProfileData {
  id_user?: string;
  nama_lengkap?: string;
  username?: string;
  email?: string;
  total_balance?: number;
  rating_avg?: number;
  total_completed?: number;
  avatar_url?: string | null;
}

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
  toggleRole: () => void;
  user: UserProfileData | null;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

function FcmBridge() {
  const { permission, requestPermission } = useFCM();
  const [dismissed, setDismissed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    if (sessionStorage.getItem('fcm_prompt_dismissed')) {
      setDismissed(true);
    }
  }, []);

  if (!isMounted) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('fcm_prompt_dismissed', 'true');
  };
  
  if (permission === 'default' && !dismissed) {
    return (
      <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px)+12px)] lg:bottom-6 left-4 right-4 lg:left-auto lg:right-6 lg:w-96 bg-surface-container-lowest border border-card-border shadow-lg rounded-xl p-4 z-40 flex flex-col gap-3 animate-in slide-in-from-bottom-5 font-sans">
        <div>
          <h4 className="font-headline font-bold text-sm text-on-surface flex items-center gap-2">
            <BellRing className="w-4.5 h-4.5 text-primary" />
            Aktifkan Notifikasi
          </h4>
          <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
            Dapatkan info instan saat lamaranmu diterima atau ada tugas baru di sekitarmu.
          </p>
        </div>
        <div className="flex justify-end gap-2 mt-1">
          <button 
            onClick={handleDismiss}
            className="text-on-surface-variant px-3 py-1.5 text-xs font-semibold hover:text-on-surface transition-colors cursor-pointer"
          >
            Nanti
          </button>
          <Button 
            size="sm"
            onClick={requestPermission}
          >
            Izinkan
          </Button>
        </div>
      </div>
    );
  }
  
  return null;
}

export function useCurrentRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useCurrentRole must be used within a RoleContext Provider");
  }
  return context;
}

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [role, setRoleState] = useState<Role>("worker");
  const [user, setUser] = useState<UserProfileData | null>(null);

  // Initialize online presence pinging
  usePresencePing(60000); // 1 minute interval

  useEffect(() => {
    const saved = localStorage.getItem("cepat_role") as Role;
    if (saved === "worker" || saved === "requester") {
      setRoleState(saved);
    }

    async function fetchUser() {
      try {
        const res = await fetch("/api/users/me");
        if (res.status === 403) {
          const json = await res.json().catch(() => ({}));
          if (json.is_banned && json.ban_details) {
            const type = json.ban_details.type || 'PERMANENT';
            const reason = encodeURIComponent(json.ban_details.reason || '');
            const until = json.ban_details.banned_until ? encodeURIComponent(json.ban_details.banned_until) : '';
            window.location.href = `/login?banned=true&type=${type}&reason=${reason}&until=${until}`;
            return;
          }
        }
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const roleName = json.data.role?.nama_role || json.data.role;
            if (roleName === 'Admin') {
              window.location.href = '/admin/dashboard';
              return;
            }
            setUser(json.data);
          }
        }
      } catch (e) {
        console.error("Failed to fetch user profile:", e);
      }
    }
    fetchUser();
  }, []);

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    localStorage.setItem("cepat_role", newRole);
  };

  const toggleRole = () => {
    const newRole = role === "worker" ? "requester" : "worker";
    setRole(newRole);
  };

  return (
    <RoleContext.Provider value={{ role, setRole, toggleRole, user }}>
      <ToastProvider>
        <PwaInstallBanner />
        <FcmBridge />
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-3 focus:bg-primary focus:text-on-primary font-bold shadow-md m-2 rounded-lg text-xs">
          Skip to main content
        </a>
        <div className="flex h-[100dvh] w-full max-w-full overflow-hidden bg-surface font-sans">
          {/* Sidebar Left */}
          <Sidebar role={role} onRoleToggle={toggleRole} user={user} />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden relative">
            <main
              id="main-content"
              className="flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar [scrollbar-gutter:stable] pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0"
              tabIndex={-1}
            >
              {children}
            </main>

            {/* Mobile Bottom Navigation */}
            <React.Suspense fallback={null}>
              <BottomNav role={role} />
            </React.Suspense>
          </div>
        </div>
      </ToastProvider>
    </RoleContext.Provider>
  );
}
