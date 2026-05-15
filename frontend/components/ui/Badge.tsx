const styles: Record<string, string> = {
  VERIFIED: "bg-brand-light text-brand-dark",
  SUSPICIOUS: "bg-warning-light text-warning",
  FLAGGED: "bg-danger-light text-danger",
  ACTIVE: "bg-brand-light text-brand-dark",
  PENDING: "bg-warning-light text-warning",
};

export function Badge({ children }: { children: string }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${styles[children] || "bg-gray-100 text-gray-600"}`}>{children}</span>;
}
