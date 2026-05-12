"use client";

import Link from "next/link";
import { relativeTime } from "@/lib/utils";

const severity = { CRITICAL: "bg-red-600", HIGH: "bg-amber-500", MEDIUM: "bg-yellow-400" } as Record<string, string>;
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
    <article className="relative overflow-hidden rounded-lg border border-border bg-white p-5 pl-7">
      <span className={`absolute inset-y-0 left-0 w-2 ${severity[signal.severity] || "bg-gray-300"}`} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold">{labels[signal.signal_type] || signal.signal_type}</span>
          <h3 className="mt-3 font-bold">{worker.first_name ? `${worker.first_name} ${worker.last_name}` : "Unknown worker"}</h3>
          <p className="mt-1 text-sm text-ink-secondary">{description(signal)}</p>
        </div>
        <span className="text-xs text-ink-secondary">{relativeTime(signal.detected_at || signal.created_at)}</span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        {signal.worker_id && <Link href={`/admin/workers/${signal.worker_id}`} className="text-sm font-semibold text-brand-dark">Open worker</Link>}
        {signal.is_reviewed ? <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">Reviewed</span> : <button className="rounded-lg border border-border px-3 py-2 text-sm font-semibold">Mark Reviewed</button>}
      </div>
    </article>
  );
}
