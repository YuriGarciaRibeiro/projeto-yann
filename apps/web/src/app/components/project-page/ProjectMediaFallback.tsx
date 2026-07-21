"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";

type MediaPlaceholderProps = {
  className?: string;
  label: string;
  tone?: "dark" | "light";
};

type ProjectImageProps = {
  alt: string;
  className?: string;
  placeholderClassName?: string;
  src: string;
  tone?: "dark" | "light";
};

type ProjectVideoProps = {
  alt: string;
  className?: string;
  placeholderClassName?: string;
  posterSrc?: string | null;
  src: string;
  type: string;
};

export function ProjectImage({
  alt,
  className = "",
  placeholderClassName,
  src,
  tone = "light",
}: ProjectImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <MediaPlaceholder
        className={placeholderClassName ?? className}
        label={alt}
        tone={tone}
      />
    );
  }

  return <img alt={alt} className={className} onError={() => setFailed(true)} src={src} />;
}

export function ProjectVideo({
  alt,
  className = "",
  placeholderClassName,
  posterSrc,
  src,
  type,
}: ProjectVideoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <MediaPlaceholder className={placeholderClassName ?? className} label={alt} tone="dark" />;
  }

  return (
    <video
      aria-label={alt}
      className={className}
      controls
      muted
      onError={() => setFailed(true)}
      playsInline
      poster={posterSrc ?? undefined}
      preload="metadata"
    >
      <source src={src} type={type} />
    </video>
  );
}

export function MediaPlaceholder({
  className = "",
  label,
  tone = "light",
}: MediaPlaceholderProps) {
  const isDark = tone === "dark";

  return (
    <div
      aria-label={`${label} indisponivel`}
      className={`grid place-items-center ${isDark ? "bg-charcoal text-white" : "bg-line text-ink"} ${className}`}
      role="img"
    >
      <div className={`max-w-xs border-t pt-4 text-center ${isDark ? "border-white/18" : "border-black/18"}`}>
        <p className={`text-label font-medium uppercase tracking-[0.18em] ${isDark ? "text-white/45" : "text-mid-gray"}`}>
          Midia indisponivel
        </p>
        <p className={`mt-3 text-caption leading-6 ${isDark ? "text-white/62" : "text-graphite"}`}>
          {label}
        </p>
      </div>
    </div>
  );
}
