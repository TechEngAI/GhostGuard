"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-end gap-4 rounded-3xl border border-border bg-white p-8 shadow-sm transition-all", className)}>{children}</div>;
}
