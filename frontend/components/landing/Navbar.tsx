"use client";

import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, ShieldCheck, X, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useDarkMode } from "@/hooks/useDarkMode";
import { Logo } from "@/components/ui/Logo";

const navLinks = [
  { href: "#home", label: "Home" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#features", label: "Features" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const { isDark, toggleDarkMode } = useDarkMode();
  const { scrollY } = useScroll();
  
  const bgOpacity = useTransform(scrollY, [0, 50], [0, 0.95]);
  const backdropBlur = useTransform(scrollY, [0, 50], [0, 16]);
  const borderOpacity = useTransform(scrollY, [0, 50], [0, 1]);

  useEffect(() => {
    if (!loginOpen) return;
    const handler = () => setLoginOpen(false);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [loginOpen]);

  return (
    <motion.header 
      style={{ 
        backgroundColor: useTransform(bgOpacity, o => isDark ? `rgba(10, 13, 18, ${o})` : `rgba(255, 255, 255, ${o})`),
        backdropFilter: useTransform(backdropBlur, b => `blur(${b}px)`),
        borderColor: useTransform(borderOpacity, o => isDark ? `rgba(255, 255, 255, ${o * 0.05})` : `rgba(0, 0, 0, ${o * 0.05})`)
      }}
      className="sticky top-0 z-50 border-b transition-all duration-500"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/">
          <Logo withText />
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {navLinks.map((link) => (
            <a 
              key={link.href} 
              href={link.href} 
              className="text-sm font-bold text-ink-secondary hover:text-brand dark:text-gray-400 dark:hover:text-white transition-colors relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <button 
            onClick={toggleDarkMode}
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-ink dark:text-white"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setLoginOpen(!loginOpen)} 
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-ink hover:bg-brand-light dark:text-white dark:hover:bg-slate-800 transition-colors"
            >
              Portal Login <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", loginOpen && "rotate-180")} />
            </button>
            
            <AnimatePresence>
              {loginOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-56 rounded-2xl border border-border bg-white p-2 shadow-2xl dark:bg-slate-900 dark:border-slate-800"
                >
                  <Link href="/admin/login" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold hover:bg-brand-light dark:hover:bg-slate-800 text-ink dark:text-white transition-colors">
                    <span className="w-8 h-8 rounded-lg bg-admin/10 flex items-center justify-center text-admin text-lg">📊</span>
                    Admin Portal
                  </Link>
                  <Link href="/worker/login" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold hover:bg-brand-light dark:hover:bg-slate-800 text-ink dark:text-white transition-colors">
                    <span className="w-8 h-8 rounded-lg bg-worker/10 flex items-center justify-center text-worker text-lg">👷</span>
                    Worker Portal
                  </Link>
                  <Link href="/hr/login" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold hover:bg-brand-light dark:hover:bg-slate-800 text-ink dark:text-white transition-colors">
                    <span className="w-8 h-8 rounded-lg bg-hr/10 flex items-center justify-center text-hr text-lg">⚖️</span>
                    HR Portal
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Link href="/admin/register">
            <Button className="h-11 px-6 rounded-xl font-bold shadow-lg shadow-brand/20">Get Started</Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button onClick={toggleDarkMode} className="p-2 rounded-lg text-ink dark:text-white">
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            className="p-2 rounded-lg hover:bg-brand-light dark:hover:bg-slate-800 transition-colors text-ink dark:text-white" 
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border bg-white dark:bg-slate-950 dark:border-slate-800 overflow-hidden md:hidden"
          >
            <div className="p-6 space-y-6">
              <nav className="grid gap-4">
                {navLinks.map((link) => (
                  <a key={link.href} href={link.href} className="text-lg font-bold text-ink dark:text-white" onClick={() => setOpen(false)}>
                    {link.label}
                  </a>
                ))}
              </nav>
              <div className="pt-6 border-t border-border dark:border-slate-800 grid gap-4">
                <Link href="/admin/login" className="text-sm font-bold text-ink-secondary dark:text-gray-400">Admin Login</Link>
                <Link href="/worker/login" className="text-sm font-bold text-ink-secondary dark:text-gray-400">Worker Login</Link>
                <Link href="/hr/login" className="text-sm font-bold text-ink-secondary dark:text-gray-400">HR Login</Link>
                <Link href="/admin/register" onClick={() => setOpen(false)}>
                  <Button className="w-full h-12 rounded-xl font-bold">Get Started</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
