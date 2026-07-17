---
name: editorial-layout-typography
description: This skill should be used when designing or implementing typography, spacing, grids, editorial composition, content widths, section rhythm, project indexes, and responsive layout for the architecture portfolio.
user-invocable: true
---

# Editorial Layout and Typography

Treat each page as a sequence of architectural spreads, not a collection of web cards.

## Typography direction

Default pairing:

- Display and major project titles: **Bodoni Moda**.
- UI, metadata, body, navigation, and technical information: **Manrope**.

Allowed alternative for a younger and more experimental tone:

- Display: **Instrument Serif**.
- UI and body: **Inter**.

Do not add more than two primary font families.

## Type roles

```css
:root {
  --font-display: "Bodoni Moda", Georgia, serif;
  --font-sans: "Manrope", Arial, sans-serif;

  --text-display-xl: clamp(4rem, 10vw, 9rem);
  --text-display-lg: clamp(3.25rem, 7vw, 7rem);
  --text-h1: clamp(2.75rem, 5.5vw, 5.5rem);
  --text-h2: clamp(2.25rem, 4vw, 4rem);
  --text-h3: clamp(1.75rem, 2.8vw, 2.75rem);
  --text-body-lg: clamp(1.125rem, 1.4vw, 1.375rem);
  --text-body: clamp(1rem, 1.1vw, 1.125rem);
  --text-small: 0.8125rem;
  --text-label: 0.6875rem;
}
```

### Display

- Weight: 400.
- Line-height: `0.86–0.98`.
- Tracking: `-0.045em` to `-0.02em`.
- Use for project names, manifesto lines, and major chapter transitions.
- Do not use long centered paragraphs.

### Body

- Weight: 400.
- Line-height: `1.5–1.65`.
- Tracking: `-0.015em` to `0`.
- Limit long text to approximately `620–720px`.

### Labels

- Sans serif.
- Weight: 500.
- Size: `11–13px`.
- Tracking: `0.10–0.16em`.
- Uppercase only for short metadata and navigation labels.

## Grid

### Desktop

- 12 columns.
- Outer margins: `clamp(32px, 4vw, 72px)`.
- Gutters: `clamp(16px, 1.5vw, 28px)`.
- Editorial maximum width: `1440px`.

### Tablet

- 6 columns.
- Margins: `24–40px`.
- Gutters: `20px`.

### Mobile

- 4 columns.
- Margins: `18–24px`.
- Gutters: `12–16px`.

The media can break out of the container. Text and metadata should remain aligned to the grid.

## Section models

### Full-bleed chapter

- Media occupies the full viewport.
- Text aligns to the editorial grid.
- Use `100svh`.
- Restrict overlay copy to one title, a short descriptor, essential metadata, and one action.

### Editorial pause

- Use `paper` or `white`.
- Provide generous top and bottom spacing.
- Allow an intentionally empty column.
- Typical section height may be `70–100svh`, but content remains in normal flow.

### Project index

Use a list rather than cards:

```text
01   Casa Horizonte       Aracaju       2026
02   Residência Pontal    Maceió        2025
03   Casa Areia           Recife        2025
```

Use hairline separators. A desktop hover preview is optional; the title and navigation must
remain fully usable without it.

## Spacing system

Use a small, intentional scale:

```css
:root {
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-24: 6rem;
  --space-32: 8rem;
  --space-40: 10rem;
}
```

Use `clamp()` for major section spacing. Do not compensate for weak composition by adding
random margins.

## Composition rules

- Prefer asymmetry with clear alignment.
- Allow text to begin or end off the visual center.
- Keep one dominant idea per viewport.
- Avoid centered-everything layouts.
- Avoid repeating identical two-column sections.
- Use empty space as a narrative pause.
- Maintain a consistent baseline relationship between labels, titles, and metadata.
