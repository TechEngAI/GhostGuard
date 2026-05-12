"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileText, HeartHandshake, LayoutDashboard, LogOut, Receipt } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { clearTokens } from "@/lib/auth";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Dashboard", href: "/hr/dashboard", icon: LayoutDashboard },
  { label: "Payroll", href: "/hr/payroll", icon: FileText },
  { label: "Receipts", href: "/hr/payroll", icon: Receipt },
];

export function SidebarHr() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-border bg-white p-5 md:flex md:flex-col">
      <Link href="/hr/dashboard" className="flex items-center gap-3 text-xl font-bold text-[#534AB7]">
        <HeartHandshake className="h-7 w-7" /> GhostGuard HR
      </Link>
      <div className="mt-6 rounded-lg bg-violet-50 p-3 text-sm">
        <p className="font-semibold">{String(user?.first_name || "HR")} {String(user?.last_name || "Officer")}</p>
        <span className="mt-2 inline-flex rounded-full bg-white px-2 py-1 text-xs font-bold text-[#534AB7]">HR Officer</span>
        <p className="mt-2 text-xs text-ink-secondary">{String(user?.company_name || "Company workspace")}</p>
      </div>
      <nav className="mt-6 space-y-1">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={`${item.href}-${item.label}`} href={item.href} className={cn("flex items-center gap-3 rounded-md border-l-4 border-transparent px-3 py-3 text-sm font-medium text-ink-secondary hover:bg-gray-50", active && "border-[#534AB7] bg-violet-50 font-semibold text-[#534AB7]")}>
              <Icon className="h-4 w-4" /> {item.label}
            </Link>
          );
        })}
      </nav>
      <button onClick={() => { clearTokens(); router.push("/hr/login"); }} className="mt-auto flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold text-danger hover:bg-red-50">
        <LogOut className="h-4 w-4" /> Logout
      </button>
    </aside>
  );
}
