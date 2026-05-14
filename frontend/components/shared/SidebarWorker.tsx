"use client";

import { Calendar, CreditCard, LayoutDashboard, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import SidebarBase from "./SidebarBase";

const nav = [
  { label: "Check-In", href: "/worker/dashboard", icon: LayoutDashboard },
  { label: "History", href: "/worker/attendance", icon: Calendar },
  { label: "Profile", href: "/worker/profile", icon: User },
  { label: "Bank Account", href: "/worker/bank", icon: CreditCard },
];

export function SidebarWorker() {
  const { user } = useAuth();
  const workerName = `${String(user?.first_name || "Worker")} ${String(user?.last_name || "")}`.trim();

  return (
    <SidebarBase
      portal="worker"
      userName={workerName}
      userRole={String((user?.roles as any)?.role_name || "Worker")}
      navItems={nav}
      logoutPath="/worker/login"
    />
  );
}
