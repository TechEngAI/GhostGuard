"use client";

import { motion } from "framer-motion";
import { Send, Bell, Shield } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setTimeout(() => {
      setStatus('success');
      setEmail("");
    }, 1500);
  };

  return (
    <section className="bg-white dark:bg-slate-950 py-32 transition-colors duration-500 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="relative rounded-[48px] bg-ink dark:bg-slate-900 px-8 py-20 text-center overflow-hidden">
          {/* Decorative background orbs */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-brand/10 blur-[100px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand/5 blur-[120px] translate-x-1/3 translate-y-1/3" />
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/20 text-brand mb-8"
            >
              <Bell className="h-8 w-8" />
            </motion.div>

            <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl mb-6">
              Stay ahead of the ghosts.
            </h2>
            <p className="text-lg font-medium text-gray-400 mb-12">
              Join 5,000+ HR leaders receiving our weekly brief on payroll fraud trends and security best practices in the Nigerian market.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your work email"
                className="flex-1 h-14 rounded-2xl bg-white/5 border border-white/10 px-6 text-white placeholder:text-gray-500 focus:outline-none focus:border-brand transition-colors"
                disabled={status === 'success'}
              />
              <Button 
                type="submit" 
                className="h-14 px-8 rounded-2xl font-black text-lg shadow-xl shadow-brand/20 whitespace-nowrap"
                disabled={status !== 'idle'}
              >
                {status === 'loading' ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                    <Send className="h-5 w-5" />
                  </motion.div>
                ) : status === 'success' ? (
                  "Subscribed!"
                ) : (
                  "Join Brief"
                )}
              </Button>
            </form>

            {status === 'success' && (
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 text-brand font-bold"
              >
                Welcome to the inner circle. Check your inbox!
              </motion.p>
            )}

            <div className="mt-12 flex items-center justify-center gap-6 text-xs font-bold uppercase tracking-widest text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3" /> No spam ever
              </div>
              <div className="h-1 w-1 rounded-full bg-gray-700" />
              <div>Unsubscribe anytime</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
