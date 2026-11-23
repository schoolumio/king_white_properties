import Link from "next/link";
import { ArrowUpRight, BedDouble, Bath, Gauge, MapPin, Maximize2, Settings2 } from "lucide-react";
import { Photo } from "@/components/ui/photo";
import { DemoBadge } from "@/components/ui/section";
import { formatNumber, formatPrice } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import {
  AVAILABILITY_LABELS,
  CONDITION_LABELS,
  LISTING_LABELS,
  PROJECT_STATUS_LABELS,
  PROPERTY_STATUS_LABELS,
  SECTOR_LABELS,
  TRANSMISSION_LABELS,
} from "@/lib/labels";
import type { ProjectCardData, PropertyCardData, VehicleCardData } from "@/lib/queries";
import { cn } from "@/lib/utils";

function locationLabel(loc: { name: string; city: string | null; state: string | null } | null) {
  if (!loc) return null;
  return [loc.name, loc.city && loc.city !== loc.name ? loc.city : null, loc.state].filter(Boolean).join(", ");
}

export function ProjectCard({ project, size = "md", priority }: { project: ProjectCardData; size?: "lg" | "md"; priority?: boolean }) {
  const cover = project.media[0];
  return (
    <article className="group relative flex h-full flex-col">
      <Link href={`/real-estate/developments/${project.slug}`} className="block" aria-label={`View ${project.name}`}>
        <Photo
          src={mediaUrl(cover?.media)}
          alt={cover?.caption || cover?.media.alt || `${project.name} — development`}
          className={cn("bg-primary", size === "lg" ? "aspect-[4/3] lg:aspect-[16/11]" : "aspect-[4/3]")}
          imgClassName="transition-transform duration-[1.6s] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
          sizes={size === "lg" ? "(min-width:1024px) 58vw, 100vw" : "(min-width:1024px) 30vw, 100vw"}
          priority={priority}
          fallbackLabel={project.name}
        />
        <span className="absolute top-4 left-4 bg-white/95 px-3 py-1.5 font-display text-[10.5px] font-semibold tracking-[0.16em] text-primary uppercase">
          {PROJECT_STATUS_LABELS[project.status]}
        </span>
      </Link>
      <div className="flex flex-1 flex-col border-b border-line pt-6 pb-7">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-medium tracking-[0.12em] text-muted uppercase">
          <span>{SECTOR_LABELS[project.sector]}</span>
          {project.projectType && (
            <>
              <span className="h-3 w-px bg-line" aria-hidden />
              <span>{project.projectType}</span>
            </>
          )}
          {project.isDemo && <DemoBadge />}
        </div>
        <h3 className={cn("mt-3 font-display font-semibold text-primary", size === "lg" ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl")}>
          <Link href={`/real-estate/developments/${project.slug}`} className="hover:text-accent-deep">
            {project.name}
          </Link>
        </h3>
        {locationLabel(project.location) && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-ink/60">
            <MapPin className="h-3.5 w-3.5 text-accent-deep" aria-hidden />
            {locationLabel(project.location)}
          </p>
        )}
        <p className="mt-4 line-clamp-3 text-[15px] leading-relaxed text-ink/65">{project.summary}</p>
        <div className="mt-auto pt-6">
          <Link href={`/real-estate/developments/${project.slug}`} className="link-arrow text-primary hover:text-accent-deep">
            <span>View project</span>
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function PropertyCard({ property, priority }: { property: PropertyCardData; priority?: boolean }) {
  const cover = property.images[0];
  const specs = [
    property.bedrooms ? { icon: BedDouble, label: `${property.bedrooms} bed` } : null,
    property.bathrooms ? { icon: Bath, label: `${property.bathrooms} bath` } : null,
    property.floorAreaSqm
      ? { icon: Maximize2, label: `${formatNumber(property.floorAreaSqm)} m²` }
      : property.landAreaSqm
        ? { icon: Maximize2, label: `${formatNumber(property.landAreaSqm)} m² land` }
        : null,
  ].filter(Boolean) as { icon: typeof BedDouble; label: string }[];

  return (
    <article className="group flex h-full flex-col bg-white">
      <Link href={`/real-estate/properties/${property.slug}`} className="relative block" aria-label={`View ${property.title}`}>
        <Photo
          src={mediaUrl(cover?.media)}
          alt={cover?.alt || cover?.media.alt || property.title}
          className="aspect-[4/3] bg-surface-deep"
          imgClassName="transition-transform duration-[1.6s] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
          sizes="(min-width:1280px) 30vw, (min-width:768px) 45vw, 100vw"
          priority={priority}
          tone="surface"
          fallbackLabel={SECTOR_LABELS[property.sector]}
        />
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="bg-primary px-2.5 py-1 font-display text-[10.5px] font-semibold tracking-[0.14em] text-white uppercase">{LISTING_LABELS[property.listingType]}</span>
          {property.status !== "AVAILABLE" && (
            <span className="bg-white px-2.5 py-1 font-display text-[10.5px] font-semibold tracking-[0.14em] text-primary uppercase">{PROPERTY_STATUS_LABELS[property.status]}</span>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col border-x border-b border-line p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11.5px] font-medium tracking-[0.14em] text-muted uppercase">{property.propertyType?.name ?? SECTOR_LABELS[property.sector]}</p>
          {property.isDemo && <DemoBadge />}
        </div>
        <h3 className="mt-2.5 font-display text-lg leading-snug font-semibold text-primary">
          <Link href={`/real-estate/properties/${property.slug}`} className="hover:text-accent-deep">
            {property.title}
          </Link>
        </h3>
        {locationLabel(property.location) && (
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink/60">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-accent-deep" aria-hidden />
            {locationLabel(property.location)}
          </p>
        )}
        {specs.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-ink/70">
            {specs.map((s) => (
              <li key={s.label} className="flex items-center gap-1.5">
                <s.icon className="h-4 w-4 text-muted" aria-hidden strokeWidth={1.5} />
                {s.label}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex items-end justify-between gap-4 pt-6">
          <p className="font-display text-lg font-semibold text-primary">{formatPrice(property)}</p>
          <Link href={`/real-estate/properties/${property.slug}`} className="text-[13px] font-semibold text-primary underline decoration-accent underline-offset-4 hover:text-accent-deep">
            View property
          </Link>
        </div>
      </div>
    </article>
  );
}

export function VehicleCard({ vehicle, dark, priority }: { vehicle: VehicleCardData; dark?: boolean; priority?: boolean }) {
  const cover = vehicle.images[0];
  const name = `${vehicle.make} ${vehicle.model}`;
  return (
    <article className={cn("group flex h-full flex-col", dark ? "bg-white/[0.03] ring-1 ring-white/10" : "bg-white ring-1 ring-line")}>
      <Link href={`/automotive/vehicles/${vehicle.slug}`} className="relative block" aria-label={`View ${vehicle.year} ${name}`}>
        <Photo
          src={mediaUrl(cover?.media)}
          alt={cover?.alt || cover?.media.alt || `${vehicle.year} ${name}`}
          className={cn("aspect-[16/10]", dark ? "bg-evergreen" : "bg-surface-deep")}
          imgClassName="transition-transform duration-[1.6s] ease-[var(--ease-out-expo)] group-hover:scale-[1.05]"
          sizes="(min-width:1280px) 30vw, (min-width:768px) 45vw, 100vw"
          priority={priority}
          tone={dark ? "evergreen" : "surface"}
          fallbackLabel={vehicle.make}
        />
        <span
          className={cn(
            "absolute top-4 left-4 inline-flex items-center gap-2 px-2.5 py-1 font-display text-[10.5px] font-semibold tracking-[0.14em] uppercase",
            "bg-white/95 text-primary",
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", vehicle.availability === "AVAILABLE" ? "bg-emerald-500" : "bg-amber-500")} aria-hidden />
          {AVAILABILITY_LABELS[vehicle.availability]}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center justify-between gap-3">
          <p className={cn("font-display text-[11px] font-semibold tracking-[0.24em] uppercase", dark ? "text-accent-soft" : "text-accent-deep")}>
            {vehicle.make} · {vehicle.year}
          </p>
          {vehicle.isDemo && <DemoBadge />}
        </div>
        <h3 className={cn("mt-2 font-display text-xl font-semibold", dark ? "text-white" : "text-primary")}>
          <Link href={`/automotive/vehicles/${vehicle.slug}`} className="hover:text-accent-soft">
            {vehicle.model}
            {vehicle.variant && <span className={cn("ml-2 text-base font-medium", dark ? "text-white/50" : "text-ink/50")}>{vehicle.variant}</span>}
          </Link>
        </h3>
        <ul className={cn("mt-5 grid grid-cols-3 border-y py-3.5 text-[12.5px]", dark ? "border-white/10 text-white/65" : "border-line text-ink/65")}>
          <li className="flex items-center gap-1.5">{CONDITION_LABELS[vehicle.condition]}</li>
          <li className="flex items-center gap-1.5">
            <Settings2 className="h-3.5 w-3.5 opacity-60" aria-hidden />
            {TRANSMISSION_LABELS[vehicle.transmission]}
          </li>
          <li className="flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5 opacity-60" aria-hidden />
            {vehicle.mileage !== null ? `${formatNumber(vehicle.mileage)} ${vehicle.mileageUnit}` : "—"}
          </li>
        </ul>
        <div className="mt-auto flex items-end justify-between gap-4 pt-5">
          <p className={cn("font-display text-lg font-semibold", dark ? "text-white" : "text-primary")}>{formatPrice(vehicle)}</p>
          <Link
            href={`/automotive/vehicles/${vehicle.slug}`}
            className={cn("text-[13px] font-semibold underline decoration-accent underline-offset-4", dark ? "text-white hover:text-accent-soft" : "text-primary hover:text-accent-deep")}
          >
            View vehicle
          </Link>
        </div>
      </div>
    </article>
  );
}
