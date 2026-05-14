"use client";

import { ReactNode } from "react";
import { SidebarHr } from "@/components/shared/SidebarHr";
import { ErrorBoundaryWrapper } from "@/components/shared/ErrorBoundary";

export default function HrLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pl-60">
      <SidebarHr />
      <ErrorBoundaryWrapper>{children}</ErrorBoundaryWrapper>
    </div>
  );
}
