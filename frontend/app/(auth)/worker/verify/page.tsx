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
  return <main className="flex min-h-screen items-center justify-center bg-background px-4"><div className="rounded-xl border border-border bg-white p-8 text-center shadow-soft"><h1 className="mb-6 text-2xl font-bold">Verify worker account</h1>{isVerifyingLink ? <p className="text-sm text-ink-secondary">Verifying your email...</p> : <><OtpInput value={otp} onChange={setOtp} /><Button className="mt-6" disabled={otp.length !== 6} onClick={verify}>Verify</Button></>}</div></main>;
}

export default function WorkerVerifyPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-background">Loading...</main>}>
      <WorkerVerifyContent />
    </Suspense>
  );
}
