type Decimalish = { toString(): string } | number | string | null | undefined;

export const CURRENCIES = ["NGN", "USD", "GBP", "EUR"] as const;

export function formatMoney(amount: Decimalish, currency = "NGN", opts: { compact?: boolean } = {}) {
  if (amount === null || amount === undefined || amount === "") return null;
  const n = Number(amount.toString());
  if (!Number.isFinite(n)) return null;
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
      notation: opts.compact ? "compact" : "standard",
    }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString("en-NG")}`;
  }
}

const PERIOD_SUFFIX: Record<string, string> = {
  TOTAL: "",
  PER_ANNUM: " / year",
  PER_MONTH: " / month",
  PER_SQM: " / m²",
};

export function formatPrice(
  item: { price?: Decimalish; currency?: string; priceOnRequest?: boolean; pricePeriod?: string | null },
  opts: { compact?: boolean } = {},
) {
  if (item.priceOnRequest || item.price === null || item.price === undefined) return "Price on request";
  const money = formatMoney(item.price, item.currency || "NGN", opts);
  if (!money) return "Price on request";
  return money + (item.pricePeriod ? PERIOD_SUFFIX[item.pricePeriod] ?? "" : "");
}

export function formatNumber(n: number | null | undefined, suffix = "") {
  if (n === null || n === undefined) return null;
  return n.toLocaleString("en-NG") + suffix;
}

export function formatDate(date: Date | string | null | undefined, style: "long" | "short" | "datetime" = "long") {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (style === "datetime")
    return d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: style === "long" ? "long" : "short",
    year: "numeric",
  });
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function relativeTime(date: Date) {
  const diff = Date.now() - date.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return formatDate(date, "short");
}
