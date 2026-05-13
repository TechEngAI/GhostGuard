"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TrustScoreGauge } from "@/components/hr/TrustScoreGauge";
import { getWorkerBank, getWorkerProfile, unwrapError, updateWorkerProfile } from "@/lib/api";
import { NIGERIAN_STATES } from "@/lib/constants";

const fields = ["home_address", "state_of_origin", "next_of_kin_name", "next_of_kin_phone", "emergency_contact_name", "emergency_contact_phone", "nin"];

export default function WorkerProfilePage() {
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [bank, setBank] = useState<Record<string, any> | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const score = Number(profile?.completeness_score || 0);
  const missing = useMemo(() => fields.filter((field) => !form[field]), [form]);

  useEffect(() => {
    async function load() {
      try {
        const profileResponse = await getWorkerProfile();
        const data = profileResponse.data.data?.worker || profileResponse.data.data;
        setProfile(data);
        setForm(Object.fromEntries(fields.map((field) => [field, data?.[field] || ""])));
        try {
          const bankResponse = await getWorkerBank();
          setBank(bankResponse.data.data?.bank_account || bankResponse.data.data);
        } catch {}
      } catch (error) {
        toast.error(unwrapError(error));
      }
    }
    load();
  }, []);

  async function save() {
    try {
      const response = await updateWorkerProfile(form);
      const data = response.data.data?.worker || response.data.data;
      setProfile(data);
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(unwrapError(error));
    }
  }

  const color = score < 0.4 ? "bg-danger" : score < 0.7 ? "bg-warning" : "bg-brand";
  return (
    <main className="bg-background p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-xl border border-border bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Complete your profile</h1>
              <p className="mt-2 text-sm text-ink-secondary">Profile completeness: {Math.round(score * 100)}%</p>
            </div>
            <div className="text-center">
              <TrustScoreGauge score={Number(profile?.trust_score ?? score * 100)} size={96} />
              <p className="text-xs font-semibold text-ink-secondary">Trust score</p>
            </div>
          </div>
          <div className="mt-3 h-3 rounded-full bg-gray-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.round(score * 100)}%` }} /></div>
          {missing.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{missing.map((field) => <span key={field} className="rounded-full bg-warning-light px-3 py-1 text-xs font-semibold text-warning">{field.replaceAll("_", " ")}</span>)}</div>}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Input label="Home address" value={form.home_address || ""} onChange={(event) => setForm({ ...form, home_address: event.target.value })} />
            <Select label="State of origin" options={NIGERIAN_STATES} value={form.state_of_origin || ""} onChange={(event) => setForm({ ...form, state_of_origin: event.target.value })} />
            <Input label="Next of kin name" value={form.next_of_kin_name || ""} onChange={(event) => setForm({ ...form, next_of_kin_name: event.target.value })} />
            <Input label="Next of kin phone" value={form.next_of_kin_phone || ""} onChange={(event) => setForm({ ...form, next_of_kin_phone: event.target.value })} />
            <Input label="Emergency contact name" value={form.emergency_contact_name || ""} onChange={(event) => setForm({ ...form, emergency_contact_name: event.target.value })} />
            <Input label="Emergency contact phone" value={form.emergency_contact_phone || ""} onChange={(event) => setForm({ ...form, emergency_contact_phone: event.target.value })} />
            <Input label="NIN" value={form.nin || ""} onChange={(event) => setForm({ ...form, nin: event.target.value.replace(/\D/g, "").slice(0, 11) })} />
          </div>
          <Button className="mt-6" onClick={save}>Save profile</Button>
        </section>
        <section className="rounded-xl border border-border bg-white p-6">
          <h2 className="text-xl font-bold">Bank account</h2>
          {profile?.bank_verified ? (
            <div className="mt-4 flex items-center justify-between rounded-lg bg-brand-light p-4"><span>Bank account verified</span><Badge>VERIFIED</Badge></div>
          ) : bank?.match_status === "MANUAL_REVIEW" ? (
            <p className="mt-4 rounded-lg bg-warning-light p-4 text-warning">Account under admin review.</p>
          ) : bank?.match_status === "REJECTED" ? (
            <p className="mt-4 rounded-lg bg-danger-light p-4 text-danger">Account rejected. Contact admin.</p>
          ) : (
            <Link href="/worker/bank"><Button className="mt-4">Add Bank Account</Button></Link>
          )}
        </section>
      </div>
    </main>
  );
}
