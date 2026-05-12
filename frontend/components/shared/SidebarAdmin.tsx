"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, Briefcase, FileText, LayoutDashboard, LogOut, Settings, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { clearTokens } from "@/lib/auth";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Roles", href: "/admin/roles", icon: Briefcase },
  { label: "Workers", href: "/admin/workers", icon: Users },
  { label: "Fraud Signals", href: "/admin/fraud-signals", icon: AlertTriangle },
  { label: "Payroll", href: "/admin/payroll", icon: FileText },
  { label: "Settings", href: "/admin/setup", icon: Settings },
];

export function SidebarAdmin({ unreviewedCount = 0 }: { unreviewedCount?: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const adminName = `${String(user?.first_name || "Company")} ${String(user?.last_name || "Admin")}`.trim();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-border bg-white p-5 md:flex md:flex-col">
      <Link href="/admin/dashboard" className="flex items-center gap-3 text-xl font-bold text-brand-dark">
        <ShieldCheck className="h-7 w-7" /> GhostGuard
      </Link>
      <div className="mt-6 rounded-lg bg-[#E1F5EE] p-3 text-sm">
        <p className="font-semibold">{adminName}</p>
        <span className="mt-2 inline-flex rounded-full bg-white px-2 py-1 text-xs font-bold text-brand-dark">Admin</span>
        <p className="mt-2 text-xs text-ink-secondary">{String(user?.company_name || "Company workspace")}</p>
      </div>
      <nav className="mt-6 space-y-1">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 rounded-md border-l-4 border-transparent px-3 py-3 text-sm font-medium text-ink-secondary hover:bg-gray-50", active && "border-[#1D9E75] bg-[#E1F5EE] font-semibold text-[#085041]")}>
              <Icon className="h-4 w-4" /> <span className="flex-1">{item.label}</span>
              {item.href.includes("fraud") && unreviewedCount > 0 && <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">{unreviewedCount}</span>}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={() => {
          clearTokens();
          router.push("/admin/login");
        }}
        className="mt-auto flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold text-danger hover:bg-red-50"
      >
        <LogOut className="h-4 w-4" /> Logout
      </button>
    </aside>
  );
}
