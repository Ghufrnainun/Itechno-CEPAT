"use client";

import React, { useState } from "react";

interface RatingStarsProps {
  rating: number; // 0 sampai 5
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
    sm: "text-[16px]",
    md: "text-[20px]",
    lg: "text-[28px]",
  };

  const handleStarClick = (index: number) => {
    if (interactive && onChange) {
      onChange(index);
    }
  };

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      {Array.from({ length: maxStars }, (_, i) => {
        const starNumber = i + 1;
        const isFilled = starNumber <= displayRating;
        const isHalf = !isFilled && starNumber - 0.5 <= displayRating;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => handleStarClick(starNumber)}
            onMouseEnter={() => interactive && setHoverRating(starNumber)}
            onMouseLeave={() => interactive && setHoverRating(null)}
            className={`transition-transform duration-150 ${
              interactive ? "cursor-pointer hover:scale-115 active:scale-95" : "cursor-default"
            }`}
          >
            <span
              className={`material-symbols-outlined select-none ${sizeClasses[size]} ${
                isFilled || isHalf
                  ? "text-amber-400 font-filled"
                  : "text-neutral-300"
              }`}
              style={{
                fontVariationSettings: isFilled ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              {isFilled ? "star" : isHalf ? "star_half" : "star"}
            </span>
          </button>
        );
      })}

      {showScore && (
        <span className="ml-1 font-mono font-bold text-on-surface text-sm">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
