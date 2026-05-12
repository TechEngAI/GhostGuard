"use client";

import { ReactNode } from "react";
import { SidebarWorker } from "@/components/shared/SidebarWorker";

export default function WorkerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background md:pl-60">
      <SidebarWorker />
      {children}
    </div>
  );
}
