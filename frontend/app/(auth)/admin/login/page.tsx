import { LoginForm } from "@/components/auth/LoginForm";
import AuthLayout from "@/components/auth/AuthLayout";

export default function AdminLoginPage() {
  return (
    <AuthLayout
      portal="admin"
      title="Stop paying workers who don't exist."
      subtitle="Admin Login"
      heroImageUrl="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&q=80"
      features={[
        "Manage your entire workforce in one place",
        "Detect fraud signals with AI anomaly scoring",
        "Approve payroll with confidence"
      ]}
    >
      <LoginForm type="admin" />
    </AuthLayout>
  );
}
