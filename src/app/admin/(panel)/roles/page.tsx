import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { PageHeader, Panel } from "@/components/admin/ui";
import { ActionForm, SubmitButton, TextInput } from "@/components/admin/form";
import { saveRole } from "@/app/admin/actions/system";

export const metadata = { title: "Roles & permissions" };

const groups = Object.entries(PERMISSIONS).reduce<Record<string, { key: string; description: string }[]>>((acc, [key, v]) => {
  (acc[v.group] ??= []).push({ key, description: v.description });
  return acc;
}, {});

function PermissionGrid({ selected, disabled }: { selected: Set<string>; disabled?: boolean }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Object.entries(groups).map(([g, perms]) => (
        <fieldset key={g}>
          <legend className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-ink/50 uppercase">{g}</legend>
          <div className="space-y-1.5">
            {perms.map((p) => (
              <label key={p.key} className="flex items-start gap-2 text-[13px] text-ink/80">
                <input type="checkbox" name="permissions" value={p.key} defaultChecked={selected.has(p.key)} disabled={disabled} className="mt-0.5" />
                {p.description}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

export default async function AdminRoles() {
  await requireUser("users.manage");
  const roles = await db.role.findMany({ orderBy: { createdAt: "asc" }, include: { permissions: { include: { permission: true } }, _count: { select: { users: true } } } });
  return (
    <>
      <PageHeader title="Roles & permissions" description="Role-based access control. Users inherit every permission of their role." />
      <div className="space-y-4">
        {roles.map((r) => (
          <details key={r.id} className="border border-line bg-white">
            <summary className="flex cursor-pointer flex-wrap items-center gap-3 p-4">
              <span className="flex-1">
                <span className="font-medium text-navy">{r.name}</span>
                <span className="block text-xs text-ink/50">{r.description}</span>
              </span>
              <span className="text-xs text-ink/50">
                {r.permissions.length} permissions · {r._count.users} user{r._count.users === 1 ? "" : "s"}
              </span>
            </summary>
            <div className="border-t border-line p-4">
              <ActionForm action={saveRole} className="space-y-5">
                <input type="hidden" name="id" value={r.id} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextInput label="Role name" name="name" defaultValue={r.name} />
                  <TextInput label="Description" name="description" defaultValue={r.description ?? ""} />
                </div>
                <PermissionGrid selected={new Set(r.permissions.map((p) => p.permission.key))} disabled={r.key === "super_admin"} />
                {r.key !== "super_admin" && <SubmitButton>Save role</SubmitButton>}
              </ActionForm>
            </div>
          </details>
        ))}
        <Panel title="Create a custom role">
          <ActionForm action={saveRole} className="space-y-5" resetOnSuccess>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput label="Role name" name="name" />
              <TextInput label="Description" name="description" />
            </div>
            <PermissionGrid selected={new Set()} />
            <SubmitButton>Create role</SubmitButton>
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
