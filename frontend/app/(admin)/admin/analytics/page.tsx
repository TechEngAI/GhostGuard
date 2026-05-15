"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Banknote, FileText, Users } from "lucide-react";
import { FraudSignalDonut } from "@/components/analytics/FraudSignalDonut";
import { PayrollHistoryChart } from "@/components/analytics/PayrollHistoryChart";
import { SavingsHeroCard } from "@/components/analytics/SavingsHeroCard";
import { TopRiskTable } from "@/components/analytics/TopRiskTable";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { Skeleton } from "@/components/shared/Skeleton";
import { StatCard } from "@/components/shared/StatCard";
import { getAnalyticsSummary, getFraudBreakdown, getPayrollHistory, getTopRiskWorkers, unwrapError } from "@/lib/api";
import { formatNGN, unwrapData } from "@/lib/utils";

export default function AdminAnalyticsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [fraudBreakdown, setFraudBreakdown] = useState<any[]>([]);
  const [topRisk, setTopRisk] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [summaryRes, historyRes, fraudRes, topRiskRes] = await Promise.all([
        getAnalyticsSummary(),
        getPayrollHistory(),
        getFraudBreakdown(),
        getTopRiskWorkers(10),
      ]);
      setSummary(unwrapData<any>(summaryRes).summary || unwrapData<any>(summaryRes));
      const historyData = unwrapData<any>(historyRes);
      setHistory(historyData.history || historyData.items || historyData || []);
      const fraudData = unwrapData<any>(fraudRes);
      setFraudBreakdown(fraudData.breakdown || fraudData.items || fraudData || []);
      const riskData = unwrapData<any>(topRiskRes);
      setTopRisk(riskData.workers || riskData.items || riskData || []);
    } catch (err) {
      setError(unwrapError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = "GhostGuard - Analytics";
    load();
  }, []);

  const latestSaved = Number(history[0]?.salary_saved || history[history.length - 1]?.salary_saved || summary?.latest_salary_saved || 0);
  const annual = latestSaved * 12;

  if (loading) return <main className="p-6"><div className="grid gap-4"><Skeleton className="h-40 rounded-2xl" /><div className="grid gap-4 md:grid-cols-4"><Skeleton.StatCard /><Skeleton.StatCard /><Skeleton.StatCard /><Skeleton.StatCard /></div><Skeleton lines={6} /></div></main>;
  if (error) return <ErrorBoundary message={error} onRetry={load} />;

  return (
    <main className="space-y-8 p-4 sm:p-8">
      <div>
        <h1 className="text-3xl font-black sm:text-4xl">Analytics</h1>
        <p className="mt-1 text-sm text-ink-secondary">Savings, risk, payroll, and fraud signal intelligence.</p>
      </div>

      <SavingsHeroCard summary={summary} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active Workers" value={summary?.active_workers || 0} icon={Users} color="teal" />
        <StatCard label="Total Signals Detected" value={summary?.total_signals_detected || 0} icon={AlertTriangle} color="red" />
        <StatCard label="Total Disbursed" value={formatNGN(Number(summary?.total_disbursed || 0))} icon={Banknote} color="teal" />
        <StatCard label="Payroll Runs" value={summary?.total_payroll_runs || 0} icon={FileText} color="purple" />
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">
        <PayrollHistoryChart data={history} />
        <FraudSignalDonut data={fraudBreakdown} />
      </div>

      <TopRiskTable workers={topRisk} />

      <section className="rounded-2xl border-l-4 border-brand bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black">Estimated Annual Savings</h2>
        <p className="mt-3 text-sm text-ink-secondary">
          If ghost workers go undetected for a year, your company would lose <strong className="text-ink">{formatNGN(annual)}</strong> annually.
        </p>
        <p className="mt-2 text-sm text-ink-secondary">
          GhostGuard detected and removed them. That is <strong className="text-brand">{formatNGN(latestSaved)}</strong> saved this month alone.
        </p>
        <p className="mt-4 text-xs text-ink-tertiary">Based on ghost worker salary data from your latest payroll run.</p>
      </section>
    </main>
  );
}
