"use client";

import { motion } from "framer-motion";
import { CountUpNumber } from "@/components/shared/CountUpNumber";
import { ShieldCheck, Users, TrendingDown, Building2 } from "lucide-react";

const stats = [
  { label: "Workers Verified", value: 45000, prefix: "", suffix: "+", icon: Users, color: "text-blue-500 bg-blue-500/10" },
  { label: "Fraud Prevented", value: 450, prefix: "₦", suffix: "M+", icon: TrendingDown, color: "text-emerald-500 bg-emerald-500/10" },
  { label: "Organisations", value: 120, prefix: "", suffix: "+", icon: Building2, color: "text-amber-500 bg-amber-500/10" },
  { label: "Uptime", value: 99.9, prefix: "", suffix: "%", icon: ShieldCheck, color: "text-brand bg-brand/10" },
];

const logos = [
  "Ministry of Health", "Leadway Assurance", "UBA Group", "Zinox", "MainOne", "Interswitch"
];

export function SocialProofSection() {
  return (
    <section className="bg-white dark:bg-slate-950 py-24 border-y border-border dark:border-slate-800 transition-colors duration-500">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 mb-20">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center text-center"
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="text-3xl font-black text-ink dark:text-white mb-1">
                <CountUpNumber value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
              </p>
              <p className="text-xs font-black uppercase tracking-widest text-ink-tertiary dark:text-gray-500">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col items-center">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-ink-tertiary dark:text-gray-600 mb-10">
            Trusted by Powering Payroll for
          </p>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-8 grayscale opacity-50 dark:invert dark:opacity-30">
            {logos.map((logo) => (
              <span key={logo} className="text-xl font-black tracking-tighter text-ink italic">
                {logo}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
