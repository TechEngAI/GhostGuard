"use client";

import { useMemo, useState } from "react";
import { FraudSignalFeed } from "@/components/admin/FraudSignalFeed";
import { FilterBar } from "@/components/shared/FilterBar";
import { useFraudSignals } from "@/hooks/useFraudSignals";

export default function FraudSignalsPage() {
  const { signals, loading } = useFraudSignals();
  const [severity, setSeverity] = useState("");
  const [type, setType] = useState("");
  const filtered = useMemo(() => signals.filter((signal) => (!severity || signal.severity === severity) && (!type || signal.signal_type === type)), [signals, severity, type]);
  const affected = new Set(filtered.map((signal) => signal.worker_id).filter(Boolean)).size;
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold">Fraud Signals</h1>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        {[["Total", filtered.length], ["Critical", filtered.filter((s) => s.severity === "CRITICAL").length], ["Unreviewed", filtered.filter((s) => !s.is_reviewed).length], ["Workers affected", affected]].map(([label, value]) => <div key={label} className="rounded-lg border border-border bg-white p-4"><p className="text-sm text-ink-secondary">{label}</p><p className="text-2xl font-bold">{value}</p></div>)}
      </div>
      <div className="mt-4"><FilterBar><select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border border-border px-3 py-2"><option value="">All signal types</option><option>IMPOSSIBLE_TRAVEL</option><option>DEVICE_SHARED</option><option>GPS_BOUNDARY_HUGGING</option><option>APPROVAL_PATH_ANOMALY</option><option>BANK_VELOCITY</option></select><select value={severity} onChange={(e) => setSeverity(e.target.value)} className="rounded-lg border border-border px-3 py-2"><option value="">All severities</option><option>CRITICAL</option><option>HIGH</option><option>MEDIUM</option></select></FilterBar></div>
      <div className="mt-4"><FraudSignalFeed signals={filtered} loading={loading} /></div>
    </main>
  );
}
