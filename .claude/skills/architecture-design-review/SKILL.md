---
name: architecture-design-review
description: This skill should be used when auditing, reviewing, critiquing, or validating an implemented architecture portfolio page or component against the project's monochrome editorial design system, interaction rules, performance requirements, responsive behavior, and accessibility standards.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash
---

# Architecture Portfolio Design Review

Review the implementation as both a senior design director and frontend performance engineer.

## Review order

### 1. Narrative and hierarchy

Check:

- Is project media clearly the primary content?
- Does each viewport have one dominant idea?
- Does the page alternate intensity and stillness?
- Is the project story understandable without animation?
- Are real project details used rather than generic portfolio copy?

### 2. Monochrome identity

Check:

- Is the interface predominantly black, white, and neutral gray?
- Are project media colors allowed to remain accurate?
- Are there unauthorized colorful accents, gradients, pills, or glass cards?
- Are surfaces separated with spacing and hairlines instead of shadows?
- Are text and controls readable across changing video frames?

### 3. Editorial composition

Check:

- Is text consistently aligned to the grid?
- Is negative space intentional?
- Are line lengths controlled?
- Is display typography used selectively?
- Are all sections avoiding the same repeated layout?
- Are labels and metadata restrained?

### 4. Components

Check:

- Is the header nearly invisible but recoverable and keyboard accessible?
- Do buttons have literal labels and visible focus?
- Are project lists lists rather than dashboard cards?
- Are hover enhancements optional rather than essential?
- Does the menu work with Escape, focus trap, and focus restoration?

### 5. Scroll video

Check:

- Was the video edited for scrub behavior?
- Is there one normalized timeline?
- Does reverse scrolling work?
- Are overlays readable long enough?
- Is smoothing responsive rather than delayed?
- Is scroll distance proportional to sequence length?
- Is failure handling present?
- Is only one video actively scrubbed?

### 6. Performance

Check:

- Are sources responsive?
- Are posters present?
- Are later videos lazy-loaded?
- Does the server support range requests?
- Are keyframes frequent enough?
- Are expensive blur and backdrop effects avoided?
- Are seek writes deduplicated?
- Are triggers and RAF callbacks cleaned up?

### 7. Responsive and accessibility

Check:

- Does mobile use intentional art direction?
- Is reduced motion a complete alternative?
- Are semantics and headings correct?
- Is the page keyboard usable?
- Do media failures preserve content?
- Are touch targets sufficient?

## Severity levels

Report findings as:

- **Blocker:** prevents content access, causes severe stutter, breaks navigation, or violates accessibility.
- **Major:** visibly conflicts with the art direction or creates significant usability/performance risk.
- **Minor:** inconsistency or polish issue.
- **Opportunity:** optional enhancement that supports the concept without adding fragility.

## Output format

Provide:

1. A concise verdict.
2. Findings ordered by severity.
3. Exact file/component references when code is available.
4. Concrete fixes, not vague aesthetic criticism.
5. A final checklist of what already complies.

Do not praise the design generically. Connect every conclusion to an observable implementation detail.
