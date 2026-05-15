"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { clearTokens } from "@/lib/auth";

interface NavItem {
  label: string;
  href: string;
  icon: any;
  badge?: number;
  dot?: boolean;
}

interface SidebarBaseProps {
  portal: "admin" | "worker" | "hr";
  userName: string;
  userRole: string;
  companyName?: string;
  navItems: NavItem[];
  logoutPath: string;
}

export default function SidebarBase({
  portal,
  userName,
  userRole,
  companyName,
  navItems,
  logoutPath,
}: SidebarBaseProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`sidebar_collapsed_${portal}`);
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    }
    setIsLoaded(true);
  }, [portal]);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem(`sidebar_collapsed_${portal}`, JSON.stringify(newState));
  };

  const portalColors = {
    admin: "border-admin bg-admin/5 text-admin",
    worker: "border-worker bg-worker/5 text-worker",
    hr: "border-hr bg-hr/5 text-hr",
  };

  const portalActiveColors = {
    admin: "bg-admin text-white shadow-lg shadow-admin/20",
    worker: "bg-worker text-white shadow-lg shadow-worker/20",
    hr: "bg-hr text-white shadow-lg shadow-hr/20",
  };

  if (!isLoaded) return <aside className="w-64 hidden md:block" />;

  const navLinks = navItems.map((item) => {
    const Icon = item.icon;
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
    return { ...item, Icon, active };
  });

  return (
    <>
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 88 : 280 }}
      className="fixed inset-y-0 left-0 z-30 hidden border-r border-border bg-white md:flex md:flex-col overflow-hidden transition-colors dark:bg-slate-950 dark:border-slate-800"
    >
      {/* Header */}
      <div className="flex h-20 items-center px-6">
        <Link href={`/${portal}/dashboard`} className="flex items-center gap-3 overflow-hidden">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all",
              portalActiveColors[portal]
            )}
          >
            <ShieldCheck className="h-6 w-6" />
          </motion.div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-xl font-black tracking-tight text-brand-dark dark:text-white whitespace-nowrap"
              >
                GhostGuard
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Profile Card */}
      <div className="px-4 mb-6">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className={cn(
            "relative overflow-hidden rounded-2xl border p-4 transition-all",
            isCollapsed ? "px-2" : "px-4",
            portalColors[portal]
          )}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-white shadow-sm flex items-center justify-center font-black text-brand dark:bg-slate-800">
              {userName.charAt(0)}
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="overflow-hidden"
              >
                <p className="font-bold truncate text-ink dark:text-white">{userName}</p>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 dark:text-gray-400">
                  {userRole}
                </p>
              </motion.div>
            )}
          </div>
          {!isCollapsed && companyName && (
             <p className="mt-3 text-[11px] font-medium text-ink-tertiary dark:text-gray-500 truncate">
               {companyName}
             </p>
          )}
        </motion.div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navLinks.map((item) => {
          const Icon = item.Icon;
          const active = item.active;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all",
                active 
                  ? portalActiveColors[portal] 
                  : "text-ink-secondary hover:bg-gray-50 hover:text-ink dark:text-gray-400 dark:hover:bg-slate-900/50 dark:hover:text-white",
                isCollapsed && "justify-center px-0"
              )}
            >
              {active && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-current opacity-10 pointer-events-none"
                />
              )}
              <Icon className={cn("h-5 w-5 shrink-0 z-10", active ? "text-white" : "group-hover:scale-110 transition-transform")} />
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="truncate z-10"
                >
                  {item.label}
                </motion.span>
              )}
              {item.badge !== undefined && item.badge > 0 && (
                <span className={cn(
                  "absolute flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black z-20",
                  isCollapsed ? "top-1 right-1" : "right-4",
                  active ? "bg-white text-brand" : "bg-red-500 text-white"
                )}>
                  {item.badge}
                </span>
              )}
              {item.dot && (
                <span className={cn("absolute h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white", isCollapsed ? "right-2 top-2" : "right-4 top-3")} />
              )}
              {isCollapsed && (
                <div className="absolute left-full ml-4 hidden group-hover:block z-50">
                   <div className="rounded-lg bg-ink px-3 py-1.5 text-xs font-bold text-white shadow-xl whitespace-nowrap dark:bg-slate-800">
                     {item.label}
                   </div>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 mt-auto border-t border-border/50 dark:border-slate-800">
        <button
          onClick={toggleCollapse}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-ink-tertiary hover:bg-gray-50 transition-all dark:text-gray-500 dark:hover:bg-slate-900/50"
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5 mx-auto" /> : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span>Collapse</span>
            </>
          )}
        </button>
        <button
          onClick={() => {
            clearTokens();
            router.push(logoutPath);
          }}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-danger hover:bg-red-50 transition-all dark:hover:bg-red-950/20"
        >
          <LogOut className={cn("h-5 w-5", isCollapsed && "mx-auto")} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </motion.aside>
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-white px-2 py-2 shadow-2xl md:hidden">
      {navLinks.slice(0, 5).map((item) => {
        const Icon = item.Icon;
        return (
          <Link key={item.href} href={item.href} className={cn("relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-bold", item.active ? portalActiveColors[portal] : "text-ink-tertiary")}>
            <Icon className="h-5 w-5" />
            <span className="max-w-full truncate">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && <span className="absolute right-3 top-1 h-4 min-w-4 rounded-full bg-red-500 px-1 text-[9px] leading-4 text-white">{item.badge}</span>}
            {item.dot && <span className="absolute right-4 top-1 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />}
          </Link>
        );
      })}
    </nav>
    </>
  );
}
