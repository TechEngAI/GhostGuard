import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function FooterCTA() {
  return (
    <footer className="bg-[#0D1117] px-4 py-20 text-center text-white">
      <h2 className="text-4xl font-bold">Ready to eliminate ghost workers from your payroll?</h2>
      <div className="mt-8"><Link href="/admin/register"><Button>Get Started Free</Button></Link></div>
      <div className="mt-8 flex justify-center gap-6 text-sm text-gray-300">
        <Link href="/admin/login">Admin Login</Link>
        <Link href="/worker/login">Worker Login</Link>
        <Link href="/hr/login">HR Login</Link>
      </div>
    </footer>
  );
}
