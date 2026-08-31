import React from "react";
import { CheckCircle2, User, Store, Briefcase, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoleCardProps {
  isSelected: boolean;
  onClick: () => void;
  title: string;
  description: string;
  iconName?: string;
  icon?: React.ReactNode;
}

export function RoleCard({
  isSelected,
  onClick,
  title,
  description,
  iconName,
  icon,
}: RoleCardProps) {
  const renderIcon = () => {
    if (icon) return icon;
    if (iconName === "engineering" || iconName === "school" || iconName === "worker" || iconName === "work") {
      return <Briefcase className="w-4 h-4" />;
    }
    if (iconName === "storefront" || iconName === "requester" || iconName === "add_task") {
      return <PlusCircle className="w-4 h-4" />;
    }
    return <User className="w-4 h-4" />;
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative text-left p-3.5 rounded-xl border flex flex-col justify-between gap-2 cursor-pointer",
        "transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        isSelected
          ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/20"
          : "bg-surface-container-lowest border-card-border hover:border-outline-variant hover:bg-surface-container-low"
      )}
    >
      <div className="flex justify-between items-center w-full">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0",
            isSelected
              ? "bg-primary text-on-primary shadow-xs"
              : "bg-surface-container-low text-on-surface-variant border border-card-border"
          )}
        >
          {renderIcon()}
        </div>
        <div
          className={cn(
            "w-4.5 h-4.5 rounded-full flex items-center justify-center transition-all",
            isSelected ? "text-primary opacity-100 scale-100" : "opacity-0 scale-75"
          )}
        >
          <CheckCircle2 className="w-4 h-4" />
        </div>
      </div>

      <div>
        <span
          className={cn(
            "font-headline text-xs sm:text-sm font-bold block mb-0.5",
            isSelected ? "text-primary" : "text-on-surface"
          )}
        >
          {title}
        </span>
        <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
          {description}
        </p>
      </div>
    </button>
  );
}
