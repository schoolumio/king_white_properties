import Link from "next/link";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export type FilterField =
  | { name: string; label: string; type: "select"; options: { value: string; label: string }[] }
  | { name: string; label: string; type: "text" | "number"; placeholder?: string };

/** Server-rendered GET filter form — works without JavaScript and keeps URLs shareable. */
export function FilterBar({ action, fields, values, dark }: { action: string; fields: FilterField[]; values: Record<string, string | undefined>; dark?: boolean }) {
  const active = fields.filter((f) => values[f.name]).length;
  const field = cn(
    "h-12 w-full border px-3 text-[14.5px] outline-none transition-colors",
    dark ? "border-white/15 bg-white/[0.04] text-white focus:border-accent-soft [&>option]:text-ink" : "border-line bg-white text-ink focus:border-primary",
  );
  return (
    <form action={action} method="get" className={cn("border p-5 sm:p-6", dark ? "border-white/10 bg-white/[0.02]" : "border-line bg-white")} role="search">
      <div className="mb-4 flex items-center justify-between">
        <p className={cn("flex items-center gap-2 font-display text-[12px] font-semibold tracking-[0.16em] uppercase", dark ? "text-white/70" : "text-primary/70")}>
          <SlidersHorizontal className="h-4 w-4" aria-hidden /> Refine results
          {active > 0 && <span className="bg-accent px-1.5 text-[10px] text-primary">{active}</span>}
        </p>
        {active > 0 && (
          <Link href={action} className={cn("text-[13px] underline underline-offset-4", dark ? "text-white/60 hover:text-white" : "text-ink/60 hover:text-primary")}>
            Clear all
          </Link>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {fields.map((f) => (
          <label key={f.name} className="block">
            <span className={cn("mb-1.5 block text-[11.5px] font-medium tracking-wide", dark ? "text-white/50" : "text-ink/55")}>{f.label}</span>
            {f.type === "select" ? (
              <select name={f.name} defaultValue={values[f.name] ?? ""} className={field}>
                <option value="">Any</option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input name={f.name} type={f.type} defaultValue={values[f.name] ?? ""} placeholder={f.placeholder} min={f.type === "number" ? 0 : undefined} className={field} />
            )}
          </label>
        ))}
        <div className="flex items-end">
          <button type="submit" className={cn("h-12 w-full font-display text-sm font-semibold", dark ? "bg-accent text-primary hover:bg-accent-soft" : "bg-primary text-white hover:bg-primary-deep")}>
            Apply filters
          </button>
        </div>
      </div>
    </form>
  );
}

export function Pagination({ page, pageCount, basePath, params, dark }: { page: number; pageCount: number; basePath: string; params: Record<string, string | undefined>; dark?: boolean }) {
  if (pageCount <= 1) return null;
  const href = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") qs.set(k, v);
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter((p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1);
  const base = cn("grid h-11 min-w-11 place-items-center border px-3 text-sm", dark ? "border-white/15 text-white" : "border-line text-primary");
  return (
    <nav aria-label="Pagination" className="mt-14 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && (
        <Link href={href(page - 1)} className={base} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 opacity-50">…</span>}
          <Link href={href(p)} aria-current={p === page ? "page" : undefined} className={cn(base, p === page && (dark ? "border-accent bg-accent text-primary" : "border-primary bg-primary text-white"))}>
            {p}
          </Link>
        </span>
      ))}
      {page < pageCount && (
        <Link href={href(page + 1)} className={base} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </nav>
  );
}

export function ResultsMeta({ total, label, dark }: { total: number; label: string; dark?: boolean }) {
  return (
    <p className={cn("text-sm", dark ? "text-white/55" : "text-ink/55")} aria-live="polite">
      <span className={cn("font-display font-semibold", dark ? "text-white" : "text-primary")}>{total}</span> {label}
      {total === 1 ? "" : "s"}
    </p>
  );
}

export function opts<T extends string>(labels: Record<T, string>) {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));
}
