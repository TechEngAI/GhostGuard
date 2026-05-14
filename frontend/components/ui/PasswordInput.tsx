"use client";

import { InputHTMLAttributes, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const PasswordInput = forwardRef<HTMLInputElement, Props>(({ label, error, className = "", ...props }, ref) => {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block group">
      {label && <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-ink-tertiary dark:text-gray-400 group-focus-within:text-brand transition-colors">{label}</span>}
      <span className="relative block">
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          className={`w-full rounded-2xl border border-border bg-white px-4 py-3.5 pr-12 text-sm font-medium text-ink placeholder:text-ink-tertiary focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-white dark:placeholder:text-slate-600 ${className}`}
          {...props}
        />
        <button type="button" onClick={() => setVisible((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink dark:hover:text-white transition-colors" aria-label={visible ? "Hide password" : "Show password"}>
          {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </span>
      {error && <span className="mt-1.5 block text-xs font-bold text-danger">{error}</span>}
    </label>
  );
});
PasswordInput.displayName = "PasswordInput";
