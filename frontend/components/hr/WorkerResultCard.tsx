"use client";

import { AlertCircle, Calendar, CreditCard, MapPin, Navigation, Smartphone } from "lucide-react";
import toast from "react-hot-toast";
import { DecisionToggle } from "@/components/hr/DecisionToggle";
import { TrustScoreGauge } from "@/components/hr/TrustScoreGauge";
import { makeWorkerDecision, unwrapError } from "@/lib/api";
import { formatNGN, getInitials } from "@/lib/utils";

function reasonIcon(reason: string) {
  const text = reason.toLowerCase();
  if (text.includes("zero") || text.includes("attendance")) return Calendar;
  if (text.includes("device")) return Smartphone;
  if (text.includes("impossible")) return Navigation;
  if (text.includes("bank")) return CreditCard;
  if (text.includes("gps") || text.includes("geofence")) return MapPin;
  return AlertCircle;
}

export function WorkerResultCard({ runId, result, onChanged }: { runId: string; result: any; onChanged: () => void }) {
  const border = result.verdict === "FLAGGED" ? "border-l-red-600" : result.verdict === "SUSPICIOUS" ? "border-l-amber-500" : "border-l-gray-300";
  async function decide(decision: "INCLUDE" | "EXCLUDE", note?: string) {
    try {
      await makeWorkerDecision(runId, result.worker_id, { decision, note });
      toast.success("Decision saved.");
      onChanged();
    } catch (error) {
      toast.error(unwrapError(error));
    }
  }
  return (
    <article className={`grid gap-6 rounded-lg border border-l-4 border-border bg-white p-5 lg:grid-cols-[200px_1fr_240px] ${border}`}>
      <div>
        <span className="grid h-12 w-12 place-items-center rounded-full bg-violet-100 font-bold text-[#534AB7]">{getInitials(result.worker_name?.split(" ")[0], result.worker_name?.split(" ")[1])}</span>
        <h3 className="mt-3 font-bold">{result.worker_name}</h3>
        <p className="text-sm text-ink-secondary">{result.role_name}</p>
        <p className="mt-3 text-sm font-bold">Net Pay: {formatNGN(Number(result.net_pay || result.gross_salary || 0))}</p>
        <p className="text-sm text-ink-secondary">Days present: {result.days_present}/{(result.days_present || 0) + (result.days_absent || 0)} days</p>
      </div>
      <div className="flex gap-5">
        <TrustScoreGauge score={Number(result.trust_score || 0)} />
        <ul className="space-y-2 text-sm">
          {(result.flag_reasons || []).map((reason: string) => {
            const Icon = reasonIcon(reason);
            return <li key={reason} className="flex gap-2"><Icon className="mt-0.5 h-4 w-4 text-ink-secondary" /> <span>{reason}</span></li>;
          })}
        </ul>
      </div>
      <div>
        {(result.hr_decision || "PENDING") === "PENDING" ? (
          <DecisionToggle onDecision={decide} />
        ) : (
          <div className="rounded-lg bg-gray-50 p-4 text-sm">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${result.hr_decision === "INCLUDE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{result.hr_decision === "INCLUDE" ? "Included" : "Excluded"}</span>
            {result.hr_note && <p className="mt-3 text-ink-secondary">{result.hr_note}</p>}
            <button onClick={() => decide("INCLUDE")} className="mt-3 text-xs font-semibold text-ink-secondary">Undo</button>
          </div>
        )}
      </div>
    </article>
  );
}
