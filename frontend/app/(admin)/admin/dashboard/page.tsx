"use client";

import { AlertTriangle, Briefcase, FileText, Users } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { FraudSignalCard } from "@/components/admin/FraudSignalCard";
import { WorkerTable } from "@/components/admin/WorkerTable";
import { StatCard } from "@/components/shared/StatCard";
import { getCompany, getFraudSignals, getPayrollRuns, getRoles, getWorkers, unwrapError } from "@/lib/api";
import { unwrapData } from "@/lib/utils";

import PageWrapper from "@/components/shared/PageWrapper";

export default function AdminDashboardPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [latestRun, setLatestRun] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const [companyRes, workerRes, roleRes, signalRes, runRes] = await Promise.all([
          getCompany(), 
          getWorkers({ page_size: 5 }), 
          getRoles(), 
          getFraudSignals({ page_size: 5 }), 
          getPayrollRuns()
        ]);
        setCompany(unwrapData<any>(companyRes).company || unwrapData<any>(companyRes));
        const workerData = unwrapData<any>(workerRes);
        setWorkers(workerData.items || workerData.workers || workerData || []);
        const roleData = unwrapData<any>(roleRes);
        setRoles(roleData.roles || roleData || []);
        const signalData = unwrapData<any>(signalRes);
        setSignals(signalData.signals || signalData.items || signalData || []);
        const runs = unwrapData<any>(runRes).runs || [];
        setLatestRun(runs[0] || null);
      } catch (error) {
        toast.error(unwrapError(error));
      }
    }
    load();
  }, []);

  const unreviewed = signals.filter((signal) => !signal.is_reviewed).length;

  return (
    <PageWrapper className="p-8 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-black tracking-tight text-ink">Admin Dashboard</h1>
        <p className="text-sm font-medium text-ink-secondary mt-1">
          {company?.name || "Company"} overview · Real-time monitoring active
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Workers" value={workers.length} icon={Users} color="teal" />
        <StatCard label="Active Roles" value={roles.length} icon={Briefcase} color="purple" />
        <StatCard label="Unreviewed Signals" value={unreviewed} icon={AlertTriangle} color="red" />
        <StatCard label="Latest Payroll" value={latestRun?.status || "None"} icon={FileText} color="amber" />
      </div>

      <div className="mt-12 grid gap-10 xl:grid-cols-2">
        <section className="bg-white rounded-[32px] border border-border p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-ink">Recent Workers</h2>
            <Link href="/admin/workers" className="text-xs font-bold uppercase tracking-widest text-brand hover:underline">View All</Link>
          </div>
          <WorkerTable workers={workers.slice(0, 5)} onView={() => {}} />
        </section>

        <section className="bg-white rounded-[32px] border border-border p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-ink">Recent Fraud Signals</h2>
            <Link href="/admin/fraud-signals" className="text-xs font-bold uppercase tracking-widest text-brand hover:underline">Monitor All</Link>
          </div>
          <div className="space-y-4">
            {signals.slice(0, 5).map((signal) => (
              <FraudSignalCard key={signal.id} signal={signal} />
            ))}
            {signals.length === 0 && (
              <p className="py-10 text-center text-sm font-medium text-ink-tertiary">No signals detected yet.</p>
            )}
          </div>
        </section>
      </div>
    </PageWrapper>
  );
}
