"use client";

import React, { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  shape?: "circle" | "rounded";
  className?: string;
}

const sizeClasses = {
  xs: "w-5 h-5 text-[10px]",
  sm: "w-7 h-7 text-[11px]",
  md: "w-8 h-8 text-xs",
  lg: "w-10 h-10 text-sm",
  xl: "w-12 h-12 text-base",
};

const pixelSizes = {
  xs: 20,
  sm: 28,
  md: 32,
  lg: 40,
  xl: 48,
};

export function Avatar({
  src,
  alt = "Foto profil",
  name = "User",
  size = "md",
  shape = "circle",
  className,
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  const initial = (name || alt || "U").trim().charAt(0).toUpperCase() || "U";
  const radiusClass = shape === "circle" ? "rounded-full" : "rounded-lg";

  const showImage = Boolean(src && !hasError);

  return (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0 font-bold select-none overflow-hidden transition-all",
        sizeClasses[size],
        radiusClass,
        showImage
          ? "bg-surface-container-low border border-card-border"
          : "bg-primary text-on-primary font-mono",
        className
      )}
      title={name}
    >
      {showImage ? (
        <Image
          src={src!}
          alt={alt || name}
          fill
          sizes={`${pixelSizes[size]}px`}
          className="object-cover"
          onError={() => setHasError(true)}
          referrerPolicy="no-referrer"
          unoptimized={typeof src === 'string' && (src.includes('dicebear.com') || src.includes('.svg'))}
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}
