# Project Preloader Design

## Purpose

Improve the first impression of project pages with video-heavy heroes by showing a minimal loading layer until the first visual media is ready enough to reveal the page.

## Approved Direction

Use a lightweight project preloader for `/projetos/[slug]`. It should not wait for every video on the page. It only prepares the first hero media enough to avoid an abrupt black or empty first viewport.

## Behavior

The preloader shows a black editorial layer with the Yann mark, project title, and a restrained progress line. It waits for the hero poster and, on capable non-reduced-motion devices, hero video metadata or `canplay` readiness.

The preloader has a maximum wait time of 3500ms. If media is slow or fails, the page reveals with the existing poster/fallback state instead of blocking the visitor.

## Accessibility And Performance

Reduced-motion and touch/coarse-pointer contexts should avoid waiting for scroll-scrub video readiness. They should reveal after the poster is ready or after the timeout.

Only the first hero media participates in the preloader. Later videos keep using lazy loading and viewport-based activation.
