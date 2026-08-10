'use client';

import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onConfirm?: () => void;
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  isLoading?: boolean;
}

export default function AdminModal({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  confirmLabel = 'Simpan Perubahan',
  confirmVariant = 'primary',
  isLoading = false,
}: AdminModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0C1F16]/30 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Dialog Box */}
      <div className="relative w-full max-w-lg bg-white rounded-xl border border-[#E2E8F0] shadow-xl overflow-hidden z-10 animate-fadeIn font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <h3 className="font-headline font-bold text-base text-[#0C1F16]">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0C1F16] hover:bg-[#E2E8F0] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>

        {/* Actions */}
        {onConfirm && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#64748B] hover:text-[#0C1F16] hover:bg-[#E2E8F0] rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 text-xs font-bold text-white rounded-lg transition-colors shadow-2xs ${
                confirmVariant === 'danger'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-[#0F766E] hover:bg-[#005C55]'
              } disabled:opacity-50`}
            >
              {isLoading ? 'Memproses...' : confirmLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
