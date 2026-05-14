"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { getCompany, updateCompany, unwrapError } from "@/lib/api";
import type { Company } from "@/types";

const GpsMapPicker = dynamic(() => import("@/components/onboarding/GpsMapPicker"), { ssr: false });
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type CompanySetupFormProps = {
  mode?: "setup" | "settings";
};

function parseWorkingDays(value?: string) {
  if (!value) return ["Mon", "Tue", "Wed", "Thu", "Fri"];
  return value.split("-").filter((day) => days.includes(day));
}

export function CompanySetupForm({ mode = "setup" }: CompanySetupFormProps) {
  const router = useRouter();
  const [lat, setLat] = useState<number>();
  const [lng, setLng] = useState<number>();
  const [radius, setRadius] = useState(100);
  const [workStart, setWorkStart] = useState("08:00");
  const [workEnd, setWorkEnd] = useState("18:00");
  const [workingDays, setWorkingDays] = useState(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [payrollCycle, setPayrollCycle] = useState("MONTHLY");
  const [timezone, setTimezone] = useState("Africa/Lagos");
  const [loadingCompany, setLoadingCompany] = useState(mode === "settings");
  const [loading, setLoading] = useState(false);
  const isSettings = mode === "settings";

  useEffect(() => {
    if (!isSettings) return;

    let mounted = true;
    async function loadCompany() {
      setLoadingCompany(true);
      try {
        const response = await getCompany();
        const company = response.data.data as Company;
        if (!mounted) return;
        setLat(company.office_lat != null ? Number(company.office_lat) : undefined);
        setLng(company.office_lng != null ? Number(company.office_lng) : undefined);
        setRadius(Number(company.geofence_radius || 100));
        setWorkStart(String(company.work_start_time || "08:00").slice(0, 5));
        setWorkEnd(String(company.work_end_time || "18:00").slice(0, 5));
        setWorkingDays(parseWorkingDays(company.working_days));
        setPayrollCycle(company.payroll_cycle || "MONTHLY");
        setTimezone(company.timezone || "Africa/Lagos");
      } catch (error) {
        toast.error(unwrapError(error));
      } finally {
        if (mounted) setLoadingCompany(false);
      }
    }

    loadCompany();
    return () => {
      mounted = false;
    };
  }, [isSettings]);

  function useLocation() {
    if (!navigator.geolocation) {
      toast.error("Location is not available in this browser.");
      return;
    }
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
      toast.success(isSettings ? "Company settings updated." : "Company setup complete!");
      if (!isSettings) router.push("/admin/dashboard");
    } catch (error) {
      toast.error(unwrapError(error));
    } finally {
      setLoading(false);
    }
  }

  if (loadingCompany) {
    return (
      <div className="rounded-lg border border-border bg-white p-6 text-sm font-semibold text-ink-secondary">
        Loading company settings...
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-ink">Company settings</h2>
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
              <button key={cycle} type="button" onClick={() => setPayrollCycle(cycle)} className={`rounded-lg border p-4 text-left font-semibold ${payrollCycle === cycle ? "border-brand bg-brand-light text-brand-dark" : "border-border"}`}>
                {cycle === "MONTHLY" ? "Monthly" : "Bi-weekly"}
              </button>
            ))}
          </div>
          <Select label="Timezone" options={["Africa/Lagos"]} value={timezone} onChange={(event) => setTimezone(event.target.value)} />
          <Button className="w-full" onClick={submit} isLoading={loading}>{isSettings ? "Save company settings" : "Save setup"}</Button>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div><h2 className="text-xl font-black text-ink">Office GPS boundary</h2><p className="text-sm text-ink-secondary">Click on the map or use your current location.</p></div>
          <Button variant="secondary" onClick={useLocation}>Use my current location</Button>
        </div>
        <GpsMapPicker lat={lat} lng={lng} radius={radius} onChange={(nextLat, nextLng) => { setLat(nextLat); setLng(nextLng); }} />
        <p className="mt-3 text-sm text-ink-secondary">lat: {lat?.toFixed(5) || "--"}, lng: {lng?.toFixed(5) || "--"}</p>
      </div>
    </div>
  );
}
