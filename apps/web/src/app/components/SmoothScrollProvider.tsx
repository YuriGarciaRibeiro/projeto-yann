"use client";

import { ReactLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const enableSmoothScroll = useSyncExternalStore(
    (notify) => {
      if (isAdminRoute) {
        return () => {};
      }

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
      const coarsePointer = window.matchMedia("(pointer: coarse)");

      reducedMotion.addEventListener("change", notify);
      coarsePointer.addEventListener("change", notify);

      return () => {
        reducedMotion.removeEventListener("change", notify);
        coarsePointer.removeEventListener("change", notify);
      };
    },
    () => {
      if (isAdminRoute) {
        return false;
      }

      return (
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
        !window.matchMedia("(pointer: coarse)").matches
      );
    },
    () => false,
  );

  if (!enableSmoothScroll) {
    return children;
  }

  return (
    <ReactLenis
      root
      options={{
        autoRaf: true,
        lerp: 0.055,
        wheelMultiplier: 0.65,
        touchMultiplier: 1,
      }}
    >
      {children}
    </ReactLenis>
  );
}
