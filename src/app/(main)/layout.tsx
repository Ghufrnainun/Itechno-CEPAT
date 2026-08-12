"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Sidebar } from "@/components/ui/Sidebar";
import { BottomNav } from "@/components/ui/BottomNav";
import { ToastProvider } from "@/components/ui/Toast";
import { useFCM } from "@/hooks/useFCM";

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
  
  useEffect(() => {
    if (sessionStorage.getItem('fcm_prompt_dismissed')) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('fcm_prompt_dismissed', 'true');
  };
  
  if (permission === 'default' && !dismissed) {
    return (
      <div className="fixed bottom-[80px] lg:bottom-6 left-4 right-4 lg:left-6 lg:right-auto lg:w-96 bg-surface border border-outline shadow-lg rounded-xl p-4 z-30 flex flex-col gap-3 animate-in slide-in-from-bottom-5">
        <div>
          <h4 className="font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">notifications_active</span>
            Aktifkan Notifikasi
          </h4>
          <p className="text-sm text-on-surface-variant mt-1">Dapatkan info instan saat lamaranmu diterima atau ada tugas baru di sekitarmu.</p>
        </div>
        <div className="flex justify-end gap-3 mt-1">
          <button 
            onClick={handleDismiss}
            className="text-on-surface-variant px-3 py-2 text-sm font-medium hover:text-on-surface transition-colors"
          >
            Nanti
          </button>
          <button 
            onClick={requestPermission}
            className="bg-primary text-on-primary px-4 py-2 rounded-full font-bold text-sm hover:bg-opacity-90 transition-all shadow-sm"
          >
            Izinkan
          </button>
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
            const reason = encodeURIComponent(json.ban_details.reason || 'Akun Anda ditangguhkan oleh admin.');
            const until = json.ban_details.banned_until ? encodeURIComponent(json.ban_details.banned_until) : '';
            window.location.href = `/login?banned=true&type=${type}&reason=${reason}&until=${until}`;
            return;
          }
        }
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
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
        <FcmBridge />
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-primary focus:text-on-primary font-bold shadow-md m-2 rounded-md">
          Skip to main content
        </a>
        <div className="flex h-screen w-screen overflow-hidden bg-layout-bg font-sans">
          {/* Sidebar Left */}
          <Sidebar role={role} onRoleToggle={toggleRole} user={user} />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            <main id="main-content" className="flex-grow overflow-y-auto pb-20 lg:pb-0 custom-scrollbar" tabIndex={-1}>
              {children}
            </main>

            {/* Mobile Bottom Navigation */}
            <BottomNav role={role} />
          </div>
        </div>
      </ToastProvider>
    </RoleContext.Provider>
  );
}
