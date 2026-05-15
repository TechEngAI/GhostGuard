"use client";

import { formatNGN } from "@/lib/utils";

export function SavingsHeroCard({ summary }: { summary: any }) {
  return (
    <section className="rounded-2xl bg-[#085041] p-6 text-white shadow-xl sm:p-8">
      <p className="text-sm font-bold uppercase tracking-widest text-white/60">GhostGuard has saved your company</p>
      <p className="mt-3 text-5xl font-black tracking-tight sm:text-6xl">{formatNGN(Number(summary?.total_salary_saved || 0))}</p>
      <p className="mt-4 max-w-2xl text-sm font-medium text-white/75">
        by detecting {summary?.total_ghosts_detected || 0} ghost workers across {summary?.total_payroll_runs || 0} payroll runs
      </p>
    </section>
  );
}
