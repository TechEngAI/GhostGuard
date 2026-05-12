"use client";

import { ReactNode } from "react";
import { SidebarAdmin } from "@/components/shared/SidebarAdmin";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background md:pl-60">
      <SidebarAdmin />
      <div>{children}</div>
    </div>
  );
}
