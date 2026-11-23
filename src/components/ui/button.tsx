import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "accent" | "outline" | "outline-light" | "light" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "group inline-flex items-center justify-center gap-3 font-display font-semibold tracking-wide transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-deep",
  accent: "bg-accent text-primary hover:bg-accent-soft",
  outline: "border border-primary/25 text-primary hover:border-primary hover:bg-primary hover:text-white",
  "outline-light": "border border-white/35 text-white hover:border-white hover:bg-white hover:text-primary",
  light: "bg-white text-primary hover:bg-surface",
  ghost: "text-primary hover:text-accent-deep",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-[13px]",
  md: "h-12 px-6 text-sm",
  lg: "h-14 px-8 text-[15px]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  size = "md",
  arrow = false,
  className,
  ...rest
}: {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  className?: string;
} & Omit<React.ComponentProps<typeof Link>, "href" | "className">) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...rest}>
      {children}
      {arrow && <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />}
    </Link>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

export function ArrowLink({ href, children, className, light }: { href: string; children: React.ReactNode; className?: string; light?: boolean }) {
  return (
    <Link href={href} className={cn("link-arrow", light ? "text-white hover:text-accent-soft" : "text-primary hover:text-accent-deep", className)}>
      <span className="border-b border-current/30 pb-0.5">{children}</span>
      <ArrowRight className="h-4 w-4" aria-hidden />
    </Link>
  );
}
