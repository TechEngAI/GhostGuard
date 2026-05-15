"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect } from "react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/ui/OtpInput";
import { adminVerifyOtp, unwrapError } from "@/lib/api";
import { setTokens } from "@/lib/auth";
import AuthLayout from "@/components/auth/AuthLayout";

type VerifyData = {
  access_token?: string;
  refresh_token?: string;
};

function AdminVerifyContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [otp, setOtp] = useState("");
  const [isVerifyingLink, setIsVerifyingLink] = useState(false);

  const finishVerification = useCallback((data: VerifyData) => {
    if (data.access_token && data.refresh_token) setTokens(data.access_token, data.refresh_token, "admin");
    toast.success("Account verified.");
    router.push("/admin/setup");
  }, [router]);

  useEffect(() => {
    async function verifyEmailLink() {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      if (accessToken && refreshToken) {
        finishVerification({ access_token: accessToken, refresh_token: refreshToken });
        return;
      }

      const tokenHash = params.get("token_hash");
      if (!tokenHash) return;

      setIsVerifyingLink(true);
      try {
        const response = await adminVerifyOtp({ token_hash: tokenHash, type: params.get("type") || "signup" });
        finishVerification(response.data.data);
      } catch (error) {
        toast.error(unwrapError(error));
      } finally {
        setIsVerifyingLink(false);
      }
    }

    verifyEmailLink();
  }, [finishVerification, params]);

  async function verify() {
    try {
      const response = await adminVerifyOtp({ email: params.get("email") || sessionStorage.getItem("admin_registration_email"), otp });
      finishVerification(response.data.data);
    } catch (error) {
      toast.error(unwrapError(error));
      setOtp("");
    }
  }

  return (
    <AuthLayout
      portal="admin"
      title="Protecting your company starts with you."
      subtitle="Verify Account"
      features={[
        "Secure verification process",
        "Account ownership confirmation",
        "Instant access upon verification"
      ]}
    >
      <div className="text-center">
        <h2 className="text-xl font-bold mb-4">Enter verification code</h2>
        <p className="text-sm text-ink-secondary mb-8">
          We've sent a 6-digit code to your email. Enter it below to proceed.
        </p>

        {isVerifyingLink ? (
          <p className="text-sm text-ink-secondary">Verifying your email...</p>
        ) : (
          <>
            <OtpInput value={otp} onChange={setOtp} />
            <Button 
              className="mt-8 w-full h-12 rounded-xl font-bold shadow-soft transition-all hover:scale-[1.02] active:scale-[0.98]" 
              disabled={otp.length !== 6} 
              onClick={verify}
            >
              Verify & Continue
            </Button>
          </>
        )}
      </div>
    </AuthLayout>
  );
}

export default function AdminVerifyPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-background">Loading...</main>}>
      <AdminVerifyContent />
    </Suspense>
  );
}
