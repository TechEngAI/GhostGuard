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

import PageWrapper from "@/components/shared/PageWrapper";

export default function WorkerDashboardPage() {
  const [today, setToday] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { gps, getLocation } = useGps();
  const deviceId = useDeviceFingerprint();

  useEffect(() => {
    getLocation().catch(() => {}); // Initial location fetch
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
    setLoading(true);
    try {
      const coords = await getLocation();
      const response = await checkIn({ 
        latitude: coords.latitude, 
        longitude: coords.longitude, 
        accuracy: gps.accuracy, 
        device_id: deviceId, 
        user_agent: navigator.userAgent 
      });
      toast.success("Checked in! Have a great day.");
      if ((unwrapData<any>(response).fraud_signals_detected || []).length) toast("Note: anomaly recorded. Contact admin.");
      const next = await getTodayAttendance();
      setToday(unwrapData<any>(next));
    } catch (error) {
      const errorData = error instanceof Error ? error.message : unwrapError(error);
      const errorCode = (error as any).response?.data?.error?.code;
      if (errorCode === "GPS_ACCURACY_POOR") {
        const accuracy = (error as any).response?.data?.error?.data?.accuracy_metres;
        toast.error(
          `GPS signal too weak (±${Math.round(accuracy)}m). Move outdoors to an open area and try again.`,
          { duration: 6000 }
        );
      } else if (errorCode === "OUTSIDE_GEOFENCE") {
        const dist = (error as any).response?.data?.error?.data?.distance_metres;
        const radius = (error as any).response?.data?.error?.data?.geofence_radius;
        toast.error(
          `You are ${Math.round(dist)}m from the office. Must be within ${radius}m.`,
          { duration: 6000 }
        );
      } else {
        toast.error(errorData);
      }
    } finally {
      setLoading(false);
    }
  }

  async function doCheckOut() {
    setLoading(true);
    try {
      const coords = await getLocation();
      const response = await checkOut({ 
        latitude: coords.latitude, 
        longitude: coords.longitude,
        accuracy: gps.accuracy
      });
      toast.success(`Checked out. You worked ${unwrapData<any>(response).hours_worked || 0}h today.`);
      const next = await getTodayAttendance();
      setToday(unwrapData<any>(next));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : unwrapError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageWrapper className="p-8 max-w-2xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black tracking-tight text-ink">Worker Dashboard</h1>
        <p className="text-sm font-medium text-ink-secondary mt-1">
          {profile ? `Welcome back, ${profile.first_name}` : "Check in to start your workday"}
        </p>
      </div>

      <div className="space-y-6">
        <CheckInCard today={today} />
        
        {status === "NOT_CHECKED_IN" && (
          <GpsStatusIndicator 
            gps={gps} 
            isRemote={isRemote} 
            distance={distance} 
            radius={Number(company.geofence_radius || 100)} 
            onRetry={getLocation} 
          />
        )}

        <button
          disabled={loading || status === "CHECKED_OUT" || (status === "NOT_CHECKED_IN" && (!inRange || gps.status === "loading"))}
          onClick={status === "CHECKED_IN" ? doCheckOut : doCheckIn}
          className={`relative w-full overflow-hidden rounded-[32px] px-8 py-6 text-xl font-black text-white shadow-2xl transition-all active:scale-95 disabled:scale-100 disabled:cursor-not-allowed disabled:bg-gray-300 ${
            status === "CHECKED_IN" 
              ? "bg-amber-600 shadow-amber-500/20" 
              : !inRange 
                ? "bg-red-700 shadow-red-500/20" 
                : "bg-brand shadow-brand/20"
          }`}
        >
          <span className="relative z-10">
            {loading ? "Processing..." : status === "CHECKED_IN" ? "Check Out" : status === "CHECKED_OUT" ? "See you tomorrow" : gps.status === "loading" ? "Detecting location..." : !inRange ? "Outside Boundary" : "Check In Now"}
          </span>
          {status !== "CHECKED_OUT" && !loading && (
             <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
          )}
        </button>
      </div>
    </PageWrapper>
  );
}
