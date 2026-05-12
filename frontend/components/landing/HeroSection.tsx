import Link from "next/link";
import { BadgeCheck, Bot, Building2, Zap } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function HeroSection() {
  return (
    <section id="home" className="animated-grid min-h-screen bg-[#0D1117] text-white">
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-200">
            Powered by Squad API
          </div>
          <h1 className="max-w-4xl text-5xl font-bold leading-tight md:text-7xl">Stop Paying Ghost Workers.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-300">
            GhostGuard uses GPS verification, AI anomaly detection, and Squad-powered payroll to eliminate ghost workers from your payroll automatically.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/admin/register"><Button className="w-full sm:w-auto">Start as Admin</Button></Link>
            <Link href="/worker/register"><Button variant="secondary" className="w-full border-white/30 bg-transparent text-white hover:bg-white/10 sm:w-auto">I'm a Worker</Button></Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-white/10 px-4 py-2">NGN 200B+ lost yearly</span>
            <span className="rounded-full bg-white/10 px-4 py-2">AI-powered detection</span>
            <span className="rounded-full bg-white/10 px-4 py-2">Squad API integrated</span>
          </div>
        </div>
        <div className="hidden lg:block">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Payroll Run</p>
                <h2 className="text-2xl font-bold">May Analysis</h2>
              </div>
              <Bot className="h-9 w-9 text-brand" />
            </div>
            {[
              ["Amina Yusuf", "91", "VERIFIED"],
              ["Chinedu Okafor", "87", "VERIFIED"],
              ["Tunde Bello", "18", "FLAGGED"],
            ].map(([name, score, status]) => (
              <div key={name} className="mb-3 flex items-center justify-between rounded-xl bg-white p-4 text-ink">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light text-brand-dark"><Building2 className="h-5 w-5" /></div>
                  <div><p className="font-semibold">{name}</p><p className="text-sm text-ink-tertiary">Trust score {score}</p></div>
                </div>
                <Badge>{status}</Badge>
              </div>
            ))}
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-sm text-gray-200">
                <span className="flex items-center gap-2"><Zap className="h-4 w-4" /> Payroll analysis complete</span>
                <span>100%</span>
              </div>
              <div className="h-3 rounded-full bg-white/10"><div className="h-full rounded-full bg-brand" /></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
