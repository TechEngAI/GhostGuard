"use client";

import { AlertTriangle, BarChart3, Briefcase, FileText, LayoutDashboard, Settings, UserCog, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import SidebarBase from "./SidebarBase";

const nav = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Roles", href: "/admin/roles", icon: Briefcase },
  { label: "Workers", href: "/admin/workers", icon: Users },
  { label: "HR Officers", href: "/admin/hr", icon: UserCog },
  { label: "Fraud Signals", href: "/admin/fraud-signals", icon: AlertTriangle },
  { label: "Payroll", href: "/admin/payroll", icon: FileText },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function SidebarAdmin({ unreviewedCount = 0 }: { unreviewedCount?: number }) {
  const { user } = useAuth();
  const adminName = `${String(user?.first_name || "Company")} ${String(user?.last_name || "Admin")}`.trim();

  const navWithBadges = nav.map(item => ({
    ...item,
    badge: item.href.includes("fraud") ? unreviewedCount : undefined
  }));

  return (
    <SidebarBase
      portal="admin"
      userName={adminName}
      userRole="Administrator"
      companyName={String(user?.company_name || "Company workspace")}
      navItems={navWithBadges}
      logoutPath="/admin/login"
    />
  );
}
