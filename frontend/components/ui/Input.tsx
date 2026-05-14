"use client";

import { InputHTMLAttributes, forwardRef } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  helper?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, helper, className = "", ...props }, ref) => (
  <label className="block group">
    {label && <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-ink-tertiary dark:text-gray-400 group-focus-within:text-brand transition-colors">{label}</span>}
    <input
      ref={ref}
      className={`w-full rounded-2xl border border-border bg-white px-4 py-3.5 text-sm font-medium text-ink placeholder:text-ink-tertiary focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-white dark:placeholder:text-slate-600 ${className}`}
      {...props}
    />
    {helper && !error && <span className="mt-1.5 block text-xs font-medium text-ink-tertiary dark:text-gray-500">{helper}</span>}
    {error && <span className="mt-1.5 block text-xs font-bold text-danger">{error}</span>}
  </label>
));
Input.displayName = "Input";
