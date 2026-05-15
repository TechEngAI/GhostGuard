"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, X, ChevronDown, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function AdvancedSearchBar() {
  const [query, setQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter) 
        : [...prev, filter]
    );
  };

  const filters = ["High Risk", "Verified", "Flagged", "Recently Active", "Lagos Office", "Abuja Office"];

  return (
    <div className="w-full space-y-4">
      <div className="relative group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-ink-tertiary dark:text-gray-500 group-focus-within:text-brand transition-colors">
          <Search className="h-5 w-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Global search across workers, departments, or signals..."
          className="w-full h-14 pl-14 pr-32 rounded-2xl bg-white dark:bg-slate-900 border border-border dark:border-slate-800 focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 dark:focus:ring-brand/10 text-ink dark:text-white font-medium transition-all shadow-soft"
        />
        <div className="absolute inset-y-0 right-2 flex items-center">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
              isFilterOpen 
                ? "bg-brand text-white shadow-lg shadow-brand/20" 
                : "bg-gray-100 dark:bg-slate-800 text-ink dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilters.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-brand text-[10px] font-black">
                {activeFilters.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 rounded-3xl bg-gray-50 dark:bg-slate-900/50 border border-border dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {filters.map((f) => {
                const isActive = activeFilters.includes(f);
                return (
                  <button
                    key={f}
                    onClick={() => toggleFilter(f)}
                    className={cn(
                      "flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
                      isActive 
                        ? "bg-brand/10 text-brand border border-brand/20" 
                        : "bg-white dark:bg-slate-800 text-ink-secondary dark:text-gray-400 border border-border dark:border-slate-700 hover:border-brand/30"
                    )}
                  >
                    {f}
                    {isActive && <Check className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map(f => (
            <span 
              key={f}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand text-white text-[10px] font-black uppercase tracking-wider"
            >
              {f}
              <button onClick={() => toggleFilter(f)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button 
            onClick={() => setActiveFilters([])}
            className="text-[10px] font-black text-ink-tertiary dark:text-gray-500 hover:text-brand transition-colors uppercase tracking-widest px-2"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
