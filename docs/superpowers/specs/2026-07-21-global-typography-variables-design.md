# Global Typography Variables Design

## Goal

Make font sizes easy to tune across the public project pages, the home page, and the admin interface by centralizing screen typography in editable CSS variables.

## Current Behavior

`apps/web/src/app/globals.css` already defines several text variables, but many components still use direct Tailwind font-size classes or one-off arbitrary values. Examples include `text-sm`, `text-base`, `text-lg`, `text-4xl`, `text-6xl`, `text-[0.6875rem]`, and inline `clamp(...)` values. This makes visual testing slower because sizes must be changed in several files.

## Approach

Use a global semantic typography scale in `apps/web/src/app/globals.css`. Keep the existing visual direction, but expand and rename the variables so their purpose is clearer when testing different sizes.

The scale will include variables such as:

- `--text-hero-title`
- `--text-page-title`
- `--text-section-title`
- `--text-card-title`
- `--text-body-large`
- `--text-body`
- `--text-caption`
- `--text-meta`
- `--text-label`
- `--text-admin-title`
- `--text-admin-body`
- `--text-admin-control`

Components will use `text-[var(--...)]` instead of direct font-size classes where the size is part of the screen typography. Existing line-height, tracking, color, spacing, and layout choices remain unchanged unless a class must be adjusted to avoid conflicting font-size utilities.

## UI Behavior

- Public project pages keep the current editorial hierarchy, but hero titles, section titles, body copy, metadata, captions, and labels become controlled from `globals.css`.
- The home page title, body, header metadata, and footer metadata use the same global variables instead of one-off values.
- Admin headings, labels, controls, helper text, and buttons use admin-specific variables so the admin can be tuned without distorting the portfolio pages.
- Mobile and desktop responsiveness remains driven by `clamp(...)` values in the variables.

## Testing

Run the web lint check after implementation. Visual verification should include at least the home page, one public project page, and the admin login or project form screen.

## Out Of Scope

- Changing font families.
- Redesigning the visual hierarchy.
- Changing spacing, layout, animation, or media behavior.
- Adding a runtime typography editor or theme switcher.
- Migrating non-font Tailwind utilities to CSS variables.
