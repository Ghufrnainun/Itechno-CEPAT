import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "lime";
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = "primary",
  fullWidth = false,
  className = "",
  ...props
}: ButtonProps) {
  let baseStyle = "font-label-md text-label-md font-bold px-md py-sm rounded transition-all duration-150 active:scale-95 flex items-center justify-center gap-sm cursor-pointer ";
  
  if (fullWidth) {
    baseStyle += "w-full ";
  }

  switch (variant) {
    case "primary":
      baseStyle += "bg-primary-container text-on-primary hover:bg-primary-container/90";
      break;
    case "secondary":
      baseStyle += "bg-white border-2 border-primary-container text-primary-container hover:bg-surface-container";
      break;
    case "lime":
      baseStyle += "bg-secondary-container text-on-secondary-container hover:bg-secondary-container/90";
      break;
    case "ghost":
      baseStyle += "text-primary hover:bg-surface-container-low";
      break;
  }

  return (
    <button className={`${baseStyle} ${className}`} {...props}>
      {children}
    </button>
  );
}
