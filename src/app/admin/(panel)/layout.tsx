import type { Metadata } from "next";
import { db } from "@/lib/db";
import { can, requireUser } from "@/lib/auth";
import { getSite } from "@/lib/content";
import { enquiryScope } from "@/lib/enquiry-access";
import { ADMIN_NAV } from "@/components/admin/nav";
import { AdminShell } from "@/components/admin/shell";
import { logout } from "../actions/auth";

export const metadata: Metadata = { title: { default: "Administration", template: "%s · Admin" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [site, newEnquiries] = await Promise.all([getSite(), db.enquiry.count({ where: { AND: [enquiryScope(user), { status: "NEW" }] } })]);
  const nav = ADMIN_NAV.map((g) => ({ ...g, items: g.items.filter((i) => can(user, i.permissions)) })).filter((g) => g.items.length);
  return (
    <AdminShell nav={nav} user={{ name: user.name, role: user.role.name }} companyName={site.companyName} newEnquiries={newEnquiries} logoutAction={logout}>
      {children}
    </AdminShell>
  );
}
