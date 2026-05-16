"use client";
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { ConfirmContent } from "@/components/auth/ConfirmContent";

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center bg-slate-950 text-white"><div className="text-slate-400">Verifying...</div></main>}>
      <ConfirmContent />
    </Suspense>
  );
}
