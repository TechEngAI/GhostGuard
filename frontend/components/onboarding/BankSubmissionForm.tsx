"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { NIGERIAN_BANKS } from "@/lib/constants";
import { bankLookup, bankSubmit, unwrapError } from "@/lib/api";

type LookupResult = { account_name: string; account_number?: string; bank_name?: string };

export function BankSubmissionForm() {
  const [step, setStep] = useState(1);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const bank = useMemo(() => NIGERIAN_BANKS.find((item) => item.code === bankCode), [bankCode]);

  useEffect(() => {
    if (accountNumber.length !== 10 || !bankCode) {
      setLookup(null);
      setLookupError("");
      return;
    }
    let cancelled = false;
    async function runLookup() {
      setLoadingLookup(true);
      setLookupError("");
      try {
        const response = await bankLookup({ account_number: accountNumber, bank_code: bankCode });
        if (!cancelled) setLookup(response.data.data);
      } catch (error) {
        if (!cancelled) setLookupError(unwrapError(error));
      } finally {
        if (!cancelled) setLoadingLookup(false);
      }
    }
    runLookup();
    return () => {
      cancelled = true;
    };
  }, [accountNumber, bankCode]);

  async function submit() {
    if (!lookup || !bank) return;
    try {
      const response = await bankSubmit({
        account_number: accountNumber,
        bank_code: bankCode,
        bank_name: bank.name,
        confirmed_account_name: lookup.account_name,
      });
      setResult(
        response.data.data?.bank_account?.match_status ||
        response.data.data?.worker?.status ||
        "AUTO_VERIFIED"
      );
      setStep(3);
    } catch (error) {
      toast.error(unwrapError(error));
    }
  }

  const masked = accountNumber ? `${"X".repeat(Math.max(0, accountNumber.length - 2))}${accountNumber.slice(-2)}` : "";
  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-border bg-white p-6 shadow-soft">
      {step === 1 && (
        <div className="space-y-5">
          <h1 className="text-2xl font-bold">Add bank account</h1>
          <Select label="Bank" options={NIGERIAN_BANKS.map((item) => ({ label: `${item.name} (${item.code})`, value: item.code }))} value={bankCode} onChange={(event) => setBankCode(event.target.value)} />
          <div>
            <Input label="Account number" inputMode="numeric" maxLength={10} value={accountNumber} onChange={(event) => setAccountNumber(event.target.value.replace(/\D/g, "").slice(0, 10))} />
            {loadingLookup && <p className="mt-2 flex items-center gap-2 text-sm text-ink-secondary"><Spinner /> Checking account...</p>}
            {lookupError && <p className="mt-2 text-sm text-danger">{lookupError}</p>}
          </div>
          {lookup && (
            <div className="rounded-xl border border-brand bg-brand-light p-5">
              <p className="text-sm font-bold text-brand-dark">Account found</p>
              <h2 className="mt-2 text-2xl font-bold text-brand-dark">{lookup.account_name}</h2>
              <p className="mt-4 text-sm text-ink-secondary">Is this your name?</p>
              <div className="mt-4 flex gap-3">
                <Button onClick={() => setStep(2)}>Yes, that's me</Button>
                <Button variant="secondary" onClick={() => { setLookup(null); setAccountNumber(""); }}>No, try again</Button>
              </div>
            </div>
          )}
        </div>
      )}
      {step === 2 && lookup && bank && (
        <div className="space-y-5">
          <h1 className="text-2xl font-bold">Confirm bank account</h1>
          <div className="rounded-xl border border-border bg-background p-5">
            <p className="text-sm text-ink-secondary">Bank</p><p className="font-bold">{bank.name}</p>
            <p className="mt-4 text-sm text-ink-secondary">Account number</p><p className="font-bold">{masked}</p>
            <p className="mt-4 text-sm text-ink-secondary">Account name</p><p className="font-bold">{lookup.account_name}</p>
          </div>
          <p className="text-sm text-ink-secondary">Submitting will link this account to your GhostGuard profile for salary payment.</p>
          <div className="flex gap-3"><Button onClick={submit}>Confirm and Submit</Button><Button variant="secondary" onClick={() => setStep(1)}>Go back</Button></div>
        </div>
      )}
      {step === 3 && (
        <div className="text-center">
          {result === "AUTO_VERIFIED" || result === "VERIFIED" ? (
            <><CheckCircle2 className="mx-auto h-16 w-16 text-brand" /><h1 className="mt-4 text-2xl font-bold">Your bank account is verified!</h1><p className="mt-2 text-ink-secondary">Attendance is now active. You can now check in to work.</p><Link href="/worker/dashboard"><Button className="mt-6">Go to dashboard</Button></Link></>
          ) : result === "REJECTED" ? (
            <><XCircle className="mx-auto h-16 w-16 text-danger" /><h1 className="mt-4 text-2xl font-bold">Account name mismatch.</h1><p className="mt-2 text-ink-secondary">The name on this account does not match your registered name. Contact your administrator.</p></>
          ) : (
            <><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning-light text-3xl text-warning">!</div><h1 className="mt-4 text-2xl font-bold">Your account is being reviewed.</h1><p className="mt-2 text-ink-secondary">Your name could not be automatically verified. Your administrator will review within 24 hours.</p></>
          )}
        </div>
      )}
    </div>
  );
}
