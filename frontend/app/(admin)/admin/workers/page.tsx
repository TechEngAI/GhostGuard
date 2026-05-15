"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { FilterBar } from "@/components/shared/FilterBar";
import { WorkerDrawer } from "@/components/admin/WorkerDrawer";
import { WorkerTable } from "@/components/admin/WorkerTable";
import { useWorkers } from "@/hooks/useWorkers";

import PageWrapper from "@/components/shared/PageWrapper";

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
    <PageWrapper className="p-8 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-black tracking-tight text-ink">Workers Directory</h1>
        <p className="text-sm font-medium text-ink-secondary mt-1">
          {total} workers registered in your organization.
        </p>
      </div>

      <div className="bg-white rounded-[32px] border border-border p-8 shadow-sm overflow-hidden">
        <FilterBar className="mb-8 bg-gray-50/50 p-6 rounded-2xl border border-border/50">
          <div className="flex-1 min-w-[300px]">
            <label className="text-[10px] font-black uppercase tracking-widest text-ink-tertiary mb-1.5 block">Search Personnel</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-tertiary" />
              <input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Name, email or ID..." 
                className="w-full rounded-xl border border-border bg-white pl-10 pr-4 py-3 text-sm font-bold focus:border-brand focus:ring-4 focus:ring-brand/5 outline-none transition-all" 
              />
            </div>
          </div>
          <div className="w-48">
            <label className="text-[10px] font-black uppercase tracking-widest text-ink-tertiary mb-1.5 block">Status</label>
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value)} 
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-bold focus:border-brand focus:ring-4 focus:ring-brand/5 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option>ACTIVE</option>
              <option>PENDING_BANK</option>
              <option>SUSPENDED</option>
            </select>
          </div>
        </FilterBar>

        <div className="relative">
          <WorkerTable workers={filtered} loading={loading} onView={setSelected} />
          {filtered.length === 0 && !loading && (
            <div className="py-20 text-center">
              <p className="font-bold text-ink-tertiary">No personnel found matching these filters.</p>
            </div>
          )}
        </div>
      </div>

      <WorkerDrawer worker={selected} open={!!selected} onClose={() => setSelected(null)} onChanged={reload} />
    </PageWrapper>
  );
}
