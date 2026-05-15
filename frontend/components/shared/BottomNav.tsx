"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface BottomNavProps {
  items: NavItem[];
}

export default function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border px-4 py-2 flex justify-around items-center z-50 pb-safe">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;

        return (
          <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 min-w-[64px] relative py-1">
            <div className={cn("p-1.5 rounded-xl transition-colors", isActive ? "text-brand" : "text-ink-tertiary")}>
              <Icon size={22} />
            </div>
            <span className={cn("text-[10px] font-medium", isActive ? "text-brand" : "text-ink-tertiary")}>{item.label}</span>
            {isActive && (
              <motion.div
                layoutId="bottom-nav-indicator"
                className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand rounded-full"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
