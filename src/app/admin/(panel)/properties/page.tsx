import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate, formatPrice } from "@/lib/format";
import { LISTING_LABELS, PROPERTY_STATUS_LABELS, SECTOR_LABELS } from "@/lib/labels";
import { firstParam, toInt } from "@/lib/utils";
import { AdminButtonLink, AdminPager, EmptyRow, FilterForm, FilterInput, FilterSelect, PageHeader, PublishPill, Table, Td, Th } from "@/components/admin/ui";
import { DemoBadge } from "@/components/ui/section";

export const metadata = { title: "Properties" };
const PAGE_SIZE = 25;
const o = (m: Record<string, string>) => Object.entries(m).map(([value, label]) => ({ value, label }));

export default async function AdminProperties({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser("property.manage");
  const sp = await searchParams;
  const v = { q: firstParam(sp.q), publish: firstParam(sp.publish), sector: firstParam(sp.sector), status: firstParam(sp.status) };
  const page = Math.max(1, toInt(firstParam(sp.page), 1)!);
  const where: Prisma.PropertyWhereInput = {};
  if (v.q) where.OR = [{ title: { contains: v.q, mode: "insensitive" } }, { address: { contains: v.q, mode: "insensitive" } }];
  if (v.publish) where.publishStatus = v.publish as never;
  else where.publishStatus = { not: "ARCHIVED" };
  if (v.sector) where.sector = v.sector as never;
  if (v.status) where.status = v.status as never;
  const [total, rows] = await Promise.all([
    db.property.count({ where }),
    db.property.findMany({ where, orderBy: { updatedAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { location: true, _count: { select: { images: true, enquiries: true } } } }),
  ]);
  return (
    <>
      <PageHeader
        title="Properties"
        description="Residential, commercial, industrial, land and mixed-use listings."
        actions={
          <AdminButtonLink href="/admin/properties/new">
            <Plus className="h-4 w-4" /> New property
          </AdminButtonLink>
        }
      />
      <FilterForm action="/admin/properties">
        <FilterInput name="q" label="Search" value={v.q} placeholder="Title or address" />
        <FilterSelect name="publish" label="Publication" value={v.publish} options={[{ value: "PUBLISHED", label: "Published" }, { value: "DRAFT", label: "Draft" }, { value: "ARCHIVED", label: "Archived" }]} />
        <FilterSelect name="sector" label="Category" value={v.sector} options={o(SECTOR_LABELS)} />
        <FilterSelect name="status" label="Availability" value={v.status} options={o(PROPERTY_STATUS_LABELS)} />
      </FilterForm>
      <Table>
        <thead>
          <tr>
            <Th>Property</Th>
            <Th>Category</Th>
            <Th>Price</Th>
            <Th>Availability</Th>
            <Th>Publication</Th>
            <Th>Photos</Th>
            <Th>Enquiries</Th>
            <Th>Updated</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <EmptyRow colSpan={8}>
              No properties yet. <Link href="/admin/properties/new" className="text-navy underline">Create the first listing</Link>.
            </EmptyRow>
          )}
          {rows.map((p) => (
            <tr key={p.id} className="hover:bg-[#fafaf8]">
              <Td>
                <Link href={`/admin/properties/${p.id}`} className="font-medium text-navy hover:underline">
                  {p.title}
                </Link>
                <span className="block text-xs text-ink/50">
                  {p.location?.name ?? "No location"} {p.featured && "· Featured"}
                </span>
                {p.isDemo && <DemoBadge />}
              </Td>
              <Td className="text-ink/70">
                {SECTOR_LABELS[p.sector]}
                <span className="block text-xs text-ink/45">{LISTING_LABELS[p.listingType]}</span>
              </Td>
              <Td className="whitespace-nowrap">{formatPrice(p, { compact: true })}</Td>
              <Td>{PROPERTY_STATUS_LABELS[p.status]}</Td>
              <Td>
                <PublishPill status={p.publishStatus} />
              </Td>
              <Td className={p._count.images === 0 ? "text-amber-700" : ""}>{p._count.images}</Td>
              <Td>{p._count.enquiries}</Td>
              <Td className="whitespace-nowrap text-ink/55">{formatDate(p.updatedAt, "short")}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <AdminPager page={page} pageCount={Math.ceil(total / PAGE_SIZE)} basePath="/admin/properties" params={v} />
    </>
  );
}
