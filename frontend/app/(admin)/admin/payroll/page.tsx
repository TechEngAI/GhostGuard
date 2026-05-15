"use client";

import { CheckCircle, Download, Loader2, ShieldAlert, XCircle } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { PayrollRunCard } from "@/components/admin/PayrollRunCard";
import { downloadPayrollCsv, generatePayroll, getPayrollResults, unwrapError } from "@/lib/api";
import { formatNGN, unwrapData, verdictColor } from "@/lib/utils";
import { usePayrollRuns } from "@/hooks/usePayrollRuns";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function AdminPayrollPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState("");
  const [summary, setSummary] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const { runs, reload } = usePayrollRuns("admin");
  const resultsRef = useRef<HTMLDivElement>(null);
  const counts = useMemo(() => ({
    verified: summary?.verified_count ?? results.filter((r) => r.verdict === "VERIFIED").length,
    suspicious: summary?.suspicious_count ?? results.filter((r) => r.verdict === "SUSPICIOUS").length,
    flagged: summary?.flagged_count ?? results.filter((r) => r.verdict === "FLAGGED").length,
  }), [summary, results]);
  async function runPayroll() {
    setRunning(true);
    setResults([]);
    const labels = ["Collecting attendance data...", "Engineering ML features...", "Running Isolation Forest model...", "Scoring workers..."];
    let active = true;
    labels.forEach((label, index) => setTimeout(() => active && setStep(label), [0, 1000, 2500, 4500][index]));
    try {
      const response = await generatePayroll({ month, year });
      const data = unwrapData<any>(response);
      setSummary(data);
      if (data.payroll_run_id) {
        const resultResponse = await getPayrollResults(data.payroll_run_id);
        const resultData = unwrapData<any>(resultResponse);
        setResults(resultData.results || []);
      }
      reload();
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (error: any) {
      if (error?.response?.data?.error?.code === "PAYROLL_ALREADY_GENERATED") toast.error("Analysis already run for this month. See results below.");
      else toast.error(unwrapError(error));
    } finally {
      active = false;
      setRunning(false);
      setStep("");
    }
  }
  async function download(runId: string) {
    try {
      const response = await downloadPayrollCsv(runId);
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ghostguard-payroll-${runId}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(unwrapError(error));
    }
  }
  const sorted = [...results].sort((a, b) => Number(a.trust_score || 0) - Number(b.trust_score || 0));
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold">Payroll</h1>
      <section className="mt-6 rounded-lg border border-border bg-white p-6">
        <h2 className="text-xl font-bold">Generate New Analysis</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="rounded-lg border border-border px-3 py-2">{months.map((label, index) => <option key={label} value={index + 1}>{label}</option>)}</select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-lg border border-border px-3 py-2"><option>{now.getFullYear()}</option><option>{now.getFullYear() - 1}</option></select>
          <button disabled={running} onClick={runPayroll} className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2 font-bold text-white disabled:opacity-60">{running && <Loader2 className="h-4 w-4 animate-spin" />} Run Ghost Detection</button>
        </div>
        {step && <p className="mt-4 inline-flex items-center gap-2 text-sm text-ink-secondary"><Loader2 className="h-4 w-4 animate-spin" /> {step}</p>}
        {(summary || results.length > 0) && <div className="mt-6 grid gap-4 md:grid-cols-3"><div className="rounded-lg bg-green-50 p-5 text-green-700"><CheckCircle /> <p className="mt-2 text-3xl font-bold">{counts.verified}</p><p>VERIFIED</p></div><div className="rounded-lg bg-amber-50 p-5 text-amber-700"><ShieldAlert /> <p className="mt-2 text-3xl font-bold">{counts.suspicious}</p><p>SUSPICIOUS</p></div><div className="rounded-lg bg-red-50 p-5 text-red-700"><XCircle /> <p className="mt-2 text-3xl font-bold">{counts.flagged}</p><p>FLAGGED</p></div></div>}
      </section>
      <section ref={resultsRef} className="mt-6 rounded-lg border border-border bg-white p-6">
        <h2 className="text-xl font-bold">Results</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <tbody className="divide-y divide-border">
              {sorted.map((row) => <tr key={row.worker_id}><td className="py-4 font-semibold">{row.worker_name}<p className="text-xs text-ink-secondary">{row.role_name} · {formatNGN(Number(row.gross_salary || 0))}</p></td><td>{row.days_present} days</td><td className="w-56"><div className="h-2 rounded-full bg-gray-100"><div className={`h-full rounded-full ${Number(row.trust_score) < 40 ? "bg-red-600" : Number(row.trust_score) < 70 ? "bg-amber-500" : "bg-brand"}`} style={{ width: `${row.trust_score}%` }} /></div><span className="text-xs">{row.trust_score}</span></td><td><span className={`rounded-full border px-3 py-1 text-xs font-bold ${verdictColor(row.verdict)}`}>{row.verdict}</span></td><td className="max-w-md">{row.flag_reasons?.[0]}</td></tr>)}
            </tbody>
          </table>
          {sorted.length === 0 && <p className="py-8 text-center text-sm text-ink-secondary">Run or open a payroll analysis to view results.</p>}
        </div>
      </section>
      <section className="mt-6">
        <h2 className="mb-3 text-xl font-bold">Previous Runs</h2>
        <div className="grid gap-4 lg:grid-cols-3">{runs.map((run) => <div key={run.id}><PayrollRunCard run={run} /><button onClick={() => download(run.id)} className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-brand-dark"><Download className="h-4 w-4" /> Download CSV</button></div>)}</div>
      </section>
    </main>
  );
}
