import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "lime" | "outline" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      fullWidth = false,
      icon,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyle =
      "group relative inline-flex items-center justify-center font-sans font-semibold rounded-xl " +
      "transition-[background-color,color,border-color,transform,box-shadow] duration-150 ease-out " +
      "active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 " +
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:active:scale-100 " +
      "cursor-pointer select-none overflow-hidden ";

    let sizeStyle = "";
    switch (size) {
      case "sm":
        sizeStyle = "text-xs px-3 py-1.5 min-h-[44px] md:min-h-[36px] gap-1.5 rounded-lg";
        break;
      case "lg":
        sizeStyle = "text-base px-6 py-3 min-h-[48px] gap-2.5 rounded-xl";
        break;
      case "icon":
        sizeStyle = "w-10 h-10 p-0 min-h-[40px] min-w-[40px] shrink-0 rounded-xl";
        break;
      case "md":
      default:
        sizeStyle = "text-sm px-4 py-2.5 min-h-[42px] gap-2 rounded-xl";
        break;
    }

    let variantStyle = "";
    switch (variant) {
      case "primary":
        variantStyle =
          "bg-primary text-on-primary hover:bg-primary-container shadow-xs";
        break;
      case "secondary":
        variantStyle =
          "bg-surface-container-lowest border border-card-border text-on-surface hover:bg-surface-container-low hover:border-outline-variant shadow-xs";
        break;
      case "lime":
        variantStyle =
          "bg-secondary-container text-on-secondary-container hover:brightness-95 border border-outline-variant/30 shadow-xs";
        break;
      case "outline":
        variantStyle =
          "bg-transparent border border-primary text-primary hover:bg-interaction-bg";
        break;
      case "destructive":
        variantStyle =
          "bg-error text-on-error hover:opacity-90 shadow-xs";
        break;
      case "ghost":
        variantStyle =
          "bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low shadow-none";
        break;
    }

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          baseStyle,
          sizeStyle,
          variantStyle,
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {icon && (
          <span className="inline-flex items-center justify-center shrink-0">
            {icon}
          </span>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
