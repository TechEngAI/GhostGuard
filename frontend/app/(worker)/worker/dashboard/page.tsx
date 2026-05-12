"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CheckInCard } from "@/components/worker/CheckInCard";
import { GpsStatusIndicator } from "@/components/worker/GpsStatusIndicator";
import { checkIn, checkOut, getTodayAttendance, getWorkerProfile, unwrapError } from "@/lib/api";
import { unwrapData } from "@/lib/utils";
import { useDeviceFingerprint } from "@/hooks/useDeviceFingerprint";
import { useGps } from "@/hooks/useGps";

function distanceMetres(aLat?: number | null, aLng?: number | null, bLat?: number | null, bLng?: number | null) {
  if (aLat == null || aLng == null || bLat == null || bLng == null) return null;
  const r = 6371000;
  const p1 = (aLat * Math.PI) / 180;
  const p2 = (bLat * Math.PI) / 180;
  const dp = ((bLat - aLat) * Math.PI) / 180;
  const dl = ((bLng - aLng) * Math.PI) / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function WorkerDashboardPage() {
  const [today, setToday] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { gps, getLocation } = useGps();
  const deviceId = useDeviceFingerprint();
  useEffect(() => {
    getLocation();
    async function load() {
      try {
        const [todayRes, profileRes] = await Promise.all([getTodayAttendance(), getWorkerProfile()]);
        setToday(unwrapData<any>(todayRes));
        setProfile(unwrapData<any>(profileRes).worker || unwrapData<any>(profileRes));
      } catch (error) {
        toast.error(unwrapError(error));
      }
    }
    load();
  }, [getLocation]);
  const company = profile?.companies || profile?.company || {};
  const isRemote = profile?.roles?.work_type === "REMOTE";
  const distance = useMemo(() => distanceMetres(gps.latitude, gps.longitude, Number(company.office_lat), Number(company.office_lng)), [gps.latitude, gps.longitude, company.office_lat, company.office_lng]);
  const status = today?.status || "NOT_CHECKED_IN";
  const inRange = isRemote || distance == null || distance <= Number(company.geofence_radius || 100);
  async function doCheckIn() {
    getLocation();
    if (gps.latitude == null || gps.longitude == null) return toast.error("Location is not ready yet.");
    setLoading(true);
    try {
      const response = await checkIn({ latitude: gps.latitude, longitude: gps.longitude, device_id: deviceId, user_agent: navigator.userAgent });
      toast.success("Checked in! Have a great day.");
      if ((unwrapData<any>(response).fraud_signals_detected || []).length) toast("Note: anomaly recorded. Contact admin.");
      const next = await getTodayAttendance();
      setToday(unwrapData<any>(next));
    } catch (error) {
      toast.error(unwrapError(error));
    } finally {
      setLoading(false);
    }
  }
  async function doCheckOut() {
    getLocation();
    if (gps.latitude == null || gps.longitude == null) return toast.error("Location is not ready yet.");
    setLoading(true);
    try {
      const response = await checkOut({ latitude: gps.latitude, longitude: gps.longitude });
      toast.success(`Checked out. You worked ${unwrapData<any>(response).hours_worked || 0}h today.`);
      const next = await getTodayAttendance();
      setToday(unwrapData<any>(next));
    } catch (error) {
      toast.error(unwrapError(error));
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="p-6">
      <div className="mx-auto max-w-lg space-y-4">
        <CheckInCard today={today} />
        {status === "NOT_CHECKED_IN" && <GpsStatusIndicator gps={gps} isRemote={isRemote} distance={distance} radius={Number(company.geofence_radius || 100)} onRetry={getLocation} />}
        <button
          disabled={loading || status === "CHECKED_OUT" || (status === "NOT_CHECKED_IN" && (!inRange || gps.status === "loading"))}
          onClick={status === "CHECKED_IN" ? doCheckOut : doCheckIn}
          className={`w-full rounded-lg px-5 py-4 text-lg font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-300 ${status === "CHECKED_IN" ? "bg-amber-600" : !inRange ? "bg-red-700" : "bg-brand"}`}
        >
          {loading ? "Working..." : status === "CHECKED_IN" ? "Check Out" : status === "CHECKED_OUT" ? "See you tomorrow" : gps.status === "loading" ? "Detecting location..." : !inRange ? "Outside Office Boundary" : "Check In Now"}
        </button>
      </div>
    </main>
  );
}
