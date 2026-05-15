"use client";

import { motion } from "framer-motion";
import { CountUpNumber } from "@/components/shared/CountUpNumber";
import useScrollAnimation from "@/hooks/useScrollAnimation";

export function ProblemSection() {
  useScrollAnimation();
  const cards = [
    { value: 200, prefix: "NGN ", suffix: "B+", body: "Lost annually to ghost workers across Nigeria's public and private sectors", color: "border-red-500/10 bg-red-500/5 text-red-600 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20" },
    { value: 23000, prefix: "", suffix: "+", body: "Ghost workers discovered in a single state government audit (ICPC)", color: "border-amber-500/10 bg-amber-500/5 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" },
    { value: 0, prefix: "", suffix: " tools", body: "Most organisations have no automated way to detect payroll fraud", color: "border-brand/10 bg-brand/5 text-brand dark:bg-brand/10 dark:text-brand-light dark:border-brand/20" },
  ];
  return (
    <section className="py-32 bg-white dark:bg-slate-950 overflow-hidden transition-colors duration-500">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-brand mb-4">The Ghost Worker Crisis</h2>
          <p className="mx-auto mt-4 max-w-4xl text-4xl font-black tracking-tight text-ink dark:text-white sm:text-5xl leading-[1.1]">
            Ghost workers are bleeding Nigerian organisations dry.
          </p>
        </motion.div>

        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {cards.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -8 }}
              className={`rounded-[32px] border p-10 text-left transition-shadow hover:shadow-2xl ${stat.color}`}
            >
              <p className="text-5xl font-black tracking-tighter">
                <CountUpNumber value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
              </p>
              <p className="mt-6 text-sm font-bold leading-relaxed opacity-80">{stat.body}</p>
            </motion.div>
          ))}
        </div>

        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mx-auto mt-20 max-w-3xl text-lg font-medium leading-relaxed text-ink-secondary dark:text-gray-400"
        >
          Payroll fraud hides in routine: names that never show up, accounts that change too often, and attendance patterns that look too perfect. <span className="text-brand-dark dark:text-brand font-bold">GhostGuard turns those weak signals into evidence</span> before money leaves the company.
        </motion.p>
      </div>
    </section>
  );
}
