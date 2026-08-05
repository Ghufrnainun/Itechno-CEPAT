"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentRole } from "@/app/(main)/layout";

export default function ProfileRedirect() {
  const router = useRouter();
  const { user } = useCurrentRole();

  useEffect(() => {
    if (user?.id_user) {
      router.replace(`/profile/${user.id_user}`);
    } else {
      // Fallback if not loaded
      router.replace("/profile/me");
    }
  }, [user, router]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-pulse flex flex-col items-center gap-2">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-sm font-medium text-on-surface-variant">Memuat Profil...</span>
      </div>
    </div>
  );
}
