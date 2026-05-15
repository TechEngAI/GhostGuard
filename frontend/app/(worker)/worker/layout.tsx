"use client";

import { ReactNode } from "react";
import { SidebarWorker } from "@/components/shared/SidebarWorker";
import { ErrorBoundaryWrapper } from "@/components/shared/ErrorBoundary";

export default function WorkerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pl-60">
      <SidebarWorker />
      <ErrorBoundaryWrapper>{children}</ErrorBoundaryWrapper>
    </div>
  );
}
