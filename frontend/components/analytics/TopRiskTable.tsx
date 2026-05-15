"use client";

import Link from "next/link";
import { Trophy, Users } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn, verdictColor } from "@/lib/utils";

export function TopRiskTable({ workers }: { workers: any[] }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black">Highest Risk Workers</h2>
      <p className="mt-1 text-sm text-ink-secondary">Workers with lowest average trust score across all payroll runs</p>
      {!workers?.length ? (
        <div className="mt-6"><EmptyState icon={Users} title="No workers have been scored yet" description="Generate a payroll analysis first." /></div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="text-xs font-black uppercase tracking-widest text-ink-tertiary">
              <tr>
                <th className="px-3 py-3">Rank</th>
                <th className="px-3 py-3">Worker</th>
                <th className="px-3 py-3">Avg Trust Score</th>
                <th className="px-3 py-3">Flagged</th>
                <th className="px-3 py-3">Suspicious</th>
                <th className="px-3 py-3">Runs</th>
                <th className="px-3 py-3">Latest Verdict</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {workers.map((worker, index) => {
                const score = Number(worker.avg_trust_score || worker.average_trust_score || 0);
                return (
                  <tr key={worker.worker_id || worker.id} className={cn(index === 0 && score < 40 && "border-l-4 border-amber-500 bg-amber-50/40")}>
                    <td className="px-3 py-4 font-black">{index === 0 ? <span className="inline-flex items-center gap-1"><Trophy className="h-4 w-4 text-amber-600" />#1</span> : `#${index + 1}`}</td>
                    <td className="px-3 py-4"><p className="font-bold">{worker.worker_name || `${worker.first_name || ""} ${worker.last_name || ""}`.trim()}</p><p className="text-xs text-ink-secondary">{worker.role_name || worker.role}</p></td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-28 rounded-full bg-slate-100"><div className={cn("h-2 rounded-full", score >= 70 ? "bg-green-600" : score >= 40 ? "bg-amber-600" : "bg-red-700")} style={{ width: `${Math.min(score, 100)}%` }} /></div>
                        <span className="font-black">{score.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-4 font-black text-red-700">{worker.times_flagged || 0}</td>
                    <td className="px-3 py-4 font-black text-amber-700">{worker.times_suspicious || 0}</td>
                    <td className="px-3 py-4 font-bold text-ink-secondary">{worker.total_payroll_runs || 0}</td>
                    <td className="px-3 py-4"><span className={cn("rounded-full border px-2 py-1 text-xs font-black", verdictColor(worker.latest_verdict || ""))}>{worker.latest_verdict || "N/A"}</span></td>
                    <td className="px-3 py-4"><Link className="font-bold text-brand hover:underline" href={`/admin/workers/${worker.worker_id || worker.id}`}>View Worker</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
