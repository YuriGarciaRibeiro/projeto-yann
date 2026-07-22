# Project Page Visual Adjustments Design

## Goal

Refine the public project page so media has more visual priority. The requested result is a smaller persistent logo, moderately smaller typography, and cleaner parallax videos without constant dark overlays.

## Scope

- Applies to the public project page at `/projetos/[slug]` and the root route when it renders a project.
- Applies to the project hero, parallax video sections, and parallax video sequences.
- Does not change admin screens, project data, upload behavior, routing, or media processing.

## Visual Direction

Use the approved option B: moderate reduction.

- Reduce the logo enough that it becomes a persistent brand mark instead of a dominant hero element.
- Reduce project-page typography moderately, including hero title, parallax section titles, body-large text, captions, metadata, and labels.
- Preserve the premium editorial tone and high contrast.
- Give more visual weight to videos and images.

## Persistent Logo

The logo should remain visible at the top of the viewport throughout the full project page.

- Place it as a fixed project-page header layer, above hero and parallax content.
- Keep it in the top-left header position used by the current hero.
- Use a smaller responsive size than the current hero logo.
- Avoid duplicating the logo inside the hero once the fixed layer exists.

## Parallax Video Darkening

Remove the constant darkening overlays currently rendered over parallax videos.

- Remove the left-to-right dark gradient overlay from parallax video sections and enhanced parallax sequences.
- Remove the bottom dark gradient overlay from parallax video sections and enhanced parallax sequences.
- Also remove these overlays in the non-enhanced/fallback parallax sequence rendering so mobile and reduced-motion behavior matches.
- Keep only the transition darkening between parallax blocks, provided by the existing `.project-scrub-flow::before` and `.project-scrub-flow::after` gradients.

## Components

- `ProjectPage` owns the fixed logo so it can persist through the whole page.
- `ProjectHero` no longer renders its own absolute logo header.
- `ParallaxVideoSection` renders media and text without constant dark overlays.
- `ParallaxVideoSequence` renders active media and fallback articles without constant dark overlays.
- Global typography tokens in `globals.css` are adjusted moderately for project-facing text sizes.

## Accessibility And Responsiveness

- The fixed logo remains a normal link with an accessible label.
- The logo must not block project content or interactive controls.
- Text must remain readable after overlays are removed. If needed, text opacity and placement can remain unchanged, but no new full-screen darkening layer should be added.
- Reduced-motion and coarse-pointer fallbacks should receive the same visual cleanup.

## Testing

- Run the existing project page and parallax-related tests.
- Run lint/type checks if available in the project scripts.
- Manually inspect the project page at desktop and mobile widths to confirm logo persistence, smaller scale, and clean video playback.
