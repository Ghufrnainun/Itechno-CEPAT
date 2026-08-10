'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative flex flex-col gap-1.5 ${className}`} ref={dropdownRef}>
      {label && (
        <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 px-3 py-2 text-xs font-sans font-semibold bg-[#F8FAFC] text-[#0C1F16] border border-[#E2E8F0] rounded-lg hover:border-[#0F766E]/40 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 transition-all cursor-pointer shadow-2xs"
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption?.icon}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#64748B] transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-[#0F766E]' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-[#E2E8F0] rounded-xl shadow-lg py-1 overflow-hidden animate-fadeIn font-sans text-xs">
          <div className="max-h-60 overflow-y-auto divide-y divide-[#F1F5F9]">
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-left font-medium transition-colors ${
                    isSelected
                      ? 'bg-[#E6F4F1] text-[#0F766E] font-bold'
                      : 'text-[#0C1F16] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    {option.icon}
                    {option.label}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
