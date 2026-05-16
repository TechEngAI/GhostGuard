@@@ -1,0 +1,11 @@
"use client";
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { WalletContent } from "@/components/admin/WalletContent";

export default function AdminWalletPage() {
  return (
    <Suspense fallback={<main className="p-6"><div className="h-96 bg-gray-200 rounded-xl animate-pulse" /></main>}>
      <WalletContent />
    </Suspense>
  );
}
