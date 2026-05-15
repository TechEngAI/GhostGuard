"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    name: "Chioma Okafor",
    company: "Ministry of Finance",
    role: "Finance Director",
    quote: "GhostGuard saved us over ₦50M in the first quarter alone. The GPS verification is a game-changer for our remote offices.",
    avatar: "CO",
    rating: 5
  },
  {
    name: "Tunde Bello",
    company: "Leadway Assurance",
    role: "HR Operations",
    quote: "The bank account velocity check exposed 14 ghost accounts that had been active for years. Incredible ROI.",
    avatar: "TB",
    rating: 5
  },
  {
    name: "Fatima Yusuf",
    company: "Zinox Group",
    role: "Internal Auditor",
    quote: "We finally have a way to verify attendance that can't be spoofed. The transparency has improved employee morale.",
    avatar: "FY",
    rating: 5
  }
];

export function TestimonialsSection() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <section className="bg-[#F8F7F2] dark:bg-slate-900 py-32 overflow-hidden transition-colors duration-500">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-20">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-brand mb-4">Success Stories</h2>
          <p className="text-4xl font-black tracking-tight text-ink dark:text-white sm:text-5xl">
            Trusted by Nigeria's leading organisations.
          </p>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mx-auto grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3"
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              variants={item}
              whileHover={{ y: -8 }}
              className="flex flex-col justify-between rounded-[32px] bg-white dark:bg-slate-800 p-10 shadow-soft border border-border dark:border-slate-700 transition-all duration-300"
            >
              <div className="relative">
                <Quote className="absolute -top-4 -left-4 h-12 w-12 text-brand/10 dark:text-brand/5" />
                <div className="flex gap-1 mb-6">
                  {[...Array(t.rating)].map((_, i) => (
                    <span key={i} className="text-amber-400">★</span>
                  ))}
                </div>
                <p className="text-lg font-medium leading-relaxed text-ink dark:text-gray-300 italic">
                  "{t.quote}"
                </p>
              </div>
              <div className="mt-10 flex items-center gap-4 border-t border-border dark:border-slate-700 pt-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand font-black">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-bold text-ink dark:text-white">{t.name}</p>
                  <p className="text-xs font-semibold text-ink-tertiary dark:text-gray-500">{t.role} @ {t.company}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
