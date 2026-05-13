"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  return (
    <Dialog.Root open={open} onOpenChange={(val) => !val && onClose()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" 
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-45%" }}
                animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-45%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto rounded-[32px] bg-white p-8 shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800"
              >
                <div className="flex items-center justify-between gap-4 mb-6">
                  <Dialog.Title className="text-2xl font-black text-ink dark:text-white tracking-tight">{title}</Dialog.Title>
                  <Dialog.Close className="rounded-xl p-2 text-ink-tertiary hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                    <X className="h-6 w-6" />
                  </Dialog.Close>
                </div>
                <div className="relative z-10">{children}</div>
                
                {/* Decorative background */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand/5 rounded-full blur-3xl pointer-events-none" />
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
