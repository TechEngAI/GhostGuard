"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useState } from "react";
import toast from "react-hot-toast";
import { reactivateWorker, suspendWorker, unwrapError, verifyWorkerBank } from "@/lib/api";

export function WorkerDrawer({ worker, open, onClose, onChanged }: { worker: any; open: boolean; onClose: () => void; onChanged: () => void }) {
  const [confirm, setConfirm] = useState<"suspend" | "reactivate" | null>(null);
  if (!open || !worker) return null;
  const bank = worker.worker_bank_accounts?.[0] || {};
  async function bankAction(action: "approve" | "reject") {
    try {
      await verifyWorkerBank(worker.id, { action });
      toast.success(`Bank ${action}d.`);
      onChanged();
    } catch (error) {
      toast.error(unwrapError(error));
    }
  }
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-[480px] overflow-y-auto bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{worker.first_name} {worker.last_name}</h2>
            <p className="text-sm text-ink-secondary">{worker.roles?.role_name || "Worker"} · {worker.status}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-2 hover:bg-gray-100"><X /></button>
        </div>
        <section className="mt-6">
          <h3 className="font-bold">Personal Info</h3>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            {["email", "phone_number", "gender", "date_of_birth", "home_address", "state_of_origin", "nin"].map((field) => (
              <div key={field} className="rounded-lg bg-gray-50 p-3"><p className="text-xs text-ink-secondary">{field.replaceAll("_", " ")}</p><p className="font-semibold">{worker[field] || "Not set"}</p></div>
            ))}
          </div>
        </section>
        <section className="mt-6">
          <h3 className="font-bold">Bank Account</h3>
          <div className="mt-3 rounded-lg border border-border p-4 text-sm">
            <p>{bank.bank_name || "No bank submitted"} · {bank.account_number ? `****${String(bank.account_number).slice(-4)}` : "No account"}</p>
            <p className="mt-1 text-ink-secondary">Match score: {bank.match_score ?? 0}% · {bank.match_status || "PENDING"}</p>
            {bank.match_status === "MANUAL_REVIEW" && (
              <div className="mt-3 flex gap-2">
                <button onClick={() => bankAction("approve")} className="rounded-lg bg-brand px-3 py-2 text-sm font-bold text-white">Approve</button>
                <button onClick={() => bankAction("reject")} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700">Reject</button>
              </div>
            )}
          </div>
        </section>
        <section className="mt-6 grid gap-2">
          <Link href={`/admin/fraud-signals?worker=${worker.id}`} className="rounded-lg border border-border px-4 py-3 text-sm font-semibold">View fraud signals</Link>
          <Link href={`/admin/workers/${worker.id}`} className="rounded-lg border border-border px-4 py-3 text-sm font-semibold">View attendance history</Link>
        </section>
        <div className="mt-6 flex gap-2">
          {worker.status === "SUSPENDED" ? (
            <button onClick={() => setConfirm("reactivate")} className="rounded-lg bg-brand px-4 py-2 font-bold text-white">Reactivate</button>
          ) : (
            <button onClick={() => setConfirm("suspend")} className="rounded-lg bg-red-700 px-4 py-2 font-bold text-white">Suspend</button>
          )}
        </div>
      </aside>
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm === "suspend" ? "Suspend worker?" : "Reactivate worker?"}
        description="This changes the worker account status immediately."
        confirmVariant={confirm === "suspend" ? "danger" : "primary"}
        onConfirm={async () => {
          try {
            if (confirm === "suspend") await suspendWorker(worker.id, { reason: "Admin action" });
            if (confirm === "reactivate") await reactivateWorker(worker.id);
            toast.success("Worker updated.");
            onChanged();
          } catch (error) {
            toast.error(unwrapError(error));
          }
        }}
      />
    </>
  );
}
