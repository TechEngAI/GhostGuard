"use client";

import { useMemo, useState } from "react";
import PageWrapper from "@/components/shared/PageWrapper";
import { StatCard } from "@/components/shared/StatCard";
import { FilterBar } from "@/components/shared/FilterBar";
import { FraudSignalFeed } from "@/components/admin/FraudSignalFeed";
import { useFraudSignals } from "@/hooks/useFraudSignals";
import { AlertTriangle } from "lucide-react";

export default function FraudSignalsPage() {
  const { signals, loading } = useFraudSignals();
  const [severity, setSeverity] = useState("");
  const [type, setType] = useState("");

  const filtered = useMemo(() => 
    signals.filter((signal) => (!severity || signal.severity === severity) && (!type || signal.signal_type === type)), 
    [signals, severity, type]
  );

  const affected = new Set(filtered.map((signal) => signal.worker_id).filter(Boolean)).size;

  return (
    <PageWrapper className="p-8 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-black tracking-tight text-ink">Fraud Monitoring</h1>
        <p className="text-sm font-medium text-ink-secondary mt-1">
          Real-time anomaly detection and behavioral analysis.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
        {[
          ["Total Signals", filtered.length, "purple"], 
          ["Critical", filtered.filter((s) => s.severity === "CRITICAL").length, "red"], 
          ["Unreviewed", filtered.filter((s) => !s.is_reviewed).length, "amber"], 
          ["Workers Affected", affected, "teal"]
        ].map(([label, value, color]) => (
          <StatCard key={label as string} label={label as string} value={value as number} icon={AlertTriangle} color={color as any} />
        ))}
      </div>

      <div className="bg-white rounded-[32px] border border-border p-8 shadow-sm overflow-hidden">
        <FilterBar className="mb-8 bg-gray-50/50 p-6 rounded-2xl border border-border/50">
          <div className="flex-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-ink-tertiary mb-1.5 block">Signal Category</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value)} 
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-bold focus:border-brand focus:ring-4 focus:ring-brand/5 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">All Signal Types</option>
              <option>IMPOSSIBLE_TRAVEL</option>
              <option>DEVICE_SHARED</option>
              <option>GPS_BOUNDARY_HUGGING</option>
              <option>APPROVAL_PATH_ANOMALY</option>
              <option>BANK_VELOCITY</option>
            </select>
          </div>
          <div className="w-64">
            <label className="text-[10px] font-black uppercase tracking-widest text-ink-tertiary mb-1.5 block">Severity Filter</label>
            <select 
              value={severity} 
              onChange={(e) => setSeverity(e.target.value)} 
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-bold focus:border-brand focus:ring-4 focus:ring-brand/5 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">All Severities</option>
              <option>CRITICAL</option>
              <option>HIGH</option>
              <option>MEDIUM</option>
            </select>
          </div>
        </FilterBar>

        <div className="relative">
          <FraudSignalFeed signals={filtered} loading={loading} />
          {filtered.length === 0 && !loading && (
            <div className="py-20 text-center">
              <p className="font-bold text-ink-tertiary">System clear. No anomalies detected in this view.</p>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
