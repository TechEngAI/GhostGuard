"use client";

import { Check } from "lucide-react";
import { motion } from "framer-motion";

export function StepIndicator({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <div className="flex w-full items-start">
      {steps.map((step, index) => {
        const number = index + 1;
        const complete = number < currentStep;
        const active = number === currentStep;
        
        return (
          <div key={step} className="flex flex-1 items-start">
            <div className="flex flex-1 flex-col items-center">
              <div className="relative">
                {active && (
                  <motion.div 
                    layoutId="step-pulse"
                    className="absolute -inset-2 rounded-full border-2 border-brand/20 z-0 animate-pulse-ring"
                  />
                )}
                <motion.div 
                  initial={false}
                  animate={{ 
                    backgroundColor: complete || active ? "#1D9E75" : "#E5E7EB",
                    color: complete || active ? "#FFFFFF" : "#888888",
                    scale: active ? 1.1 : 1
                  }}
                  className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold shadow-sm"
                >
                  {complete ? <Check className="h-4 w-4" /> : number}
                </motion.div>
              </div>
              <span className={`mt-3 text-center text-[10px] font-black uppercase tracking-wider ${active ? "text-brand" : "text-ink-tertiary"}`}>
                {step}
              </span>
            </div>
            
            {index < steps.length - 1 && (
              <div className="mt-4.5 h-0.5 flex-1 bg-gray-200 dark:bg-slate-800 relative overflow-hidden">
                <motion.div 
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: complete ? 1 : 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  style={{ originX: 0 }}
                  className="absolute inset-0 bg-brand"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
