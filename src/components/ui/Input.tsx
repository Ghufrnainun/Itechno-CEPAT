"use client";

import React, { forwardRef, useState, useRef, useEffect, useMemo, useCallback } from "react";
import { ChevronDown, Check } from "lucide-react";
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
    const helperId = helperText && inputId ? `${inputId}-helper` : undefined;

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
            aria-describedby={helperId}
            aria-invalid={error ? true : undefined}
            className={cn(
              "w-full px-3.5 py-2.5 text-base sm:text-sm font-sans bg-transparent text-on-surface placeholder:text-on-surface-variant/40 rounded-xl border transition-all duration-150 shadow-2xs focus-visible:outline-none min-h-[44px]",
              type === "number" && "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
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
          <span id={helperId} className={cn("text-[11px] font-medium font-mono mt-1", error ? "text-error" : "text-on-surface-variant/70")}>
            {helperText}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

// ─── Select Component (Custom Accessible Dropdown) ───────────────────────────
export interface SelectOptionItem {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
  label?: string;
  required?: boolean;
  error?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  helperText?: string;
  placeholder?: string;
  className?: string;
  options?: SelectOptionItem[];
  children?: React.ReactNode;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      className,
      label,
      required,
      children,
      options,
      value,
      defaultValue,
      onChange,
      error,
      disabled,
      icon,
      helperText,
      placeholder,
      id,
      name,
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const [isOpen, setIsOpen] = useState(false);
    const [internalValue, setInternalValue] = useState<string>(value || defaultValue || '');
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    const currentValue = value !== undefined ? value : internalValue;

    // Extract options from either options prop or option children
    const extractedOptions: SelectOptionItem[] = useMemo(() => {
      if (options && options.length > 0) return options;
      const list: SelectOptionItem[] = [];
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child)) {
          const childProps = child.props as any;
          list.push({
            value: childProps.value !== undefined ? String(childProps.value) : String(childProps.children || ''),
            label: String(childProps.children || childProps.value || ''),
            disabled: Boolean(childProps.disabled),
          });
        }
      });
      return list;
    }, [options, children]);

    const selectedIndex = extractedOptions.findIndex((opt) => opt.value === currentValue);
    const selectedOption = extractedOptions[selectedIndex];

    useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value);
      }
    }, [value]);

    useEffect(() => {
      if (isOpen) {
        setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
      }
    }, [isOpen, selectedIndex]);

    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = useCallback(
      (val: string) => {
        setInternalValue(val);
        setIsOpen(false);
        if (onChange) {
          onChange({ target: { value: val, name } });
        }
        triggerRef.current?.focus();
      },
      [onChange, name]
    );

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          extractedOptions.length === 0 ? 0 : (prev + 1) % extractedOptions.length
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          extractedOptions.length === 0
            ? 0
            : (prev - 1 + extractedOptions.length) % extractedOptions.length
        );
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (
          highlightedIndex >= 0 &&
          highlightedIndex < extractedOptions.length &&
          !extractedOptions[highlightedIndex].disabled
        ) {
          handleSelect(extractedOptions[highlightedIndex].value);
        }
      } else if (e.key === 'Tab') {
        setIsOpen(false);
      }
    };

    const helperId = helperText && selectId ? `${selectId}-helper` : undefined;

    return (
      <div className="w-full flex flex-col relative" ref={dropdownRef} onKeyDown={handleKeyDown}>
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

          <button
            id={selectId}
            ref={(node) => {
              (triggerRef as any).current = node;
              if (typeof ref === 'function') ref(node);
              else if (ref) (ref as any).current = node;
            }}
            type="button"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-describedby={helperId}
            disabled={disabled}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className={cn(
              "w-full flex items-center justify-between px-3.5 py-2.5 text-base sm:text-sm font-sans bg-surface-container-low text-on-surface rounded-xl border transition-all duration-150 shadow-2xs focus-visible:outline-none cursor-pointer min-h-[44px]",
              icon && "pl-10",
              error
                ? "border-error focus:border-error focus:ring-2 focus:ring-error/20"
                : "border-card-border/90 focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 hover:border-primary/40 hover:bg-surface-container-lowest",
              isOpen && "border-primary ring-2 ring-primary/20 bg-surface-container-lowest",
              disabled && "opacity-50 cursor-not-allowed",
              className
            )}
          >
            <span className="truncate flex items-center gap-2">
              {selectedOption ? selectedOption.label : placeholder || "Pilih opsi..."}
            </span>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-on-surface-variant transition-transform duration-200 shrink-0 opacity-70",
                isOpen && "rotate-180 text-primary opacity-100"
              )}
            />
          </button>

          {/* Custom Floating Dropdown Menu */}
          {isOpen && (
            <div
              role="listbox"
              className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-surface-container-lowest border border-card-border rounded-xl shadow-xl py-1 overflow-hidden font-sans text-base sm:text-sm animate-in fade-in-50 zoom-in-95 duration-100"
            >
              <div className="max-h-60 overflow-y-auto divide-y divide-card-border/30 custom-scrollbar">
                {extractedOptions.map((opt, idx) => {
                  const isSelected = opt.value === currentValue;
                  const isHighlighted = idx === highlightedIndex;

                  return (
                    <button
                      key={opt.value + idx}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={opt.disabled}
                      onClick={() => handleSelect(opt.value)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={cn(
                        "w-full flex items-center justify-between px-3.5 py-2.5 text-left font-medium transition-colors duration-150 cursor-pointer min-h-[40px]",
                        "focus-visible:outline-none",
                        isSelected
                          ? "bg-primary/10 text-primary font-bold"
                          : isHighlighted
                          ? "bg-surface-container-low text-on-surface"
                          : "text-on-surface hover:bg-surface-container-low",
                        opt.disabled && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-primary shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {helperText && (
          <span
            id={helperId}
            className={cn(
              "text-[11px] font-medium font-mono mt-1",
              error ? "text-error" : "text-on-surface-variant/70"
            )}
          >
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
    const helperId = helperText && textareaId ? `${textareaId}-helper` : undefined;

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
          aria-describedby={helperId}
          aria-invalid={error ? true : undefined}
          className={cn(
            "w-full px-3.5 py-2.5 text-base sm:text-sm font-sans bg-transparent text-on-surface placeholder:text-on-surface-variant/40 rounded-xl border transition-all duration-150 shadow-2xs focus-visible:outline-none resize-none min-h-[96px]",
            error
              ? "border-error focus:border-error focus:ring-2 focus:ring-error/20"
              : "border-card-border/90 focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20",
            className
          )}
          {...props}
        />
        {helperText && (
          <span id={helperId} className={cn("text-[11px] font-medium font-mono mt-1", error ? "text-error" : "text-on-surface-variant/70")}>
            {helperText}
          </span>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
