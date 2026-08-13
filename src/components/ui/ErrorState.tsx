import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  icon?: React.ReactNode;
  className?: string;
  actionText?: string;
}

export function ErrorState({
  title = "Gagal Memuat Data",
  message = "Terjadi kendala jaringan saat menghubungkan ke server. Silakan coba beberapa saat lagi.",
  onRetry,
  icon,
  className,
  actionText = "Coba Lagi",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "bg-surface-container-lowest border border-card-border rounded-2xl p-6 sm:p-8",
        "flex flex-col items-center justify-center text-center gap-4 shadow-xs max-w-md mx-auto my-6 animate-fadeIn",
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-error-container/30 border border-error/20 flex items-center justify-center text-error shrink-0">
        {icon || <AlertCircle className="w-6 h-6" />}
      </div>

      <div className="space-y-1">
        <h3 className="font-headline text-base font-bold text-on-surface">
          {title}
        </h3>
        <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed max-w-xs">
          {message}
        </p>
      </div>

      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          icon={<RotateCcw className="w-3.5 h-3.5" />}
          className="mt-1"
        >
          {actionText}
        </Button>
      )}
    </div>
  );
}
