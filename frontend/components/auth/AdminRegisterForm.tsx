"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { OtpInput } from "@/components/ui/OtpInput";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { Select } from "@/components/ui/Select";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { VerificationChannelPicker } from "@/components/auth/VerificationChannelPicker";
import { COMPANY_SIZES, GENDER_OPTIONS, INDUSTRIES } from "@/lib/constants";
import { adminRegister, adminResendOtp, adminVerifyOtp, unwrapError } from "@/lib/api";
import { setTokens } from "@/lib/auth";

const schema = z
  .object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    middle_name: z.string().optional(),
    email: z.string().email(),
    phone_number: z.string().regex(/^0\d{10}$/, "Phone must be 11 digits starting with 0"),
    gender: z.string().min(1, "Gender is required"),
    date_of_birth: z.string().refine((date) => new Date(date) <= new Date(), "Date cannot be in the future"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
    company_name: z.string().min(2, "Company name is required"),
    industry: z.string().min(1, "Industry is required"),
    company_size: z.string().min(1, "Company size is required"),
    verif_channel: z.enum(["email", "phone"]),
  })
  .refine((data) => data.password === data.confirm_password, { message: "Passwords do not match", path: ["confirm_password"] });

type Values = z.infer<typeof schema>;

export function AdminRegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(60);
  const { register, handleSubmit, trigger, watch, setValue, getValues, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { verif_channel: "email" },
  });

  useEffect(() => {
    if (step !== 4 || countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown, step]);

  async function next(fields: Array<keyof Values>) {
    if (await trigger(fields)) setStep((value) => value + 1);
  }

  async function sendCode() {
    try {
      await adminRegister(getValues());
      sessionStorage.setItem("admin_registration_email", getValues("email"));
      toast.success("Verification code sent.");
      setCountdown(60);
      setStep(4);
    } catch (error) {
      toast.error(unwrapError(error));
    }
  }

  async function verify() {
    try {
      const response = await adminVerifyOtp({ email: getValues("email"), otp });
      const data = response.data.data;
      if (data.access_token) setTokens(data.access_token, data.refresh_token, "admin");
      toast.success("Account verified.");
      router.push("/admin/setup");
    } catch (error) {
      toast.error(unwrapError(error));
      setOtp("");
    }
  }

  async function resend() {
    try {
      await adminResendOtp({ email: getValues("email") });
      setCountdown(60);
      toast.success("Code resent.");
    } catch (error) {
      toast.error(unwrapError(error));
    }
  }

  const password = watch("password") || "";
  return (
    <div className="mx-auto max-w-3xl rounded-xl border border-border bg-white p-6 shadow-soft">
      <StepIndicator steps={["Personal Info", "Company Info", "Verification", "Confirm OTP"]} currentStep={step} />
      <div className="mt-8">
        {step === 1 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="First name" error={formState.errors.first_name?.message} {...register("first_name")} />
            <Input label="Last name" error={formState.errors.last_name?.message} {...register("last_name")} />
            <Input label="Middle name" {...register("middle_name")} />
            <Input label="Email" type="email" error={formState.errors.email?.message} {...register("email")} />
            <Input label="Phone number" error={formState.errors.phone_number?.message} {...register("phone_number")} />
            <Select label="Gender" options={GENDER_OPTIONS} error={formState.errors.gender?.message} {...register("gender")} />
            <Input label="Date of birth" type="date" error={formState.errors.date_of_birth?.message} {...register("date_of_birth")} />
            <div>
              <PasswordInput label="Password" error={formState.errors.password?.message} {...register("password")} />
              <PasswordStrength password={password} />
            </div>
            <PasswordInput label="Confirm password" error={formState.errors.confirm_password?.message} {...register("confirm_password")} />
            <div className="md:col-span-2"><Button type="button" onClick={() => next(["first_name", "last_name", "email", "phone_number", "gender", "date_of_birth", "password", "confirm_password"])}>Continue</Button></div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <Input label="Company name" error={formState.errors.company_name?.message} {...register("company_name")} />
            <Select label="Industry" options={INDUSTRIES} error={formState.errors.industry?.message} {...register("industry")} />
            <Select label="Company size" options={COMPANY_SIZES} error={formState.errors.company_size?.message} {...register("company_size")} />
            <div className="flex gap-3"><Button type="button" variant="secondary" onClick={() => setStep(1)}>Back</Button><Button type="button" onClick={() => next(["company_name", "industry", "company_size"])}>Continue</Button></div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-6">
            <VerificationChannelPicker selected={watch("verif_channel")} onChange={(value) => setValue("verif_channel", value)} />
            <div className="flex gap-3"><Button type="button" variant="secondary" onClick={() => setStep(2)}>Back</Button><Button type="button" isLoading={formState.isSubmitting} onClick={handleSubmit(sendCode)}>Send Verification Code</Button></div>
          </div>
        )}
        {step === 4 && (
          <div className="space-y-6 text-center">
            <div><h2 className="text-2xl font-bold">Confirm OTP</h2><p className="mt-2 text-sm text-ink-secondary">We sent a 6-digit code to your {watch("verif_channel")}.</p></div>
            <OtpInput value={otp} onChange={setOtp} />
            <Button type="button" disabled={otp.length !== 6} onClick={verify}>Verify</Button>
            <button type="button" disabled={countdown > 0} onClick={resend} className="block w-full text-sm font-semibold text-brand disabled:text-ink-tertiary">
              {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
