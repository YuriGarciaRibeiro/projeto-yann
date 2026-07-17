---
name: monochrome-visual-system
description: This skill should be used when defining or reviewing colors, surfaces, borders, contrast, image treatment, overlays, CSS variables, and visual identity for the architecture portfolio. It enforces a premium black-and-white palette that keeps videos and renders as the visual focus.
user-invocable: true
---

# Monochrome Visual System

Create a restrained black-and-white identity with subtle neutral steps. The palette should
feel architectural, cinematic, precise, and expensive rather than sterile or corporate.

## Design principle

Color is not the identity. **Contrast, scale, material, typography, and motion are the identity.**

Project media may contain color. The surrounding interface remains monochromatic so the media
retains maximum impact.

## Core palette

Use these tokens unless the existing brand provides stricter values:

| Token | Value | Role |
|---|---:|---|
| `black` | `#050505` | Cinematic background and deepest surface |
| `ink` | `#101010` | Primary dark text and dark sections |
| `charcoal` | `#1C1C1C` | Secondary dark surface |
| `graphite` | `#3F3F3F` | Secondary text on light surfaces |
| `mid-gray` | `#777777` | Metadata and tertiary labels |
| `silver` | `#B7B7B7` | Disabled states and subtle UI |
| `line` | `#D8D8D8` | Hairlines on light surfaces |
| `paper` | `#F4F4F2` | Warm editorial background |
| `white` | `#FFFFFF` | Clean surface and text over media |

Read `assets/design-tokens.css` and reuse it rather than redefining colors ad hoc.

## Surface modes

### Cinematic dark

- Background: `black` or project video.
- Foreground: `white`.
- Secondary text: white at 68–76% opacity.
- Borders: white at 16–24% opacity.
- Avoid pure white boxes floating over video.
- Use localized scrims only where text requires support.

### Editorial light

- Background: `paper` or `white`.
- Primary text: `ink`.
- Secondary text: `graphite`.
- Metadata: `mid-gray`.
- Borders: `line`.
- No shadow is needed for separation.

### Inverted editorial

Use `ink` with white typography for a studio statement, contact chapter, or transition.
Do not use alternating black sections merely for decoration; each inversion must mark a
meaningful change in narrative.

## Video overlay rules

Prefer localized gradients:

```css
background:
  linear-gradient(
    90deg,
    rgb(0 0 0 / 54%) 0%,
    rgb(0 0 0 / 22%) 38%,
    transparent 70%
  );
```

For bottom metadata:

```css
background:
  linear-gradient(
    0deg,
    rgb(0 0 0 / 48%) 0%,
    transparent 45%
  );
```

Never place a uniform 50% black layer over every video. Preserve highlights, material,
and spatial depth.

## Photography and renders

- Do not automatically desaturate project media.
- The interface may be monochrome while project renders remain in their intended color.
- Use black-and-white media only when it is an explicit curatorial choice.
- Avoid arbitrary filters that alter material accuracy.
- Posters must represent the same crop and tonal balance as the loaded video.

## Geometry

- Default radius: `0`.
- Interactive control radius: `0–2px`.
- Maximum common radius: `4px`.
- Circular geometry is reserved for cursor indicators, progress dots, and icon buttons.
- Use 1px hairlines, not shadowed containers.

## Forbidden defaults

Do not introduce:

- purple or blue gradients;
- colorful accent buttons;
- frosted glass cards;
- neon outlines;
- colored status pills;
- gray backgrounds with random white cards;
- giant soft shadows;
- excessive `mix-blend-mode: difference`.

## Contrast

Validate actual contrast in every relevant video frame. A white label that works in one frame
may disappear when the scene becomes bright. Use section-aware header themes and local scrims,
not unpredictable blend modes.
