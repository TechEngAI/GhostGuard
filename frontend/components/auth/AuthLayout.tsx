"use client";

import { ReactNode, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Shield, CheckCircle2 } from "lucide-react";
import { cn, AUTH_HERO_IMAGE_KEY } from "@/lib/utils";

interface AuthLayoutProps {
  children: ReactNode;
  portal: "admin" | "worker" | "hr";
  title: string;
  subtitle: string;
  features: string[];
  reverse?: boolean;
  heroImageUrl?: string;
}

const themeMap = {
  admin: {
    gradient: "from-[#085041] via-[#0d6b57] to-[#1D9E75]",
    orbs: ["bg-[#1D9E75]", "bg-[#085041]"],
    glow: "shadow-glow-admin",
    accent: "text-admin",
    badge: "Admin Portal",
  },
  worker: {
    gradient: "from-[#1D9E75] via-[#168a65] to-[#085041]",
    orbs: ["bg-[#1D9E75]", "bg-[#22d3ee]"],
    glow: "shadow-glow-worker",
    accent: "text-worker",
    badge: "Worker Portal",
  },
  hr: {
    gradient: "from-[#534AB7] via-[#4338ca] to-[#312e81]",
    orbs: ["bg-[#8b5cf6]", "bg-[#4338ca]"],
    glow: "shadow-glow-hr",
    accent: "text-hr",
    badge: "HR Portal",
  },
};

export default function AuthLayout({ children, portal, title, subtitle, features, reverse = false, heroImageUrl }: AuthLayoutProps) {
  const theme = themeMap[portal];
  const [resolvedImage, setResolvedImage] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(AUTH_HERO_IMAGE_KEY);
    setResolvedImage(saved || heroImageUrl || null);
  }, [heroImageUrl]);

  return (
    <div className="flex min-h-screen bg-[#F8F7F2] overflow-hidden">
      {/* Left Panel - Branded Info */}
      <div className={cn(
        "hidden lg:flex w-[45%] relative flex-col justify-center p-12 text-white overflow-hidden bg-[#085041]",
        reverse && "order-last"
      )}>
        {/* Video Background */}
        <motion.video 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
          autoPlay 
          muted 
          loop 
          playsInline 
          className="auth-video"
          src="/videos/auth-bg.mp4"
        />
        <div className={cn("absolute inset-0 z-[1] bg-gradient-to-br opacity-85", theme.gradient)} />

        {/* Orbs */}
        <div className={cn("orb w-[400px] h-[400px] -top-20 -left-20 opacity-30 z-[2]", theme.orbs[0])} />
        <div className={cn("orb w-[300px] h-[300px] bottom-10 -right-10 opacity-20 z-[2]", theme.orbs[1])} />

        <div className="relative z-10 flex flex-col h-full justify-between">
          <div>
            <Link href="/" className="flex items-center gap-3 mb-12 group">
              <div className="w-11 h-11 bg-white/15 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:bg-white/20 transition-colors">
                <Shield size={24} />
              </div>
              <span className="text-2xl font-extrabold tracking-tight">GhostGuard</span>
            </Link>

            <span className="inline-block bg-white/15 border border-white/30 rounded-full px-4 py-1 text-xs font-bold mb-6 backdrop-blur-sm">
              {theme.badge}
            </span>

            <h2 className="text-4xl font-black leading-[1.1] mb-8 max-w-md">
              {title}
            </h2>

            <ul className="space-y-5 mb-8">
              {features.map((feature, i) => (
                <motion.li 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-4 text-sm font-medium text-white/90"
                >
                  <div className="w-2 h-2 bg-white/60 rounded-full shrink-0" />
                  {feature}
                </motion.li>
              ))}
            </ul>
          </div>

          {resolvedImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.7, ease: "easeOut" }}
              className="relative max-w-sm"
            >
              <motion.img 
                src={resolvedImage}
                alt="Feature Preview"
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="w-full rounded-2xl border-4 border-white/20 shadow-2xl object-cover aspect-video"
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            </motion.div>
          )}

          <div className="pt-8 border-t border-white/10 mt-auto">
            <p className="text-sm text-white/60">
              GhostGuard Platform &copy; 2024
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        {/* Mobile Header */}
        <div className="lg:hidden absolute top-8 left-8 right-8 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Shield className={theme.accent} size={28} />
            <span className="text-xl font-bold">GhostGuard</span>
          </Link>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={subtitle} // Use subtitle or something unique to trigger transition on step change
            initial={{ opacity: 0, rotateY: 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: -90 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="w-full max-w-md"
            style={{ perspective: 1000 }}
          >
            <div className={cn(
              "bg-white rounded-[32px] p-8 lg:p-10 shadow-soft border border-[#E0DED6] relative overflow-hidden",
              theme.glow
            )}>
              <div className="text-center mb-8">
                <div className={cn("w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4", theme.accent, "bg-brand-light")}>
                  <Shield size={28} />
                </div>
                <h1 className="text-2xl font-extrabold text-ink tracking-tight">Welcome back</h1>
                <p className={cn("text-sm font-semibold mt-1", theme.accent)}>{theme.badge}</p>
              </div>

              {children}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
