"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/ui/OtpInput";
import { setTokens } from "@/lib/auth";
import { unwrapError, workerVerifyOtp } from "@/lib/api";

function WorkerVerifyContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [otp, setOtp] = useState("");
  async function verify() {
    try {
      const response = await workerVerifyOtp({ email: params.get("email"), otp });
      const data = response.data.data;
      if (data.access_token) setTokens(data.access_token, data.refresh_token, "worker");
      router.push("/worker/profile");
    } catch (error) {
      toast.error(unwrapError(error));
      setOtp("");
    }
  }
  return <main className="flex min-h-screen items-center justify-center bg-background px-4"><div className="rounded-xl border border-border bg-white p-8 text-center shadow-soft"><h1 className="mb-6 text-2xl font-bold">Verify worker account</h1><OtpInput value={otp} onChange={setOtp} /><Button className="mt-6" disabled={otp.length !== 6} onClick={verify}>Verify</Button></div></main>;
}

export default function WorkerVerifyPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-background">Loading...</main>}>
      <WorkerVerifyContent />
    </Suspense>
  );
}
