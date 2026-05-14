"use client";

import { useState, useEffect } from "react";
import { useGps } from "@/hooks/useGps";
import { useDeviceFingerprint } from "@/hooks/useDeviceFingerprint";
import { checkIn, checkOut } from "@/lib/api";
import { Clock, CheckCircle2, MapPin, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

interface AttendanceRecord {
  id: string;
  check_in_time: string;
  check_out_time: string | null;
  hours_worked: number | null;
  distance_from_office: number | null;
  is_late: boolean;
}

interface CheckInCardProps {
  todayRecord?: {
    status: "NOT_CHECKED_IN" | "CHECKED_IN" | "CHECKED_OUT";
    record: AttendanceRecord | null;
  } | null;
  onStatusChange?: () => void;
  // Legacy props for backwards compatibility with dashboard
  today?: any;
}

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours % 1) * 60);
  return `${h}h ${m}m`;
}

export function CheckInCard({ todayRecord, onStatusChange, today }: CheckInCardProps) {
  // Support both new and legacy prop names
  const data = todayRecord || today;
  const handleStatusChange = onStatusChange || (() => {});
  const { gps, getLocation } = useGps();
  const deviceId = useDeviceFingerprint();
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const status = data?.status || "NOT_CHECKED_IN";
  const record = data?.record;

  // Timer effect for CHECKED_IN state
  useEffect(() => {
    if (status !== "CHECKED_IN" || !record?.check_in_time) return;

    const interval = setInterval(() => {
      const elapsedMs = Date.now() - new Date(record.check_in_time).getTime();
      setElapsed(Math.floor(elapsedMs / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [status, record?.check_in_time]);

  const formatElapsed = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  async function handleCheckIn() {
    await getLocation();
    if (gps.latitude === null) {
      toast.error("Wait for GPS to detect your location before checking in.");
      return;
    }

    setIsCheckingIn(true);
    try {
      const response = await checkIn({
        latitude: gps.latitude,
        longitude: gps.longitude,
        accuracy: gps.accuracy,
        device_id: deviceId ?? "unknown",
        user_agent: navigator.userAgent,
      });

      toast.success(response.data.message || "Checked in! Have a great day.");
      if ((response.data.data?.fraud_signals_detected || []).length > 0) {
        toast("Note: location anomaly recorded.", { icon: "⚠️" });
      }
      handleStatusChange();
    } catch (error: any) {
      const errorCode = error.response?.data?.error?.code;
      const errorData = error.response?.data?.error?.data;

      if (errorCode === "OUTSIDE_GEOFENCE") {
        const dist = errorData?.distance_metres;
        const radius = errorData?.geofence_radius;
        toast.error(
          `You are ${Math.round(dist)}m away. Must be within ${radius}m to check in.`,
          { duration: 6000 }
        );
      } else if (errorCode === "GPS_ACCURACY_POOR") {
        const accuracy = errorData?.accuracy_metres;
        toast.error(
          `GPS signal too weak (±${Math.round(accuracy)}m). Move outdoors to an open area and try again.`,
          { duration: 6000 }
        );
      } else if (errorCode === "BANK_NOT_VERIFIED") {
        toast.error("Complete your bank verification first.");
      } else if (errorCode === "ALREADY_CHECKED_IN") {
        toast.error("You are already checked in.");
        handleStatusChange();
      } else if (errorCode === "ACCOUNT_NOT_ACTIVE") {
        toast.error("Your account is not active. Contact your administrator.");
      } else {
        toast.error(error.response?.data?.error?.message || "Check-in failed. Please try again.");
      }
    } finally {
      setIsCheckingIn(false);
    }
  }

  async function handleCheckOut() {
    setIsCheckingOut(true);
    try {
      const response = await checkOut({
        latitude: gps.latitude || undefined,
        longitude: gps.longitude || undefined,
      });

      toast.success(`Checked out. You worked ${formatHours(response.data.data?.hours_worked || 0)} today.`);
      handleStatusChange();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Check-out failed. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  }

  // NOT_CHECKED_IN state
  if (status === "NOT_CHECKED_IN") {
    return (
      <div className="space-y-4">
        <section className="mx-auto max-w-md rounded-2xl border border-border bg-white p-6 text-center shadow-sm">
          <Clock className="mx-auto h-12 w-12 text-ink-secondary" />
          <h1 className="mt-4 text-2xl font-bold text-ink">Not checked in</h1>
          <p className="mt-2 text-sm text-ink-secondary">{format(new Date(), "EEEE, MMMM d")}</p>
        </section>

        {/* GPS Status Indicator */}
        <div className="mx-auto max-w-md">
          {(gps.status === "idle" || gps.status === "loading") && (
            <div className="rounded-2xl border border-border bg-gray-50 p-4 text-center text-sm">
              {gps.status === "idle" ? (
                <p className="text-ink-secondary">Tap Check In to detect your location</p>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-ink-secondary">Detecting your location...</span>
                </div>
              )}
            </div>
          )}

          {gps.status === "success" && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-center text-sm">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <MapPin className="h-4 w-4" />
                <span className="font-semibold">Location detected</span>
              </div>
              <p className="mt-2 text-xs text-ink-secondary">GPS accuracy: ±{Math.round(gps.accuracy || 0)}m</p>
              {gps.accuracy && gps.accuracy > 100 && (
                <p className="mt-2 text-xs font-semibold text-amber-700">⚠ Low accuracy — move to open space</p>
              )}
            </div>
          )}

          {(gps.status === "error" || gps.status === "denied") && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm">
              <div className="flex gap-2 text-amber-800">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{gps.error}</span>
              </div>
              <button
                onClick={getLocation}
                className="mt-3 w-full rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-amber-700 active:scale-95"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Check-In Button */}
        <button
          onClick={handleCheckIn}
          disabled={
            gps.status === "loading" ||
            gps.status === "error" ||
            gps.status === "denied" ||
            isCheckingIn
          }
          className="mx-auto block w-full max-w-md rounded-2xl bg-brand px-8 py-4 text-lg font-black text-white shadow-lg transition-all hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
        >
          {isCheckingIn ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Checking in...</span>
            </div>
          ) : gps.status === "loading" ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Detecting location...</span>
            </div>
          ) : gps.status === "error" || gps.status === "denied" ? (
            "Enable location to check in"
          ) : (
            "Check In Now"
          )}
        </button>
      </div>
    );
  }

  // CHECKED_IN state
  if (status === "CHECKED_IN" || record?.check_in_time) {
    return (
      <div className="space-y-4">
        <section className="mx-auto max-w-md rounded-2xl border border-emerald-200 bg-[#E1F5EE] p-6 text-center shadow-sm">
          <div className="mx-auto h-3 w-3 animate-pulse rounded-full bg-green-500" />
          <h1 className="mt-4 text-2xl font-bold text-brand-dark">Checked in</h1>
          <p className="mt-2 text-4xl font-bold font-mono text-brand">{formatElapsed(elapsed)}</p>
          <p className="mt-2 text-sm text-ink-secondary">
            Checked in at {format(new Date(record!.check_in_time), "hh:mm a")}
          </p>
          {record?.distance_from_office != null && (
            <p className="mt-1 text-sm text-ink-secondary">📍 {Math.round(record.distance_from_office)}m from office</p>
          )}
          {record?.is_late && (
            <p className="mt-3 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
              Late arrival
            </p>
          )}
        </section>

        {/* Check-Out Button */}
        <button
          onClick={handleCheckOut}
          disabled={isCheckingOut}
          className="mx-auto block w-full max-w-md rounded-2xl bg-amber-600 px-8 py-4 text-lg font-black text-white shadow-lg transition-all hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-75"
        >
          {isCheckingOut ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Checking out...</span>
            </div>
          ) : (
            "Check Out"
          )}
        </button>
      </div>
    );
  }

  // CHECKED_OUT state
  if (status === "CHECKED_OUT" || record?.check_out_time) {
    return (
      <section className="mx-auto max-w-md rounded-2xl border-2 border-brand bg-white p-6 text-center shadow-sm">
        <CheckCircle2 className="mx-auto h-12 w-12 text-brand" />
        <h1 className="mt-4 text-2xl font-bold text-ink">Day complete ✓</h1>
        <p className="mt-2 text-lg font-semibold text-ink-secondary">
          {formatHours(record?.hours_worked || 0)} worked today
        </p>
        <p className="mt-1 text-sm text-ink-secondary">
          {format(new Date(record!.check_in_time), "hh:mm a")} → {format(new Date(record!.check_out_time!), "hh:mm a")}
        </p>
        <p className="mt-4 text-sm font-semibold text-ink-tertiary">See you tomorrow</p>
      </section>
    );
  }

  return null;
}
