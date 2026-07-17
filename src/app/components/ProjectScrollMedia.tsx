"use client";

import { useState } from "react";

import { ScrollVideoParallax } from "./ScrollVideoParallax";

type ProjectScrollMediaProps = {
  alt: string;
  className?: string;
  posterSrc: string | null;
  scrollRangeClassName?: string;
  title: string;
  videoMimeType: string | null;
  videoSrc: string | null;
};

export function ProjectScrollMedia({
  alt,
  className = "",
  posterSrc,
  scrollRangeClassName,
  title,
  videoMimeType,
  videoSrc,
}: ProjectScrollMediaProps) {
  const [videoFailed, setVideoFailed] = useState(false);

  if (videoSrc && videoMimeType && !videoFailed) {
    return (
      <ScrollVideoParallax
        alt={alt}
        className={className}
        onVideoError={() => setVideoFailed(true)}
        scrollRangeClassName={scrollRangeClassName}
        title={title}
        videoMimeType={videoMimeType}
        videoSrc={videoSrc}
      />
    );
  }

  if (!posterSrc) {
    return (
      <div
        aria-label={alt}
        className={`absolute inset-0 z-0 grid place-items-center bg-[var(--charcoal)] text-white ${className}`}
        role="img"
      >
        <div className="max-w-xs border-t border-white/18 pt-4 text-center">
          <p className="text-[var(--text-label)] font-medium uppercase tracking-[0.18em] text-white/45">
            Midia indisponivel
          </p>
          <p className="mt-3 text-sm leading-6 text-white/62">{alt}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      aria-label={alt}
      className={`absolute inset-0 z-0 bg-[var(--black)] bg-cover bg-center ${className}`}
      role="img"
      style={{ backgroundImage: `url(${posterSrc})` }}
    />
  );
}
