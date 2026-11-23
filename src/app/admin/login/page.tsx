import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getSite } from "@/lib/content";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getCurrentUser()) redirect("/admin");
  const [site, sp] = await Promise.all([getSite(), searchParams]);
  return (
    <main className="grid min-h-screen bg-navy lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <div className="grain absolute inset-0 opacity-50" aria-hidden />
        <div className="relative flex h-full flex-col justify-between p-14 text-white">
          <p className="font-display text-sm font-bold tracking-[0.24em] uppercase">{site.companyName}</p>
          <div>
            <p className="font-serif text-4xl leading-tight text-gold-soft italic">{site.tagline}</p>
            <p className="mt-6 max-w-sm text-white/50">Corporate administration portal — authorised personnel only. All activity is logged.</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center bg-white px-6 py-16">
        <div className="w-full max-w-sm">
          <p className="font-display text-xs font-semibold tracking-[0.24em] text-gold-deep uppercase">Administration</p>
          <h1 className="mt-4 font-display text-3xl font-semibold text-navy">Sign in</h1>
          <p className="mt-2 text-sm text-ink/60">Use the credentials issued by your administrator.</p>
          <LoginForm next={sp.next ?? ""} />
        </div>
      </div>
    </main>
  );
}
