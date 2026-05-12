"use client";

import { SelectHTMLAttributes, forwardRef } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  options: Array<string | { label: string; value: string }>;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, options, className = "", ...props }, ref) => (
  <label className="block">
    {label && <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>}
    <select ref={ref} className={`w-full rounded-lg border border-border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand ${className}`} {...props}>
      <option value="">Select option</option>
      {options.map((option) => {
        const value = typeof option === "string" ? option : option.value;
        const labelText = typeof option === "string" ? option : option.label;
        return (
          <option key={value} value={value}>
            {labelText}
          </option>
        );
      })}
    </select>
    {error && <span className="mt-1 block text-sm text-danger">{error}</span>}
  </label>
));
Select.displayName = "Select";
