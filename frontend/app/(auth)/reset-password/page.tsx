"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { adminForgotPassword, adminResetPassword, hrForgotPassword, hrResetPassword, unwrapError, workerForgotPassword, workerResetPassword } from "@/lib/api";
import type { UserType } from "@/types";

const forgotMap = { admin: adminForgotPassword, worker: workerForgotPassword, hr: hrForgotPassword };
const resetMap = { admin: adminResetPassword, worker: workerResetPassword, hr: hrResetPassword };

function ResetPasswordContent() {
  const params = useSearchParams();
  const router = useRouter();
  const type = (params.get("type") || "admin") as UserType;
  const token = params.get("access_token") || "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      if (token) {
        if (password !== confirm) {
          toast.error("Passwords do not match.");
          return;
        }
        await resetMap[type]({ access_token: token, new_password: password });
        toast.success("Password updated.");
        window.setTimeout(() => router.push(`/${type}/login`), 2000);
      } else {
        await forgotMap[type]({ email });
        toast.success("Password reset email sent. Check your inbox.");
      }
    } catch (error) {
      toast.error(unwrapError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center bg-background px-4 py-12">
      <div className="mx-auto w-full max-w-md rounded-xl border border-border bg-white p-8 shadow-soft">
        <h1 className="text-2xl font-bold">{token ? "Set a new password" : "Reset your password"}</h1>
        <div className="mt-6 space-y-5">
          {token ? (
            <>
              <div><PasswordInput label="New password" value={password} onChange={(event) => setPassword(event.target.value)} /><PasswordStrength password={password} /></div>
              <PasswordInput label="Confirm password" value={confirm} onChange={(event) => setConfirm(event.target.value)} />
            </>
          ) : (
            <Input label="Email address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          )}
          <Button className="w-full" onClick={submit} isLoading={loading}>{token ? "Update password" : "Send reset email"}</Button>
          <Link href={`/${type}/login`} className="block text-center text-sm font-semibold text-brand">Back to login</Link>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-background">Loading...</main>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
