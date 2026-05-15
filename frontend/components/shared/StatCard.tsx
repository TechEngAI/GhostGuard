"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CountUpNumber } from "./CountUpNumber";

const colors = {
  teal: "from-emerald-500/10 to-emerald-500/5 text-emerald-600 border-emerald-500/20 dark:from-emerald-500/5 dark:to-transparent dark:border-emerald-500/30",
  purple: "from-violet-500/10 to-violet-500/5 text-violet-600 border-violet-500/20 dark:from-violet-500/5 dark:to-transparent dark:border-violet-500/30",
  amber: "from-amber-500/10 to-amber-500/5 text-amber-600 border-amber-500/20 dark:from-amber-500/5 dark:to-transparent dark:border-amber-500/30",
  red: "from-red-500/10 to-red-500/5 text-red-600 border-red-500/20 dark:from-red-500/5 dark:to-transparent dark:border-red-500/30",
  gray: "from-slate-500/10 to-slate-500/5 text-slate-600 border-slate-500/20 dark:from-slate-500/5 dark:to-transparent dark:border-slate-500/30",
};

export function StatCard({ label, value, icon: Icon, color = "teal", prefix = "", suffix = "" }: { label: string; value: string | number; icon: LucideIcon; color?: keyof typeof colors; prefix?: string; suffix?: string }) {
  const numericValue = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.]/g, "")) || 0;
  const isNumeric = typeof value === "number" || !isNaN(numericValue);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className={cn(
        "relative overflow-hidden rounded-[32px] border-2 bg-gradient-to-br p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-brand/5 dark:bg-slate-900/50",
        colors[color]
      )}
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-slate-800 transition-transform duration-500 hover:rotate-12">
          <Icon className="h-7 w-7" />
        </div>
      </div>
      
      <div className="flex flex-col relative z-10">
        <span className="text-4xl font-black tracking-tight text-ink dark:text-white">
          {isNumeric ? (
            <CountUpNumber value={numericValue} prefix={prefix} suffix={suffix} />
          ) : (
            value
          )}
        </span>
        <span className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-ink-tertiary dark:text-gray-500">
          {label}
        </span>
      </div>
      
      {/* Decorative background element */}
      <div className="absolute -right-4 -bottom-4 h-32 w-32 rounded-full bg-current opacity-[0.04] blur-3xl" />
    </motion.div>
  );
}
