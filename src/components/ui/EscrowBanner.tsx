import React from "react";

export function EscrowBanner() {
  return (
    <div className="escrow-bg rounded-lg border border-[#FCD34D] p-sm flex items-center gap-sm shrink-0">
      <span className="material-symbols-outlined escrow-text text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
        verified_user
      </span>
      <p className="font-label-sm text-label-sm escrow-text">
        Dana ditahan di Escrow • Aman &amp; Terpercaya
      </p>
    </div>
  );
}
