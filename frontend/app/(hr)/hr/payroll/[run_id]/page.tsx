"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ApprovePayrollButton } from "@/components/hr/ApprovePayrollButton";
import { WorkerResultCard } from "@/components/hr/WorkerResultCard";
import { getHrPayrollResults, unwrapError } from "@/lib/api";
import { unwrapData } from "@/lib/utils";

const order = { FLAGGED: 0, SUSPICIOUS: 1, VERIFIED: 2 } as Record<string, number>;

export default function HrPayrollReviewPage({ params }: { params: { run_id: string } }) {
  const [run, setRun] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [tab, setTab] = useState("ALL");
  async function load() {
    try {
      const response = await getHrPayrollResults(params.run_id);
      const data = unwrapData<any>(response);
      setRun(data.run);
      setResults(data.results || []);
    } catch (error) {
      toast.error(unwrapError(error));
    }
  }
  useEffect(() => { load(); }, [params.run_id]);
  const filtered = useMemo(() => results.filter((row) => tab === "ALL" || row.verdict === tab).sort((a, b) => (order[a.verdict] ?? 9) - (order[b.verdict] ?? 9)), [results, tab]);
  const pending = results.filter((row) => ["FLAGGED", "SUSPICIOUS"].includes(row.verdict) && (row.hr_decision || "PENDING") === "PENDING").length;
  return (
    <main className="p-6">
      <div className="sticky top-0 z-20 -mx-6 -mt-6 border-b border-border bg-background/95 px-6 py-4 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><h1 className="text-2xl font-bold">{run?.month_year || "Payroll review"}</h1><p className="text-sm text-ink-secondary">{run?.status} · {pending > 0 ? `${pending} workers need your decision` : "Ready for approval"}</p></div>
          <ApprovePayrollButton runId={params.run_id} pendingCount={pending} onApproved={load} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">{["ALL", "FLAGGED", "SUSPICIOUS", "VERIFIED"].map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded-lg px-3 py-2 text-sm font-bold ${tab === item ? "bg-[#534AB7] text-white" : "bg-white text-ink-secondary"}`}>{item} ({item === "ALL" ? results.length : results.filter((row) => row.verdict === item).length})</button>)}</div>
      </div>
      <div className="mt-6 space-y-4">{filtered.map((result) => <WorkerResultCard key={result.worker_id} runId={params.run_id} result={result} onChanged={load} />)}</div>
    </main>
  );
}
