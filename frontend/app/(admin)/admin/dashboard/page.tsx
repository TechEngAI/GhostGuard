"use client";

import { AlertTriangle, Briefcase, FileText, Users } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FraudSignalCard } from "@/components/admin/FraudSignalCard";
import { WorkerTable } from "@/components/admin/WorkerTable";
import { StatCard } from "@/components/shared/StatCard";
import { getCompany, getFraudSignals, getPayrollRuns, getRoles, getWorkers, unwrapError } from "@/lib/api";
import { unwrapData } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [latestRun, setLatestRun] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  useEffect(() => {
    async function load() {
      try {
        const [companyRes, workerRes, roleRes, signalRes, runRes] = await Promise.all([getCompany(), getWorkers({ page_size: 5 }), getRoles(), getFraudSignals({ page_size: 5 }), getPayrollRuns()]);
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
    <main className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-ink-secondary">{company?.name || "Company"} overview</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Workers" value={workers.length} icon={Users} color="teal" />
        <StatCard label="Active Roles" value={roles.length} icon={Briefcase} color="purple" />
        <StatCard label="Unreviewed Signals" value={unreviewed} icon={AlertTriangle} color="red" />
        <StatCard label="Latest Payroll Status" value={latestRun?.status || "Not generated"} icon={FileText} color="amber" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-bold">Recent workers</h2>
          <WorkerTable workers={workers.slice(0, 5)} onView={() => {}} />
        </section>
        <section>
          <h2 className="mb-3 text-lg font-bold">Recent fraud signals</h2>
          <div className="space-y-3">{signals.slice(0, 5).map((signal) => <FraudSignalCard key={signal.id} signal={signal} />)}</div>
        </section>
      </div>
    </main>
  );
}
