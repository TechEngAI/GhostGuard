import { CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { AttendanceTimer } from "@/components/worker/AttendanceTimer";
import { formatHours } from "@/lib/utils";

export function CheckInCard({ today }: { today: any }) {
  const status = today?.status || "NOT_CHECKED_IN";
  const record = today?.record;
  if (status === "CHECKED_IN" || record?.status === "OPEN") {
    return (
      <section className="rounded-lg border border-emerald-200 bg-[#E1F5EE] p-6 text-center">
        <span className="mx-auto block h-3 w-3 animate-pulse rounded-full bg-green-500" />
        <h1 className="mt-4 text-2xl font-bold text-brand-dark">Checked in</h1>
        <p className="mt-2 text-4xl font-bold"><AttendanceTimer startTime={record.check_in_time} /></p>
        <p className="mt-2 text-sm text-ink-secondary">Checked in at {format(new Date(record.check_in_time), "hh:mm a")}</p>
        {record.distance_from_office != null && <p className="mt-1 text-sm text-ink-secondary">{Math.round(record.distance_from_office)}m from office</p>}
      </section>
    );
  }
  if (status === "CHECKED_OUT" || record?.status === "CLOSED") {
    return (
      <section className="rounded-lg border border-emerald-300 bg-white p-6 text-center">
        <CheckCircle className="mx-auto h-10 w-10 text-brand" />
        <h1 className="mt-4 text-2xl font-bold">Day complete</h1>
        <p className="mt-2 text-lg font-semibold">{formatHours(Number(record.hours_worked || 0))} worked today</p>
        <p className="mt-1 text-sm text-ink-secondary">{format(new Date(record.check_in_time), "hh:mm a")} → {format(new Date(record.check_out_time), "hh:mm a")}</p>
      </section>
    );
  }
  return (
    <section className="rounded-lg border border-border bg-white p-6 text-center">
      <Clock className="mx-auto h-10 w-10 text-ink-secondary" />
      <h1 className="mt-4 text-2xl font-bold">Not checked in</h1>
      <p className="mt-2 text-sm text-ink-secondary">{format(new Date(), "EEEE, MMMM d")}</p>
    </section>
  );
}
