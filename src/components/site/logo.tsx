import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { isOptimizable } from "@/lib/media";

function initials(name: string) {
  const words = name.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  return (words.length >= 2 ? words[0][0] + words[1][0] : (words[0] ?? "C").slice(0, 2)).toUpperCase();
}

export function Logo({
  companyName,
  logo,
  light,
  className,
}: {
  companyName: string;
  logo?: string;
  light?: boolean;
  className?: string;
}) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-3", className)} aria-label={`${companyName} — home`}>
      {logo ? (
        <Image src={logo} alt={companyName} width={180} height={48} className="h-10 w-auto object-contain" priority unoptimized={!isOptimizable(logo)} />
      ) : (
        <>
          <span
            className={cn(
              "relative grid h-10 w-10 shrink-0 place-items-center border font-display text-[13px] font-bold tracking-[0.08em] transition-colors",
              light ? "border-white/40 text-white group-hover:border-gold-soft" : "border-navy/30 text-navy group-hover:border-gold",
            )}
          >
            {initials(companyName)}
            <span className={cn("absolute -right-px -bottom-px h-2 w-2", "bg-gold")} />
          </span>
          <span className="flex flex-col leading-none">
            <span className={cn("font-display text-[13px] font-bold tracking-[0.22em] uppercase", light ? "text-white" : "text-navy")}>
              {companyName}
            </span>
            <span className={cn("mt-1.5 text-[9.5px] font-medium tracking-[0.3em] uppercase", light ? "text-white/50" : "text-steel")}>
              Real Estate · Automotive
            </span>
          </span>
        </>
      )}
    </Link>
  );
}
