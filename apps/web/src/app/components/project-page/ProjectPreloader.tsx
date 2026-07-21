"use client";

import NextImage from "next/image";
import { type ReactNode, useEffect, useState } from "react";

import {
  PROJECT_MEDIA_READY_EVENT,
  type ProjectMediaReadyDetail,
} from "./projectMediaReadyEvent";

const PRELOADER_TIMEOUT_MS = 15000;
const OVERLAY_EXIT_MS = 500;

export type ProjectPreloadMedia = {
  mimeType: string;
  src: string;
};

type ProjectPreloaderProps = {
  children: ReactNode;
  posterSrc: string | null;
  preloadMedia: ProjectPreloadMedia[];
  projectTitle: string;
  videoMimeType: string | null;
  videoSrc: string | null;
};

export function ProjectPreloader({
  children,
  posterSrc,
  preloadMedia,
  projectTitle,
  videoMimeType,
  videoSrc,
}: ProjectPreloaderProps) {
  const [isReady, setIsReady] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      if (!cancelled) {
        setIsReady(true);
      }
    }, PRELOADER_TIMEOUT_MS);

    async function waitForPoster() {
      if (videoSrc && videoMimeType?.startsWith("video/")) {
        return;
      }

      if (!posterSrc) {
        return;
      }

      await new Promise<void>((resolve) => {
        const image = new Image();
        image.onload = () => resolve();
        image.onerror = () => resolve();
        image.src = posterSrc;
      });
    }

    async function waitForVideo(media: ProjectPreloadMedia) {
      if (!media.mimeType.startsWith("video/")) {
        return;
      }

      await new Promise<void>((resolve) => {
        let settled = false;
        const video = document.createElement("video");
        const complete = (event?: Event) => {
          if (settled) {
            return;
          }

          const mediaEvent = event as CustomEvent<ProjectMediaReadyDetail> | undefined;

          if (mediaEvent?.detail?.src && mediaEvent.detail.src !== media.src) {
            return;
          }

          settled = true;
          video.removeEventListener("canplaythrough", complete);
          video.removeEventListener("canplay", complete);
          video.removeEventListener("loadeddata", complete);
          video.removeEventListener("error", complete);
          window.removeEventListener(PROJECT_MEDIA_READY_EVENT, complete);
          resolve();
        };

        video.muted = true;
        video.playsInline = true;
        video.preload = "auto";
        video.addEventListener("canplaythrough", complete, { once: true });
        video.addEventListener("canplay", complete, { once: true });
        video.addEventListener("loadeddata", complete, { once: true });
        video.addEventListener("error", complete, { once: true });
        window.addEventListener(PROJECT_MEDIA_READY_EVENT, complete);
        video.src = media.src;
        video.load();
      });
    }

    const mediaToPreload = preloadMedia.length
      ? preloadMedia
      : videoSrc && videoMimeType
        ? [{ mimeType: videoMimeType, src: videoSrc }]
        : [];

    Promise.all([waitForPoster(), ...mediaToPreload.map(waitForVideo)]).finally(() => {
      window.clearTimeout(timeoutId);
      if (!cancelled) {
        setIsReady(true);
      }
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [posterSrc, preloadMedia, videoMimeType, videoSrc]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const timeoutId = window.setTimeout(() => setShowOverlay(false), OVERLAY_EXIT_MS);
    return () => window.clearTimeout(timeoutId);
  }, [isReady]);

  return (
    <>
      {children}
      {showOverlay ? (
        <div
          aria-busy={!isReady}
          aria-live="polite"
          className={`fixed inset-0 z-[100] grid place-items-center bg-black px-5 text-white transition-opacity duration-500 ease-out ${
            isReady ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
          role="status"
        >
          <div className="w-full max-w-md text-center">
            <NextImage
              alt="Yann"
              className="mx-auto h-16 w-auto"
              height={1598}
              priority
              src="/logo.png"
              unoptimized
              width={3554}
            />
            <p className="mt-5 font-display text-preloader-title font-normal leading-[0.86] tracking-[-0.055em]">
              {projectTitle}
            </p>
            <div className="mx-auto mt-9 h-px w-44 overflow-hidden bg-white/18" aria-hidden="true">
              <div className="h-full w-1/2 animate-[project-preloader_1.35s_ease-in-out_infinite] bg-white" />
            </div>
            <span className="sr-only">Carregando midia do projeto.</span>
          </div>
        </div>
      ) : null}
    </>
  );
}
