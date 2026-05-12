"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-brand hover:bg-brand-dark text-white",
  secondary: "border border-border hover:bg-background text-gray-700",
  danger: "bg-danger hover:bg-red-900 text-white",
  ghost: "hover:bg-brand-light text-brand-dark",
};

export function Button({ children, variant = "primary", isLoading, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; isLoading?: boolean; children: ReactNode }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
