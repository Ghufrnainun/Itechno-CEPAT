import React from "react";

interface RoleCardProps {
  isSelected: boolean;
  onClick: () => void;
  title: string;
  description: string;
  iconName: string;
}

export function RoleCard({
  isSelected,
  onClick,
  title,
  description,
  iconName,
}: RoleCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-md rounded border flex flex-col gap-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-container focus:ring-offset-1 transition-all duration-150 ${isSelected ? "role-card-selected" : "role-card-unselected"}`}
    >
      <div className="flex justify-between items-center w-full mb-xs">
        <span
          className={`material-symbols-outlined ${isSelected ? "text-primary-container" : "text-on-surface-variant"}`}
          style={{ fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0" }}
        >
          {iconName}
        </span>
        <span
          className={`material-symbols-outlined text-[18px] ${isSelected ? "text-primary-container" : "text-transparent"}`}
        >
          check_circle
        </span>
      </div>
      <span className={`font-body-md text-body-md font-semibold ${isSelected ? "text-primary" : "text-on-surface"}`}>
        {title}
      </span>
      <span className="font-body-sm text-body-sm text-on-surface-variant">
        {description}
      </span>
    </button>
  );
}
