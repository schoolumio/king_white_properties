import { SITE_URL } from "./site-url";

export function absoluteUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pageMetadata(opts: { title: string; description?: string | null; path: string; image?: string | null; noindex?: boolean }) {
  return {
    title: opts.title,
    description: opts.description ?? undefined,
    alternates: { canonical: opts.path },
    openGraph: {
      title: opts.title,
      description: opts.description ?? undefined,
      url: opts.path,
      images: opts.image ? [{ url: absoluteUrl(opts.image) }] : undefined,
    },
    robots: opts.noindex ? { index: false, follow: false } : undefined,
  };
}

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output with "<" escaped is safe to inline.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
