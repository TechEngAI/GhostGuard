"use client";

import { Clipboard } from "lucide-react";
import { useState } from "react";

export function InviteCodeDisplay({ code, compact = false }: { code: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className={`flex items-center justify-between gap-3 rounded-lg bg-gray-900 px-6 py-4 font-mono text-green-400 ${compact ? "text-sm" : "text-xl"}`}>
      <span className="truncate">{code}</span>
      <button onClick={copy} className="inline-flex shrink-0 items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20">
        <Clipboard className="h-4 w-4" /> {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
