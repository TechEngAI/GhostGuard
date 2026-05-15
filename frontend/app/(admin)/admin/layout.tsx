"use client";

import { ReactNode } from "react";
import { SidebarAdmin } from "@/components/shared/SidebarAdmin";
import { ErrorBoundaryWrapper } from "@/components/shared/ErrorBoundary";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pl-60">
      <SidebarAdmin />
      <ErrorBoundaryWrapper>{children}</ErrorBoundaryWrapper>
    </div>
  );
}
