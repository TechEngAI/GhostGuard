import { WorkerRegisterForm } from "@/components/auth/WorkerRegisterForm";
import AuthLayout from "@/components/auth/AuthLayout";

export default function WorkerRegisterPage() {
  return (
    <AuthLayout
      portal="worker"
      title="Get verified and get paid on time."
      subtitle="Worker Registration"
      heroImageUrl="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80"
      features={[
        "Secure verification with your company",
        "Direct link to your bank account",
        "Real-time attendance tracking"
      ]}
    >
      <WorkerRegisterForm />
    </AuthLayout>
  );
}
