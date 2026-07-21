"use client";

import type { MotionValue } from "framer-motion";
import { useState } from "react";

import { ScrollVideoParallax } from "./ScrollVideoParallax";

type ProjectScrollMediaProps = {
  alt: string;
  className?: string;
  controlledProgress?: number | MotionValue<number>;
  onDurationChange?: (durationSeconds: number, scrollHeightSvh: number) => void;
  posterSrc: string | null;
  scrollRangeClassName?: string;
  shouldWriteScrollHeight?: boolean;
  title: string;
  videoMimeType: string | null;
  videoSrc: string | null;
};

export function ProjectScrollMedia({
  alt,
  className = "",
  controlledProgress,
  onDurationChange,
  posterSrc,
  scrollRangeClassName,
  shouldWriteScrollHeight,
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
        controlledProgress={controlledProgress}
        onDurationChange={onDurationChange}
        onVideoError={() => setVideoFailed(true)}
        posterSrc={posterSrc}
        scrollRangeClassName={scrollRangeClassName}
        shouldWriteScrollHeight={shouldWriteScrollHeight}
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
