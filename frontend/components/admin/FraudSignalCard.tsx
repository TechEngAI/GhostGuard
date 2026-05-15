"use client";

import Link from "next/link";
import { relativeTime, cn } from "@/lib/utils";
import { motion } from "framer-motion";

const severityColors = { 
  CRITICAL: "bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)]", 
  HIGH: "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]", 
  MEDIUM: "bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)]" 
} as Record<string, string>;

const labels: Record<string, string> = {
  IMPOSSIBLE_TRAVEL: "✈️ Impossible Travel",
  DEVICE_SHARED: "📱 Device Sharing Ring",
  GPS_BOUNDARY_HUGGING: "📍 GPS Boundary Hugging",
  APPROVAL_PATH_ANOMALY: "🔍 Approval Anomaly",
  BANK_VELOCITY: "🏦 Bank Account Cycling",
};

function description(signal: any) {
  const meta = signal.metadata || {};
  if (signal.signal_type === "IMPOSSIBLE_TRAVEL") return `Checked in ${meta.distance_km || "?"}km apart in ${meta.time_gap_minutes || "?"} minutes - implied speed: ${meta.speed_kmh || "?"} km/h`;
  if (signal.signal_type === "DEVICE_SHARED") return `Device shared with ${meta.shared_count || 0} workers: ${(meta.shared_with_worker_ids || []).join(", ")}`;
  if (signal.signal_type === "GPS_BOUNDARY_HUGGING") return `${Math.round(Number(meta.boundary_hugging_score || 0) * 100)}% of check-ins near the geofence boundary`;
  if (signal.signal_type === "APPROVAL_PATH_ANOMALY") return `Admin ${meta.admin_id || ""} made ${meta.edit_count || 0} manual edits - above company average`;
  if (signal.signal_type === "BANK_VELOCITY") return `Bank account changed ${meta.change_count || 0} times in ${meta.period_days || 90} days`;
  return "Suspicious activity detected. Manual review recommended.";
}

export function FraudSignalCard({ signal }: { signal: any }) {
  const worker = signal.workers || {};
  
  return (
    <motion.article 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.01, x: 4 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-white p-6 pl-10 shadow-sm transition-all hover:shadow-md dark:bg-slate-900 dark:border-slate-800"
    >
      {/* Animated Severity Bar */}
      <motion.span 
        initial={{ height: 0 }}
        animate={{ height: "100%" }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={cn("absolute inset-y-0 left-0 w-2.5", severityColors[signal.severity] || "bg-gray-300")} 
      />
      
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-ink-tertiary dark:bg-slate-800">
            {labels[signal.signal_type] || signal.signal_type}
          </span>
          <h3 className="mt-4 text-lg font-black text-ink dark:text-white">
            {worker.first_name ? `${worker.first_name} ${worker.last_name}` : "Unknown worker"}
          </h3>
          <p className="mt-2 text-sm font-medium text-ink-secondary dark:text-gray-400 max-w-2xl">
            {description(signal)}
          </p>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-ink-tertiary">
          {relativeTime(signal.detected_at || signal.created_at)}
        </span>
      </div>
      
      <div className="mt-6 flex items-center justify-between gap-4 border-t border-gray-50 pt-4 dark:border-slate-800">
        <div className="flex gap-4">
          {signal.worker_id && (
            <Link 
              href={`/admin/workers/${signal.worker_id}`} 
              className="text-xs font-black uppercase tracking-widest text-brand hover:text-brand-dark transition-colors"
            >
              Inspect Worker
            </Link>
          )}
        </div>
        
        {signal.is_reviewed ? (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:bg-emerald-950/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Reviewed
          </span>
        ) : (
          <button className="rounded-xl border border-border px-4 py-2 text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all dark:border-slate-800 dark:hover:bg-slate-800">
            Mark Reviewed
          </button>
        )}
      </div>
    </motion.article>
  );
}
