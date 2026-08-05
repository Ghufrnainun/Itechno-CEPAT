import React, { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-md z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white border border-outline-variant rounded-xl w-full max-w-[500px] overflow-hidden flex flex-col shadow-lg animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-md py-sm border-b border-outline-variant bg-surface flex justify-between items-center">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center cursor-pointer text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-md overflow-y-auto max-h-[70vh] custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
