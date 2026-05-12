import { CompanySetupForm } from "@/components/onboarding/CompanySetupForm";

export default function AdminSetupPage() {
  return (
    <main className="bg-background p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome to GhostGuard! Set up your company to get started.</h1>
        <p className="mt-2 text-ink-secondary">Your attendance and payroll fraud detection rules begin with the office boundary.</p>
      </div>
      <CompanySetupForm />
    </main>
  );
}
