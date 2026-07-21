export function getTotalSegmentScrollHeight(segmentScrollHeights: number[]) {
  return segmentScrollHeights.reduce((total, height) => total + height, 0);
}

export function getParallaxSequenceProgress(segmentScrollHeights: number[], globalProgress: number) {
  const totalScrollHeight = getTotalSegmentScrollHeight(segmentScrollHeights);

  if (segmentScrollHeights.length === 0 || totalScrollHeight <= 0) {
    return { activeIndex: 0, localProgress: 0 };
  }

  const scrollPosition = Math.min(Math.max(globalProgress, 0), 1) * totalScrollHeight;
  let segmentStart = 0;
  let nextScrollBoundary = 0;
  const nextActiveIndex = segmentScrollHeights.findIndex((height) => {
    segmentStart = nextScrollBoundary;
    nextScrollBoundary += height;
    return scrollPosition <= nextScrollBoundary;
  });
  const activeIndex = nextActiveIndex === -1 ? segmentScrollHeights.length - 1 : nextActiveIndex;
  const segmentHeight = segmentScrollHeights[activeIndex] ?? totalScrollHeight;
  const localProgress = segmentHeight > 0 ? (scrollPosition - segmentStart) / segmentHeight : 0;

  return {
    activeIndex,
    localProgress: Math.min(Math.max(localProgress, 0), 1),
  };
}
