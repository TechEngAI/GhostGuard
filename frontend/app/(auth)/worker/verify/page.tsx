"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect } from "react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/ui/OtpInput";
import { setTokens } from "@/lib/auth";
import { unwrapError, workerVerifyOtp } from "@/lib/api";

type VerifyData = {
  access_token?: string;
  refresh_token?: string;
};

import AuthLayout from "@/components/auth/AuthLayout";

function WorkerVerifyContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [otp, setOtp] = useState("");
  const [isVerifyingLink, setIsVerifyingLink] = useState(false);

  const finishVerification = useCallback((data: VerifyData) => {
    if (data.access_token && data.refresh_token) setTokens(data.access_token, data.refresh_token, "worker");
    toast.success("Account verified.");
    router.push("/worker/profile");
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
        const response = await workerVerifyOtp({ token_hash: tokenHash, type: params.get("type") || "signup" });
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
      const response = await workerVerifyOtp({ email: params.get("email"), otp, type: "signup" });
      finishVerification(response.data.data);
    } catch (error) {
      toast.error(unwrapError(error));
      setOtp("");
    }
  }

  return (
    <AuthLayout
      portal="worker"
      title="You're just one step away from joining."
      subtitle="Verify Worker"
      features={[
        "Secure identity confirmation",
        "Payroll account activation",
        "Access to your worker dashboard"
      ]}
    >
      <div className="text-center">
        <h2 className="text-xl font-bold mb-4">Confirm your identity</h2>
        <p className="text-sm text-ink-secondary mb-8">
          Please enter the 6-digit verification code we sent to your email address.
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
              Verify & Complete
            </Button>
          </>
        )}
      </div>
    </AuthLayout>
  );
}

export default function WorkerVerifyPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-background">Loading...</main>}>
      <WorkerVerifyContent />
    </Suspense>
  );
}
