import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CONTENT_SECTIONS } from "@/lib/content-schema";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Website content" };

export default async function ContentIndex() {
  await requireUser("content.manage");
  const rows = await db.corporateContent.findMany({ select: { key: true, updatedAt: true } });
  const updated = new Map(rows.map((r) => [r.key, r.updatedAt]));
  const groups = ["Company", "Homepage", "Pages", "Divisions"] as const;
  return (
    <>
      <PageHeader title="Website content" description="Corporate information, homepage sections, corporate pages and division pages. Changes publish immediately." />
      <div className="space-y-8">
        {groups.map((g) => (
          <section key={g}>
            <h2 className="mb-3 text-[11px] font-semibold tracking-[0.16em] text-ink/50 uppercase">{g}</h2>
            <ul className="grid gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-3">
              {CONTENT_SECTIONS.filter((s) => s.group === g).map((s) => (
                <li key={s.key}>
                  <Link href={`/admin/content/${encodeURIComponent(s.key)}`} className="block h-full bg-white p-5 hover:bg-[#fafaf8]">
                    <span className="font-display font-semibold text-navy">{s.title}</span>
                    <span className="mt-1 block text-[13px] text-ink/55">{s.description}</span>
                    <span className="mt-3 block text-[11.5px] text-ink/40">{updated.get(s.key) ? `Edited ${formatDate(updated.get(s.key)!, "short")}` : "Using default content"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
