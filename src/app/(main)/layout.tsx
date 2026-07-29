"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Sidebar } from "@/components/ui/Sidebar";
import { BottomNav } from "@/components/ui/BottomNav";
import { ToastProvider } from "@/components/ui/Toast";

type Role = "worker" | "requester";

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
  toggleRole: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

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

  useEffect(() => {
    const saved = localStorage.getItem("cepat_role") as Role;
    if (saved === "worker" || saved === "requester") {
      setRoleState(saved);
    }
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
    <RoleContext.Provider value={{ role, setRole, toggleRole }}>
      <ToastProvider>
        <div className="flex h-screen w-screen overflow-hidden bg-layout-bg font-sans">
          {/* Sidebar Left */}
          <Sidebar role={role} onRoleToggle={toggleRole} />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            <main className="flex-grow overflow-y-auto pb-20 lg:pb-0 custom-scrollbar">
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
