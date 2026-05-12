"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { FilterBar } from "@/components/shared/FilterBar";
import { WorkerDrawer } from "@/components/admin/WorkerDrawer";
import { WorkerTable } from "@/components/admin/WorkerTable";
import { useWorkers } from "@/hooks/useWorkers";

export default function WorkersPage() {
  const { workers, total, loading, reload } = useWorkers();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const filtered = useMemo(() => workers.filter((worker) => {
    const text = `${worker.first_name} ${worker.last_name} ${worker.email}`.toLowerCase();
    return (!search || text.includes(search.toLowerCase())) && (!status || worker.status === status);
  }), [workers, search, status]);
  return (
    <main className="p-6">
      <div className="mb-6"><h1 className="text-3xl font-bold">Workers</h1><p className="text-sm text-ink-secondary">{total} workers in your company</p></div>
      <FilterBar>
        <label className="min-w-72 flex-1 text-sm font-semibold">Search<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or email" className="mt-1 w-full rounded-lg border border-border px-3 py-2" /></label>
        <label className="text-sm font-semibold">Status<select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-44 rounded-lg border border-border px-3 py-2"><option value="">All</option><option>ACTIVE</option><option>PENDING_BANK</option><option>SUSPENDED</option></select></label>
        <Search className="h-5 w-5 text-ink-secondary" />
      </FilterBar>
      <div className="mt-4"><WorkerTable workers={filtered} loading={loading} onView={setSelected} /></div>
      <WorkerDrawer worker={selected} open={!!selected} onClose={() => setSelected(null)} onChanged={reload} />
    </main>
  );
}
