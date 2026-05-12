"use client";

import { ReactNode } from "react";
import { SidebarHr } from "@/components/shared/SidebarHr";

export default function HrLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background md:pl-60">
      <SidebarHr />
      {children}
    </div>
  );
}
