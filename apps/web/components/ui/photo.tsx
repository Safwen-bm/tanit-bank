"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TanitMark } from "../tanit-mark";

/**
 * A photo from /public/images with a quiet placeholder, so the page still looks intentional
 * while an image is missing or loading.
 */
export function Photo({
  src,
  alt,
  className,
  sizes = "(min-width: 1024px) 40vw, 90vw",
  eager = false,
  dark = false,
  fallback,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  eager?: boolean;
  /** Use on always-dark surfaces so the placeholder stays dark if the file is missing. */
  dark?: boolean;
  /** Replaces the default placeholder mark (for example with a <Guilloche />). */
  fallback?: ReactNode;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={cn("relative overflow-hidden", dark ? "bg-deep" : "bg-paper-2", className)}>
      <div
        className={cn("absolute inset-0 flex items-center justify-center", dark ? "text-deep-ink/10" : "text-ink/10")}
        aria-hidden="true"
      >
        {fallback ?? <TanitMark className="size-1/4 min-w-8" />}
      </div>
      {!failed && (
        <Image
          ref={(el) => {
            if (el && el.complete && el.naturalWidth === 0) setFailed(true);
          }}
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          loading={eager ? "eager" : "lazy"}
          onError={() => setFailed(true)}
          className="object-cover"
        />
      )}
    </div>
  );
}
