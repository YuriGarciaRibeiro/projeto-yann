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
        <motion.div
          className="relative z-30 grid min-h-svh max-w-none grid-cols-4 content-end items-end gap-4 px-5 pb-10 pt-28 sm:grid-cols-6 sm:px-8 sm:pb-14 lg:grid-cols-12 lg:px-8 lg:pb-16 xl:px-10"
          style={{ y: contentY }}
        >
          <div className="col-span-4 self-end sm:col-span-5 lg:col-span-7">
            {heroMetadata.length > 0 ? (
              <p className="text-label font-medium uppercase tracking-[0.16em] text-white/68">
                {heroMetadata.join(" / ")}
              </p>
            ) : null}
            <h1
              className="mt-5 font-display text-hero-title font-normal leading-[0.88] tracking-[-0.045em]"
              id="project-title"
            >
              {project.title}
            </h1>
            {project.subtitle ? (
              <p className="mt-6 max-w-2xl text-body-large leading-[1.55] text-white/78">
                {project.subtitle}
              </p>
            ) : null}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
