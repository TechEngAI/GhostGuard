import Link from "next/link";
import { CheckCircle, FileText, ShieldAlert } from "lucide-react";

export function PayrollRunCard({ run, hrefPrefix = "/admin/payroll" }: { run: any; hrefPrefix?: string }) {
  return (
    <article className="rounded-lg border border-border bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">{run.month_year}</h3>
          <p className="text-sm text-ink-secondary">{run.total_workers || 0} workers · {run.status}</p>
        </div>
        <FileText className="h-5 w-5 text-ink-secondary" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-green-700"><CheckCircle className="h-3 w-3" /> {run.verified_count || 0} verified</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-amber-700"><ShieldAlert className="h-3 w-3" /> {run.suspicious_count || 0} suspicious</span>
        <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">{run.flagged_count || 0} flagged</span>
      </div>
      <Link href={`${hrefPrefix}/${run.id || run.payroll_run_id}`} className="mt-4 inline-flex text-sm font-semibold text-brand-dark hover:underline">
        View results
      </Link>
    </article>
  );
}
