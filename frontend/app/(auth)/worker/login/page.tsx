import { LoginForm } from "@/components/auth/LoginForm";
import AuthLayout from "@/components/auth/AuthLayout";

export default function WorkerLoginPage() {
  return (
    <AuthLayout
      portal="worker"
      title="Secure your earnings with ease."
      subtitle="Worker Login"
      heroImageUrl="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80"
      features={[
        "Clock in securely with GPS verification",
        "Track your attendance and earnings",
        "Receive payments directly to your bank"
      ]}
    >
      <LoginForm type="worker" />
    </AuthLayout>
  );
}
