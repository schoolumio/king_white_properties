import { cn } from "@/lib/utils";

export function SectionHeader({
  eyebrow,
  heading,
  intro,
  light,
  align = "left",
  className,
  action,
}: {
  eyebrow?: string;
  heading: string;
  intro?: string;
  light?: boolean;
  align?: "left" | "split";
  className?: string;
  action?: React.ReactNode;
}) {
  if (align === "split") {
    return (
      <div className={cn("grid gap-8 lg:grid-cols-12 lg:items-end", className)}>
        <div className="lg:col-span-7">
          {eyebrow && <p className={cn("eyebrow", light && "eyebrow-light")}>{eyebrow}</p>}
          <h2 className={cn("display-lg mt-5", light ? "text-white" : "text-navy")}>{heading}</h2>
        </div>
        <div className="lg:col-span-5 lg:pb-2">
          {intro && <p className={cn("text-base leading-relaxed sm:text-lg", light ? "text-white/65" : "text-ink/65")}>{intro}</p>}
          {action && <div className="mt-6">{action}</div>}
        </div>
      </div>
    );
  }
  return (
    <div className={cn("max-w-3xl", className)}>
      {eyebrow && <p className={cn("eyebrow", light && "eyebrow-light")}>{eyebrow}</p>}
      <h2 className={cn("display-lg mt-5", light ? "text-white" : "text-navy")}>{heading}</h2>
      {intro && <p className={cn("mt-6 text-base leading-relaxed sm:text-lg", light ? "text-white/65" : "text-ink/65")}>{intro}</p>}
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  light,
  className,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  light?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden border px-6 py-14 sm:px-12 sm:py-16",
        light ? "border-white/15 text-white" : "border-line bg-white/60 text-navy",
        className,
      )}
    >
      <div className="relative max-w-xl">
        <div className={cn("mb-6 h-px w-12", light ? "bg-gold-soft" : "bg-gold")} />
        <h3 className="font-display text-xl font-semibold sm:text-2xl">{title}</h3>
        <p className={cn("mt-3 text-[15px] leading-relaxed", light ? "text-white/60" : "text-ink/60")}>{description}</p>
        {action && <div className="mt-8">{action}</div>}
      </div>
      <svg className={cn("pointer-events-none absolute -right-10 -bottom-10 hidden h-64 w-64 sm:block", light ? "text-white/[0.06]" : "text-navy/[0.05]")} viewBox="0 0 100 100" aria-hidden>
        <rect x="10" y="10" width="80" height="80" fill="none" stroke="currentColor" strokeWidth="0.8" />
        <rect x="25" y="25" width="50" height="50" fill="none" stroke="currentColor" strokeWidth="0.8" />
        <rect x="40" y="40" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="0.8" />
      </svg>
    </div>
  );
}

export function Badge({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: "neutral" | "gold" | "navy" | "success" | "muted" | "light"; className?: string }) {
  const tones = {
    neutral: "bg-ivory text-navy",
    gold: "bg-gold text-navy",
    navy: "bg-navy text-white",
    success: "bg-emerald-50 text-emerald-800",
    muted: "bg-ink/5 text-ink/60",
    light: "bg-white/90 text-navy backdrop-blur",
  };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 font-display text-[10.5px] font-semibold tracking-[0.14em] uppercase", tones[tone], className)}>
      {children}
    </span>
  );
}

export function DemoBadge() {
  return (
    <span
      title="Sample record for demonstration environments — not a real listing"
      className="inline-flex items-center border border-dashed border-amber-500 bg-amber-50 px-2 py-0.5 font-display text-[10px] font-bold tracking-[0.14em] text-amber-800 uppercase"
    >
      Demo data
    </span>
  );
}
