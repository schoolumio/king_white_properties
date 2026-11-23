import { cn } from "@/lib/utils";

/**
 * Keyless map embed (OpenStreetMap). If NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY is set,
 * the Google Maps Embed API is used instead.
 */
export function MapEmbed({ lat, lng, title, className }: { lat: number; lng: number; title: string; className?: string }) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  const d = 0.012;
  const src = key
    ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${lat},${lng}&zoom=15`
    : `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lng}`;
  return (
    <div className={cn("relative w-full overflow-hidden bg-ivory-deep", className)}>
      <iframe title={title} src={src} className="absolute inset-0 h-full w-full grayscale-[35%]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      <a
        href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute right-3 bottom-3 bg-white px-3 py-1.5 text-xs font-semibold text-navy shadow"
      >
        Open larger map
      </a>
    </div>
  );
}
