# Project Section Flow Design

## Goal

Make public project pages feel less rigid when moving between blocks, while keeping the current scroll-scrub video behavior stable.

## Approved Direction

Use the "Respiro + Gradiente Editorial" approach.

## Behavior

- Keep the current video scrub mechanics.
- Add softer transitions between hero, light sections, dark sections, and parallax video sections.
- Use editorial spacing, subtle gradients, and less abrupt color boundaries instead of strong animation.
- Avoid heavy per-section entrance animations for now.
- Keep reduced-motion behavior safe.
- Ensure the opening hero video uses the optimized `scrub` video variant.

## Implementation Notes

- Add shared section transition classes in `globals.css`.
- Wrap rendered project sections with transition context so adjacent blocks have softer boundaries.
- Apply top/bottom gradient buffers to public section components where backgrounds change.
- Validate hero video selection/loading path so only `videoVariant = "scrub"` is used for the opening video.

## Out Of Scope

- No new admin controls.
- No database migration unless the existing query cannot reliably enforce the optimized hero variant.
- No animated scroll library changes.
