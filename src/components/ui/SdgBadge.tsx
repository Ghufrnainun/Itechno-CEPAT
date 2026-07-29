import React from "react";

export function SdgBadge() {
  return (
    <div className="inline-flex items-center gap-xs px-xs py-[2px] rounded sdg-badge shrink-0">
      <span className="material-symbols-outlined text-[12px] text-on-secondary-fixed-variant" style={{ fontVariationSettings: "'FILL' 1" }}>
        work
      </span>
      <span className="font-label-sm text-[10px] text-on-secondary-fixed-variant">
        SDG 8
      </span>
    </div>
  );
}
