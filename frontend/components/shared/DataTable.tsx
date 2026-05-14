"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./SkeletonLoader";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

export type Column<T> = {
  label: string;
  key: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
};

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading,
  emptyMessage = "No records found.",
  onRowClick,
}: {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const sortedData = useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="overflow-x-auto rounded-[32px] border border-border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-soft transition-colors duration-500">
      <table className="min-w-full divide-y divide-border dark:divide-slate-800 text-sm">
        <thead className="bg-gray-50 dark:bg-slate-800/50">
          <tr>
            {columns.map((column) => (
              <th 
                key={column.key} 
                className={cn(
                  "px-6 py-5 text-left text-xs font-black uppercase tracking-widest text-ink-tertiary dark:text-gray-500",
                  column.sortable && "cursor-pointer hover:text-brand transition-colors"
                )}
                onClick={() => column.sortable && requestSort(column.key)}
              >
                <div className="flex items-center gap-2">
                  {column.label}
                  {column.sortable && (
                    <span className="text-gray-400 dark:text-gray-600">
                      {sortConfig?.key === column.key ? (
                        sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronsUpDown className="h-3 w-3" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border dark:divide-slate-800">
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-5">
                      <Skeleton className="h-4 w-28 rounded-md" />
                    </td>
                  ))}
                </tr>
              ))
            : sortedData.map((row, index) => (
                <tr 
                  key={row.id || index} 
                  onClick={() => onRowClick?.(row)} 
                  className={cn(
                    "bg-white dark:bg-slate-900 transition-colors duration-300", 
                    onRowClick && "cursor-pointer hover:bg-brand/5 dark:hover:bg-brand/5"
                  )}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-5 align-middle text-ink dark:text-gray-300 font-medium">
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
      {!loading && data.length === 0 && (
        <div className="p-12 text-center text-sm font-bold text-ink-tertiary dark:text-gray-500 bg-white dark:bg-slate-900 rounded-b-[32px]">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}
