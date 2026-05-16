"use client";
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { AcceptInviteContent } from "@/components/auth/AcceptInviteContent";

export default function HrAcceptInvitePage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#085041] flex items-center justify-center px-4 py-12"><div className="text-white">Loading...</div></main>}>
      <AcceptInviteContent />
    </Suspense>
  );
}
