"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-client";

export function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    const nextPath = searchParams.get("next");
    const redirectTo = nextPath && nextPath.startsWith("/") ? nextPath : "/hr/accept-invite";

    if (!token_hash || !type) {
      router.replace("/hr/login?error=invalid_link");
      return;
    }

    const handleConfirm = async () => {
      const supabase = createClient();

      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as any,
      });

      if (error) {
        console.error("Token verify error:", error.message);
        router.replace(`/hr/login?error=expired_link`);
        return;
      }

      router.replace(redirectTo);
    };

    handleConfirm();
  }, [router, searchParams]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-4">
      <div className="rounded-3xl bg-slate-900/90 border border-slate-700 p-10 shadow-2xl text-center max-w-lg w-full">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400 mb-4">GhostGuard</p>
        <h1 className="text-3xl font-semibold mb-3">Verifying your invitation...</h1>
        <p className="text-slate-400">Please wait while we secure your account and redirect you to set your password.</p>
      </div>
    </main>
  );
}
