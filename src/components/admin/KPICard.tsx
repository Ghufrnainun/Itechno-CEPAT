'use client';

import { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: ReactNode;
  subtitle?: string;
  className?: string;
}

export default function KPICard({
  title,
  value,
  change,
  isPositive = true,
  icon,
  subtitle,
  className,
}: KPICardProps) {
  return (
    <div
      className={cn(
        "group bg-black/5 ring-1 ring-black/5 p-1 rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:shadow-lg",
        className
      )}
    >
      <div className="bg-surface-container-lowest shadow-[inset_0_1px_1px_rgba(255,255,255,1)] rounded-[calc(1rem-0.25rem)] p-4 h-full flex flex-col justify-between gap-3">
        
        <div className="flex items-center justify-between gap-2">
          <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-on-surface-variant truncate">
            {title}
          </span>
          <div className="w-8 h-8 rounded-full bg-surface-container-low text-primary ring-1 ring-card-border shrink-0 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 group-hover:bg-primary group-hover:text-on-primary">
            {icon}
          </div>
        </div>

        <div className="space-y-1.5 min-w-0">
          <div
            className="font-headline text-base sm:text-lg xl:text-base 2xl:text-lg font-extrabold text-on-surface tracking-tight tabular-nums truncate"
            title={typeof value === 'string' || typeof value === 'number' ? String(value) : undefined}
          >
            {value}
          </div>

          {/* Change / Context Badge */}
          {change && (
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center text-[10.5px] font-mono font-bold px-2 py-1 rounded-full tabular-nums leading-none shrink-0 ring-1",
                  isPositive
                    ? "bg-secondary/10 text-secondary ring-secondary/20"
                    : "bg-error/10 text-error ring-error/20"
                )}
              >
                {isPositive ? (
                  <ArrowUpRight className="w-3 h-3 mr-0.5 inline shrink-0" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 mr-0.5 inline shrink-0" />
                )}
                {change}
              </span>
            </div>
          )}
        </div>

        {/* Optional Subtitle */}
        {subtitle && (
          <p className="text-[11px] font-sans text-on-surface-variant leading-normal pt-2 mt-1 border-t border-card-border/40">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
