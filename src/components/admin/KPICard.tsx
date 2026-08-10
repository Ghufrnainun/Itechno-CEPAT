'use client';

import { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: ReactNode;
  subtitle?: string;
}

export default function KPICard({
  title,
  value,
  change,
  isPositive = true,
  icon,
  subtitle,
}: KPICardProps) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs transition-all hover:border-[#0F766E]/40">
      <div className="flex items-center justify-between">
        <span className="font-sans text-xs font-bold uppercase tracking-wider text-[#64748B]">
          {title}
        </span>
        <div className="p-2.5 rounded-lg bg-[#E6F4F1] text-[#0F766E] border border-[#0F766E]/10">
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-2">
        <div className="font-headline text-2xl lg:text-3xl font-extrabold text-[#0C1F16] tracking-tight">
          {value}
        </div>

        {change && (
          <div
            className={`inline-flex items-center font-mono text-[11px] font-bold px-2 py-0.5 rounded-full ${
              isPositive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
            )}
            {change}
          </div>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs font-sans text-[#64748B]">
          {subtitle}
        </p>
      )}
    </div>
  );
}
