import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "lime" | "outline";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  icon,
  className = "",
  ...props
}: ButtonProps) {
  let baseStyle =
    "group relative inline-flex items-center justify-center font-sans font-bold rounded transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer shadow-xs overflow-hidden ";

  if (fullWidth) {
    baseStyle += "w-full ";
  }

  // Size variations (WCAG 44px touch target)
  switch (size) {
    case "sm":
      baseStyle += "text-xs px-3.5 py-1.5 min-h-[36px] gap-1.5 ";
      break;
    case "lg":
      baseStyle += "text-base px-6 py-3 min-h-[48px] gap-2.5 ";
      break;
    case "md":
    default:
      baseStyle += "text-sm px-5 py-2.5 min-h-[44px] gap-2 ";
      break;
  }

  // Variant styling (docs/design.md)
  switch (variant) {
    case "primary":
      baseStyle +=
        "bg-primary text-on-primary hover:bg-primary-container ";
      break;
    case "secondary":
      baseStyle +=
        "bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container-low ";
      break;
    case "lime":
      baseStyle +=
        "bg-secondary-container text-on-secondary-container hover:brightness-95 border border-outline-variant/40 ";
      break;
    case "outline":
      baseStyle +=
        "bg-transparent border-2 border-primary text-primary hover:bg-primary/10 ";
      break;
    case "ghost":
      baseStyle +=
        "bg-transparent text-primary hover:bg-surface-container-low shadow-none ";
      break;
  }

  return (
    <button className={`${baseStyle} ${className}`} {...props}>
      {children}
      {icon && <span className="inline-flex items-center justify-center shrink-0">{icon}</span>}
    </button>
  );
}
