import { Spinner } from "@/components/ui/Spinner";

export default function HrDashboardPage() {
  return (
    <main className="p-8">
      <div className="rounded-xl border border-border bg-white p-8">
        <h1 className="text-3xl font-bold">Welcome. Payroll dashboard loading...</h1>
        <div className="mt-6"><Spinner /></div>
      </div>
    </main>
  );
}
