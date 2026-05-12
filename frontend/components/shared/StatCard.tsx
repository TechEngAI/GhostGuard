import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const colors = {
  teal: "border-emerald-200 bg-emerald-50 text-emerald-800",
  purple: "border-violet-200 bg-violet-50 text-violet-800",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  red: "border-red-200 bg-red-50 text-red-800",
  gray: "border-gray-200 bg-gray-50 text-gray-700",
};

export function StatCard({ label, value, icon: Icon, color = "teal" }: { label: string; value: string | number; icon: LucideIcon; color?: keyof typeof colors }) {
  return (
    <div className={cn("rounded-lg border p-5", colors[color])}>
      <Icon className="h-5 w-5" />
      <div className="mt-5 text-3xl font-bold tracking-normal">{value}</div>
      <div className="mt-1 text-sm font-medium opacity-80">{label}</div>
    </div>
  );
}
