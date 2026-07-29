"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";

import { ProjectScrollMedia } from "../ProjectScrollMedia";
import type { PublishedProjectPageData } from "./ProjectPage";

type ProjectHeroProps = {
  data: PublishedProjectPageData;
};

export function ProjectHero({ data }: ProjectHeroProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const { project, heroVideoAsset, fallbackImageAsset } = data;
  const mediaAlt =
    fallbackImageAsset?.altText ?? heroVideoAsset?.altText ?? `Imagem do projeto ${project.title}.`;
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const smoothScrollYProgress = useSpring(scrollYProgress, {
    damping: 30,
    restDelta: 0.001,
    stiffness: 100,
  });
  const contentY = useTransform(smoothScrollYProgress, [0.62, 1], [0, shouldReduceMotion ? 0 : -96]);
  const heroMetadata = [
    project.heroDisplayName,
    project.category,
    project.location,
    project.year,
  ].filter(Boolean);

  return (
    <section
      aria-labelledby="project-title"
      className="hero-scroll-range relative bg-black text-white"
      data-header-theme="light"
      ref={sectionRef}
    >
      <div className="hero-scroll-stage sticky top-0 min-h-svh overflow-hidden">
        <ProjectScrollMedia
          alt={mediaAlt}
          posterSrc={fallbackImageAsset?.url ?? null}
          showProgress={false}
          title={project.title}
          videoMimeType={heroVideoAsset?.mimeType ?? null}
          videoSrc={heroVideoAsset?.url ?? null}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[58svh] bg-gradient-to-t from-black/82 via-black/42 to-transparent" />
        <motion.div
          className="relative z-30 grid min-h-svh max-w-none grid-cols-4 content-end items-end gap-4 px-5 pb-[calc(3.5rem+env(safe-area-inset-bottom))] pt-24 sm:grid-cols-6 sm:px-8 sm:pb-14 lg:grid-cols-12 lg:px-8 lg:pb-16 xl:px-10"
          style={{ y: contentY }}
        >
          <div className="col-span-4 self-end sm:col-span-5 lg:col-span-7">
            {heroMetadata.length > 0 ? (
              <p className="max-w-[92vw] text-label font-medium uppercase leading-[1.55] tracking-[0.16em] text-white/90 [text-shadow:0_2px_18px_rgb(0_0_0/0.72)]">
                {heroMetadata.join(" / ")}
              </p>
            ) : null}
            <h1
              className="mt-4 max-w-[92vw] font-display text-hero-title font-normal leading-[0.86] tracking-[-0.055em] [text-wrap:balance] [text-shadow:0_2px_22px_rgb(0_0_0/0.48)] sm:mt-5 lg:leading-[0.88] lg:tracking-[-0.045em]"
              id="project-title"
            >
              {project.title}
            </h1>
            {project.subtitle ? (
              <p className="mt-5 max-w-[34rem] text-body-large leading-[1.6] text-white/92 [text-shadow:0_2px_18px_rgb(0_0_0/0.68)] sm:mt-6">
                {project.subtitle}
              </p>
            ) : null}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
