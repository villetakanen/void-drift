---
generated:
  by: "openai-codex/gpt-6.2-sol"
  at: "2026-11-22T07:41:00Z"
verified: []
---

# Documents grid

## Blueprint

### Context

Documents grid gives design-system documentation a readable prose column,
room for asides and tables, and full-width space for examples. It adapts to
its host's available width.

### Architecture

`packages/core/src/lib/styles/documents-grid.css` owns the shared CSS component.
`apps/web/src/layouts/DesignSystemLayout.astro` applies it once to the main
content, on `main` or its content wrapper. Pages supply content through the
layout. A separate inline-size query wrapper can supply the width query when
needed. The [Typography contract](../typography/spec.md) owns the layout's
shared prose styling for MDX documentation; this contract owns placement and
responsive layout. See [Surfaces and layers](../surfaces/spec.md#panels) for
panel treatment of authored asides.

The canonical reference is the MDX page at `/lab/ds/documents-grid`. The
Design system component catalog lists it with the stylesheet and this contract.

### Constraints

- The component fills 100% of its parent's width, including 16px padding on
  all sides. It provides an inline-size container and adapts to that available
  width rather than the viewport.
- At a width of at least `67ch + 67ch / φ + 64px`, the direct content uses a
  three-column grid: 67ch prose, a smaller golden-section gutter of `67ch / φ`
  (about 41.41ch), and an outside column that takes the remainder. The fixed
  64px accounts for both inline padding edges and both 16px column gaps.
  The threshold and tracks use the same `ch` basis.
- In the grid, direct children span all three columns by default. Direct `p`,
  `h1`–`h6`, `ul`, `ol`, `dl`, `blockquote`, and `pre` occupy the prose column;
  `table` spans prose and gutter; `aside` occupies only the gutter.
- Below the threshold, the content uses a flex column in source order.

## Contract

### Definition of Done

- The shared layout applies the shared stylesheet to the main content across
  Design system pages.
- The catalog links the canonical MDX reference, names the stylesheet, and
  links this contract. The reference demonstrates the column placements and
  the source-order fallback.

### Regression guardrails

- The page header, navigation, and inspector retain their shell layout.
- Placement rules apply to direct children; nested content keeps the layout
  of its own component.

### Scenarios

```gherkin
Scenario: Follow the parent width
  Given a Documents grid in a parent whose width can change independently of the viewport
  When the parent is resized
  Then the component border box fills the parent's width with 16px padding on every side
  And the layout responds to the inline-size container

Scenario: Fit the three columns at the threshold
  Given an available width equal to 67ch plus 67ch divided by phi plus 64px
  When the document renders
  Then the grid has a 67ch prose column and a gutter of 67ch divided by phi
  And two 16px column gaps separate the three columns
  And the outside column takes all remaining width, including zero at the threshold

Scenario: Place direct content by element
  Given room for the three-column grid
  When a document renders headings h1 through h6, a paragraph, lists, a blockquote, preformatted text, a table, an aside, and a generic example block as direct children
  Then the headings, paragraph, lists, blockquote, and preformatted text occupy the prose column
  And the table spans prose and gutter
  And the aside occupies only the gutter
  And the generic example block spans all three columns

Scenario: Stack content below the threshold
  Given a three-column document at a supported Lab viewport width
  When its container becomes narrower than 67ch plus 67ch divided by phi plus 64px
  Then the content becomes a single flex column in source order

Scenario: Use the shared layout and find its reference
  Given the Design system overview at /lab/ds
  When I open Documents grid from the component catalog
  Then its canonical MDX page is /lab/ds/documents-grid
  And the catalog names packages/core/src/lib/styles/documents-grid.css and links this contract
  And the overview and reference both get the grid from DesignSystemLayout's main content area
```
