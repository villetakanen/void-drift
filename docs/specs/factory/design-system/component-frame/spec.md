---
status: draft
generated:
  by: "codex/gpt-6"
  at: "2026-11-21T18:02:03+00:00"
verified: []
---

# Component frame

## Blueprint

### Context

Component frame marks live examples in design-system documentation. It is
documentation apparatus, independent of production surface elevation. Its
initial consumers are the three Page header examples and its own reference page.

### Architecture

`apps/web/src/components/lab/ComponentFrame.svelte` owns the frame and its styles.
It renders a Svelte `children` snippet; Astro and MDX supply nested content.
The canonical MDX reference page at `/lab/ds/component-frame` demonstrates the
frame, and the Design system registry names its source and this contract.

### Constraints

- The frame is the named `component-frame` CSS inline-size container.
- Its border box fills its parent width, with a zero minimum width.
- Vertical padding uses `--spacing-sm` (8px), horizontal padding uses
  `--spacing-md` (16px), and the 1px dashed border uses `--color-border`.
- The page background remains visible through the frame; it adds no background.
- The host owns external spacing; the frame adds no external margin.

## Contract

### Definition of Done

- The reference page demonstrates actual framed content and explains usage.
- All three Page header examples compose the shared frame.
- The shared component owns the framing styles once.

### Regression guardrails

- Example content retains its semantics, controls and local state.
- Production UI surfaces retain their own elevation definitions.

### Scenarios

```gherkin
Scenario: Recognise an example boundary
  Given a Component frame on a documentation page
  When it renders nested content
  Then a 1px dashed border uses the existing border token
  And 8px vertical and 16px horizontal padding surrounds the content
  And the page background remains visible through it
  And the frame adds no external margin

Scenario: Follow available width
  Given a Component frame inside a parent
  When the parent width changes
  Then the frame border box fills that width with a zero minimum width
  And descendants can query its named inline-size container

Scenario: Compose examples from either authoring format
  Given Svelte children and MDX nested content
  When the Page header and Component frame reference pages render
  Then all three header examples use the shared frame
  And the frame reference page shows actual framed content
  And the example switch still changes only its local state
```
