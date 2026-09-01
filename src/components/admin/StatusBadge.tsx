'use client';

import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'open' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();

  switch (normalizedStatus) {
    case 'open':
      return (
        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20", className)}>
          Open
        </span>
      );
    case 'accepted':
      return (
        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-tertiary-container/40 text-tertiary border border-tertiary/25", className)}>
          Accepted
        </span>
      );
    case 'in_progress':
      return (
        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-primary-container/20 text-primary-container border border-primary-container/30", className)}>
          In Progress
        </span>
      );
    case 'completed':
      return (
        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-secondary-container/50 text-secondary border border-secondary/30", className)}>
          Completed
        </span>
      );
    case 'cancelled':
      return (
        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-error-container/40 text-error border border-error/25", className)}>
          Cancelled
        </span>
      );
    default:
      return (
        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-surface-container text-on-surface-variant border border-card-border", className)}>
          {status}
        </span>
      );
  }
}
