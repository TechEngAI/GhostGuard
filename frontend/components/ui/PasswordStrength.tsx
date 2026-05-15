"use client";

import { motion } from "framer-motion";

const labels = ["Weak", "Fair", "Good", "Strong"];
const colors = ["#A32D2D", "#BA7517", "#EAB308", "#1D9E75"];
const bgColors = ["bg-danger", "bg-warning", "bg-yellow-500", "bg-brand"];

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  
  const score = [password.length >= 8, /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
  const level = Math.max(1, score);

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((bar) => (
          <motion.div
            key={bar}
            initial={false}
            animate={{ 
              backgroundColor: bar <= level ? colors[level - 1] : "#E5E7EB",
              opacity: bar <= level ? 1 : 0.3 
            }}
            transition={{ duration: 0.3 }}
            className="h-1.5 flex-1 rounded-full"
          />
        ))}
      </div>
      <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-ink-tertiary">
        Security Level: <span style={{ color: colors[level - 1] }}>{labels[level - 1]}</span>
      </p>
    </div>
  );
}
