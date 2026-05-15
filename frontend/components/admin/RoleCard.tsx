"use client";

import { Pencil, RefreshCw, Trash2 } from "lucide-react";
import { InviteCodeDisplay } from "@/components/admin/InviteCodeDisplay";
import { formatNGN } from "@/lib/utils";

const badge: Record<string, string> = {
  ONSITE: "bg-emerald-100 text-emerald-700",
  REMOTE: "bg-blue-100 text-blue-700",
  HYBRID: "bg-amber-100 text-amber-700",
};

export function RoleCard({ role, onRegenerate, onDelete }: { role: any; onRegenerate: (role: any) => void; onDelete: (role: any) => void }) {
  const filled = Number(role.headcount_filled || 0);
  const max = Number(role.headcount_max || 0);
  const progress = max ? Math.min(100, (filled / max) * 100) : 0;
  return (
    <article className="rounded-lg border border-border bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold">{role.role_name}</h3>
          <p className="mt-1 text-sm text-ink-secondary">{role.department || "Unassigned department"}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${badge[role.work_type] || badge.ONSITE}`}>{role.work_type || "ONSITE"}</span>
      </div>
      <div className="mt-5">
        <div className="flex justify-between text-sm font-semibold">
          <span>Headcount</span>
          <span>{filled}/{max}</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-gray-100"><div className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} /></div>
      </div>
      <p className="mt-4 text-lg font-bold text-brand-dark">{formatNGN(Number(role.gross_salary || 0))}</p>
      <div className="mt-4"><InviteCodeDisplay code={role.invite_code} compact /></div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-ink-secondary"><Pencil className="h-4 w-4" /> Edit</button>
        <button onClick={() => onRegenerate(role)} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-ink-secondary"><RefreshCw className="h-4 w-4" /> Regenerate</button>
        <button disabled={filled > 0} onClick={() => onDelete(role)} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"><Trash2 className="h-4 w-4" /> Delete</button>
      </div>
    </article>
  );
}
