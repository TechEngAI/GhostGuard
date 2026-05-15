"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getWorkerAttendanceAdmin, getWorkerDetail, unwrapError } from "@/lib/api";
import { unwrapData } from "@/lib/utils";

export default function WorkerDetailPage({ params }: { params: { id: string } }) {
  const [worker, setWorker] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const month = new Date().toISOString().slice(0, 7);
  useEffect(() => {
    async function load() {
      try {
        const [workerRes, attendanceRes] = await Promise.all([getWorkerDetail(params.id), getWorkerAttendanceAdmin(params.id, { month })]);
        setWorker(unwrapData<any>(workerRes).worker || unwrapData<any>(workerRes));
        const data = unwrapData<any>(attendanceRes);
        setAttendance(data.records || []);
      } catch (error) {
        toast.error(unwrapError(error));
      }
    }
    load();
  }, [params.id]);
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold">{worker ? `${worker.first_name} ${worker.last_name}` : "Worker detail"}</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_2fr]">
        <section className="rounded-lg border border-border bg-white p-5">
          <h2 className="font-bold">Profile</h2>
          {worker && Object.entries(worker).filter(([_, value]) => typeof value !== "object").slice(0, 14).map(([key, value]) => <p key={key} className="mt-2 text-sm"><span className="text-ink-secondary">{key}: </span>{String(value || "Not set")}</p>)}
        </section>
        <section className="rounded-lg border border-border bg-white p-5">
          <h2 className="font-bold">Attendance this month</h2>
          <div className="mt-3 divide-y divide-border">{attendance.map((row) => <div key={row.id} className="py-3 text-sm">{row.check_in_time} · {row.status} · {row.hours_worked || 0}h</div>)}</div>
        </section>
      </div>
    </main>
  );
}
