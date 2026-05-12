"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { updateCompany, unwrapError } from "@/lib/api";

const GpsMapPicker = dynamic(() => import("@/components/onboarding/GpsMapPicker"), { ssr: false });
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CompanySetupForm() {
  const router = useRouter();
  const [lat, setLat] = useState<number>();
  const [lng, setLng] = useState<number>();
  const [radius, setRadius] = useState(100);
  const [workStart, setWorkStart] = useState("08:00");
  const [workEnd, setWorkEnd] = useState("18:00");
  const [workingDays, setWorkingDays] = useState(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [payrollCycle, setPayrollCycle] = useState("MONTHLY");
  const [timezone, setTimezone] = useState("Africa/Lagos");
  const [loading, setLoading] = useState(false);

  function useLocation() {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
      },
      () => toast.error("Could not get your location. Please click on the map."),
    );
  }

  async function submit() {
    if (!lat || !lng) {
      toast.error("Choose your office location on the map.");
      return;
    }
    setLoading(true);
    try {
      await updateCompany({
        office_lat: lat,
        office_lng: lng,
        geofence_radius: radius,
        work_start_time: workStart,
        work_end_time: workEnd,
        working_days: workingDays.join("-"),
        payroll_cycle: payrollCycle,
        timezone,
      });
      toast.success("Company setup complete!");
      router.push("/admin/dashboard");
    } catch (error) {
      toast.error(unwrapError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="rounded-xl border border-border bg-white p-6">
        <h2 className="text-2xl font-bold">Company settings</h2>
        <div className="mt-6 space-y-5">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Geofence radius: {radius}m</span>
            <input type="range" min={50} max={500} step={10} value={radius} onChange={(event) => setRadius(Number(event.target.value))} className="w-full accent-brand" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Work start time" type="time" value={workStart} onChange={(event) => setWorkStart(event.target.value)} />
            <Input label="Work end time" type="time" value={workEnd} onChange={(event) => setWorkEnd(event.target.value)} />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Working days</p>
            <div className="grid grid-cols-4 gap-2">
              {days.map((day) => (
                <label key={day} className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm">
                  <input type="checkbox" checked={workingDays.includes(day)} onChange={() => setWorkingDays((list) => (list.includes(day) ? list.filter((item) => item !== day) : [...list, day]))} />
                  {day}
                </label>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {["MONTHLY", "BI_WEEKLY"].map((cycle) => (
              <button key={cycle} type="button" onClick={() => setPayrollCycle(cycle)} className={`rounded-xl border p-4 text-left font-semibold ${payrollCycle === cycle ? "border-brand bg-brand-light text-brand-dark" : "border-border"}`}>
                {cycle === "MONTHLY" ? "Monthly" : "Bi-weekly"}
              </button>
            ))}
          </div>
          <Select label="Timezone" options={["Africa/Lagos"]} value={timezone} onChange={(event) => setTimezone(event.target.value)} />
          <Button className="w-full" onClick={submit} isLoading={loading}>Save setup</Button>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-white p-6">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div><h2 className="text-2xl font-bold">Office GPS boundary</h2><p className="text-sm text-ink-secondary">Click on the map or use your current location.</p></div>
          <Button variant="secondary" onClick={useLocation}>Use my current location</Button>
        </div>
        <GpsMapPicker lat={lat} lng={lng} radius={radius} onChange={(nextLat, nextLng) => { setLat(nextLat); setLng(nextLng); }} />
        <p className="mt-3 text-sm text-ink-secondary">lat: {lat?.toFixed(5) || "--"}, lng: {lng?.toFixed(5) || "--"}</p>
      </div>
    </div>
  );
}
