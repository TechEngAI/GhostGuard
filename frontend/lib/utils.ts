import clsx from "clsx";

export const cn = (...inputs: Array<string | false | null | undefined>) => clsx(inputs);

export const formatNGN = (amount: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(Number(amount || 0));

export const formatNumber = (value: number | string) => {
  const parsed = Number(String(value).replace(/[^0-9]/g, ""));
  if (Number.isNaN(parsed)) return "";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(parsed);
};

export const parseIntegerFromFormattedString = (value: string) => {
  const cleaned = String(value).replace(/[^0-9]/g, "");
  return cleaned === "" ? 0 : Number(cleaned);
};

export const relativeTime = (dateString: string) => {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  return `${Math.floor(hours / 24)} days ago`;
};

export const formatHours = (decimalHours: number) => {
  const h = Math.floor(Number(decimalHours || 0));
  const m = Math.round((Number(decimalHours || 0) - h) * 60);
  return `${h}h ${m}m`;
};

export const getInitials = (firstName = "", lastName = "") => `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "GG";

export const verdictColor = (verdict: string) =>
  ({
    VERIFIED: "text-green-700 bg-green-100 border-green-300",
    SUSPICIOUS: "text-amber-700 bg-amber-100 border-amber-300",
    FLAGGED: "text-red-700 bg-red-100 border-red-300",
  })[verdict] ?? "text-gray-600 bg-gray-100 border-gray-200";

export const unwrapData = <T = any>(response: any): T => response?.data?.data ?? response?.data ?? response;
