"use client";

import { ReactNode } from "react";

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-white p-4">{children}</div>;
}
