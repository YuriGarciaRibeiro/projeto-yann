---
name: scroll-video-experience
description: This skill should be used when designing or implementing scroll-bound video, video scrubbing, sticky cinematic chapters, GSAP ScrollTrigger timelines, synchronized text overlays, reversible scroll animation, or architectural video storytelling.
user-invocable: true
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# Scroll-Bound Video Experience

The scroll interaction should feel like the visitor is moving through the architecture, not
operating a video player.

## Content prerequisite

Use a video edited specifically for scrubbing. The sequence should have architectural logic:

1. Exterior approach.
2. Threshold or entrance.
3. Main spatial reveal.
4. Light and material detail.
5. Important view or circulation moment.
6. Final composition and project identity.

Do not attach an arbitrary long promotional video to scroll.

## Structural pattern

```text
<section with narrative scroll distance>
  <sticky stage at 100svh>
    <video>
    <localized scrims>
    <editorial overlays>
    <progress indicator>
  </sticky stage>
</section>
```

Start from:

```css
.scrub-section {
  position: relative;
  min-height: 500svh;
}

.scrub-stage {
  position: sticky;
  top: 0;
  height: 100svh;
  overflow: clip;
}
```

When ScrollTrigger handles pinning directly, avoid duplicating sticky and pin behavior.

## One normalized timeline

Derive all visual state from one normalized progress value:

```ts
type ScrubState = {
  progress: number; // 0 to 1
  targetTime: number;
};
```

The video, text, header theme, progress indicator, and exit transition must use the same
chapter progress. This ensures correct reverse scrolling.

## Scroll mapping

Use GSAP ScrollTrigger for complex sequences.

Recommended starting values:

- `scrub: 0.15–0.3` for desktop trackpads.
- `scrub: 0.25–0.45` for mouse-wheel-heavy environments.
- Avoid smoothing above `0.5` because it feels delayed.
- Use `invalidateOnRefresh: true`.
- Refresh only after layout-affecting media or font changes, never on every scroll event.

Starting scroll distances:

- 5-second sequence: `250–400svh`.
- 8-second sequence: `400–600svh`.
- Longer than 8–10 seconds: divide into chapters.

## Text choreography

Every overlay has:

1. entrance;
2. readable hold;
3. exit.

Example progress window:

| Progress | State |
|---:|---|
| `0.00–0.08` | hidden |
| `0.08–0.15` | enter |
| `0.15–0.30` | hold |
| `0.30–0.38` | exit |
| `0.38+` | hidden |

Prefer:

- opacity;
- `translateY(12–24px)`;
- restrained clipping;
- subtle tracking change on short display text.

Avoid:

- large blur;
- strong scale;
- per-letter chaos;
- rotation;
- constant parallax;
- more than 2–4 simultaneous animated overlays.

## Overlay zones

- Top-left: number, category, location.
- Center-left or lower-left: project title.
- Bottom-left: compact metadata and action.

Do not place important text over the architectural focal point.

## Runtime sequence

1. Render semantic text and poster.
2. Attach media events.
3. Wait for video metadata.
4. Confirm duration is finite and seekable behavior is acceptable.
5. Initialize ScrollTrigger.
6. Update a target time from progress.
7. Apply seeks in `requestAnimationFrame`, avoiding redundant tiny seeks.
8. Optionally use `requestVideoFrameCallback()` for measurement and frame-synchronized overlays.
9. Destroy listeners, RAF callbacks, and triggers on unmount.

Use `examples/VideoScrubSection.tsx` as an implementation starting point.

## Mobile behavior

Do not automatically copy the desktop chapter.

Use one of:

- shorter scrub with lower-resolution media;
- a few controlled scene steps;
- ordinary muted playback;
- crossfading keyframes;
- static poster with editorial content in normal flow.

Avoid extremely long pinned mobile sections.

## Reduced motion

When `prefers-reduced-motion: reduce` is active:

- do not pin the page for hundreds of viewport heights;
- do not bind video time to scroll;
- show a poster or normal muted video;
- place all text in normal document flow;
- preserve the full project narrative and navigation.

## Failure handling

If media fails:

- show the poster;
- reveal the text;
- keep the CTA active;
- remove the artificial scroll distance;
- never leave a blank 500vh section.
