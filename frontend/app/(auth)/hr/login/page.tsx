import { LoginForm } from "@/components/auth/LoginForm";
import AuthLayout from "@/components/auth/AuthLayout";

export default function HrLoginPage() {
  return (
    <AuthLayout
      portal="hr"
      title="Streamline your payroll review."
      subtitle="HR Login"
      heroImageUrl="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&q=80"
      features={[
        "Review flagged payroll anomalies",
        "Make informed payment decisions",
        "Ensure compliance across the organization"
      ]}
    >
      <LoginForm type="hr" />
    </AuthLayout>
  );
}
