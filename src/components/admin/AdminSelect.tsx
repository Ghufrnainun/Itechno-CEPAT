'use client';

import { useState, useRef, useEffect, useId, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface AdminSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}

export default function AdminSelect({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  className = '',
  label,
}: AdminSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const listboxId = useId();

  const selectedIndex = options.findIndex((opt) => opt.value === value);
  const selectedOption = options[selectedIndex];

  // Sync highlightedIndex when opening
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
      onChange(val);
      setIsOpen(false);
      triggerRef.current?.focus();
    },
    [onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
      setHighlightedIndex((prev) => (options.length === 0 ? 0 : (prev + 1) % options.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        options.length === 0 ? 0 : (prev - 1 + options.length) % options.length
      );
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < options.length) {
        handleSelect(options[highlightedIndex].value);
      }
    } else if (e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  return (
    <div
      className={cn("relative flex flex-col gap-1.5", className)}
      ref={dropdownRef}
      onKeyDown={handleKeyDown}
    >
      {label && (
        <label id={labelId} className="font-sans text-[11px] font-bold uppercase tracking-wider text-on-surface-variant select-none">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-labelledby={label ? labelId : undefined}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-activedescendant={
          isOpen && highlightedIndex >= 0 ? `${listboxId}-opt-${highlightedIndex}` : undefined
        }
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 px-3.5 py-2.5 min-h-[42px] text-xs font-sans font-semibold bg-surface-container-low text-on-surface border border-card-border rounded-xl hover:border-primary/40 hover:bg-surface-container-lowest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 transition-all duration-150 cursor-pointer shadow-2xs"
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption?.icon}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-on-surface-variant transition-transform duration-200 shrink-0",
            isOpen && "rotate-180 text-primary"
          )}
        />
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div
          id={listboxId}
          ref={listboxRef}
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1 z-50 bg-surface-container-lowest border border-card-border rounded-xl shadow-lg py-1 overflow-hidden font-sans text-xs"
        >
          <div className="max-h-60 overflow-y-auto divide-y divide-card-border/40 custom-scrollbar">
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isHighlighted = index === highlightedIndex;

              return (
                <button
                  id={`${listboxId}-opt-${index}`}
                  key={option.value}
                  type="button"
                  role="option"
                  tabIndex={-1}
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    "w-full flex items-center justify-between px-3.5 py-2.5 text-left font-medium transition-colors duration-150 cursor-pointer",
                    "focus-visible:outline-none",
                    isSelected
                      ? "bg-primary/10 text-primary font-bold"
                      : isHighlighted
                      ? "bg-surface-container-low text-on-surface"
                      : "text-on-surface hover:bg-surface-container-low"
                  )}
                >
                  <span className="flex items-center gap-2 truncate">
                    {option.icon}
                    {option.label}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

