"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function WorkerLayout({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border bg-white px-6 py-4">
        <Link href="/worker/dashboard" className="flex items-center gap-2 text-xl font-bold text-brand-dark"><ShieldCheck /> GhostGuard</Link>
        <button onClick={logout} className="flex items-center gap-2 text-sm font-semibold text-danger"><LogOut className="h-4 w-4" /> Logout</button>
      </header>
      {children}
    </div>
  );
}
