"use client";

import { CheckCircle, Clock, FileText, Wallet } from "lucide-react";
import { PayrollRunCard } from "@/components/admin/PayrollRunCard";
import { StatCard } from "@/components/shared/StatCard";
import { usePayrollRuns } from "@/hooks/usePayrollRuns";

export default function HrDashboardPage() {
  const { runs } = usePayrollRuns("hr");
  const pending = runs.filter((run) => run.status === "ANALYSED" || Number(run.pending_decisions_count || 0) > 0).length;
  const approved = runs.filter((run) => run.status === "APPROVED" || run.status === "DISBURSED").length;
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold">HR Dashboard</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <StatCard label="Total payroll runs" value={runs.length} icon={FileText} color="purple" />
        <StatCard label="Pending review" value={pending} icon={Clock} color="amber" />
        <StatCard label="Approved runs" value={approved} icon={CheckCircle} color="teal" />
        <StatCard label="Total disbursed" value={runs.filter((run) => run.status === "DISBURSED").length} icon={Wallet} color="gray" />
      </div>
      <section className="mt-6">
        <h2 className="mb-3 text-xl font-bold">Recent runs</h2>
        <div className="grid gap-4 lg:grid-cols-3">{runs.slice(0, 3).map((run) => <PayrollRunCard key={run.id} run={run} hrefPrefix="/hr/payroll" />)}</div>
      </section>
    </main>
  );
}
