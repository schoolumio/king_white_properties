"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Building2,
  Car,
  ExternalLink,
  FileText,
  History,
  Images,
  Inbox,
  Landmark,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Newspaper,
  PanelsTopLeft,
  ScrollText,
  Settings,
  ShieldCheck,
  Tags,
  TrendingUp,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminNavGroup } from "./nav";

const ICONS = { BarChart3, Building2, Car, FileText, History, Images, Inbox, Landmark, LayoutDashboard, MapPin, Newspaper, PanelsTopLeft, ScrollText, Settings, ShieldCheck, Tags, TrendingUp, UserCog, Users };

export function AdminShell({
  nav,
  user,
  companyName,
  newEnquiries,
  logoutAction,
  children,
}: {
  nav: AdminNavGroup[];
  user: { name: string; role: string };
  companyName: string;
  newEnquiries: number;
  logoutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <Link href="/admin" className="min-w-0">
          <span className="block truncate font-display text-[12px] font-bold tracking-[0.2em] text-white uppercase">{companyName}</span>
          <span className="block text-[10px] tracking-[0.24em] text-accent-soft uppercase">Administration</span>
        </Link>
        <button className="text-white/70 lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation">
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Admin">
        {nav.map((group) => (
          <div key={group.title} className="mb-5">
            <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.2em] text-white/35 uppercase">{group.title}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = ICONS[item.icon as keyof typeof ICONS] ?? LayoutDashboard;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-[13.5px] transition-colors",
                        active(item.href) ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.6} />
                      <span className="flex-1">{item.label}</span>
                      {item.href === "/admin/enquiries" && newEnquiries > 0 && <span className="bg-accent px-1.5 py-0.5 text-[10px] font-bold text-primary">{newEnquiries}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <Link href="/admin/account" className="block text-sm text-white hover:text-accent-soft">
          {user.name}
          <span className="block text-xs text-white/45">{user.role}</span>
        </Link>
        <div className="mt-3 flex items-center gap-4 text-xs">
          <Link href="/" target="_blank" className="inline-flex items-center gap-1 text-white/55 hover:text-white">
            <ExternalLink className="h-3.5 w-3.5" /> View site
          </Link>
          <form action={logoutAction}>
            <button className="inline-flex items-center gap-1 text-white/55 hover:text-white">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-ink">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-primary lg:block">{sidebar}</aside>
      <div className={cn("fixed inset-0 z-50 lg:hidden", open ? "visible" : "invisible")}>
        <div className={cn("absolute inset-0 bg-black/50 transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={() => setOpen(false)} />
        <aside className={cn("absolute inset-y-0 left-0 w-72 bg-primary transition-transform", open ? "translate-x-0" : "-translate-x-full")}>{sidebar}</aside>
      </div>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-white px-4 lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open navigation" className="p-1">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display text-sm font-semibold text-primary">Administration</span>
        </header>
        <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
