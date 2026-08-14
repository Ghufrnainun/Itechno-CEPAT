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
  label?: string;
  error?: boolean;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, required, error, icon, leftIcon, rightIcon, helperText, type = "text", id, ...props }, ref) => {
    const activeIcon = leftIcon || icon;
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col">
        {label && (
          <Label htmlFor={inputId} required={required}>
            {label}
          </Label>
        )}
        <div className="relative flex items-center w-full">
          {activeIcon && (
            <div className="absolute left-3.5 text-on-surface-variant pointer-events-none shrink-0 z-10">
              {activeIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            required={required}
            className={cn(
              "w-full px-3.5 py-2.5 text-xs sm:text-sm font-sans bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 rounded-xl border transition-all duration-150 shadow-2xs focus-visible:outline-none min-h-[42px]",
              activeIcon && "pl-10",
              rightIcon && "pr-10",
              error
                ? "border-error focus:border-error focus:ring-2 focus:ring-error/20"
                : "border-card-border/90 focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-on-surface-variant shrink-0 z-10">
              {rightIcon}
            </div>
          )}
        </div>
        {helperText && (
          <span className={cn("text-[11px] font-medium font-mono mt-1", error ? "text-error" : "text-on-surface-variant/70")}>
            {helperText}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

// ─── Select Component (With Custom Hidden Native Chevron) ───────────────────
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: boolean;
  icon?: React.ReactNode;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, required, children, error, icon, helperText, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col">
        {label && (
          <Label htmlFor={selectId} required={required}>
            {label}
          </Label>
        )}
        <div className="relative flex items-center w-full">
          {icon && (
            <div className="absolute left-3.5 text-on-surface-variant pointer-events-none shrink-0 z-10">
              {icon}
            </div>
          )}
          <select
            id={selectId}
            ref={ref}
            required={required}
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
        {helperText && (
          <span className={cn("text-[11px] font-medium font-mono mt-1", error ? "text-error" : "text-on-surface-variant/70")}>
            {helperText}
          </span>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";

// ─── Textarea Component ──────────────────────────────────────────────────────
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: boolean;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, required, error, helperText, id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col">
        {label && (
          <Label htmlFor={textareaId} required={required}>
            {label}
          </Label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          required={required}
          className={cn(
            "w-full px-3.5 py-2.5 text-xs sm:text-sm font-sans bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 rounded-xl border transition-all duration-150 shadow-2xs focus-visible:outline-none resize-none",
            error
              ? "border-error focus:border-error focus:ring-2 focus:ring-error/20"
              : "border-card-border/90 focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20",
            className
          )}
          {...props}
        />
        {helperText && (
          <span className={cn("text-[11px] font-medium font-mono mt-1", error ? "text-error" : "text-on-surface-variant/70")}>
            {helperText}
          </span>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
