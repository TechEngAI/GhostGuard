"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, CreditCard, LayoutDashboard, LogOut, ShieldCheck, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { clearTokens } from "@/lib/auth";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Check-In", href: "/worker/dashboard", icon: LayoutDashboard },
  { label: "History", href: "/worker/attendance", icon: Calendar },
  { label: "Profile", href: "/worker/profile", icon: User },
  { label: "Bank Account", href: "/worker/bank", icon: CreditCard },
];

export function SidebarWorker() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-border bg-white p-5 md:flex md:flex-col">
      <Link href="/worker/dashboard" className="flex items-center gap-3 text-xl font-bold text-brand-dark">
        <ShieldCheck className="h-7 w-7" /> GhostGuard
      </Link>
      <nav className="mt-8 space-y-1">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 rounded-md border-l-4 border-transparent px-3 py-3 text-sm font-medium text-ink-secondary hover:bg-gray-50", active && "border-[#1D9E75] bg-[#E1F5EE] font-semibold text-[#085041]")}>
              <Icon className="h-4 w-4" /> {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-lg bg-gray-50 p-3 text-sm">
        <p className="font-semibold">{String(user?.first_name || "Worker")} {String(user?.last_name || "")}</p>
        <p className="text-xs text-ink-secondary">{String((user?.roles as any)?.role_name || "Worker")}</p>
        <button onClick={() => { clearTokens(); router.push("/worker/login"); }} className="mt-3 flex items-center gap-2 text-sm font-semibold text-danger">
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </aside>
  );
}
