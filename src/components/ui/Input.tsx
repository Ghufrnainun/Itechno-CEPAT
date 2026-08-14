"use client";

import React, { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Label Component ────────────────────────────────────────────────────────
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("block text-xs font-bold text-on-surface mb-1.5 select-none", className)}
      {...props}
    >
      {children}
      {required && <span className="text-error ml-0.5">*</span>}
    </label>
  )
);
Label.displayName = "Label";

// ─── Input Component ────────────────────────────────────────────────────────
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, icon, type = "text", ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3.5 text-on-surface-variant pointer-events-none shrink-0">
            {icon}
          </div>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            "w-full px-3.5 py-2.5 text-xs sm:text-sm font-sans bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 rounded-xl border transition-all duration-150 shadow-2xs focus-visible:outline-none min-h-[42px]",
            icon && "pl-10",
            error
              ? "border-error focus:border-error focus:ring-2 focus:ring-error/20"
              : "border-card-border/90 focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";

// ─── Select Component (With Custom Hidden Native Chevron) ───────────────────
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  icon?: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, error, icon, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3.5 text-on-surface-variant pointer-events-none shrink-0 z-10">
            {icon}
          </div>
        )}
        <select
          ref={ref}
          className={cn(
            "w-full appearance-none px-3.5 py-2.5 pr-10 text-xs sm:text-sm font-sans bg-surface-container-low text-on-surface rounded-xl border transition-all duration-150 shadow-2xs focus-visible:outline-none cursor-pointer min-h-[42px]",
            icon && "pl-10",
            error
              ? "border-error focus:border-error focus:ring-2 focus:ring-error/20"
              : "border-card-border/90 focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="w-4 h-4 text-on-surface-variant pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 shrink-0 z-10 opacity-70" />
      </div>
    );
  }
);
Select.displayName = "Select";

// ─── Textarea Component ──────────────────────────────────────────────────────
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full px-3.5 py-2.5 text-xs sm:text-sm font-sans bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 rounded-xl border transition-all duration-150 shadow-2xs focus-visible:outline-none resize-none",
          error
            ? "border-error focus:border-error focus:ring-2 focus:ring-error/20"
            : "border-card-border/90 focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
