"use client";

import { useCallback, useState } from "react";

interface GpsState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  status: "idle" | "loading" | "success" | "error" | "denied";
  error: string | null;
}

const initialState: GpsState = { latitude: null, longitude: null, accuracy: null, status: "idle", error: null };

export function useGps() {
  const [gps, setGps] = useState<GpsState>(initialState);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGps((prev) => ({ ...prev, status: "error", error: "Geolocation not supported by your browser." }));
      return;
    }
    setGps((prev) => ({ ...prev, status: "loading", error: null }));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGps({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          status: "success",
          error: null,
        });
      },
      (error) => {
        const messages: Record<number, string> = {
          1: "Location permission denied. Please allow location access and try again.",
          2: "Could not detect your location. Check your GPS signal.",
          3: "Location request timed out. Try again.",
        };
        setGps((prev) => ({ ...prev, status: error.code === 1 ? "denied" : "error", error: messages[error.code] || "Location error." }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, []);

  return { gps, getLocation };
}
