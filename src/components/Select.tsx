import React, { forwardRef } from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { label: string; value: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = "", ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <div className="relative">
          <select
            ref={ref}
            className={`w-full px-3 py-2.5 border rounded-lg outline-none transition-all duration-200 text-sm bg-white appearance-none ${
              error
                ? "border-red-500 focus:ring-2 focus:ring-red-100"
                : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
            } ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {/* Custom Arrow Icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </div>
        </div>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";