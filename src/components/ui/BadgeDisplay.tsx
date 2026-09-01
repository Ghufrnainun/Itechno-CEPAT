import React from "react";
import { Trophy, Star, Shield, Award } from "lucide-react";

export interface BadgeProps {
  id_badge: string;
  kode_badge: string;
  nama_badge: string;
  deskripsi: string;
  icon_url: string | null;
  earned_at?: string;
}

export function BadgeDisplay({ badge }: { badge: BadgeProps }) {
  // Select icon based on code or default
  let Icon = Award;
  if (badge.kode_badge.includes("VETERAN")) Icon = Shield;
  if (badge.kode_badge.includes("RATED")) Icon = Star;
  if (badge.kode_badge.includes("FIRST")) Icon = Trophy;

  return (
    <div className="flex flex-col items-center gap-2 p-3 border border-card-border bg-surface-container-low rounded-xl shadow-sm text-center">
      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
        {badge.icon_url ? (
          <img src={badge.icon_url} alt={badge.nama_badge} className="w-6 h-6" />
        ) : (
          <Icon className="w-6 h-6" />
        )}
      </div>
      <div>
        <h4 className="font-headline font-bold text-xs text-on-surface">{badge.nama_badge}</h4>
        <p className="text-xs text-on-surface-variant line-clamp-2 mt-1">{badge.deskripsi}</p>
      </div>
    </div>
  );
}
