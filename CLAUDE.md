# Project Instructions — Architecture Portfolio

This repository implements a premium architecture portfolio centered on cinematic video,
3D renders, photography, and editorial storytelling.

## Mandatory design direction

- Use a predominantly black, white, and neutral-gray visual system.
- Treat media as the primary content and UI as a quiet frame.
- Alternate full-bleed cinematic sections with restrained editorial sections.
- Preserve generous negative space.
- Prefer strong composition, typography, scale, and motion over decorative color.
- Never introduce bright accent colors unless the user explicitly changes the art direction.
- Never default to gradients, glassmorphism, neon, colorful pills, dashboard cards, or generic SaaS visuals.
- Avoid large rounded cards, excessive shadows, and decorative blur.
- Use square or nearly square geometry. Typical radius: 0–4px.
- Keep every animation reversible and derived from scroll or explicit interaction state.
- Build accessible fallbacks for reduced motion, touch devices, slow connections, and failed media.

## Skill routing

Use the specialized project skills whenever relevant:

- `architecture-portfolio-design`: orchestrates complete pages and major features.
- `monochrome-visual-system`: color, contrast, surfaces, imagery treatment, and design tokens.
- `editorial-layout-typography`: grid, spacing, typography, and section rhythm.
- `minimal-ui-components`: header, navigation, buttons, project lists, indicators, and overlays.
- `scroll-video-experience`: scroll-bound video and synchronized editorial overlays.
- `media-performance`: encoding, delivery, preload, responsive sources, and runtime performance.
- `responsive-accessibility`: mobile adaptation, reduced motion, keyboard, semantic structure, and fallbacks.
- `architecture-design-review`: audits UI and implementation against this system.

## Engineering defaults

Unless the repository already establishes alternatives:

- Next.js with TypeScript.
- CSS variables for tokens.
- GSAP with ScrollTrigger for timeline-heavy motion.
- Native scrolling first.
- Progressive enhancement rather than mandatory animation.
- One active scrubbed video at a time.
- Transform and opacity for frequent animation.
- Responsive media exports, not one desktop asset cropped everywhere.

Read the relevant skill and its references before implementing or reviewing a feature.
