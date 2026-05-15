"use client";

import { FraudSignalCard } from "@/components/admin/FraudSignalCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { AlertTriangle } from "lucide-react";

export function FraudSignalFeed({ signals, loading }: { signals: any[]; loading?: boolean }) {
  if (loading) return <div className="rounded-lg border border-border bg-white p-8 text-sm text-ink-secondary">Loading signals...</div>;
  if (!signals.length) return <EmptyState icon={AlertTriangle} title="No fraud signals" description="No suspicious activity matches the current filters." />;
  return <div className="space-y-4">{signals.map((signal) => <FraudSignalCard key={signal.id} signal={signal} />)}</div>;
}
