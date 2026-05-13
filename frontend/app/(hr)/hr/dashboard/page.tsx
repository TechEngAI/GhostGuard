"use client";

import { CheckCircle, Clock, FileText, Wallet } from "lucide-react";
import { PayrollRunCard } from "@/components/admin/PayrollRunCard";
import { StatCard } from "@/components/shared/StatCard";
import { usePayrollRuns } from "@/hooks/usePayrollRuns";
import Link from "next/link";

import PageWrapper from "@/components/shared/PageWrapper";

export default function HrDashboardPage() {
  const { runs } = usePayrollRuns("hr");
  const pending = runs.filter((run) => run.status === "ANALYSED" || Number(run.pending_decisions_count || 0) > 0).length;
  const approved = runs.filter((run) => run.status === "APPROVED" || run.status === "DISBURSED").length;

  return (
    <PageWrapper className="p-8 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-black tracking-tight text-ink">HR Dashboard</h1>
        <p className="text-sm font-medium text-ink-secondary mt-1">
          Review and approve payroll cycles securely.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Runs" value={runs.length} icon={FileText} color="purple" />
        <StatCard label="Pending Review" value={pending} icon={Clock} color="amber" />
        <StatCard label="Approved Runs" value={approved} icon={CheckCircle} color="teal" />
        <StatCard label="Disbursed" value={runs.filter((run) => run.status === "DISBURSED").length} icon={Wallet} color="gray" />
      </div>

      <section className="mt-12 bg-white rounded-[32px] border border-border p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-ink">Recent Payroll Cycles</h2>
          <Link href="/hr/payroll" className="text-xs font-bold uppercase tracking-widest text-brand hover:underline">View All History</Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {runs.slice(0, 3).map((run) => (
            <PayrollRunCard key={run.id} run={run} hrefPrefix="/hr/payroll" />
          ))}
          {runs.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-3xl">
               <p className="font-bold text-ink-tertiary">No payroll runs found.</p>
            </div>
          )}
        </div>
      </section>
    </PageWrapper>
  );
}
