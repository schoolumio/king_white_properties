import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Photo } from "@/components/ui/photo";
import { absoluteUrl, JsonLd } from "@/lib/seo";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items, light = true }: { items: Crumb[]; light?: boolean }) {
  const all = [{ label: "Home", href: "/" }, ...items];
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, ...(c.href ? { item: absoluteUrl(c.href) } : {}) })),
        }}
      />
      <nav aria-label="Breadcrumb">
        <ol className={cn("flex flex-wrap items-center gap-1.5 text-[12.5px]", light ? "text-white/50" : "text-ink/50")}>
          {all.map((c, i) => (
            <li key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3 w-3" aria-hidden />}
              {c.href && i < all.length - 1 ? (
                <Link href={c.href} className={light ? "hover:text-white" : "hover:text-primary"}>
                  {c.label}
                </Link>
              ) : (
                <span aria-current={i === all.length - 1 ? "page" : undefined} className={light ? "text-white/80" : "text-primary"}>
                  {c.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

/** Standard dark page opening used by every public page (header sits transparently above it). */
export function PageHero({
  eyebrow,
  title,
  statement,
  image,
  imageAlt,
  crumbs,
  children,
  size = "md",
  tone = "primary",
}: {
  eyebrow?: string;
  title: string;
  statement?: string;
  image?: string | null;
  imageAlt?: string;
  crumbs?: Crumb[];
  children?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  tone?: "primary" | "evergreen";
}) {
  return (
    <section className={cn("relative isolate overflow-hidden text-white", tone === "evergreen" ? "bg-evergreen" : "bg-primary")}>
      {image && (
        <>
          <Photo src={image} alt={imageAlt ?? ""} className="absolute inset-0 -z-10" imgClassName="hero-zoom" priority sizes="100vw" />
          <div className={cn("absolute inset-0 -z-10", tone === "evergreen" ? "bg-gradient-to-r from-evergreen via-evergreen/85 to-evergreen/30" : "bg-gradient-to-r from-primary via-primary/85 to-primary/30")} />
        </>
      )}
      {!image && <div className="grain absolute inset-0 -z-10 opacity-40" aria-hidden />}
      <div className={cn("shell", size === "lg" ? "pt-40 pb-24 sm:pt-48 sm:pb-32 lg:min-h-[78vh] lg:flex lg:flex-col lg:justify-end" : size === "md" ? "pt-36 pb-16 sm:pt-44 sm:pb-24" : "pt-32 pb-12 sm:pt-36 sm:pb-14")}>
        {crumbs && <Breadcrumbs items={crumbs} />}
        <div className={cn("max-w-4xl", crumbs && "mt-8")}>
          {eyebrow && <p className="eyebrow eyebrow-light rise">{eyebrow}</p>}
          <h1 className={cn("rise mt-5", size === "sm" ? "display-md" : size === "lg" ? "display-xl" : "display-lg")} style={{ animationDelay: "100ms" }}>
            {title}
          </h1>
          {statement && (
            <p className="rise mt-6 max-w-2xl text-lg leading-relaxed text-white/70 sm:text-xl" style={{ animationDelay: "220ms" }}>
              {statement}
            </p>
          )}
          {children && (
            <div className="rise mt-10" style={{ animationDelay: "320ms" }}>
              {children}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
