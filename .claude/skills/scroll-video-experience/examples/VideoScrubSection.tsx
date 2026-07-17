"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type VideoScrubSectionProps = {
  src: string;
  poster: string;
  title: string;
  description?: string;
};

export function VideoScrubSection({
  src,
  poster,
  title,
  description,
}: VideoScrubSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const video = videoRef.current;
    const content = contentRef.current;

    if (!section || !stage || !video || !content) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    let frameId = 0;
    let targetTime = 0;
    let destroyed = false;
    let trigger: ScrollTrigger | undefined;

    const seek = () => {
      if (destroyed) return;

      const minimumDelta = 1 / 60;
      if (
        Number.isFinite(video.duration) &&
        Math.abs(video.currentTime - targetTime) > minimumDelta
      ) {
        video.currentTime = targetTime;
      }

      frameId = window.requestAnimationFrame(seek);
    };

    const initialize = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;

      const timeline = gsap.timeline({
        defaults: { ease: "none" },
      });

      timeline
        .fromTo(
          content,
          { autoAlpha: 0, y: 20 },
          { autoAlpha: 1, y: 0, duration: 0.08 },
          0.08,
        )
        .to(
          content,
          { autoAlpha: 0, y: -16, duration: 0.08 },
          0.32,
        );

      trigger = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => `+=${window.innerHeight * 5}`,
        pin: stage,
        scrub: 0.25,
        animation: timeline,
        invalidateOnRefresh: true,
        onUpdate(self) {
          targetTime = self.progress * video.duration;
        },
      });

      seek();
    };

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      initialize();
    } else {
      video.addEventListener("loadedmetadata", initialize, { once: true });
    }

    return () => {
      destroyed = true;
      window.cancelAnimationFrame(frameId);
      video.removeEventListener("loadedmetadata", initialize);
      trigger?.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} className="scrub-section">
      <div ref={stageRef} className="scrub-stage">
        <video
          ref={videoRef}
          className="scrub-video"
          src={src}
          poster={poster}
          muted
          playsInline
          preload="metadata"
          aria-label={`Architectural film for ${title}`}
        />

        <div className="scrub-overlay" aria-hidden="true" />

        <div ref={contentRef} className="scrub-content">
          <p className="scrub-kicker">Selected project</p>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
      </div>
    </section>
  );
}
