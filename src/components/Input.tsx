import React, { forwardRef, useId } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = "", id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;

    return (
      <div className="w-full space-y-1.5">
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={`w-full px-3 py-2.5 border rounded-lg outline-none transition-all duration-200 text-sm ${
              error 
                ? "border-red-500 focus:ring-2 focus:ring-red-100" 
                : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-50 placeholder:text-gray-400"
            } ${className}`}
            {...props}
          />
          {icon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600">
              {icon}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} role="alert" className="text-xs text-red-500 mt-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
