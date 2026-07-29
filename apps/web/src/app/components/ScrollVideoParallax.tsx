"use client";

import {
  motion,
  type MotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  PROJECT_MEDIA_READY_EVENT,
  type ProjectMediaReadyDetail,
} from "./project-page/projectMediaReadyEvent";
import { getScrubScrollHeightSvh } from "./scrollVideoScrub";

type ScrollVideoParallaxProps = {
  alt: string;
  className?: string;
  controlledProgress?: number | MotionValue<number>;
  onDurationChange?: (durationSeconds: number, scrollHeightSvh: number) => void;
  onVideoError: () => void;
  posterSrc?: string | null;
  scrollRangeClassName?: string;
  showProgress?: boolean;
  shouldWriteScrollHeight?: boolean;
  title: string;
  videoMimeType: string;
  videoSrc: string;
};

const MIN_SEEK_INTERVAL_MS = 22;
const NEAR_VIEWPORT_ROOT_MARGIN = "50% 0px";

export function ScrollVideoParallax({
  alt,
  className = "",
  controlledProgress,
  onDurationChange,
  onVideoError,
  posterSrc = null,
  scrollRangeClassName = "hero-scroll-range",
  showProgress = true,
  shouldWriteScrollHeight = true,
  title,
  videoMimeType,
  videoSrc,
}: ScrollVideoParallaxProps) {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<number | null>(null);
  const durationRef = useRef(0);
  const scrollHeightRef = useRef(0);
  const targetTimeRef = useRef(0);
  const latestProgressRef = useRef(0);
  const lastSeekAtRef = useRef(0);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [isVideoFrameReady, setIsVideoFrameReady] = useState(false);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const smoothScrollYProgress = useSpring(scrollYProgress, {
    damping: 30,
    restDelta: 0.001,
    stiffness: 100,
  });
  const controlledMotionProgress =
    typeof controlledProgress === "number" ? null : (controlledProgress ?? null);
  const shouldAnimateVideo =
    shouldReduceMotion !== true &&
    (controlledProgress === undefined || controlledMotionProgress !== null);

  const updateTargetProgress = useCallback((progress: number, snapVideo = false) => {
    if (shouldReduceMotion === true) {
      return;
    }

    latestProgressRef.current = Math.min(Math.max(progress, 0), 1);
    targetTimeRef.current = latestProgressRef.current * Math.max(durationRef.current - 0.08, 0);

    if (snapVideo && videoRef.current && durationRef.current > 0) {
      videoRef.current.currentTime = targetTimeRef.current;
    }
  }, [shouldReduceMotion]);

  useMotionValueEvent(smoothScrollYProgress, "change", (progress) => {
    if (shouldReduceMotion === true || controlledProgress !== undefined) {
      return;
    }

    updateTargetProgress(progress);
  });

  useMotionValueEvent(controlledMotionProgress ?? scrollYProgress, "change", (progress) => {
    if (shouldReduceMotion === true || !controlledMotionProgress) {
      return;
    }

    updateTargetProgress(progress);
  });

  useLayoutEffect(() => {
    if (shouldReduceMotion === true || !controlledMotionProgress) {
      return;
    }

    updateTargetProgress(controlledMotionProgress.get(), true);
  }, [controlledMotionProgress, shouldReduceMotion, updateTargetProgress]);

  useLayoutEffect(() => {
    if (shouldReduceMotion === true || typeof controlledProgress !== "number") {
      return;
    }

    updateTargetProgress(controlledProgress, true);
  }, [controlledProgress, shouldReduceMotion, updateTargetProgress]);

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
      { rootMargin: NEAR_VIEWPORT_ROOT_MARGIN },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
      if (shouldWriteScrollHeight) {
        target.style.removeProperty("--scrub-scroll-height");
      }
    };
  }, [shouldWriteScrollHeight]);

  useEffect(() => {
    const video = videoRef.current;
    const scrollTarget = sectionRef.current ?? containerRef.current;

    if (!video || !isNearViewport || !shouldAnimateVideo) {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      return;
    }

    const tick = (now: number) => {
      const delta = targetTimeRef.current - video.currentTime;

      if (Math.abs(delta) > 0.015 && now - lastSeekAtRef.current >= MIN_SEEK_INTERVAL_MS) {
        lastSeekAtRef.current = now;
        video.currentTime += delta * 0.22;
      }

      frameRef.current = window.requestAnimationFrame(tick);
    };

    const syncDuration = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        durationRef.current = video.duration;
        const scrollHeight = getScrubScrollHeightSvh(video.duration);

        if (scrollHeightRef.current !== scrollHeight) {
          scrollHeightRef.current = scrollHeight;
          if (shouldWriteScrollHeight) {
            scrollTarget?.style.setProperty("--scrub-scroll-height", `${scrollHeight}svh`);
          }
          onDurationChange?.(video.duration, scrollHeight);
          window.requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
        }

        targetTimeRef.current =
          latestProgressRef.current * Math.max(durationRef.current - 0.08, 0);

        if (controlledProgress !== undefined) {
          video.currentTime = targetTimeRef.current;
        }
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
  }, [
    controlledProgress,
    isNearViewport,
    onDurationChange,
    shouldAnimateVideo,
    shouldWriteScrollHeight,
  ]);

  if (shouldReduceMotion === true) {
    return (
      <div
        aria-label={alt}
        className={`absolute inset-0 z-0 bg-cover bg-center ${className}`}
        ref={setScrollTarget}
        role="img"
        style={posterSrc ? { backgroundImage: `url(${posterSrc})` } : undefined}
      >
        {!posterSrc ? (
          <div className="absolute inset-0 grid place-items-center bg-charcoal px-6 text-center text-white">
            <div className="max-w-xs border-t border-white/18 pt-4">
              <p className="text-label font-medium uppercase tracking-[0.18em] text-white/45">
                Mídia indisponível
              </p>
              <p className="mt-3 text-caption leading-6 text-white/62">{alt}</p>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      aria-label={alt}
      className={`scrub-media absolute inset-0 z-0 bg-cover bg-center ${className}`}
      ref={setScrollTarget}
      role="img"
      style={posterSrc ? { backgroundImage: `url(${posterSrc})` } : undefined}
    >
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          aria-label={`Sequência em vídeo do projeto ${title}`}
          className={`h-full w-full object-cover transition-opacity duration-500 ${
            isVideoFrameReady ? "opacity-100" : "opacity-0"
          }`}
          muted
          onCanPlay={handleVideoReady}
          onError={onVideoError}
          onLoadedData={handleVideoReady}
          playsInline
          poster={posterSrc ?? undefined}
          preload={shouldAnimateVideo && (isNearViewport || isVideoFrameReady) ? "auto" : "none"}
        >
          <source src={videoSrc} type={videoMimeType} />
        </video>
      </div>
      {showProgress && controlledProgress === undefined ? (
        <div className="pointer-events-none absolute inset-x-5 bottom-5 z-40 h-px bg-white/20 sm:inset-x-8 lg:inset-x-16">
          <motion.div
            className="h-full origin-left bg-white"
            style={{ scaleX: smoothScrollYProgress }}
          />
        </div>
      ) : null}
    </div>
  );
}
