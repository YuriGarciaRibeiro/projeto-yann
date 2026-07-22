"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from "framer-motion";
import {
  type CSSProperties,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { ProjectScrollMedia } from "../../ProjectScrollMedia";
import { getScrubScrollHeightSvh } from "../../scrollVideoScrub";
import {
  getParallaxSequenceProgress,
  getTotalSegmentScrollHeight,
} from "../parallaxSequenceProgress";
import type { PublishedProjectPageData } from "../ProjectPage";

type ProjectSectionRow = PublishedProjectPageData["sections"][number];

type ParallaxVideoSequenceProps = {
  sectionRows: ProjectSectionRow[];
};

export function ParallaxVideoSequence({ sectionRows }: ParallaxVideoSequenceProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const activeIndexRef = useRef(0);
  const shouldReduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [canEnhanceSequence, setCanEnhanceSequence] = useState(false);
  const activeSegmentProgress = useMotionValue(0);
  const [segmentScrollHeights, setSegmentScrollHeights] = useState(() =>
    sectionRows.map(() => getScrubScrollHeightSvh(0)),
  );
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const smoothScrollYProgress = useSpring(scrollYProgress, {
    damping: 30,
    restDelta: 0.001,
    stiffness: 100,
  });

  const totalScrollHeight = getTotalSegmentScrollHeight(segmentScrollHeights);
  const activeRow = sectionRows[activeIndex] ?? sectionRows[0];

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(prefers-reduced-motion: no-preference) and (pointer: fine)",
    );
    const updateEnhancement = () => setCanEnhanceSequence(mediaQuery.matches);

    updateEnhancement();
    mediaQuery.addEventListener("change", updateEnhancement);

    return () => mediaQuery.removeEventListener("change", updateEnhancement);
  }, []);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    const { activeIndex: nextActiveIndex, localProgress } = getParallaxSequenceProgress(
      segmentScrollHeights,
      progress,
    );

    activeSegmentProgress.set(localProgress);
    if (activeIndexRef.current !== nextActiveIndex) {
      activeIndexRef.current = nextActiveIndex;
      setActiveIndex(nextActiveIndex);
    }
  });

  const handleDurationChange = useCallback((index: number, _duration: number, scrollHeight: number) => {
    setSegmentScrollHeights((currentHeights) => {
      if (currentHeights[index] === scrollHeight) {
        return currentHeights;
      }

      const nextHeights = [...currentHeights];
      nextHeights[index] = scrollHeight;
      return nextHeights;
    });
  }, []);
  const handleMetadataLoaded = useCallback(
    (index: number, event: SyntheticEvent<HTMLVideoElement>) => {
      const { duration } = event.currentTarget;

      if (Number.isFinite(duration) && duration > 0) {
        handleDurationChange(index, duration, getScrubScrollHeightSvh(duration));
      }
    },
    [handleDurationChange],
  );

  if (!activeRow) {
    return null;
  }

  if (!canEnhanceSequence) {
    return (
      <section
        aria-label="Sequencia de videos do projeto"
        className="project-parallax-sequence bg-black text-white"
        data-header-theme="light"
        data-sequence-mode="fallback"
        ref={sectionRef}
      >
        {sectionRows.map((sectionRow) => {
          const { section, primaryMediaAsset, posterMediaAsset } = sectionRow;
          const mediaAlt =
            posterMediaAsset?.altText ??
            primaryMediaAsset?.altText ??
            section.title ??
            "Imagem do projeto.";

          return (
            <article
              aria-labelledby={section.title ? `${section.id}-title` : undefined}
              className="relative min-h-svh overflow-hidden border-t border-white/12 first:border-t-0"
              key={section.id}
            >
              {posterMediaAsset?.url ? (
                <div
                  aria-label={mediaAlt}
                  className="absolute inset-0 z-0 bg-black bg-cover bg-center"
                  role="img"
                  style={{ backgroundImage: `url(${posterMediaAsset.url})` }}
                />
              ) : (
                <div
                  aria-label={mediaAlt}
                  className="absolute inset-0 z-0 grid place-items-center bg-charcoal text-white"
                  role="img"
                >
                  <p className="max-w-xs border-t border-white/18 pt-4 text-center text-caption leading-6 text-white/62">
                    {mediaAlt}
                  </p>
                </div>
              )}
              <div className="relative z-20 grid min-h-svh max-w-none grid-cols-4 content-end gap-4 px-5 pb-10 pt-28 sm:grid-cols-6 sm:px-8 sm:pb-14 lg:grid-cols-12 lg:px-8 lg:pb-16 xl:px-10">
                <div className="col-span-4 [text-shadow:0_2px_18px_rgb(0_0_0/0.55)] sm:col-span-5 lg:col-span-6">
                  {section.title ? (
                    <h2
                      className="font-display text-project-title font-normal leading-[0.95] tracking-[-0.045em]"
                      id={`${section.id}-title`}
                    >
                      {section.title}
                    </h2>
                  ) : null}
                  {section.body ? (
                    <p className="mt-6 max-w-2xl whitespace-pre-line text-body-large leading-[1.55] text-white/76">
                      {section.body}
                    </p>
                  ) : null}
                </div>
                {section.caption ? (
                  <p className="col-span-4 mt-10 self-end border border-white/10 bg-white/[0.08] px-4 py-3 text-caption leading-6 text-white/72 sm:col-span-3 lg:col-span-3 lg:col-start-10 lg:mt-0 xl:col-start-10">
                    {section.caption}
                  </p>
                ) : null}
              </div>
            </article>
          );
        })}
      </section>
    );
  }

  const { section } = activeRow;

  return (
    <section
      aria-labelledby={section.title ? `${section.id}-title` : undefined}
      className="project-scroll-range project-scrub-flow project-parallax-sequence relative bg-black text-white"
      data-header-theme="light"
      ref={sectionRef}
      style={{ "--scrub-scroll-height": `${totalScrollHeight}svh` } as CSSProperties}
    >
      <div className="project-scroll-stage sticky top-0 min-h-svh overflow-hidden">
        {sectionRows.map((sectionRow, index) => {
          const isActive = index === activeIndex;
          const { section: mediaSection, primaryMediaAsset, posterMediaAsset } = sectionRow;
          const mediaAlt =
            posterMediaAsset?.altText ??
            primaryMediaAsset?.altText ??
            mediaSection.title ??
            "Video do projeto.";

          return (
            <div
              className={`absolute inset-0 transition-opacity duration-500 ${
                isActive ? "opacity-100" : "opacity-0"
              }`}
              key={mediaSection.id}
            >
              <ProjectScrollMedia
                alt={mediaAlt}
                controlledProgress={isActive ? activeSegmentProgress : index < activeIndex ? 1 : 0}
                onDurationChange={(duration, scrollHeight) => {
                  handleDurationChange(index, duration, scrollHeight);
                }}
                posterSrc={posterMediaAsset?.url ?? null}
                scrollRangeClassName="project-scroll-range"
                shouldWriteScrollHeight={false}
                title={mediaSection.title ?? "Projeto"}
                videoMimeType={primaryMediaAsset?.mimeType ?? null}
                videoSrc={primaryMediaAsset?.url ?? null}
              />
              {primaryMediaAsset?.url && primaryMediaAsset.mimeType ? (
                <video
                  aria-hidden="true"
                  className="pointer-events-none absolute size-px overflow-hidden opacity-0"
                  muted
                  onLoadedMetadata={(event) => handleMetadataLoaded(index, event)}
                  preload="metadata"
                  tabIndex={-1}
                >
                  <source src={primaryMediaAsset.url} type={primaryMediaAsset.mimeType} />
                </video>
              ) : null}
            </div>
          );
        })}
        <div className="pointer-events-none absolute inset-x-5 bottom-5 z-40 h-px bg-white/20 sm:inset-x-8 lg:inset-x-16">
          <motion.div
            className="h-full origin-left bg-white"
            style={{ scaleX: smoothScrollYProgress }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="relative z-30 grid min-h-svh max-w-none grid-cols-4 content-end gap-4 px-5 pb-10 pt-28 sm:grid-cols-6 sm:px-8 sm:pb-14 lg:grid-cols-12 lg:px-8 lg:pb-16 xl:px-10"
            exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -12 }}
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
            key={section.id}
            transition={{ duration: shouldReduceMotion ? 0 : 0.41, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="col-span-4 [text-shadow:0_2px_18px_rgb(0_0_0/0.55)] sm:col-span-5 lg:col-span-6">
              {section.title ? (
                <h2
                  className="font-display text-project-title font-normal leading-[0.95] tracking-[-0.045em]"
                  id={`${section.id}-title`}
                >
                  {section.title}
                </h2>
              ) : null}
              {section.body ? (
                <p className="mt-6 max-w-2xl whitespace-pre-line text-body-large leading-[1.55] text-white/76">
                  {section.body}
                </p>
              ) : null}
            </div>
            {section.caption ? (
              <p className="col-span-4 mt-10 self-end border border-white/10 bg-white/[0.08] px-4 py-3 text-caption leading-6 text-white/72 sm:col-span-3 lg:col-span-3 lg:col-start-10 lg:mt-0 xl:col-start-10">
                {section.caption}
              </p>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
