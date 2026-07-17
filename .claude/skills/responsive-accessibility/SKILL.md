---
name: responsive-accessibility
description: This skill should be used when adapting the architecture portfolio for mobile, tablet, keyboard navigation, reduced motion, slow connections, touch input, semantic HTML, contrast, media failure, and other accessibility or progressive-enhancement requirements.
user-invocable: true
---

# Responsive and Accessible Experience

The site must remain a complete architecture portfolio when advanced animation is unavailable.

## Progressive enhancement order

1. Semantic content and navigation.
2. Responsive static layout.
3. Responsive posters and images.
4. Optional video playback.
5. Optional scroll synchronization.
6. Optional enhancement for capable desktop devices.

Never make the user pass through an animation to access essential content.

## Mobile art direction

Mobile needs its own visual composition:

- Use 9:16 or 4:5 media when the project benefits from it.
- Reframe architecture intentionally.
- Shorten scrub sequences to approximately 3–6 seconds.
- Prefer 24fps and lower resolution.
- Reduce overlay count.
- Avoid very long pinned chapters.
- Place longer project text in normal flow below the media.
- Do not use hover as the only interaction.
- Disable custom cursors.

Use `100svh` for viewport stages and test browser toolbar changes.

## Reduced motion

Use:

```css
@media (prefers-reduced-motion: reduce) {
  /* remove long pinning and nonessential movement */
}
```

In JavaScript, use `matchMedia` or `gsap.matchMedia`.

Reduced-motion behavior:

- remove scroll-bound video;
- remove long pinning;
- show a representative poster or ordinary video;
- present title, description, metadata, and action in document flow;
- shorten menu and page transitions;
- keep all project information.

Do not merely set animation duration to zero while leaving a 500vh empty section.

## Keyboard

- All navigation and project links must be reachable.
- Focus indicators must be visible in both light and dark themes.
- Mobile menu must trap focus.
- Escape closes overlays and menus.
- Restoring focus after closing a menu is required.
- Hidden headers must reveal when focused.
- Custom pointer effects must never replace the actual cursor or focus state.

## Semantics

Use:

- `header`, `nav`, `main`, `article`, `section`, and `footer`;
- one meaningful page `h1`;
- ordered heading hierarchy;
- project links with descriptive accessible names;
- meaningful video labels or adjacent text descriptions;
- buttons only for actions and anchors for navigation.

## Contrast over media

Test the actual moving frames, not only the poster. If the background changes:

- change header theme by chapter;
- use localized scrims;
- move text away from bright focal areas;
- provide a stable backing only when necessary.

Avoid relying on `mix-blend-mode` for basic readability.

## Connection and failure states

When a video is slow or fails:

- show the poster;
- expose content immediately;
- remove or reduce pinned distance;
- preserve the navigation and CTA;
- avoid infinite loading indicators.

Consider data-saving preferences and do not automatically load every project video.

## Touch behavior

- Minimum interactive size: 44 by 44 CSS pixels.
- Do not require precise dragging.
- Avoid scroll hijacking.
- Do not disable native overscroll without a strong reason.
- Ensure horizontal project lists do not trap vertical scrolling.

## Testing matrix

At minimum, verify:

- desktop Chrome;
- desktop Safari;
- iPhone Safari;
- representative Android Chrome;
- keyboard-only navigation;
- reduced motion;
- slow network;
- media request failure;
- high zoom or larger text;
- landscape and portrait mobile orientation.
