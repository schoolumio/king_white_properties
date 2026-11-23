"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Menu, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAIN_NAV } from "./nav-config";
import { Logo } from "./logo";

export function SiteHeader({ companyName, logo, logoInverse, phone, email }: { companyName: string; logo?: string; logoInverse?: string; phone?: string; email?: string }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setOpenMenu(null);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setOpenMenu(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const solid = scrolled || openMenu !== null;
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/"));

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,height] duration-500",
          solid ? "bg-navy/97 shadow-[0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md" : "bg-gradient-to-b from-navy/70 to-transparent",
        )}
      >
        <div className={cn("shell flex items-center justify-between transition-[height] duration-500", solid ? "h-[72px]" : "h-[88px]")}>
          <Logo companyName={companyName} logo={logoInverse || logo} light />

          <nav aria-label="Main" className="hidden xl:block">
            <ul className="flex items-center gap-1">
              {MAIN_NAV.map((item) => (
                <li
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => {
                    if (closeTimer.current) clearTimeout(closeTimer.current);
                    setOpenMenu(item.children ? item.label : null);
                  }}
                  onMouseLeave={() => {
                    closeTimer.current = setTimeout(() => setOpenMenu(null), 120);
                  }}
                >
                  {item.children ? (
                    <button
                      type="button"
                      aria-expanded={openMenu === item.label}
                      aria-haspopup="true"
                      onClick={() => setOpenMenu(openMenu === item.label ? null : item.label)}
                      className={cn(
                        "flex items-center gap-1.5 px-3.5 py-2 font-display text-[13.5px] font-medium tracking-wide transition-colors",
                        isActive(item.href) ? "text-gold-soft" : "text-white/85 hover:text-white",
                      )}
                    >
                      {item.label}
                      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", openMenu === item.label && "rotate-180")} aria-hidden />
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        "block px-3.5 py-2 font-display text-[13.5px] font-medium tracking-wide transition-colors",
                        isActive(item.href) ? "text-gold-soft" : "text-white/85 hover:text-white",
                      )}
                    >
                      {item.label}
                    </Link>
                  )}

                  {item.children && (
                    <div
                      className={cn(
                        "absolute top-full left-1/2 w-[440px] -translate-x-1/2 pt-4 transition-all duration-300",
                        openMenu === item.label ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0",
                      )}
                    >
                      <div className="border border-white/10 bg-navy p-3 shadow-2xl shadow-black/30">
                        <ul>
                          {item.children.map((child) => (
                            <li key={child.href + child.label}>
                              <Link
                                href={child.href}
                                className="group flex items-start justify-between gap-6 px-4 py-3.5 transition-colors hover:bg-white/[0.04] focus-visible:bg-white/[0.04]"
                              >
                                <span>
                                  <span className="block font-display text-sm font-semibold text-white">{child.label}</span>
                                  {child.description && <span className="mt-1 block text-[13px] text-white/50">{child.description}</span>}
                                </span>
                                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-gold-soft opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/partnerships#proposal"
              className="hidden h-11 items-center gap-2 border border-gold/70 px-5 font-display text-[13px] font-semibold tracking-wide text-white transition-colors hover:bg-gold hover:text-navy md:inline-flex"
            >
              Corporate Enquiry
            </Link>
            <button
              type="button"
              className="grid h-11 w-11 place-items-center border border-white/25 text-white xl:hidden"
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile navigation — a designed full-screen experience, not a compressed desktop menu */}
      <div
        className={cn("fixed inset-0 z-[60] bg-navy transition-[opacity,visibility] duration-500 xl:hidden", open ? "visible opacity-100" : "invisible opacity-0")}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
      >
        <div className="grain absolute inset-0 opacity-60" aria-hidden />
        <div className="relative flex h-full flex-col">
          <div className="shell flex h-[72px] items-center justify-between border-b border-white/10">
            <Logo companyName={companyName} logo={logoInverse || logo} light />
            <button type="button" className="grid h-11 w-11 place-items-center border border-white/25 text-white" aria-label="Close menu" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <nav aria-label="Mobile" className="shell flex-1 overflow-y-auto py-6">
            <ul className="divide-y divide-white/10">
              {MAIN_NAV.map((item, i) => (
                <li key={item.href} className={cn("transition-all duration-500", open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0")} style={{ transitionDelay: open ? `${80 + i * 40}ms` : "0ms" }}>
                  {item.children ? (
                    <>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between py-5 text-left font-display text-2xl font-semibold text-white"
                        aria-expanded={mobileSection === item.label}
                        onClick={() => setMobileSection(mobileSection === item.label ? null : item.label)}
                      >
                        {item.label}
                        <Plus className={cn("h-5 w-5 text-gold-soft transition-transform duration-300", mobileSection === item.label && "rotate-45")} aria-hidden />
                      </button>
                      <div className={cn("grid transition-[grid-template-rows] duration-500", mobileSection === item.label ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                        <ul className="overflow-hidden">
                          {item.children.map((child) => (
                            <li key={child.href + child.label}>
                              <Link href={child.href} className="flex items-center justify-between py-3 pl-4 text-base text-white/70 hover:text-white" onClick={() => setOpen(false)}>
                                {child.label}
                                <ArrowRight className="h-4 w-4 text-white/30" aria-hidden />
                              </Link>
                            </li>
                          ))}
                          <li className="h-4" />
                        </ul>
                      </div>
                    </>
                  ) : (
                    <Link href={item.href} className="block py-5 font-display text-2xl font-semibold text-white" onClick={() => setOpen(false)}>
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          <div className="shell border-t border-white/10 py-6">
            <Link href="/partnerships#proposal" onClick={() => setOpen(false)} className="flex h-14 w-full items-center justify-center gap-2 bg-gold font-display text-[15px] font-semibold text-navy">
              Corporate Enquiry <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            {(phone || email) && (
              <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/55">
                {phone && <a href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a>}
                {email && <a href={`mailto:${email}`}>{email}</a>}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
