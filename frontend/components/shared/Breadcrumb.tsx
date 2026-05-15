"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { usePathname } from "next/navigation";

export function Breadcrumb() {
  const pathname = usePathname();
  
  if (pathname === "/") return null;

  const paths = pathname.split("/").filter(Boolean);

  return (
    <nav className="flex items-center gap-2 text-sm font-bold mb-8 overflow-x-auto no-scrollbar py-2">
      <Link 
        href="/"
        className="flex items-center gap-1.5 text-ink-tertiary dark:text-gray-500 hover:text-brand dark:hover:text-white transition-colors"
      >
        <Home className="h-4 w-4" />
        <span className="hidden sm:inline">Home</span>
      </Link>

      {paths.map((path, i) => {
        const href = `/${paths.slice(0, i + 1).join("/")}`;
        const isLast = i === paths.length - 1;
        const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");

        return (
          <div key={path} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-ink-tertiary dark:text-gray-600 shrink-0" />
            {isLast ? (
              <span className="text-ink dark:text-white whitespace-nowrap">{label}</span>
            ) : (
              <Link 
                href={href}
                className="text-ink-tertiary dark:text-gray-500 hover:text-brand dark:hover:text-white transition-colors whitespace-nowrap"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
