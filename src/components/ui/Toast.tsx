"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ToastContextType {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <AnimatePresence>
        {toast && (
          <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:bottom-8 z-[9999] flex justify-center pointer-events-none px-4">
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto bg-neutral-900/95 text-white dark:bg-neutral-100 dark:text-neutral-900 backdrop-blur-md px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl font-sans text-xs sm:text-sm font-semibold shadow-2xl flex items-center gap-2.5 max-w-[calc(100vw-2rem)] border border-white/10"
              role="status"
              aria-live="polite"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
              <span className="truncate">{toast}</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: (message: string) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Toast Fallback]:', message);
        }
      },
    };
  }
  return context;
}
