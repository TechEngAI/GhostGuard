"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";

export function TrustScoreBadge({ score, verdict }: { score?: number | null; verdict?: string }) {
  if (score == null) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-600">
        Score not yet calculated
      </div>
    );
  }

  if (score >= 70) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
        <CheckCircle2 className="h-5 w-5" /> Verified Worker - Reliability Score: {score}/100
      </div>
    );
  }

  if (score >= 40) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
        <AlertTriangle className="h-5 w-5" /> Under Review - Score: {score}/100
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
      <AlertTriangle className="h-5 w-5" /> Flagged - Contact your HR officer
    </div>
  );
}
