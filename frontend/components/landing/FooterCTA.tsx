"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import useScrollAnimation from "@/hooks/useScrollAnimation";
import { Logo } from "@/components/ui/Logo";

export function FooterCTA() {
  useScrollAnimation();
  return (
    <footer className="bg-white dark:bg-[#0A0D12] px-6 py-32 text-center text-ink dark:text-white overflow-hidden relative transition-colors duration-500">
      <div className="orb w-[500px] h-[500px] bg-brand/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-[120px] opacity-20" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 max-w-4xl mx-auto"
      >
        <h2 className="text-4xl font-black tracking-tight sm:text-6xl leading-[1.1] mb-12">
          Ready to eliminate ghost workers from your payroll?
        </h2>
        
        <div className="relative inline-block">
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -inset-4 rounded-3xl bg-brand blur-xl -z-10"
          />
          <Link href="/admin/register">
            <Button className="h-16 px-12 rounded-2xl font-black text-xl shadow-2xl shadow-brand/40 group">
              Get Started for Free <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        <div className="mt-20 flex flex-wrap justify-center gap-10 text-xs font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-500">
          <Link href="/admin/login" className="hover:text-brand dark:hover:text-white transition-colors">Admin Portal</Link>
          <Link href="/worker/login" className="hover:text-brand dark:hover:text-white transition-colors">Worker Portal</Link>
          <Link href="/hr/login" className="hover:text-brand dark:hover:text-white transition-colors">HR Portal</Link>
        </div>

        <div className="mt-20 pt-10 border-t border-black/5 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <Logo withText size={32} />
          <p className="text-xs font-bold text-gray-600">
            &copy; 2024 GhostGuard Technologies. All rights reserved.
          </p>
        </div>
      </motion.div>
    </footer>
  );
}
