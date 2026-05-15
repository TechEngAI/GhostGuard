import { Suspense } from "react";
import { HrLoginContent } from "@/components/auth/HrLoginContent";
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
      <Suspense fallback={<div className="space-y-4"><div className="h-16 bg-gray-200 rounded-lg animate-pulse" /></div>}>
        <HrLoginContent />
      </Suspense>
    </AuthLayout>
  );
}
