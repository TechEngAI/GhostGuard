"use client";

import { useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";

export function HrLoginContent() {
  const searchParams = useSearchParams();
  const activated = searchParams.get("activated");
  const error = searchParams.get("error");

  return (
    <div className="space-y-4">
      {activated === "true" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          ✓ Account activated successfully. You can now log in with your email and password.
        </div>
      )}
      {error === "expired_link" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          Your invitation link has expired. Contact your administrator for a new invitation.
        </div>
      )}
      <LoginForm type="hr" />
    </div>
  );
}
