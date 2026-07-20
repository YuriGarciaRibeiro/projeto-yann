"use client";

import { type ReactNode, useEffect, useState } from "react";

import {
  PROJECT_MEDIA_READY_EVENT,
  type ProjectMediaReadyDetail,
} from "./projectMediaReadyEvent";

const PRELOADER_TIMEOUT_MS = 3500;
const OVERLAY_EXIT_MS = 500;

type ProjectPreloaderProps = {
  children: ReactNode;
  posterSrc: string | null;
  projectTitle: string;
  videoMimeType: string | null;
  videoSrc: string | null;
};

export function ProjectPreloader({
  children,
  posterSrc,
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

    async function waitForVideoMetadata() {
      if (!videoSrc || !videoMimeType?.startsWith("video/")) {
        return;
      }

      await new Promise<void>((resolve) => {
        let settled = false;
        const complete = (event?: Event) => {
          if (settled) {
            return;
          }

          const mediaEvent = event as CustomEvent<ProjectMediaReadyDetail> | undefined;

          if (mediaEvent?.detail?.src && mediaEvent.detail.src !== videoSrc) {
            return;
          }

          settled = true;
          window.removeEventListener(PROJECT_MEDIA_READY_EVENT, complete);
          resolve();
        };

        window.addEventListener(PROJECT_MEDIA_READY_EVENT, complete);
      });
    }

    Promise.all([waitForPoster(), waitForVideoMetadata()]).finally(() => {
      window.clearTimeout(timeoutId);
      if (!cancelled) {
        setIsReady(true);
      }
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [posterSrc, videoMimeType, videoSrc]);

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
          className={`fixed inset-0 z-[100] grid place-items-center bg-[var(--black)] px-5 text-white transition-opacity duration-500 ease-out ${
            isReady ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
          role="status"
        >
          <div className="w-full max-w-md text-center">
            <p className="text-[var(--text-label)] font-medium uppercase tracking-[0.22em] text-white/52">
              Yann
            </p>
            <p className="mt-5 font-[var(--font-display)] text-[clamp(2.5rem,12vw,5.5rem)] font-normal leading-[0.86] tracking-[-0.055em]">
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
