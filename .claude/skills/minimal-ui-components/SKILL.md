---
name: minimal-ui-components
description: This skill should be used when creating or reviewing navigation, headers, menus, buttons, project links, scroll indicators, counters, metadata, project lists, cursors, overlays, and other interface components for the architecture portfolio.
user-invocable: true
---

# Minimal UI Components

Components should be highly functional and visually quiet. Their personality comes from
typography, timing, spacing, and precise states rather than decorative containers.

## Header

Default structure:

```text
[WORDMARK]                         PROJECTS   STUDIO   CONTACT   MENU
```

Requirements:

- Fixed positioning.
- Desktop height: `72–80px`.
- Mobile height: `60–64px`.
- Transparent over media.
- Theme controlled by the active section: light text on dark media, dark text on light editorial surfaces.
- Hide gently while scrolling down and reveal when scrolling up.
- Always reveal near the top and when keyboard focus enters the header.
- Avoid heavy blur over playing video.

Use section metadata:

```html
<section data-header-theme="light">
<section data-header-theme="dark">
```

Do not depend on `mix-blend-mode: difference` as the primary contrast solution.

## Navigation links

- Use text links with restrained underline or line-reveal motion.
- Keep action names literal: `Projects`, `Studio`, `Contact`, `View project`.
- Maintain visible keyboard focus.
- Avoid pill navigation.
- Avoid a permanent boxed navbar unless the brand explicitly requires it.

## Buttons

### Editorial text action

Preferred form:

```text
View project ↗
```

Interaction:

- Underline starts at 30–40%.
- Underline extends to 100%.
- Arrow translates by `3–5px`.
- Duration: `220–300ms`.
- Easing: `cubic-bezier(.22, 1, .36, 1)`.

### Ghost action

- Border: 1px current color.
- Radius: `0–2px`.
- Minimum hit area: 44px.
- Fill may slide horizontally on hover.
- Do not scale the entire button.
- Do not add shadow.

## Scroll indicator

Use one subtle indicator in the first viewport:

```text
SCROLL
  │
  •
```

or:

```text
SCROLL TO EXPLORE                         00 — 01
```

It should:

- explain the interaction once;
- react to initial progress;
- disappear after approximately 8–12% of the chapter;
- never bounce indefinitely.

## Project metadata

Show only essential information:

- location;
- year;
- typology;
- area, only when meaningful;
- status, only when meaningful.

Use compact rows or aligned columns. Avoid colored badges.

## Project preview items

- No card background by default.
- No large radius.
- No shadow.
- Use image, title, year, location, and hairline.
- On hover, scale media subtly inside an overflow-hidden frame.
- Never hide critical project information until hover.

## Mobile menu

- Full viewport.
- Black or white background.
- Large text links.
- Section numbering may be used.
- Transition duration: `500–700ms`.
- Use clip, transform, or opacity without overcomplicated particles or 3D effects.
- Trap focus while open.
- Close on Escape and route change.

## Motion tokens

```css
:root {
  --duration-instant: 120ms;
  --duration-fast: 220ms;
  --duration-base: 360ms;
  --duration-slow: 700ms;
  --duration-page: 1000ms;

  --ease-editorial: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-out-soft: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
}
```

## Avoid

- colorful pills;
- floating glass panels;
- tooltip-heavy navigation;
- magnetic interactions with large displacement;
- animated custom cursor on touch devices;
- hidden navigation that cannot be recovered with keyboard;
- duplicate CTAs competing in one viewport.
