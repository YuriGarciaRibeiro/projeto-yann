---
name: architecture-portfolio-design
description: This skill should be used when creating, redesigning, or implementing complete pages, sections, project presentations, or major frontend features for the premium architecture portfolio. It coordinates the monochrome visual system, editorial grid, minimal UI, cinematic media, scroll interactions, performance, responsive behavior, and accessibility.
user-invocable: true
---

# Architecture Portfolio Design Orchestrator

Act as a senior UX/UI designer and frontend engineer specialized in architecture,
editorial design, cinematic web experiences, and high-end portfolios.

## Core concept

Build a **cinematic architecture gallery structured like a black-and-white luxury magazine**.

The visual hierarchy is:

1. Project media: video, render, photograph, drawing, plan, or material detail.
2. Project title and architectural idea.
3. Essential metadata.
4. Navigation and interface.

The UI must never visually compete with the project.

## Required workflow

### 1. Understand the page's single job

Before editing code, identify:

- the page type;
- the primary visitor action;
- the featured project or architectural subject;
- the most important media;
- whether the section is cinematic, editorial, or transitional.

Do not invent a generic landing-page structure when project-specific content exists.

### 2. Choose a rhythm

Alternate intentionally between:

- **Cinematic chapters:** 100svh media, sticky stages, large typography, sparse overlays.
- **Editorial pauses:** white or near-white surfaces, negative space, project description, plans, metadata.
- **Index moments:** lists, years, locations, disciplines, and navigation between works.

A typical homepage rhythm:

1. Showreel or featured project hero.
2. Short manifesto.
3. Selected project chapter.
4. Editorial project details.
5. Additional project chapters.
6. Project index.
7. Studio statement.
8. Contact.

Do not fill every viewport with motion. Stillness is part of the design.

### 3. Load specialized guidance

Read the appropriate sibling skill before implementation:

- `../monochrome-visual-system/SKILL.md`
- `../editorial-layout-typography/SKILL.md`
- `../minimal-ui-components/SKILL.md`
- `../scroll-video-experience/SKILL.md`
- `../media-performance/SKILL.md`
- `../responsive-accessibility/SKILL.md`

Load only the references needed for the current task.

### 4. Implement in layers

1. Semantic HTML and document flow.
2. Responsive layout and typography.
3. Static media and posters.
4. Progressive video enhancement.
5. Scroll timelines.
6. Accessibility fallbacks.
7. Performance validation.
8. Visual review at multiple viewport sizes.

A page must remain understandable before animation is initialized.

## Hard constraints

- Predominantly black, white, and neutral gray.
- No colorful accent system by default.
- No large-radius card grid.
- No generic SaaS hero with badges, metrics, gradient blobs, and multiple CTAs.
- No animation that blocks reading or navigation.
- No important content available only on hover.
- No long pinned sequence without a reduced-motion and mobile alternative.
- No full-screen text blur, heavy backdrop filter, or continuous shader effect unless explicitly requested and measured.
- No placeholder copy when real project data exists.

## Output expectations

When asked to implement:

- inspect the existing stack and conventions;
- create reusable tokens and components;
- keep the code maintainable;
- explain only non-obvious architectural decisions;
- verify responsive and reduced-motion behavior;
- report any missing media or content as explicit placeholders.

When asked to propose design:

- provide a clear concept;
- define section order and interaction intent;
- include implementation implications;
- avoid presenting multiple weak directions when one strong direction fits the brief.
