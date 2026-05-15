"use client";

import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { InviteCodeDisplay } from "@/components/admin/InviteCodeDisplay";
import { Modal } from "@/components/shared/Modal";
import { createRole, unwrapError } from "@/lib/api";
import { formatNumber, parseIntegerFromFormattedString, unwrapData } from "@/lib/utils";

const initial = { role_name: "", department: "", grade_level: "", headcount_max: 1, gross_salary: 0, pension_deduct: 0, health_deduct: 0, other_deductions: 0, work_type: "ONSITE" };

export function CreateRoleModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<any>(initial);
  const [createdCode, setCreatedCode] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await createRole(form);
      const role = unwrapData<any>(response).role || unwrapData<any>(response);
      setCreatedCode(role.invite_code);
      setForm(initial);
      onCreated();
      toast.success("Role created.");
    } catch (error) {
      toast.error(unwrapError(error));
    } finally {
      setLoading(false);
    }
  }
  function closeAll() {
    setCreatedCode("");
    onClose();
  }
  return (
    <>
      <Modal open={open && !createdCode} onClose={onClose} title="Create Role">
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          {["role_name", "department", "grade_level"].map((field) => (
            <label key={field} className="text-sm font-semibold capitalize">
              {field.replaceAll("_", " ")}
              <input required={field === "role_name"} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} className="mt-1 w-full rounded-lg border border-border px-3 py-2" />
            </label>
          ))}
          <label className="text-sm font-semibold capitalize">
            headcount max
            <input type="number" min="0" value={form.headcount_max} onChange={(e) => setForm({ ...form, headcount_max: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-border px-3 py-2" />
          </label>
          {["gross_salary", "pension_deduct", "health_deduct", "other_deductions"].map((field) => (
            <label key={field} className="text-sm font-semibold capitalize">
              {field.replaceAll("_", " ")}
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9,]*"
                value={formatNumber(form[field])}
                onChange={(e) => setForm({ ...form, [field]: parseIntegerFromFormattedString(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              />
            </label>
          ))}
          <div className="md:col-span-2">
            <p className="text-sm font-semibold">Work type</p>
            <div className="mt-2 grid gap-3 md:grid-cols-3">
              {["ONSITE", "REMOTE", "HYBRID"].map((type) => (
                <button type="button" key={type} onClick={() => setForm({ ...form, work_type: type })} className={`rounded-lg border px-4 py-3 text-sm font-bold ${form.work_type === type ? "border-brand bg-brand-light text-brand-dark" : "border-border bg-white"}`}>
                  {type}
                </button>
              ))}
            </div>
          </div>
          <button disabled={loading} className="md:col-span-2 rounded-lg bg-brand px-4 py-3 font-bold text-white disabled:opacity-60">{loading ? "Creating..." : "Create Role"}</button>
        </form>
      </Modal>
      <Modal open={!!createdCode} onClose={closeAll} title="Role Created!">
        <p className="mb-4 text-sm text-ink-secondary">Share this code with your workers so they can sign up.</p>
        <InviteCodeDisplay code={createdCode} />
        <button onClick={closeAll} className="mt-6 rounded-lg bg-brand px-4 py-2 font-bold text-white">Done</button>
      </Modal>
    </>
  );
}
