"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { usePayrollRuns } from "@/hooks/usePayrollRuns";

export default function HrPayrollPage() {
  const { runs, loading } = usePayrollRuns("hr");
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold">Payroll Runs</h1>
      {loading ? <div className="mt-6 rounded-lg border border-border bg-white p-8">Loading payroll runs...</div> : runs.length === 0 ? (
        <div className="mt-6"><EmptyState icon={FileText} title="No payroll analyses" description="No payroll analyses have been generated yet. Ask your administrator to run the ghost detection." /></div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {runs.map((run) => (
            <article key={run.id} className="rounded-lg border border-border bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="text-2xl font-bold">{run.month_year}</h2><p className="text-sm text-ink-secondary">{run.total_workers} workers</p></div>
                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-[#534AB7]">{run.status}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold"><span className="rounded-full bg-green-100 px-3 py-1 text-green-700">{run.verified_count || 0} verified</span><span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">{run.suspicious_count || 0} suspicious</span><span className="rounded-full bg-red-100 px-3 py-1 text-red-700">{run.flagged_count || 0} flagged</span>{Number(run.pending_decisions_count || 0) > 0 && <span className="rounded-full bg-amber-200 px-3 py-1 text-amber-800">{run.pending_decisions_count} pending</span>}</div>
              <Link href={`/hr/payroll/${run.id}`} className="mt-5 inline-flex rounded-lg bg-[#534AB7] px-4 py-2 text-sm font-bold text-white">Review Payroll</Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
