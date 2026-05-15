"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "default" | "outline";

const variants: Record<Variant, string> = {
  default: "bg-brand hover:bg-brand-dark text-white shadow-lg shadow-brand/20",
  primary: "bg-brand hover:bg-brand-dark text-white shadow-lg shadow-brand/20",
  secondary: "border border-border bg-white hover:bg-gray-50 text-ink dark:bg-slate-900 dark:border-slate-800 dark:text-white dark:hover:bg-slate-800",
  outline: "border border-border bg-white hover:bg-gray-50 text-ink dark:bg-slate-900 dark:border-slate-800 dark:text-white dark:hover:bg-slate-800",
  danger: "bg-danger hover:bg-red-700 text-white shadow-lg shadow-danger/20",
  ghost: "hover:bg-brand/5 text-brand dark:text-brand-light dark:hover:bg-brand/10",
};

export function Button({ 
  children, 
  variant = "primary", 
  isLoading, 
  className = "", 
  ...props 
}: ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: Variant; 
  isLoading?: boolean; 
  children: ReactNode 
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-black uppercase tracking-widest transition-all disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
      disabled={isLoading || props.disabled}
      {...(props as any)}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : null}
      <span className={cn(isLoading && "opacity-0")}>{children}</span>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
    </motion.button>
  );
}
