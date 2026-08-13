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
        "bg-surface-container-lowest border border-card-border rounded-2xl p-4.5 sm:p-5 shadow-xs",
        "transition-all duration-200 ease-out hover:border-primary/40 hover:shadow-sm hover:-translate-y-0.5",
        "flex flex-col justify-between gap-3 min-w-0",
        className
      )}
    >
      {/* Top Header: Title & Icon */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-on-surface-variant truncate">
          {title}
        </span>
        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary border border-primary/15 shrink-0 flex items-center justify-center shadow-2xs">
          {icon}
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="space-y-1.5 min-w-0">
        <div className="font-headline text-xl sm:text-2xl lg:text-[26px] font-extrabold text-on-surface tracking-tight tabular-nums font-mono truncate">
          {value}
        </div>

        {/* Change / Context Badge */}
        {change && (
          <div className="flex items-center gap-1.5 pt-0.5">
            <span
              className={cn(
                "inline-flex items-center text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-md tabular-nums leading-none shrink-0",
                isPositive
                  ? "bg-secondary-container/40 text-secondary border border-secondary/20"
                  : "bg-error-container/40 text-error border border-error/20"
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
        <p className="text-[11px] font-sans text-on-surface-variant leading-normal border-t border-card-border/60 pt-2 mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}
