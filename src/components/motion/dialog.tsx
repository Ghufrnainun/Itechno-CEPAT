"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, type Transition } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DialogContextType = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

const DialogContext = createContext<DialogContextType | null>(null);

function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("Dialog components must be used within a <Dialog>");
  }
  return context;
}

const springTransition: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 28,
  mass: 0.9,
};

export interface DialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}

export function Dialog({ children, open, onOpenChange, defaultOpen = false }: DialogProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange]
  );

  return (
    <DialogContext.Provider value={{ isOpen, onOpenChange: handleOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogTrigger({
  children,
  className,
  asChild = false,
}: {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}) {
  const { onOpenChange } = useDialog();

  if (asChild && React.isValidElement(children)) {
    const childElement = children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>;
    return React.cloneElement(childElement, {
      onClick: (e: React.MouseEvent) => {
        childElement.props.onClick?.(e);
        onOpenChange(true);
      },
    });
  }

  return (
    <button
      type="button"
      onClick={() => onOpenChange(true)}
      className={cn("cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40", className)}
    >
      {children}
    </button>
  );
}

export function DialogContent({
  children,
  className,
  maxWidth = "md",
}: {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}) {
  const { isOpen, onOpenChange } = useDialog();
  const [mounted, setMounted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
        return;
      }

      if (e.key === "Tab" && contentRef.current) {
        const focusable = contentRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    },
    [onOpenChange]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  // Handle auto-focus separately so it only runs when opening
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (contentRef.current) {
          // Find first focusable element inside the dialog content
          const focusable = contentRef.current.querySelector<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusable) {
            focusable.focus();
          } else {
            contentRef.current.focus();
          }
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mounted) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    "2xl": "max-w-5xl",
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto font-sans">
          {/* Motion Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-0"
            onClick={() => onOpenChange(false)}
            aria-hidden="true"
          />

          {/* Motion Dialog Surface (Mobile Bottom Sheet / Desktop Centered Dialog) */}
          <motion.div
            ref={contentRef}
            tabIndex={-1}
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.98 }}
            transition={springTransition}
            role="dialog"
            aria-modal="true"
            className={cn(
              "relative z-10 w-full bg-surface-container-lowest border border-card-border/90 rounded-t-3xl sm:rounded-2xl border-b-0 sm:border-b shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[85vh] focus:outline-none pb-[env(safe-area-inset-bottom,0px)] sm:pb-0 animate-in",
              maxWidthClasses[maxWidth],
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Sheet Drag Handle Indicator */}
            <div className="w-12 h-1.5 bg-on-surface-variant/20 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function DialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("px-4 sm:px-6 py-3 sm:py-4.5 border-b border-card-border flex justify-between items-center shrink-0", className)}>
      <div className="flex-1 pr-3">{children}</div>
      <DialogClose />
    </div>
  );
}

export function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn("font-headline font-extrabold text-base sm:text-lg text-on-surface tracking-tight leading-snug", className)}>
      {children}
    </h3>
  );
}

export function DialogDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-xs text-on-surface-variant font-body-sm mt-0.5 leading-relaxed", className)}>
      {children}
    </p>
  );
}

export function DialogBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4", className)}>
      {children}
    </div>
  );
}

export function DialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("px-4 sm:px-6 py-3.5 sm:py-4 border-t border-card-border/80 flex items-center justify-end gap-3 shrink-0", className)}>
      {children}
    </div>
  );
}

export function DialogClose({ className }: { className?: string }) {
  const { onOpenChange } = useDialog();
  return (
    <button
      type="button"
      onClick={() => onOpenChange(false)}
      aria-label="Tutup dialog"
      className={cn(
        "min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container flex items-center justify-center cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 shrink-0",
        className
      )}
    >
      <X className="w-4.5 h-4.5" />
    </button>
  );
}
