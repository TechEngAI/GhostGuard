"use client";

import { useState } from "react";
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
import { GENDER_OPTIONS, NIGERIAN_STATES } from "@/lib/constants";
import { setTokens } from "@/lib/auth";
import { unwrapError, workerRegister, workerResendOtp, workerVerifyOtp } from "@/lib/api";

const schema = z
  .object({
    invite_code: z.string().startsWith("GG-", "Invite code must start with GG-"),
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    middle_name: z.string().optional(),
    email: z.string().email(),
    phone_number: z.string().regex(/^0\d{10}$/, "Phone must be 11 digits starting with 0"),
    gender: z.string().optional(),
    date_of_birth: z.string().optional(),
    home_address: z.string().optional(),
    state_of_origin: z.string().optional(),
    next_of_kin_name: z.string().optional(),
    next_of_kin_phone: z.string().optional(),
    emergency_contact_name: z.string().optional(),
    emergency_contact_phone: z.string().optional(),
    nin: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
    verif_channel: z.enum(["email", "phone"]),
  })
  .refine((data) => !data.nin || /^\d{11}$/.test(data.nin), { message: "NIN must be 11 digits", path: ["nin"] })
  .refine((data) => data.password === data.confirm_password, { message: "Passwords do not match", path: ["confirm_password"] });

type Values = z.infer<typeof schema>;

export function WorkerRegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const { register, trigger, watch, setValue, getValues, handleSubmit, formState, setError } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { verif_channel: "email" },
  });

  async function next(fields: Array<keyof Values>) {
    if (await trigger(fields)) setStep((value) => value + 1);
  }

  async function createAccount() {
    try {
      await workerRegister(getValues());
      toast.success("Worker account created. Check your code.");
      setStep(5);
    } catch (error: any) {
      const code = error?.response?.data?.error?.code;
      if (code === "INVALID_INVITE_CODE") {
        setStep(1);
        setError("invite_code", { message: "Invalid invite code." });
        return;
      }
      if (code === "ROLE_FULL") {
        toast.error("This role is full. Ask your admin for a new invite code.");
        return;
      }
      toast.error(unwrapError(error));
    }
  }

  async function verify() {
    try {
      const response = await workerVerifyOtp({ email: getValues("email"), otp });
      const data = response.data.data;
      if (data.access_token) setTokens(data.access_token, data.refresh_token, "worker");
      toast.success("Account verified.");
      router.push("/worker/profile");
    } catch (error) {
      toast.error(unwrapError(error));
      setOtp("");
    }
  }

  const password = watch("password") || "";
  return (
    <div className="mx-auto max-w-3xl rounded-xl border border-border bg-white p-6 shadow-soft">
      <StepIndicator steps={["Invite Code", "Personal Info", "Additional Info", "Password", "Verify OTP"]} currentStep={step} />
      <div className="mt-8">
        {step === 1 && (
          <div className="mx-auto max-w-lg space-y-4 text-center">
            <Input label="Invite code" placeholder="Enter your invite code (e.g. GG-ACME-ENG-X7K2P9)" error={formState.errors.invite_code?.message} {...register("invite_code")} />
            <Button type="button" onClick={() => next(["invite_code"])}>Continue</Button>
          </div>
        )}
        {step === 2 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="First name" error={formState.errors.first_name?.message} {...register("first_name")} />
            <Input label="Last name" error={formState.errors.last_name?.message} {...register("last_name")} />
            <Input label="Middle name" {...register("middle_name")} />
            <Input label="Email" type="email" error={formState.errors.email?.message} {...register("email")} />
            <Input label="Phone number" error={formState.errors.phone_number?.message} {...register("phone_number")} />
            <Select label="Gender" options={GENDER_OPTIONS} {...register("gender")} />
            <Input label="Date of birth" type="date" {...register("date_of_birth")} />
            <div className="md:col-span-2 flex gap-3"><Button type="button" variant="secondary" onClick={() => setStep(1)}>Back</Button><Button type="button" onClick={() => next(["first_name", "last_name", "email", "phone_number"])}>Continue</Button></div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <p className="rounded-lg bg-brand-light p-3 text-sm text-brand-dark">These fields improve your profile score.</p>
            <Input label="Home address" {...register("home_address")} />
            <Select label="State of origin" options={NIGERIAN_STATES} {...register("state_of_origin")} />
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Next of kin name" {...register("next_of_kin_name")} />
              <Input label="Next of kin phone" {...register("next_of_kin_phone")} />
              <Input label="Emergency contact name" {...register("emergency_contact_name")} />
              <Input label="Emergency contact phone" {...register("emergency_contact_phone")} />
              <Input label="NIN" maxLength={11} error={formState.errors.nin?.message} {...register("nin")} />
            </div>
            <div className="flex gap-3"><Button type="button" variant="secondary" onClick={() => setStep(2)}>Back</Button><Button type="button" onClick={() => setStep(4)}>Continue</Button></div>
          </div>
        )}
        {step === 4 && (
          <div className="space-y-5">
            <div><PasswordInput label="Password" error={formState.errors.password?.message} {...register("password")} /><PasswordStrength password={password} /></div>
            <PasswordInput label="Confirm password" error={formState.errors.confirm_password?.message} {...register("confirm_password")} />
            <VerificationChannelPicker selected={watch("verif_channel")} onChange={(value) => setValue("verif_channel", value)} />
            <div className="flex gap-3"><Button type="button" variant="secondary" onClick={() => setStep(3)}>Back</Button><Button type="button" isLoading={formState.isSubmitting} onClick={handleSubmit(createAccount)}>Create Account</Button></div>
          </div>
        )}
        {step === 5 && (
          <div className="space-y-6 text-center">
            <h2 className="text-2xl font-bold">Verify your account</h2>
            <OtpInput value={otp} onChange={setOtp} />
            <Button type="button" disabled={otp.length !== 6} onClick={verify}>Verify</Button>
            <button type="button" className="block w-full text-sm font-semibold text-brand" onClick={() => workerResendOtp({ email: getValues("email") })}>Resend code</button>
          </div>
        )}
      </div>
    </div>
  );
}
