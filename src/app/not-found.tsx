import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-navy px-6 text-white">
      <div className="max-w-xl text-center">
        <p className="font-display text-sm tracking-[0.3em] text-gold-soft uppercase">Error 404</p>
        <h1 className="display-lg mt-6">This page could not be found.</h1>
        <p className="mt-6 text-white/60">The page may have moved, or the listing may no longer be available.</p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="inline-flex h-12 items-center justify-center bg-gold px-6 font-display text-sm font-semibold text-navy">
            Return home
          </Link>
          <Link href="/contact" className="inline-flex h-12 items-center justify-center border border-white/30 px-6 font-display text-sm font-semibold">
            Contact us
          </Link>
        </div>
      </div>
    </main>
  );
}
