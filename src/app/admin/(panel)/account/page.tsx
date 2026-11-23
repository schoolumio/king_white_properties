import { requireUser } from "@/lib/auth";
import { PageHeader, Panel } from "@/components/admin/ui";
import { ActionForm, SubmitButton, TextInput } from "@/components/admin/form";
import { changePassword } from "@/app/admin/actions/auth";

export const metadata = { title: "My account" };

export default async function Account() {
  const user = await requireUser();
  return (
    <>
      <PageHeader title="My account" description={`${user.email} · ${user.role.name}`} />
      <Panel title="Change password" className="max-w-xl">
        <ActionForm action={changePassword} className="space-y-4" resetOnSuccess>
          <TextInput label="Current password" name="current" type="password" autoComplete="current-password" />
          <TextInput label="New password" name="next" type="password" autoComplete="new-password" help="At least 12 characters." />
          <TextInput label="Confirm new password" name="confirm" type="password" autoComplete="new-password" />
          <SubmitButton>Update password</SubmitButton>
        </ActionForm>
      </Panel>
      <Panel title="Your permissions" className="mt-6 max-w-xl">
        <ul className="columns-2 text-[13px] text-ink/70">
          {[...user.permissions].sort().map((p) => (
            <li key={p} className="font-mono text-[12px]">
              {p}
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
