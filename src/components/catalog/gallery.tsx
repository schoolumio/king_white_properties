"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { Photo } from "@/components/ui/photo";
import { cn } from "@/lib/utils";

export type GalleryImage = { src: string | null; alt: string };

/** Editorial gallery: lead image + thumbnails, with keyboard-accessible lightbox. */
export function Gallery({ images, fallbackLabel, dark }: { images: GalleryImage[]; fallbackLabel?: string; dark?: boolean }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const count = images.length;
  const go = useCallback((d: number) => setActive((i) => (i + d + count) % count), [count]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, go]);

  if (count === 0) {
    return <Photo src={null} alt="" className="aspect-[16/10]" fallbackLabel={fallbackLabel ?? "Images to follow"} tone={dark ? "graphite" : "ivory"} />;
  }
  const current = images[active];
  return (
    <div>
      <div className="group relative">
        <Photo src={current.src} alt={current.alt} className={cn("aspect-[16/10]", dark ? "bg-graphite" : "bg-ivory-deep")} sizes="(min-width:1024px) 66vw, 100vw" priority tone={dark ? "graphite" : "ivory"} />
        <button type="button" onClick={() => setOpen(true)} className="absolute right-4 bottom-4 flex items-center gap-2 bg-white/95 px-3 py-2 text-xs font-semibold text-navy" aria-label="Open full-screen gallery">
          <Expand className="h-3.5 w-3.5" aria-hidden /> {active + 1} / {count}
        </button>
        {count > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} className="absolute top-1/2 left-3 grid h-11 w-11 -translate-y-1/2 place-items-center bg-white/90 text-navy opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100" aria-label="Previous image">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => go(1)} className="absolute top-1/2 right-3 grid h-11 w-11 -translate-y-1/2 place-items-center bg-white/90 text-navy opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100" aria-label="Next image">
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
      {count > 1 && (
        <ul className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">
          {images.slice(0, 12).map((img, i) => (
            <li key={i}>
              <button type="button" onClick={() => setActive(i)} className={cn("block w-full ring-offset-2 transition", i === active ? "ring-2 ring-gold" : "opacity-70 hover:opacity-100")} aria-label={`Show image ${i + 1}`} aria-current={i === active}>
                <Photo src={img.src} alt="" className="aspect-[4/3]" sizes="120px" tone={dark ? "graphite" : "ivory"} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-black/95" role="dialog" aria-modal="true" aria-label="Image gallery">
          <div className="flex items-center justify-between p-4 text-white">
            <span className="text-sm text-white/60">
              {active + 1} / {count} — {current.alt}
            </span>
            <button type="button" onClick={() => setOpen(false)} className="grid h-11 w-11 place-items-center border border-white/20" aria-label="Close gallery" autoFocus>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="relative flex-1">
            <Photo src={current.src} alt={current.alt} className="absolute inset-4" imgClassName="!object-contain" sizes="100vw" tone="graphite" />
            {count > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} className="absolute top-1/2 left-4 grid h-12 w-12 -translate-y-1/2 place-items-center bg-white/10 text-white hover:bg-white/20" aria-label="Previous image">
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button type="button" onClick={() => go(1)} className="absolute top-1/2 right-4 grid h-12 w-12 -translate-y-1/2 place-items-center bg-white/10 text-white hover:bg-white/20" aria-label="Next image">
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
