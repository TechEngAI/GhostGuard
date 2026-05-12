"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { BarChart3, BriefcaseBusiness, LayoutDashboard, LogOut, ShieldCheck, Siren, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const nav = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Roles", href: "/admin/roles", icon: BriefcaseBusiness },
  { label: "Workers", href: "/admin/workers", icon: Users },
  { label: "Fraud Signals", href: "/admin/fraud", icon: Siren },
  { label: "Payroll", href: "/admin/payroll", icon: ShieldCheck },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen bg-background md:grid md:grid-cols-[260px_1fr]">
      <aside className="border-r border-border bg-white p-5">
        <Link href="/admin/dashboard" className="flex items-center gap-3 text-xl font-bold text-brand-dark"><ShieldCheck className="h-7 w-7" /> GhostGuard</Link>
        <div className="mt-6 rounded-lg bg-brand-light p-3 text-sm"><p className="font-semibold">Company Admin</p><p className="text-brand-dark">Admin</p></div>
        <nav className="mt-6 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            return <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-ink-secondary hover:bg-background"><Icon className="h-4 w-4" /> {item.label}</Link>;
          })}
        </nav>
        <button onClick={logout} className="mt-8 flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold text-danger"><LogOut className="h-4 w-4" /> Logout</button>
      </aside>
      <div>{children}</div>
    </div>
  );
}
