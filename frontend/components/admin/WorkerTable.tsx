"use client";

import { Eye } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { getInitials } from "@/lib/utils";

function badge(text: string, cls: string) {
  return <span className={`rounded-full border px-2 py-1 text-xs font-bold ${cls}`}>{text}</span>;
}

export function WorkerTable({ workers, loading, onView }: { workers: any[]; loading?: boolean; onView: (worker: any) => void }) {
  return (
    <DataTable
      loading={loading}
      data={workers}
      onRowClick={onView}
      emptyMessage="No workers match these filters."
      columns={[
        {
          label: "Name",
          key: "name",
          render: (worker) => (
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-light text-sm font-bold text-brand-dark">{getInitials(worker.first_name, worker.last_name)}</span>
              <div><p className="font-semibold">{worker.first_name} {worker.last_name}</p><p className="text-xs text-ink-secondary">{worker.email}</p></div>
            </div>
          ),
        },
        { label: "Role", key: "role", render: (worker) => worker.roles?.role_name || "Unassigned" },
        { label: "Bank", key: "bank", render: (worker) => worker.bank_verified ? badge("VERIFIED", "border-green-300 bg-green-100 text-green-700") : badge(worker.worker_bank_accounts?.[0]?.match_status || "PENDING", "border-amber-300 bg-amber-100 text-amber-700") },
        { label: "Profile", key: "score", render: (worker) => {
          const score = Math.round(Number(worker.completeness_score || 0) * 100);
          const cls = score < 40 ? "bg-red-100 text-red-700 border-red-300" : score < 70 ? "bg-amber-100 text-amber-700 border-amber-300" : "bg-green-100 text-green-700 border-green-300";
          return badge(`${score}%`, cls);
        } },
        { label: "Status", key: "status", render: (worker) => {
          const cls = worker.status === "ACTIVE" ? "border-green-300 bg-green-100 text-green-700" : worker.status === "SUSPENDED" ? "border-red-300 bg-red-100 text-red-700" : "border-amber-300 bg-amber-100 text-amber-700";
          return badge(worker.status, cls);
        } },
        { label: "Actions", key: "actions", render: (worker) => <button onClick={(e) => { e.stopPropagation(); onView(worker); }} className="rounded-md p-2 hover:bg-gray-100"><Eye className="h-4 w-4" /></button> },
      ]}
    />
  );
}
