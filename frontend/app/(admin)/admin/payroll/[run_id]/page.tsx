"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { WorkerResultCard } from "@/components/hr/WorkerResultCard";
import { getPayrollResults, unwrapError } from "@/lib/api";
import { unwrapData } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";

const order = { FLAGGED: 0, SUSPICIOUS: 1, VERIFIED: 2 } as Record<string, number>;

export default function AdminPayrollReviewPage({ params }: { params: { run_id: string } }) {
  const [run, setRun] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [tab, setTab] = useState("ALL");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const response = await getPayrollResults(params.run_id);
      const data = unwrapData<any>(response);
      setRun(data.run);
      setResults(data.results || []);
    } catch (error) {
      toast.error(unwrapError(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [params.run_id]);

  const filtered = useMemo(() => 
    results.filter((row) => tab === "ALL" || row.verdict === tab)
           .sort((a, b) => (order[a.verdict] ?? 9) - (order[b.verdict] ?? 9)),
    [results, tab]
  );

  if (loading) return <div className="p-8 text-center font-bold">Loading analysis results...</div>;

  return (
    <main className="p-6">
      <div className="sticky top-0 z-20 -mx-6 -mt-6 border-b border-border bg-background/95 px-6 py-4 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/admin/payroll" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink-secondary hover:text-brand transition-colors mb-2">
              <ArrowLeft className="h-3 w-3" /> Back to Payroll
            </Link>
            <h1 className="text-2xl font-black text-ink">{run?.month_year || "Payroll Analysis"}</h1>
            <p className="text-sm font-medium text-ink-secondary">
              {run?.status} · {results.length} workers analyzed
            </p>
          </div>
          <div className="flex gap-3">
             {/* Admin can download but not approve (HR does that) */}
             <Button variant="outline" className="font-bold">
               <Download className="mr-2 h-4 w-4" /> Download Report
             </Button>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {["ALL", "FLAGGED", "SUSPICIOUS", "VERIFIED"].map((item) => (
            <button 
              key={item} 
              onClick={() => setTab(item)} 
              className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all ${
                tab === item ? "bg-brand text-white shadow-lg shadow-brand/20" : "bg-white text-ink-secondary hover:bg-gray-50"
              }`}
            >
              {item} ({item === "ALL" ? results.length : results.filter((row) => row.verdict === item).length})
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {filtered.map((result) => (
          <WorkerResultCard 
            key={result.worker_id} 
            runId={params.run_id} 
            result={result} 
            onChanged={load} 
          />
        ))}
        {filtered.length === 0 && (
          <div className="rounded-3xl border-2 border-dashed border-border py-20 text-center">
            <p className="font-bold text-ink-secondary">No workers found in this category.</p>
          </div>
        )}
      </div>
    </main>
  );
}
