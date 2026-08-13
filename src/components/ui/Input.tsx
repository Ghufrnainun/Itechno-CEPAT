import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-xs w-full h-full">
      {label && (
        <label className="font-body-sm text-body-sm text-on-surface-variant font-medium flex-1 flex flex-col justify-end">
          {label}
        </label>
      )}
      <input
        className={`input-field font-body-md ${error ? "border-error focus:border-error focus:ring-1 focus:ring-error" : ""} ${className}`}
        {...props}
      />
      {error && (
        <span className="font-label-sm text-label-sm text-error">
          {error}
        </span>
      )}
    </div>
  );
}
