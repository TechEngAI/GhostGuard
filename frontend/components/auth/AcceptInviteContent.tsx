"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { createClient } from "@/lib/supabase-client";

const acceptInviteSchema = z
  .object({
    new_password: z
      .string()
      .min(8, "Minimum 8 characters")
      .regex(/[A-Z]/, "Must include an uppercase letter")
      .regex(/\d/, "Must include a number")
      .regex(/[^A-Za-z0-9]/, "Must include a special character"),
    confirm_password: z.string(),
  })
  .refine((data) => data.confirm_password === data.new_password, {
    path: ["confirm_password"],
    message: "Passwords must match",
  });

type AcceptInviteForm = z.infer<typeof acceptInviteSchema>;

export function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const expiredLink = searchParams.get("error") === "expired_link";

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AcceptInviteForm>({
    resolver: zodResolver(acceptInviteSchema),
    mode: "onTouched",
  });

  const newPasswordValue = watch("new_password", "");

  const onSubmit = async (data: AcceptInviteForm) => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.updateUser({ password: data.new_password });
      if (error) throw error;
      toast.success("Password set! You can now log in.");
      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.push("/hr/login?activated=true");
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      if (message.includes("expired") || message.includes("invalid")) {
        toast.error("Your invitation link has expired. Ask your admin to resend the invitation.");
      } else {
        toast.error(error instanceof Error ? error.message : "Could not set password. Try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#085041] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">👻</div>
          <h1 className="text-3xl font-bold text-[#085041] mb-2">GhostGuard</h1>
          <p className="text-xl font-semibold text-slate-900">Welcome to GhostGuard</p>
          <p className="mt-3 text-sm text-slate-500">
            You have been invited as an HR Officer. Set your password to get started.
          </p>
        </div>

        {expiredLink ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">
              <p className="font-semibold">This invitation link has expired or already been used.</p>
              <p>Please contact your administrator to send a new invitation.</p>
            </div>
            <Link
              href="/hr/login"
              className="inline-flex w-full justify-center rounded-2xl bg-[#085041] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#064639]"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <PasswordInput
                label="Set your password"
                placeholder="Minimum 8 characters"
                {...register("new_password")}
                error={errors.new_password?.message as string | undefined}
              />
              <PasswordStrength password={newPasswordValue} />
            </div>

            <div>
              <PasswordInput
                label="Confirm password"
                placeholder="Confirm password"
                {...register("confirm_password")}
                error={errors.confirm_password?.message as string | undefined}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl bg-[#085041] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#064639] disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isLoading ? "Activating..." : "Activate My Account"}
            </button>

            <p className="text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link href="/hr/login" className="font-semibold text-[#085041] hover:underline">
                Log in
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
