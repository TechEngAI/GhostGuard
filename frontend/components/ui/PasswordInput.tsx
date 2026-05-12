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
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>}
      <span className="relative block">
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          className={`w-full rounded-lg border border-border px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-brand ${className}`}
          {...props}
        />
        <button type="button" onClick={() => setVisible((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary" aria-label={visible ? "Hide password" : "Show password"}>
          {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </span>
      {error && <span className="mt-1 block text-sm text-danger">{error}</span>}
    </label>
  );
});
PasswordInput.displayName = "PasswordInput";
