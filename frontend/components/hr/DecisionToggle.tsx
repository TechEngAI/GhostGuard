"use client";

import { useState } from "react";

export function DecisionToggle({ onDecision }: { onDecision: (decision: "INCLUDE" | "EXCLUDE", note?: string) => void }) {
  const [excluding, setExcluding] = useState(false);
  const [note, setNote] = useState("");
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => onDecision("INCLUDE")} className="rounded-lg border border-green-300 px-3 py-2 text-sm font-bold text-green-700 hover:bg-green-50">Include</button>
        <button onClick={() => setExcluding(true)} className="rounded-lg border border-red-300 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50">Exclude</button>
      </div>
      {excluding && (
        <div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason for exclusion" className="h-24 w-full rounded-lg border border-border p-3 text-sm" />
          <button onClick={() => onDecision("EXCLUDE", note)} disabled={!note.trim()} className="mt-2 w-full rounded-lg bg-red-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">Confirm Exclusion</button>
        </div>
      )}
    </div>
  );
}
