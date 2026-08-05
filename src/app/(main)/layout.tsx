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
  useFCM();
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
