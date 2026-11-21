---
generated:
  by: "openai-codex/gpt-6.1-sol"
  at: "2026-11-21T21:39:12Z"
verified: []
---

# Tray

## Blueprint

### Context

The Tray design reference records the selected Option A: base surface and neutral
resting links. It defines navigation appearance for review without introducing a
shared component or migrating the live Design system or Lab trays.

### Architecture

- `apps/web/src/pages/lab/ds/tray.mdx` owns the reference at `/lab/ds/tray`.
- One example sits in the shared [Component frame](../component-frame/spec.md).
- `/lab/ds` discovers it in a Design references section separate from the
  implemented-component catalog. It is not registered in `lab-pages.ts`.
- The example consumes `packages/core/src/lib/styles/tokens.css` directly;
  [Colour roles](../colour/spec.md) owns its scoped neutral-link exception.
- Shared Tray ownership, API, consumer scope and migration belong to a separate
  implementation decision. This reference supplies none of those definitions.

### Constraints

- The tray uses `--color-void` and resting links use `--color-text`.
- Overview is an ordinary first destination link; noninteractive group headers
  precede their destination links. Example grouping illustrates anatomy only.
- The current page has `--color-selected` text and a leading edge using
  `--state-selected-indicator-width`; resting rows reserve that edge width.
- Hover uses `--color-surface-hover`; keyboard focus uses `--color-focus-ring`,
  `--focus-ring-width` and `--focus-ring-offset-inset`, independently of selection.
- Links use sentence-case UI type and `--control-min-height` targets; group
  headers use smaller muted text with extra spacing between groups.
- The header and logo remain outside and above the tray with existing geometry.
- Existing live navigation retains its appearance, destinations and scrolling.

## Contract

### Definition of Done

- The reference shows one selected Option A example and explains anatomy, states,
  accessibility, consumed token names and source values, and implementation scope.
- The overview distinguishes the design reference from implemented shared parts.

### Regression guardrails

- The reference remains separate from shared-component registration and ownership.
- Native link semantics and visible keyboard focus remain available on every row.
- The colour exception remains scoped to this reference rather than general links.

### Scenarios

```gherkin
Scenario: Discover the selected design
  Given the Design system overview
  When I follow Tray in Design references
  Then /lab/ds/tray shows one Option A example inside Component frame
  And it identifies the base surface and neutral resting links as selected
  And it states that no shared Tray component or live migration is supplied

Scenario: Read the navigation anatomy
  Given the Tray reference
  When I inspect its example
  Then Overview is an ordinary first link
  And smaller muted noninteractive group headings introduce destination links
  And the header and logo remain outside the tray

Scenario: Distinguish navigation states
  Given the Tray reference at a supported Lab width of at least 1280px
  When I hover a resting link
  Then a light wash appears over the base surface with neutral link text
  And the current page retains selected text and its leading edge
  When I Tab through the example
  Then each link including the current page has an independent inset focus outline
  And group headings are skipped
  And Enter activates the focused native link
  And every row has a minimum height of 44px

Scenario: Inspect the implementation boundary
  Given the Tray reference and Design system overview
  When I inspect the token documentation and implemented-component catalog
  Then the reference names consumed tokens and their values from tokens.css
  And the catalog does not register a shared Tray component
  And existing Design system and Lab navigation retain their live behavior
```
