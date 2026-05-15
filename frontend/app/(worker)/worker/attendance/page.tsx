"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AttendanceCalendar } from "@/components/worker/AttendanceCalendar";
import { getAttendanceHistory, unwrapError } from "@/lib/api";
import { formatHours, unwrapData } from "@/lib/utils";

export default function WorkerAttendancePage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [records, setRecords] = useState<any[]>([]);
  useEffect(() => {
    async function load() {
      try {
        const response = await getAttendanceHistory({ month });
        const data = unwrapData<any>(response);
        setRecords(data.records || data.items || []);
      } catch (error) {
        toast.error(unwrapError(error));
      }
    }
    load();
  }, [month]);
  const summary = useMemo(() => ({
    present: new Set(records.map((r) => r.check_in_time?.slice(0, 10))).size,
    hours: records.reduce((sum, row) => sum + Number(row.hours_worked || 0), 0),
    late: records.filter((row) => row.is_late).length,
  }), [records]);
  return (
    <main className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-3xl font-bold">Attendance History</h1><p className="text-sm text-ink-secondary">Monthly check-in record</p></div>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-lg border border-border px-3 py-2" />
      </div>
      <AttendanceCalendar records={records} monthYear={month} />
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-lg bg-white p-4"><p className="text-sm text-ink-secondary">Days Present</p><p className="text-2xl font-bold">{summary.present}</p></div>
        <div className="rounded-lg bg-white p-4"><p className="text-sm text-ink-secondary">Days Absent</p><p className="text-2xl font-bold">{Math.max(0, 22 - summary.present)}</p></div>
        <div className="rounded-lg bg-white p-4"><p className="text-sm text-ink-secondary">Total Hours</p><p className="text-2xl font-bold">{formatHours(summary.hours)}</p></div>
        <div className="rounded-lg bg-white p-4"><p className="text-sm text-ink-secondary">Late Arrivals</p><p className="text-2xl font-bold">{summary.late}</p></div>
      </div>
    </main>
  );
}
