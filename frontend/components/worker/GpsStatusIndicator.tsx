import { AlertTriangle, Loader2, MapPin } from "lucide-react";

export function GpsStatusIndicator({ gps, isRemote = false, distance, radius = 100, onRetry }: { gps: any; isRemote?: boolean; distance?: number | null; radius?: number; onRetry: () => void }) {
  if (isRemote) return <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-700">Your role is remote. GPS check not required.</div>;
  if (gps.status === "loading" || gps.status === "idle") return <div className="flex items-center gap-2 rounded-lg border border-border bg-white p-4 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Detecting your location...</div>;
  if (gps.status === "error" || gps.status === "denied") return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><div className="flex gap-2"><AlertTriangle className="h-4 w-4" /> {gps.error}</div><button onClick={onRetry} className="mt-3 font-bold">Try again</button></div>;
  const inRange = distance == null || distance <= radius;
  return (
    <div className={`rounded-lg border p-4 text-sm ${inRange ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
      <div className="flex gap-2"><MapPin className="h-4 w-4" /> {distance == null ? "Location ready" : `You are ${Math.round(distance)}m from office - ${inRange ? "in range" : `outside the ${radius}m boundary`}`}</div>
      {gps.accuracy && <p className="mt-2 text-xs">GPS accuracy: ±{Math.round(gps.accuracy)}m {gps.accuracy > 50 ? "- Low accuracy, move to open space" : ""}</p>}
    </div>
  );
}
