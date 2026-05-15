"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { CreateRoleModal } from "@/components/admin/CreateRoleModal";
import { InviteCodeDisplay } from "@/components/admin/InviteCodeDisplay";
import { RoleCard } from "@/components/admin/RoleCard";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { deleteRole, regenerateCode, unwrapError } from "@/lib/api";
import { unwrapData } from "@/lib/utils";
import { useRoles } from "@/hooks/useRoles";

export default function RolesPage() {
  const { roles, loading, reload } = useRoles();
  const [createOpen, setCreateOpen] = useState(false);
  const [regenerate, setRegenerate] = useState<any>(null);
  const [remove, setRemove] = useState<any>(null);
  const [newCode, setNewCode] = useState("");
  return (
    <main className="p-6">
      <div className="flex items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold">Roles</h1><p className="text-sm text-ink-secondary">Manage payroll roles and invite codes.</p></div>
        <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 font-bold text-white"><Plus className="h-4 w-4" /> Create Role</button>
      </div>
      {loading ? <div className="mt-6 rounded-lg border border-border bg-white p-8">Loading roles...</div> : <div className="mt-6 grid gap-4 lg:grid-cols-2">{roles.map((role) => <RoleCard key={role.id} role={role} onRegenerate={setRegenerate} onDelete={setRemove} />)}</div>}
      <CreateRoleModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={reload} />
      <ConfirmDialog
        open={!!regenerate}
        onClose={() => setRegenerate(null)}
        title="Regenerate invite code?"
        description="This will invalidate the current code immediately. Workers with the old code will not be able to register. Continue?"
        onConfirm={async () => {
          try {
            const response = await regenerateCode(regenerate.id);
            const role = unwrapData<any>(response).role || unwrapData<any>(response);
            setNewCode(role.invite_code);
            reload();
          } catch (error) {
            toast.error(unwrapError(error));
          }
        }}
      />
      <ConfirmDialog
        open={!!remove}
        onClose={() => setRemove(null)}
        title="Delete role?"
        description="Only empty roles can be deleted."
        confirmVariant="danger"
        onConfirm={async () => {
          try {
            await deleteRole(remove.id);
            toast.success("Role deleted.");
            reload();
          } catch (error) {
            toast.error(unwrapError(error));
          }
        }}
      />
      {newCode && <div className="mt-6 rounded-lg border border-border bg-white p-5"><h2 className="mb-3 font-bold">New invite code</h2><InviteCodeDisplay code={newCode} /></div>}
    </main>
  );
}
