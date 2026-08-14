"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
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

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
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
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-sans">
          {/* Motion Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-0"
            onClick={() => onOpenChange(false)}
            aria-hidden="true"
          />

          {/* Motion Dialog Surface */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={springTransition}
            role="dialog"
            aria-modal="true"
            className={cn(
              "relative z-10 w-full bg-surface-container-lowest border border-card-border/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]",
              maxWidthClasses[maxWidth],
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function DialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  const { onOpenChange } = useDialog();
  return (
    <div className={cn("px-6 py-4.5 border-b border-card-border bg-surface-container-low/50 flex justify-between items-center shrink-0", className)}>
      <div className="flex-1 pr-4">{children}</div>
      <DialogClose />
    </div>
  );
}

export function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn("font-headline font-extrabold text-base sm:text-lg text-on-surface tracking-tight", className)}>
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
    <div className={cn("p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4", className)}>
      {children}
    </div>
  );
}

export function DialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("px-6 py-4 border-t border-card-border/80 bg-surface-container-low/30 flex items-center justify-end gap-3 shrink-0", className)}>
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
        "w-9 h-9 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container flex items-center justify-center cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 shrink-0",
        className
      )}
    >
      <X className="w-4.5 h-4.5" />
    </button>
  );
}
