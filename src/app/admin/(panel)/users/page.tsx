import type { User } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { Notice, PageHeader, Panel, Pill } from "@/components/admin/ui";
import { ActionForm, Checkbox, SelectInput, SubmitButton, TextInput } from "@/components/admin/form";
import { saveUser } from "@/app/admin/actions/system";

export const metadata = { title: "Users" };

function UserForm({ u, roles }: { u?: User; roles: { value: string; label: string }[] }) {
  return (
    <ActionForm action={saveUser} className="grid gap-4 sm:grid-cols-3" resetOnSuccess={!u}>
      {u && <input type="hidden" name="id" value={u.id} />}
      <TextInput label="Full name" name="name" defaultValue={u?.name} />
      <TextInput label="Email" name="email" type="email" defaultValue={u?.email} />
      <SelectInput label="Role" name="roleId" defaultValue={u?.roleId ?? ""} placeholder="Choose…" options={roles} />
      <TextInput label="Position" name="position" defaultValue={u?.position ?? ""} />
      <TextInput label="Telephone" name="phone" defaultValue={u?.phone ?? ""} />
      <TextInput label={u ? "Reset password" : "Initial password"} name="password" type="password" autoComplete="new-password" help={u ? "Leave blank to keep the current password." : "Leave blank to generate a temporary password."} />
      {u && <Checkbox label="Account active" name="active" defaultChecked={u.active} />}
      {!u && <input type="hidden" name="active" value="true" />}
      <div className="sm:col-span-3">
        <SubmitButton>{u ? "Save user" : "Create user"}</SubmitButton>
      </div>
    </ActionForm>
  );
}

export default async function AdminUsers() {
  const me = await requireUser("users.manage");
  const [users, roles] = await Promise.all([db.user.findMany({ orderBy: { name: "asc" }, include: { role: true } }), db.role.findMany({ orderBy: { name: "asc" } })]);
  const roleOpts = roles.map((r) => ({ value: r.id, label: r.name }));
  return (
    <>
      <PageHeader title="Users" description="Staff accounts and their roles. Each user can only access the functions permitted by their role." />
      <Notice>Changing a user’s password or deactivating them signs them out of all sessions immediately.</Notice>
      <Panel title="Invite a staff member" className="mb-6">
        <UserForm roles={roleOpts} />
      </Panel>
      <div className="divide-y divide-line border border-line bg-white">
        {users.map((u) => (
          <details key={u.id}>
            <summary className="flex cursor-pointer flex-wrap items-center gap-3 p-4">
              <span className="min-w-48 flex-1">
                <span className="font-medium text-primary">
                  {u.name} {u.id === me.id && <span className="text-xs text-ink/45">(you)</span>}
                </span>
                <span className="block text-xs text-ink/50">{u.email}</span>
              </span>
              <Pill className="bg-primary/5 text-primary">{u.role.name}</Pill>
              {!u.active && <Pill className="bg-rose-100 text-rose-800">Inactive</Pill>}
              <span className="w-40 text-right text-xs text-ink/45">{u.lastLoginAt ? `Last sign-in ${formatDate(u.lastLoginAt, "short")}` : "Never signed in"}</span>
            </summary>
            <div className="border-t border-line bg-[#f8faf9] p-4">
              <UserForm u={u} roles={roleOpts} />
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
