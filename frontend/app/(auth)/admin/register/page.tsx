import { AdminRegisterForm } from "@/components/auth/AdminRegisterForm";
import AuthLayout from "@/components/auth/AuthLayout";

export default function AdminRegisterPage() {
  return (
    <AuthLayout
      portal="admin"
      title="Join GhostGuard and protect your payroll."
      subtitle="Admin Registration"
      heroImageUrl="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80"
      features={[
        "Quick and easy company onboarding",
        "Secure multi-factor authentication",
        "Instant access to fraud detection tools"
      ]}
    >
      <AdminRegisterForm />
    </AuthLayout>
  );
}
