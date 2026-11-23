import type { Metadata, Viewport } from "next";
import { Inter, Manrope, Playfair_Display } from "next/font/google";
import { getContent, getSite } from "@/lib/content";
import { absoluteUrl } from "@/lib/seo";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap", style: ["normal", "italic"] });

export async function generateMetadata(): Promise<Metadata> {
  const [site, seo] = await Promise.all([getSite(), getContent<{ defaultTitle: string; description: string; ogImage: string; keywords: string[] }>("seo")]);
  return {
    metadataBase: new URL(absoluteUrl("/")),
    title: { default: `${site.companyName} — ${seo.defaultTitle}`, template: `%s | ${site.companyName}` },
    description: seo.description,
    keywords: seo.keywords,
    applicationName: site.companyName,
    openGraph: {
      type: "website",
      siteName: site.companyName,
      locale: "en_NG",
      images: seo.ogImage ? [{ url: seo.ogImage }] : undefined,
    },
    twitter: { card: "summary_large_image" },
    alternates: { canonical: "/" },
  };
}

export const viewport: Viewport = {
  themeColor: "#0F3D2E",
  width: "device-width",
  initialScale: 1,
};

const HEX = /^#[0-9a-fA-F]{6}$/;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await getContent<Record<string, string>>("theme");
  const vars = (["primary", "evergreen", "surface", "accent", "muted"] as const)
    .map((k) => {
      const value = theme[k];
      return value && HEX.test(value) ? `--brand-${k}:${value};` : "";
    })
    .join("");

  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable} ${playfair.variable}`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: `:root{${vars}}` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
