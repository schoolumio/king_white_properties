"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="grid min-h-screen place-items-center bg-navy px-6 text-white">
      <div className="max-w-xl text-center">
        <p className="font-display text-sm tracking-[0.3em] text-gold-soft uppercase">Something went wrong</p>
        <h1 className="mt-6 font-display text-4xl font-semibold">We could not load this page.</h1>
        <p className="mt-6 text-white/60">Please try again. If the problem persists, contact us directly.{error.digest && <span className="mt-2 block text-xs text-white/35">Reference: {error.digest}</span>}</p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <button onClick={reset} className="inline-flex h-12 items-center justify-center bg-gold px-6 font-display text-sm font-semibold text-navy">
            Try again
          </button>
          <Link href="/" className="inline-flex h-12 items-center justify-center border border-white/30 px-6 font-display text-sm font-semibold">
            Return home
          </Link>
        </div>
      </div>
    </main>
  );
}
