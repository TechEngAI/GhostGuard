"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bell, ShieldAlert, CheckCircle2, Info, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type NotificationType = 'alert' | 'success' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'alert',
    title: 'High Risk Signal Detected',
    message: 'Tunde Bello flagged for Bank Velocity anomaly in Lagos office.',
    time: '2 mins ago',
    read: false
  },
  {
    id: '2',
    type: 'success',
    title: 'Payroll Approved',
    message: 'Ministry of Finance payroll run for May has been successfully disbursed.',
    time: '1 hour ago',
    read: false
  },
  {
    id: '3',
    type: 'info',
    title: 'System Update',
    message: 'GhostGuard AI model updated to version 2.4. Improved GPS spoofing detection.',
    time: '5 hours ago',
    read: true
  }
];

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors group"
      >
        <Bell className="h-5 w-5 text-ink dark:text-white group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white dark:border-slate-900 text-[10px] font-black text-white items-center justify-center">
              {unreadCount}
            </span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-96 rounded-3xl border border-border bg-white dark:bg-slate-900 dark:border-slate-800 shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-6 border-b border-border dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-lg font-black text-ink dark:text-white">Notifications</h3>
                <button 
                  onClick={clearAll}
                  className="text-xs font-bold text-brand hover:underline"
                >
                  Clear All
                </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div 
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={cn(
                        "p-6 flex gap-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border-b border-border/50 dark:border-slate-800/50 last:border-0",
                        !n.read && "bg-brand/5 dark:bg-brand/5"
                      )}
                    >
                      <div className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                        n.type === 'alert' && "bg-red-500/10 text-red-500",
                        n.type === 'success' && "bg-emerald-500/10 text-emerald-500",
                        n.type === 'info' && "bg-blue-500/10 text-blue-500"
                      )}>
                        {n.type === 'alert' && <ShieldAlert className="h-5 w-5" />}
                        {n.type === 'success' && <CheckCircle2 className="h-5 w-5" />}
                        {n.type === 'info' && <Info className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-bold text-sm text-ink dark:text-white">{n.title}</p>
                          <span className="text-[10px] font-bold text-ink-tertiary dark:text-gray-500 uppercase">{n.time}</span>
                        </div>
                        <p className="text-xs font-medium text-ink-secondary dark:text-gray-400 leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-600 mb-4">
                      <Bell className="h-8 w-8" />
                    </div>
                    <p className="text-sm font-bold text-ink-tertiary dark:text-gray-500">No new notifications</p>
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-4 bg-gray-50 dark:bg-slate-800/50 text-center">
                  <button className="text-xs font-black text-ink-tertiary dark:text-gray-400 hover:text-brand transition-colors uppercase tracking-widest">
                    View All Activity
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
