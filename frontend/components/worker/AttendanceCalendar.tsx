"use client";

import { useState } from "react";
import { endOfMonth, format, getDay, startOfMonth } from "date-fns";
import { formatHours } from "@/lib/utils";

export function AttendanceCalendar({ records, monthYear }: { records: any[]; monthYear: string }) {
  const [selected, setSelected] = useState<any | null>(null);
  const first = startOfMonth(new Date(`${monthYear}-01T00:00:00`));
  const last = endOfMonth(first);
  const leading = (getDay(first) + 6) % 7;
  const days = Array.from({ length: leading + last.getDate() }, (_, index) => (index < leading ? null : index - leading + 1));
  const byDay = new Map(records.map((record) => [Number(record.check_in_time?.slice(8, 10)), record]));
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-ink-secondary">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="mt-2 grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          if (!day) return <div key={index} />;
          const date = new Date(first.getFullYear(), first.getMonth(), day);
          const weekend = [0, 6].includes(getDay(date));
          const record = byDay.get(day);
          const today = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
          return (
            <button key={day} onClick={() => setSelected(record || { day, absent: !weekend })} className={`min-h-24 rounded-lg border p-2 text-left text-xs ${record ? "border-green-200 bg-green-50" : weekend ? "border-gray-100 bg-gray-50" : "border-red-100 bg-red-50"} ${today ? "ring-2 ring-amber-300" : ""}`}>
              <span className="block text-right font-bold">{day}</span>
              <span className="mt-6 block">{record ? format(new Date(record.check_in_time), "HH:mm") : weekend ? "" : "Absent"}</span>
            </button>
          );
        })}
      </div>
      {selected && (
        <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm">
          {selected.absent ? "Absent" : (
            <div className="grid gap-1">
              <p>Check-in: {selected.check_in_time ? format(new Date(selected.check_in_time), "PPpp") : "None"}</p>
              <p>Check-out: {selected.check_out_time ? format(new Date(selected.check_out_time), "PPpp") : "Open"}</p>
              <p>Hours: {formatHours(Number(selected.hours_worked || 0))}</p>
              <p>Late: {selected.is_late ? "Yes" : "No"}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
