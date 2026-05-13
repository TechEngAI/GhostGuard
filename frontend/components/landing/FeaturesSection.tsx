"use client";

import { motion } from "framer-motion";
import { Banknote, Fingerprint, MapPinned, Plane, Search, WalletCards } from "lucide-react";
import useScrollAnimation from "@/hooks/useScrollAnimation";

export function FeaturesSection() {
  useScrollAnimation();
  const features = [
    { icon: MapPinned, title: "GPS Geofencing", body: "Workers must be physically inside the office boundary to check in. Spoofing is blocked." },
    { icon: Fingerprint, title: "Device Fingerprinting", body: "Detect multiple workers checking in from one phone using advanced hardware signals." },
    { icon: Plane, title: "Impossible Travel", body: "Catch GPS spoofing with physics. You can't be in two places at once in a single hour." },
    { icon: Banknote, title: "Bank Velocity", body: "Flag workers who rotate bank accounts to evade detection or use shared accounts." },
    { icon: Search, title: "Approval Anomaly", body: "Expose the insider handling ghost accounts through pattern matching across departments." },
    { icon: WalletCards, title: "Gross-to-Net Variance", body: "Real employees have deductions. Ghosts often receive flat cash payments with no history." },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section id="features" className="bg-white dark:bg-slate-950 py-32 overflow-hidden transition-colors duration-500">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <p className="text-sm font-black uppercase tracking-[0.2em] text-brand mb-4">Core Signals</p>
          <h2 className="text-4xl font-black tracking-tight text-ink dark:text-white sm:text-5xl">10 signals. Zero ghost workers.</h2>
        </motion.div>

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div 
                key={feature.title} 
                variants={item}
                whileHover={{ y: -6, borderColor: "#1D9E75" }}
                className="group rounded-[32px] border-2 border-border dark:border-slate-800 bg-white dark:bg-slate-900 p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-brand/5 float-card"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light dark:bg-brand/20 text-brand group-hover:scale-110 transition-transform duration-300">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-black text-ink dark:text-white">{feature.title}</h3>
                <p className="mt-4 text-sm font-medium leading-relaxed text-ink-secondary dark:text-gray-400">{feature.body}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
