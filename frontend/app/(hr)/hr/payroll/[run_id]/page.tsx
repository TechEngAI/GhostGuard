"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Receipt } from "lucide-react";
import toast from "react-hot-toast";
import { ApprovalConfirmModal } from "@/components/hr/ApprovalConfirmModal";
import { DisbursementTracker } from "@/components/hr/DisbursementTracker";
import { WorkerResultCard } from "@/components/hr/WorkerResultCard";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { Skeleton } from "@/components/shared/Skeleton";
import { approvePayroll, getHrPayrollResults, unwrapError } from "@/lib/api";
import { formatNGN, unwrapData } from "@/lib/utils";

const order = { FLAGGED: 0, SUSPICIOUS: 1, VERIFIED: 2 } as Record<string, number>;

export default function HrPayrollReviewPage({ params }: { params: { run_id: string } }) {
  const [run, setRun] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [tab, setTab] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isDisbursing, setIsDisbursing] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await getHrPayrollResults(params.run_id);
      const data = unwrapData<any>(response);
      setRun(data.run);
      setResults(data.results || []);
    } catch (err) {
      const message = unwrapError(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = "GhostGuard - HR Payroll Review";
    load();
  }, [params.run_id]);

  const filtered = useMemo(
    () => results.filter((row) => tab === "ALL" || row.verdict === tab).sort((a, b) => (order[a.verdict] ?? 9) - (order[b.verdict] ?? 9)),
    [results, tab],
  );
  const pending = results.filter((row) => ["FLAGGED", "SUSPICIOUS"].includes(row.verdict) && (row.hr_decision || "PENDING") === "PENDING").length;
  const runSummary = {
    total_workers: run?.total_workers || results.length,
    verified_count: run?.verified_count ?? results.filter((row) => row.verdict === "VERIFIED").length,
    included_count: run?.included_count ?? results.filter((row) => ["INCLUDED", "APPROVED"].includes(row.hr_decision)).length,
    excluded_count: run?.excluded_count ?? results.filter((row) => ["EXCLUDED", "REJECTED"].includes(row.hr_decision)).length,
    estimated_total_payout: run?.estimated_total_payout ?? results.reduce((sum, row) => sum + Number(row.net_pay || row.net_salary || row.salary || 0), 0),
    month_year: run?.month_year,
  };

  async function confirmApproval() {
    setIsApproving(true);
    try {
      await approvePayroll(params.run_id);
      toast.success("Payroll approved. Disbursement in progress.");
      setShowConfirmModal(false);
      setIsDisbursing(true);
    } catch (err) {
      toast.error(unwrapError(err));
      setShowConfirmModal(false);
    } finally {
      setIsApproving(false);
    }
  }

  if (loading) return <main className="p-6"><Skeleton lines={5} /></main>;
  if (error) return <ErrorBoundary message={error} onRetry={load} />;
  if (isDisbursing) return <main className="p-4 sm:p-6"><DisbursementTracker runId={params.run_id} onComplete={load} /></main>;

  return (
    <main className="p-4 sm:p-6">
      <div className="sticky top-0 z-20 -mx-4 -mt-4 border-b border-border bg-background/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:-mt-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{run?.month_year || "Payroll review"}</h1>
            <p className="text-sm text-ink-secondary">
              {run?.status} - {pending > 0 ? `${pending} workers need your decision` : `Ready for approval - ${formatNGN(runSummary.estimated_total_payout)}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/hr/payroll/${params.run_id}/receipts`} className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-bold text-ink-secondary">
              <Receipt className="h-4 w-4" /> Receipts
            </Link>
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={pending > 0 || isApproving}
              className="rounded-lg bg-[#534AB7] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isApproving ? "Approving..." : pending > 0 ? `${pending} decisions pending` : "Approve Payroll"}
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {["ALL", "FLAGGED", "SUSPICIOUS", "VERIFIED"].map((item) => (
            <button key={item} onClick={() => setTab(item)} className={`rounded-lg px-3 py-2 text-sm font-bold ${tab === item ? "bg-[#534AB7] text-white" : "bg-white text-ink-secondary"}`}>
              {item} ({item === "ALL" ? results.length : results.filter((row) => row.verdict === item).length})
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6 space-y-4">{filtered.map((result) => <WorkerResultCard key={result.worker_id} runId={params.run_id} result={result} onChanged={load} />)}</div>
      <ApprovalConfirmModal open={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={confirmApproval} runSummary={runSummary} isLoading={isApproving} />
    </main>
  );
}
