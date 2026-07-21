export const MIN_SCROLL_HEIGHT_SVH = 360;
export const MAX_SCROLL_HEIGHT_SVH = 760;
export const SCROLL_HEIGHT_PER_SECOND_SVH = 75;

export function getScrubScrollHeightSvh(durationSeconds: number) {
  return Math.min(
    Math.max(durationSeconds * SCROLL_HEIGHT_PER_SECOND_SVH, MIN_SCROLL_HEIGHT_SVH),
    MAX_SCROLL_HEIGHT_SVH,
  );
}
