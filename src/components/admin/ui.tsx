import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions, back }: { title: string; description?: string; actions?: React.ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-8">
      {back && (
        <Link href={back.href} className="mb-3 inline-flex items-center gap-1 text-[13px] text-ink/55 hover:text-navy">
          <ChevronLeft className="h-3.5 w-3.5" /> {back.label}
        </Link>
      )}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy sm:text-[1.7rem]">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm text-ink/60">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Panel({ title, description, children, className, actions }: { title?: string; description?: string; children: React.ReactNode; className?: string; actions?: React.ReactNode }) {
  return (
    <section className={cn("border border-line bg-white", className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            {title && <h2 className="font-display text-[15px] font-semibold text-navy">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-ink/55">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap", className)}>{children}</span>;
}

const PUBLISH_TONES: Record<string, string> = {
  PUBLISHED: "bg-emerald-100 text-emerald-800",
  DRAFT: "bg-slate-100 text-slate-700",
  ARCHIVED: "bg-stone-200 text-stone-600",
};

export function PublishPill({ status }: { status: string }) {
  return <Pill className={PUBLISH_TONES[status] ?? "bg-slate-100"}>{status.charAt(0) + status.slice(1).toLowerCase()}</Pill>;
}

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto border border-line bg-white">
      <table className="w-full min-w-[720px] text-left text-[13.5px]">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn("border-b border-line bg-[#fafaf8] px-4 py-3 text-[11px] font-semibold tracking-[0.08em] text-ink/55 uppercase", className)}>{children}</th>;
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("border-b border-line px-4 py-3 align-middle", className)}>{children}</td>;
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-14 text-center text-sm text-ink/50">
        {children}
      </td>
    </tr>
  );
}

export function AdminPager({ page, pageCount, basePath, params }: { page: number; pageCount: number; basePath: string; params: Record<string, string | undefined> }) {
  if (pageCount <= 1) return null;
  const href = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") qs.set(k, v);
    qs.set("page", String(p));
    return `${basePath}?${qs}`;
  };
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-ink/60">
      <span>
        Page {page} of {pageCount}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link href={href(page - 1)} className="inline-flex items-center gap-1 border border-line bg-white px-3 py-1.5 hover:border-navy">
            <ChevronLeft className="h-4 w-4" /> Previous
          </Link>
        )}
        {page < pageCount && (
          <Link href={href(page + 1)} className="inline-flex items-center gap-1 border border-line bg-white px-3 py-1.5 hover:border-navy">
            Next <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

export function AdminButtonLink({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-10 items-center gap-2 px-4 text-[13.5px] font-semibold",
        variant === "primary" ? "bg-navy text-white hover:bg-navy-deep" : "border border-line bg-white text-navy hover:border-navy",
      )}
    >
      {children}
    </Link>
  );
}

export function FilterForm({ children, action }: { children: React.ReactNode; action: string }) {
  return (
    <form action={action} method="get" className="mb-4 flex flex-wrap items-end gap-3 border border-line bg-white p-3">
      {children}
      <button className="h-9 bg-navy px-4 text-[13px] font-semibold text-white">Filter</button>
      <Link href={action} className="h-9 px-2 text-[13px] leading-9 text-ink/55 hover:text-navy">
        Reset
      </Link>
    </form>
  );
}

export function FilterSelect({ name, label, value, options }: { name: string; label: string; value?: string; options: { value: string; label: string }[] }) {
  return (
    <label className="text-[12px] text-ink/55">
      <span className="mb-1 block">{label}</span>
      <select name={name} defaultValue={value ?? ""} className="h-9 min-w-36 border border-line bg-white px-2 text-[13px] text-ink">
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FilterInput({ name, label, value, placeholder }: { name: string; label: string; value?: string; placeholder?: string }) {
  return (
    <label className="text-[12px] text-ink/55">
      <span className="mb-1 block">{label}</span>
      <input name={name} defaultValue={value ?? ""} placeholder={placeholder} className="h-9 w-56 border border-line bg-white px-2 text-[13px] text-ink" />
    </label>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warning" | "success"; children: React.ReactNode }) {
  const tones = { info: "border-sky-200 bg-sky-50 text-sky-900", warning: "border-amber-200 bg-amber-50 text-amber-900", success: "border-emerald-200 bg-emerald-50 text-emerald-900" };
  return <div className={cn("mb-6 border px-4 py-3 text-sm", tones[tone])}>{children}</div>;
}
