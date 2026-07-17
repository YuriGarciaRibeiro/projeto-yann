"use client";

import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import {
  PROJECT_MEDIA_READY_EVENT,
  type ProjectMediaReadyDetail,
} from "./project-page/projectMediaReadyEvent";

const MIN_SCROLL_HEIGHT_SVH = 260;
const MAX_SCROLL_HEIGHT_SVH = 600;
const SCROLL_HEIGHT_PER_SECOND_SVH = 55;

type ScrollVideoParallaxProps = {
  alt: string;
  className?: string;
  onVideoError: () => void;
  scrollRangeClassName?: string;
  title: string;
  videoMimeType: string;
  videoSrc: string;
};

export function ScrollVideoParallax({
  alt,
  className = "",
  onVideoError,
  scrollRangeClassName = "hero-scroll-range",
  title,
  videoMimeType,
  videoSrc,
}: ScrollVideoParallaxProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<number | null>(null);
  const durationRef = useRef(0);
  const scrollHeightRef = useRef(0);
  const targetTimeRef = useRef(0);
  const latestProgressRef = useRef(0);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [isVideoFrameReady, setIsVideoFrameReady] = useState(false);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const shadeOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [0.18, 0.34, 0.56]);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    latestProgressRef.current = Math.min(Math.max(progress, 0), 1);
    targetTimeRef.current =
      latestProgressRef.current * Math.max(durationRef.current - 0.08, 0);
  });

  const setScrollTarget = (node: HTMLDivElement | null) => {
    containerRef.current = node;
    sectionRef.current = node?.closest(`.${scrollRangeClassName}`) as HTMLElement | null;
  };

  const handleVideoReady = () => {
    setIsVideoFrameReady(true);
    window.dispatchEvent(
      new CustomEvent<ProjectMediaReadyDetail>(PROJECT_MEDIA_READY_EVENT, {
        detail: { src: videoSrc },
      }),
    );
  };

  useEffect(() => {
    const target = sectionRef.current ?? containerRef.current;

    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsNearViewport(entry.isIntersecting);
      },
      { rootMargin: "125% 0px" },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
      target.style.removeProperty("--scrub-scroll-height");
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const scrollTarget = sectionRef.current ?? containerRef.current;

    if (!video || !isNearViewport) {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      return;
    }

    const tick = () => {
      const delta = targetTimeRef.current - video.currentTime;

      if (Math.abs(delta) > 0.015) {
        video.currentTime += delta * 0.22;
      }

      frameRef.current = window.requestAnimationFrame(tick);
    };

    const syncDuration = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        durationRef.current = video.duration;
        const scrollHeight = Math.min(
          Math.max(video.duration * SCROLL_HEIGHT_PER_SECOND_SVH, MIN_SCROLL_HEIGHT_SVH),
          MAX_SCROLL_HEIGHT_SVH,
        );

        if (scrollHeightRef.current !== scrollHeight) {
          scrollHeightRef.current = scrollHeight;
          scrollTarget?.style.setProperty("--scrub-scroll-height", `${scrollHeight}svh`);
          window.requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
        }

        targetTimeRef.current =
          latestProgressRef.current * Math.max(durationRef.current - 0.08, 0);
      }
    };

    video.pause();
    syncDuration();
    video.addEventListener("loadedmetadata", syncDuration);
    video.addEventListener("durationchange", syncDuration);

    if (video.readyState < 1) {
      video.load();
    }

    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      video.removeEventListener("loadedmetadata", syncDuration);
      video.removeEventListener("durationchange", syncDuration);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

    };
  }, [isNearViewport]);

  return (
    <div
      aria-label={alt}
      className={`scrub-media absolute inset-0 z-0 ${className}`}
      ref={setScrollTarget}
      role="img"
    >
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          aria-label={`Sequencia em video do projeto ${title}`}
          className={`h-full w-full object-cover transition-opacity duration-500 ${
            isVideoFrameReady ? "opacity-100" : "opacity-0"
          }`}
          muted
          onCanPlay={handleVideoReady}
          onError={onVideoError}
          onLoadedData={handleVideoReady}
          playsInline
          preload={isNearViewport || isVideoFrameReady ? "auto" : "none"}
        >
          <source src={videoSrc} type={videoMimeType} />
        </video>
      </div>
      <motion.div className="absolute inset-0 bg-black" style={{ opacity: shadeOpacity }} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_42%,transparent_0%,rgb(0_0_0/0.16)_48%,rgb(0_0_0/0.54)_100%)]" />
    </div>
  );
}
