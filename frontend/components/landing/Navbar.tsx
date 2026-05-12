"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Menu, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

const navLinks = [
  { href: "#home", label: "Home" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#features", label: "Features" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-white/20 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span className="text-xl font-bold text-brand-dark">GhostGuard</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-ink-secondary hover:text-brand-dark">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <div className="relative">
            <button onClick={() => setLoginOpen((value) => !value)} className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-ink-secondary hover:bg-background">
              Login <ChevronDown className="h-4 w-4" />
            </button>
            {loginOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl border border-border bg-white p-2 shadow-soft">
                <Link className="block rounded-lg px-3 py-2 text-sm hover:bg-background" href="/admin/login">Admin Login</Link>
                <Link className="block rounded-lg px-3 py-2 text-sm hover:bg-background" href="/worker/login">Worker Login</Link>
                <Link className="block rounded-lg px-3 py-2 text-sm hover:bg-background" href="/hr/login">HR Login</Link>
              </div>
            )}
          </div>
          <Link href="/admin/register"><Button>Get Started</Button></Link>
        </div>
        <button className="md:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-white p-4 md:hidden">
          {navLinks.map((link) => <a key={link.href} href={link.href} className="block py-3 text-sm font-medium">{link.label}</a>)}
          <div className="mt-3 grid gap-2">
            <Link href="/admin/login">Admin Login</Link>
            <Link href="/worker/login">Worker Login</Link>
            <Link href="/hr/login">HR Login</Link>
            <Link href="/admin/register"><Button className="w-full">Get Started</Button></Link>
          </div>
        </div>
      )}
    </header>
  );
}
