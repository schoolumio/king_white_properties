"use client";

import Image, { type ImageProps } from "next/image";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { isOptimizable } from "@/lib/media";

/**
 * Editorial image with a graceful branded fallback when a source is missing or
 * fails to load, so a page never shows a broken image icon.
 */
export function Photo({
  src,
  alt,
  className,
  imgClassName,
  fallbackLabel,
  tone = "primary",
  ...rest
}: Omit<ImageProps, "src" | "alt"> & {
  src?: string | null;
  alt: string;
  imgClassName?: string;
  fallbackLabel?: string;
  tone?: "primary" | "surface" | "evergreen";
}) {
  const [failed, setFailed] = useState(false);
  const show = src && !failed;
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {show ? (
        <Image
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          className={cn("object-cover", imgClassName)}
          unoptimized={!isOptimizable(src)}
          {...rest}
          fill={rest.width ? undefined : true}
        />
      ) : (
        <Fallback tone={tone} label={fallbackLabel} />
      )}
    </div>
  );
}

function Fallback({ tone, label }: { tone: "primary" | "surface" | "evergreen"; label?: string }) {
  const id = useId().replace(/:/g, "");
  const bg = tone === "surface" ? "bg-surface-deep text-primary/30" : tone === "evergreen" ? "bg-evergreen text-white/15" : "bg-primary text-white/15";
  return (
    <div className={cn("absolute inset-0 flex items-end", bg)} role="presentation">
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden>
        <defs>
          <pattern id={`fb-${id}`} width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M48 0H0V48" fill="none" stroke="currentColor" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#fb-${id})`} />
        <line x1="0" y1="100%" x2="100%" y2="0" stroke="currentColor" strokeWidth="0.6" />
      </svg>
      {label && (
        <span className="relative m-5 font-display text-[10px] font-semibold tracking-[0.3em] uppercase opacity-80">{label}</span>
      )}
    </div>
  );
}
