---
generated:
  by: "openai-codex/gpt-6.2-sol"
  at: "2026-11-24T15:56:39+00:00"
verified: []
---

# Tray

## Blueprint

### Context

Tray is a quiet navigation column beneath the page header. It uses the base
surface and neutral resting links selected in the original `/lab/ds/tray`
design reference. The Design system and Lab layouts use it; Design studies
retain their own navigation. Field Guide also uses Tray for its index,
article destinations and title-screen return link.

### Architecture

- `apps/web/src/components/Tray.svelte` renders a labelled navigation landmark
  from typed destination links (labels and hrefs) and groups (labels and ordered
  links). The host supplies an accessible label and `activeHref`; a matching
  link exposes `aria-current="page"`, including Overview when current.
- The host owns routing and active-destination resolution, sizing and scrolling.
  `apps/web/src/layouts/DesignSystemLayout.astro` supplies Overview, a Components
  group from the Design system registry in `apps/web/src/data/lab-pages.ts`
  (excluding Overview), then the footer links: Lab (`/lab`), Design studies
  (`/lab/studies`) and Back to Game (`/`). It selects the deepest registered
  Design system destination covering the current path. The [Lab](../../../lab/spec.md)
  supplies its own destinations and selection.
- `apps/web/src/pages/lab/ds/tray.mdx` owns the canonical page at `/lab/ds/tray`.
  It uses the same Tray in a [Component frame](../component-frame/spec.md).
  Its Structure and Controls groups illustrate anatomy, not live taxonomy.
- Presentation uses shared tokens from `packages/core/src/lib/styles/tokens.css`;
  [Colour roles](../colour/spec.md) owns the scoped neutral-link exception.

### Constraints

- Links use sentence-case UI type and `--control-min-height` targets; group
  headings use smaller muted text and extra spacing between groups.
- The current page has selected text and a single leading edge using
  `--state-selected-indicator-width`; resting rows reserve that edge width.
  Hover uses `--color-surface-hover` without overriding the current-page cue.
- Keyboard focus is independent of selection and uses `--color-focus-ring`,
  `--focus-ring-width` and `--focus-ring-offset-inset`. Links follow native
  tab order and Enter activation; group headings are noninteractive.
- The [Page header](../page-header/spec.md) and logo retain their geometry above
  the tray. Live rails stay 250px wide and scroll independently of the main
  stage; the demo remains 256px wide within the available frame width.

## Contract

### Definition of Done

- The live Design system and Lab rails and the framed demo render the same Tray component.
- The canonical page explains anatomy, states, accessibility, consumed tokens
  and their source values, and the component's inputs and host responsibilities.

### Regression guardrails

- The Components group retains its existing entries and relative registry order
  when Tray is added; the existing footer destinations and order are preserved.

### Scenarios

```gherkin
Scenario: Browse the live Design system tray
  Given the Design system overview at /lab/ds
  When I inspect its labelled tray navigation
  Then Overview is the first native link and has aria-current="page"
  And the Components heading introduces the existing registry destinations in their original order plus Tray
  And the last links are Lab to /lab, Design studies to /lab/studies, and Back to Game to /
  When I open Tray or a component at an earlier address such as /lab/tokens
  Then only the link for that component has aria-current="page"

Scenario: Read and operate Tray
  Given a live rail or the framed Tray demo at a viewport of at least 1280px
  When I inspect the link rows and group headings
  Then the links use sentence-case UI type and have a minimum height of 44px
  And the smaller muted group headings are separated from preceding links by extra space
  And the current link has a single leading edge whose width is reserved on resting links
  When I hover a link
  Then a light surface wash appears and the current-page cue remains visible
  When I Tab through the tray
  Then each link including the current page receives a visible inset focus outline in document order
  And group headings are skipped
  And Enter activates the focused native link

Scenario: Preserve layout and adoption boundaries
  Given a Design system or Lab page at a viewport of at least 1280px with overflowing rail and main content
  When I scroll the rail and then scroll the main content
  Then each scrolls independently and the rail remains 250px wide
  And the full-width header and logo stay above both with unchanged geometry
  When I open Design studies or the game
  Then those layouts retain their own navigation without adopting Tray

Scenario: Inspect the canonical example
  Given the canonical Tray page at /lab/ds/tray
  When I inspect the framed demo and its documentation
  Then one example uses the live rail's Tray component with Overview first and Tray marked current
  And the host sizes the demo to 256px within the available frame width
  And the page documents the typed links and groups, activeHref and accessible label
  And it explains the states, keyboard behavior and shared token names and values
  And routing, sizing and scrolling are host responsibilities
```
