type MediaLike = { id: string; url: string | null; visibility: "PUBLIC" | "PRIVATE" };

/** URL for a media asset as seen by the browser. Private assets go through the authorised file route. */
export function mediaUrl(asset: MediaLike | null | undefined) {
  if (!asset) return null;
  if (asset.visibility === "PUBLIC" && asset.url) return asset.url;
  return `/api/files/${asset.id}`;
}

/** Public documents are always downloaded through /api/files so access rules are enforced centrally. */
export function downloadUrl(asset: { id: string }) {
  return `/api/files/${asset.id}?download=1`;
}

const OPTIMIZABLE_HOSTS = ["res.cloudinary.com", "images.unsplash.com"];

/** Only hosts configured in next.config images.remotePatterns go through the optimiser. */
export function isOptimizable(src: string) {
  if (src.startsWith("/api/")) return false;
  if (src.startsWith("/")) return true;
  try {
    return OPTIMIZABLE_HOSTS.includes(new URL(src).hostname);
  } catch {
    return false;
  }
}
