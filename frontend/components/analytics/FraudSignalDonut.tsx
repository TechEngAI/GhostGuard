"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const colors: Record<string, string> = {
  IMPOSSIBLE_TRAVEL: "#A32D2D",
  DEVICE_SHARED: "#D85A30",
  GPS_BOUNDARY_HUGGING: "#BA7517",
  APPROVAL_PATH_ANOMALY: "#534AB7",
  BANK_VELOCITY: "#185FA5",
};

const names: Record<string, string> = {
  IMPOSSIBLE_TRAVEL: "Impossible Travel",
  DEVICE_SHARED: "Device Sharing",
  GPS_BOUNDARY_HUGGING: "GPS Spoofing",
  APPROVAL_PATH_ANOMALY: "Insider Anomaly",
  BANK_VELOCITY: "Bank Cycling",
};

export function FraudSignalDonut({ data }: { data: any[] }) {
  const rows = (data || []).map((item) => ({
    type: item.signal_type || item.type,
    name: names[item.signal_type || item.type] || humanize(item.signal_type || item.type),
    count: Number(item.count || item.total || 0),
  }));
  const total = rows.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black">Fraud Signal Breakdown</h2>
      <p className="mt-1 text-sm text-ink-secondary">Types of ghost worker signals detected</p>
      <div className="relative mt-6 h-[320px]">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={rows} dataKey="count" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
              {rows.map((entry) => <Cell key={entry.type} fill={colors[entry.type] || "#64748b"} />)}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-x-0 top-[118px] text-center">
          <p className="text-3xl font-black">{total}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-ink-tertiary">signals</p>
        </div>
      </div>
    </section>
  );
}

function humanize(value?: string) {
  return String(value || "Unknown").toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
