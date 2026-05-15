"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FileText } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatNGN } from "@/lib/utils";

export function PayrollHistoryChart({ data }: { data: any[] }) {
  const rows = (data || []).map((item) => ({
    ...item,
    month: formatMonth(item.month_year || item.month || item.period),
    verified: Number(item.verified || item.verified_count || 0),
    suspicious: Number(item.suspicious || item.suspicious_count || 0),
    flagged: Number(item.flagged || item.flagged_count || 0),
  }));

  return (
    <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black">Payroll Analysis History</h2>
      <p className="mt-1 text-sm text-ink-secondary">Workers verified vs flagged per payroll run</p>
      {rows.length === 0 ? (
        <div className="mt-6"><EmptyState icon={FileText} title="No payroll runs yet" description="Generate your first analysis to see history." /></div>
      ) : (
        <div className="mt-6 h-[320px]">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                <div className="rounded-lg border border-border bg-white p-3 text-sm shadow-lg">
                  <p className="font-black">{label}</p>
                  {payload.map((item) => <p key={String(item.dataKey)} style={{ color: item.color }}>{item.name}: {item.value}</p>)}
                  <p className="mt-2 font-bold text-brand">Saved: {formatNGN(Number(payload[0]?.payload?.salary_saved || 0))}</p>
                  <p className="text-xs text-ink-secondary">Excluded: {payload[0]?.payload?.excluded_count || 0}</p>
                </div>
              ) : null} />
              <Legend verticalAlign="bottom" />
              <Bar dataKey="verified" fill="#1D9E75" name="Verified" stackId="a" />
              <Bar dataKey="suspicious" fill="#BA7517" name="Suspicious" stackId="a" />
              <Bar dataKey="flagged" fill="#A32D2D" name="Flagged" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

function formatMonth(value?: string) {
  if (!value) return "-";
  const date = new Date(value.includes("-") ? `${value}-01` : value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}
