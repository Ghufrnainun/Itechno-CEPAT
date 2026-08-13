"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number; // 0 to 5
  maxStars?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (newRating: number) => void;
  className?: string;
  showScore?: boolean;
}

export function RatingStars({
  rating,
  maxStars = 5,
  size = "md",
  interactive = false,
  onChange,
  className = "",
  showScore = false,
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const displayRating = hoverRating !== null ? hoverRating : rating;

  const sizeClasses = {
    sm: "w-3.5 h-3.5",
    md: "w-4.5 h-4.5",
    lg: "w-6 h-6",
  };

  const handleStarClick = (index: number) => {
    if (interactive && onChange) {
      onChange(index);
    }
  };

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      {Array.from({ length: maxStars }, (_, i) => {
        const starNumber = i + 1;
        const isFilled = starNumber <= Math.round(displayRating);

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => handleStarClick(starNumber)}
            onMouseEnter={() => interactive && setHoverRating(starNumber)}
            onMouseLeave={() => interactive && setHoverRating(null)}
            className={cn(
              "transition-transform duration-150 p-0.5",
              interactive
                ? "cursor-pointer hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-sm"
                : "cursor-default"
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                isFilled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-outline-variant/60"
              )}
            />
          </button>
        );
      })}

      {showScore && (
        <span className="ml-1 font-mono font-bold text-on-surface text-sm tabular-nums">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
