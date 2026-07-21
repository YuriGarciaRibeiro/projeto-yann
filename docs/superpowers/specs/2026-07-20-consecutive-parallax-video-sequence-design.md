# Consecutive Parallax Video Sequence Design

## Goal

When a project page has consecutive `parallax_video` sections, the user should continue scrolling while the viewport remains visually fixed until all videos in that consecutive sequence have completed their scrub. The page should only resume normal vertical movement after the last parallax video in the sequence finishes.

## Current Behavior

Each `parallax_video` section renders independently through `ParallaxVideoSection`, with its own `.project-scroll-range` and sticky `.project-scroll-stage`. When one section ends and the next begins, the document advances to the next section. This creates a visible descent/transition between videos even when the intended experience is one uninterrupted cinematic sequence.

Existing tests also protect against negative-margin overlap and settle transforms because earlier overlap-based transitions produced visible bands. The new behavior should not reintroduce those overlap techniques.

## Proposed Architecture

Group consecutive `parallax_video` sections at the project page rendering layer.

`ProjectPage` will transform `renderedSections` into render groups before mapping them to React elements:

- Single non-parallax sections render exactly as they do today.
- A single isolated `parallax_video` section continues rendering through `ParallaxVideoSection`.
- Two or more consecutive `parallax_video` sections render through a new sequence component named `ParallaxVideoSequence`.

`ParallaxVideoSequence` owns one outer scroll range and one sticky `100svh` stage. Inside that fixed stage, it switches between the grouped videos based on the sequence scroll progress.

## Scroll Model

The sequence scroll distance should be the sum of the scrub distances for the videos in the group.

Each video receives a progress segment inside the combined range. For example, a three-video sequence is treated as one sticky block with three adjacent scrub segments. As the user scrolls:

1. Video 1 scrubs from start to end while the viewport is fixed.
2. Video 2 starts immediately in the same fixed viewport.
3. Video 3 starts immediately in the same fixed viewport.
4. After video 3 finishes, the sticky range ends and the page continues normally.

The existing duration-based pacing constants in `ScrollVideoParallax` should remain the source of truth for calculating per-video scroll height. If the implementation needs shared calculation, extract the constants or helper without changing the pacing values.

## Visual Behavior

There should be no normal page descent between consecutive parallax videos. The transition from one video to the next happens inside the same sticky viewport.

Text overlays should change with the active video. A minimal crossfade is acceptable if it prevents flashing, but no scale/settle transform, negative margin, or stacked overlap seam should be introduced.

The existing dark gradient overlays can be reused so the sequence stays visually consistent with `ParallaxVideoSection`.

## Fallbacks And Accessibility

Reduced-motion and coarse-pointer behavior should preserve the current progressive-enhancement model. On devices where sticky scrub is disabled by CSS, videos should remain readable and navigable as normal content rather than trapping the user in a complex interaction.

Each video section title and body should remain available as semantic content. The grouped sequence should keep accessible labels for the active media and avoid keyboard traps because the page still uses normal document scroll.

## Testing

Add or update tests around the render grouping and transition constraints:

- Consecutive `parallax_video` sections are grouped into a sequence.
- Non-consecutive `parallax_video` sections are not grouped across other content.
- Existing protections remain: no negative-margin overlap, no parallax seam masks, and no settle transforms on the video layer.
- The sequence implementation uses one sticky stage for the consecutive group rather than independent sticky stages between grouped videos.

## Out Of Scope

This change does not modify upload behavior, project data shape, admin section ordering, media storage, or video compression. It also does not change the scrub pacing values unless a small helper extraction is required to reuse the existing calculation.
