"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { BriefcaseBusiness, HeartHandshake, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { adminLogin, getCompany, hrLogin, unwrapError, workerLogin } from "@/lib/api";
import { setTokens } from "@/lib/auth";
import type { UserType } from "@/types";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

const config = {
  admin: { label: "Admin Portal", accent: "text-admin", icon: ShieldCheck, login: adminLogin, dashboard: "/admin/dashboard", register: "/admin/register" },
  worker: { label: "Worker Portal", accent: "text-worker", icon: BriefcaseBusiness, login: workerLogin, dashboard: "/worker/dashboard", register: "/worker/register" },
  hr: { label: "HR Portal", accent: "text-hr", icon: HeartHandshake, login: hrLogin, dashboard: "/hr/dashboard", register: "" },
};

export function LoginForm({ type }: { type: UserType }) {
  const router = useRouter();
  const portal = config[type];
  const Icon = portal.icon;
  const { register, handleSubmit, formState } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function submit(values: FormValues) {
    try {
      const response = await portal.login(values);
      const data = response.data.data;
      setTokens(data.access_token, data.refresh_token, type);
      toast.success("Welcome back.");
      if (type === "admin") {
        try {
          const company = (await getCompany()).data.data;
          const profile = company.company || company;
          router.push(profile.office_lat ? "/admin/dashboard" : "/admin/setup");
          return;
        } catch {
          router.push("/admin/setup");
          return;
        }
      }
      router.push(portal.dashboard);
    } catch (error) {
      toast.error(unwrapError(error));
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-border bg-white p-8 shadow-soft">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-light">
          <Icon className={`h-7 w-7 ${portal.accent}`} />
        </div>
        <h1 className="text-2xl font-bold text-ink">GhostGuard</h1>
        <p className={`mt-1 text-sm font-semibold ${portal.accent}`}>{portal.label}</p>
      </div>
      <form className="space-y-5" onSubmit={handleSubmit(submit)}>
        <Input label="Email address" type="email" error={formState.errors.email?.message} {...register("email")} />
        <div>
          <PasswordInput label="Password" error={formState.errors.password?.message} {...register("password")} />
          <Link href={`/reset-password?type=${type}`} className="mt-2 inline-block text-sm font-medium text-brand hover:text-brand-dark">
            Forgot password?
          </Link>
        </div>
        <Button className="w-full" isLoading={formState.isSubmitting}>Login</Button>
      </form>
      {type === "admin" && <p className="mt-6 text-center text-sm text-ink-secondary">Don't have an account? <Link className="font-semibold text-brand" href="/admin/register">Register as Admin</Link></p>}
      {type === "worker" && <p className="mt-6 text-center text-sm text-ink-secondary">New worker? <Link className="font-semibold text-brand" href="/worker/register">Register here</Link><br />You need an invite code from your employer.</p>}
      {type === "hr" && <p className="mt-6 rounded-lg bg-[#F4F2FF] p-4 text-sm text-ink-secondary">HR accounts are set up by your company administrator. Contact your admin if you haven't received your invitation email.</p>}
    </div>
  );
}
