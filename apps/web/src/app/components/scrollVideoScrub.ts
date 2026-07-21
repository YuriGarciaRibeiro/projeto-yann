export const MIN_SCROLL_HEIGHT_SVH = 260;
export const MAX_SCROLL_HEIGHT_SVH = 600;
export const SCROLL_HEIGHT_PER_SECOND_SVH = 55;

export function getScrubScrollHeightSvh(durationSeconds: number) {
  return Math.min(
    Math.max(durationSeconds * SCROLL_HEIGHT_PER_SECOND_SVH, MIN_SCROLL_HEIGHT_SVH),
    MAX_SCROLL_HEIGHT_SVH,
  );
}
