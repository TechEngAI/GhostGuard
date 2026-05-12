"use client";

import { InputHTMLAttributes, forwardRef } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  helper?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, helper, className = "", ...props }, ref) => (
  <label className="block">
    {label && <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>}
    <input
      ref={ref}
      className={`w-full rounded-lg border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand ${className}`}
      {...props}
    />
    {helper && !error && <span className="mt-1 block text-xs text-ink-tertiary">{helper}</span>}
    {error && <span className="mt-1 block text-sm text-danger">{error}</span>}
  </label>
));
Input.displayName = "Input";
