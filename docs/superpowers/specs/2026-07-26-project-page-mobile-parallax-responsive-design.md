# Project Page Mobile Parallax Responsive Design

## Goal

Improve the entire public project page experience on mobile while testing the full desktop-style parallax behavior on touch devices. The change should make the page feel intentional on phones without making the parallax decision hard to reverse later.

## Scope

- Public project pages at `/projetos/[slug]`.
- Project page shell, hero, parallax video sections, grouped parallax sequences, image blocks, video blocks, text blocks, technical information, and contact/credit footer.
- Global scroll/parallax CSS rules in `apps/web/src/app/globals.css`.
- No database, admin, upload, or API changes.

## Direction

Use the full parallax test as the first implementation direction. Mobile and tablet touch screens should no longer automatically disable sticky parallax only because they use `pointer: coarse`.

The implementation should keep the behavior easy to change later by centralizing the mobile parallax controls in a small set of global CSS rules and variables. If the full effect feels too heavy, the future fallback should require changing those rules rather than rewriting the page components.

## Responsive Behavior

The mobile page should preserve the portfolio's monochrome editorial direction:

- Media remains the dominant content.
- UI stays quiet and minimal.
- Text has enough breathing room and readable line length.
- Sections stack in a natural single-column flow.
- Full-bleed media should not create horizontal overflow.
- Hero metadata, title, and subtitle should remain readable over media.
- Section rhythm should feel deliberate instead of compressed desktop layout.

## Parallax Behavior

- Keep parallax/sticky behavior active on mobile for this test.
- Keep `prefers-reduced-motion: reduce` as the opt-out path that disables sticky/scrub behavior.
- Centralize scroll heights with CSS variables so the mobile parallax range can be tuned quickly.
- Avoid scattering touch-device checks across individual components.
- Preserve existing desktop behavior unless a responsive fix is required.

## Accessibility And Fallbacks

- Reduced-motion users should receive non-sticky normal-flow sections.
- Keyboard focus styles and semantic structure should remain unchanged or improved.
- Media fallback content should remain visible when videos fail or are unavailable.
- Text over video/image must maintain usable contrast.

## Testing

Verification should include:

- Lint or project test command available for the web app.
- Manual mobile viewport check for `/projetos/[slug]`.
- Confirmation that parallax is active in a mobile-sized viewport when reduced motion is not enabled.
- Confirmation that reduced motion still disables the sticky/scrub behavior.
- Check for horizontal overflow on the public project page.

## Out Of Scope

- Re-encoding or replacing media assets.
- Admin form changes.
- New project section types.
- Rebuilding the page's data model.
- Permanent removal of parallax on mobile.
