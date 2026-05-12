"use client";

import { cn } from "@/lib/utils";

export type Column<T> = {
  label: string;
  key: string;
  render?: (row: T) => React.ReactNode;
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
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-white">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3 text-left font-semibold text-ink-secondary">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-4">
                      <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                    </td>
                  ))}
                </tr>
              ))
            : data.map((row, index) => (
                <tr key={row.id || index} onClick={() => onRowClick?.(row)} className={cn("bg-white", onRowClick && "cursor-pointer hover:bg-emerald-50/40")}>
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-4 align-middle">
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
      {!loading && data.length === 0 && <div className="p-8 text-center text-sm text-ink-secondary">{emptyMessage}</div>}
    </div>
  );
}
