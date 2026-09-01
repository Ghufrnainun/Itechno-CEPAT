"use client";

import { motion, MotionConfig, useReducedMotion, type Transition } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { EASE_OUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

type Variant = "pill" | "underline" | "segment";

type Ctx = {
  value: string;
  setValue: (v: string) => void;
  layoutId: string;
  variant: Variant;
};

const TabsCtx = createContext<Ctx | null>(null);

function useTabs() {
  const ctx = useContext(TabsCtx);
  if (!ctx) throw new Error("Tabs.* must be used inside <Tabs>");
  return ctx;
}

// Weighty spring for the active-tab indicator: a touch of overshoot so it
// settles with life instead of snapping.
const transition: Transition = {
  type: "spring",
  stiffness: 280,
  damping: 26,
  mass: 1.0,
};

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  variant = "segment",
  children,
  className,
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  variant?: Variant;
  children: ReactNode;
  className?: string;
}) {
  const [internal, setInternal] = useState(defaultValue ?? "");
  const layoutId = useId();
  const reduce = useReducedMotion();
  const controlled = value !== undefined;
  const current = controlled ? value : internal;
  const setValue = useCallback(
    (v: string) => {
      if (!controlled) setInternal(v);
      onValueChange?.(v);
    },
    [controlled, onValueChange],
  );
  const contextValue = useMemo(
    () => ({ value: current, setValue, layoutId, variant }),
    [current, layoutId, setValue, variant],
  );
  return (
    <MotionConfig transition={reduce ? { duration: 0 } : transition}>
      <TabsCtx.Provider value={contextValue}>
        {/* layoutRoot scopes projection to the Tabs wrapper */}
        <motion.div layoutRoot className={className}>
          {children}
        </motion.div>
      </TabsCtx.Provider>
    </MotionConfig>
  );
}

const listClasses: Record<Variant, string> = {
  pill: "inline-flex items-center gap-1 rounded-xl bg-surface-container-low border border-card-border p-1 max-w-full overflow-x-auto no-scrollbar shadow-xs",
  underline: "inline-flex items-center gap-2 border-b border-card-border max-w-full overflow-x-auto no-scrollbar",
  segment: "inline-flex items-center gap-1 rounded-xl bg-surface-container-low border border-card-border p-1 max-w-full overflow-x-auto no-scrollbar shadow-xs",
};

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  const { variant } = useTabs();
  return (
    <div role="tablist" className={cn(listClasses[variant], className)}>
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className,
  indicatorClassName,
}: {
  value: string;
  children: ReactNode;
  className?: string;
  indicatorClassName?: string;
}) {
  const { value: current, setValue, layoutId, variant } = useTabs();
  const active = current === value;

  if (variant === "underline") {
    return (
      <button
        type="button"
        role="tab"
        aria-selected={active}
        onClick={() => setValue(value)}
        className={cn(
          "relative isolate px-3.5 pb-2.5 pt-1.5 -mb-px text-xs font-bold transition-colors min-h-[38px] inline-flex items-center justify-center gap-2 cursor-pointer font-sans select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          "font-bold",
          active ? "text-primary" : "text-on-surface-variant hover:text-on-surface",
          className,
        )}
      >
        <span className="relative z-10 inline-flex items-center gap-1.5">{children}</span>
        {active ? (
          <motion.span
            layoutId={layoutId}
            className={cn(
              "absolute -bottom-px left-0 right-0 h-0.5 bg-primary rounded-full z-10",
              indicatorClassName,
            )}
          />
        ) : null}
      </button>
    );
  }

  const radiusClass = variant === "segment" ? "rounded-lg" : "rounded-full";

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => setValue(value)}
      className={cn(
        "relative isolate inline-flex items-center justify-center whitespace-nowrap px-4 py-2 text-xs font-bold font-sans outline-none cursor-pointer select-none transition-colors duration-150 min-h-[36px]",
        radiusClass,
        "font-bold",
        active
          ? "text-primary"
          : "text-on-surface-variant hover:text-on-surface",
        className,
      )}
    >
      {active && (
        <motion.span
          layoutId={layoutId}
          className={cn(
            "absolute inset-0 z-0 bg-surface-container-lowest border border-card-border/80 shadow-xs pointer-events-none rounded-lg",
            indicatorClassName,
          )}
        />
      )}
      <span className="relative z-10 inline-flex items-center gap-1.5">{children}</span>
    </button>
  );
}

export function TabsContent({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const { value: current } = useTabs();
  const reduce = useReducedMotion();
  const active = current === value;

  if (!active) {
    return (
      <div hidden className={className}>
        {children}
      </div>
    );
  }
  return (
    <motion.div
      key={value}
      initial={{ opacity: 0, y: reduce ? 0 : 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: EASE_OUT }}
      className={cn("mt-4", className)}
    >
      {children}
    </motion.div>
  );
}
