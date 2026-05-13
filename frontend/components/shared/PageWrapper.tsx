"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { Breadcrumb } from "./Breadcrumb";

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function PageWrapper({ 
  children, 
  className = "", 
  title, 
  subtitle,
  actions 
}: PageWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as any }}
      className={`min-h-full p-4 sm:p-8 bg-background dark:bg-slate-950 transition-colors duration-500 ${className}`}
    >
      <Breadcrumb />
      
      {(title || subtitle || actions) && (
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            {title && (
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-black tracking-tight text-ink dark:text-white sm:text-4xl"
              >
                {title}
              </motion.h1>
            )}
            {subtitle && (
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-2 text-sm font-medium text-ink-secondary dark:text-gray-400"
              >
                {subtitle}
              </motion.p>
            )}
          </div>
          {actions && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-4"
            >
              {actions}
            </motion.div>
          )}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
