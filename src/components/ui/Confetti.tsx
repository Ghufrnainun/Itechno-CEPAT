"use client";

import React, { useEffect, useState } from "react";

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  tilt: number;
  vx: number;
  vy: number;
}

const COLORS = [
  "oklch(0.65 0.20 175)", // Emerald
  "oklch(0.75 0.18 140)", // Lime
  "oklch(0.72 0.18 65)",  // Amber
  "oklch(0.68 0.22 320)", // Pink
  "oklch(0.65 0.20 250)", // Sky
];

export function Confetti({ active, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    // Spawn 32 particles
    const initialParticles: Particle[] = Array.from({ length: 32 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() * 20 - 10), // start near center top
      y: 30 + (Math.random() * 10 - 5),
      size: Math.random() * 8 + 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      tilt: Math.random() * 360,
      vx: (Math.random() - 0.5) * 60,
      vy: (Math.random() - 0.8) * 50 - 20,
    }));

    setParticles(initialParticles);

    const timer = setTimeout(() => {
      setParticles([]);
      if (onComplete) onComplete();
    }, 2200);

    return () => clearTimeout(timer);
  }, [active, onComplete]);

  if (!active || particles.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-sm animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size * 1.4}px`,
            backgroundColor: p.color,
            transform: `rotate(${p.tilt}deg)`,
            animation: `confettiPop 2.2s cubic-bezier(0.25, 1, 0.5, 1) forwards`,
            opacity: 0.9,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confettiPop {
          0% {
            opacity: 1;
            transform: translate(0, 0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translate(var(--vx, 40px), 380px) rotate(720deg);
          }
        }
      `}</style>
    </div>
  );
}
