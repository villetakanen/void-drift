---
generated:
  by: "claude-code/claude-fable-5-2"
  at: "2026-11-23T07:34:50+02:00"
verified: []
---

# Component frame

## Blueprint

### Context

Component frame shows a component's own box and spacing on a design-system
page, isolated from the surrounding page. A reader sees the component's size
and outer spacing without browser developer tools. Any space between the
dashed line and the visible component belongs to the component.

### Architecture

`apps/web/src/components/lab/ComponentFrame.svelte` owns the frame and its styles.
It renders a Svelte `children` snippet; Astro and MDX supply nested content.
Its boolean `fit` input, false by default, selects the width behaviour.
The canonical MDX reference page at `/lab/ds/component-frame` demonstrates both
widths, and the Design system registry names its source and this contract.

### Constraints

- The dashed line traces the outer box of the framed content, margins included.
- The frame adds no padding, no background and no external margin; the host
  page owns the spacing around the frame.
- The frame establishes its own block formatting context, so the content's
  outer margins stay inside the dashed line.
- The line is a 1px dashed outline in `--color-border`, drawn immediately
  outside the frame's box. It takes no layout space.
- By default the frame fills its parent's width, with a zero minimum width,
  and is the named `component-frame` CSS inline-size container.
- With `fit`, the frame takes the width of its content, up to its parent's
  width. A `fit` frame is not a size container.
- Document prose styles of the Design system layout apply to the direct
  children of the prose host only; framed content receives none of them.

## Contract

### Definition of Done

- The reference page shows a default frame and a `fit` frame, each around
  content with visible spacing of its own, and says when to use each.
- The shared component owns the framing styles once.

### Regression guardrails

- Framed content keeps its semantics, controls, local state, size and position.
- Production UI surfaces retain their own elevation definitions.

### Scenarios

```gherkin
Scenario: Trace the content's outer box
  Given a Component frame around content with its own margin and padding
  When it renders
  Then the frame's box equals the content's margin box
  And a 1px dashed line in the border colour surrounds that box
  And the page background remains visible through the frame

Scenario: Keep the content's margins inside the line
  Given a Component frame whose first and last children have vertical margins
  When it renders between other page blocks
  Then those margins lie inside the dashed line
  And the frame adds no margin of its own

Scenario: Leave the content's layout unchanged
  Given content placed directly in a parent
  When the same content is placed in a Component frame in that parent
  Then the content keeps its size
  And the dashed line takes no layout space

Scenario: Fill the available width by default
  Given a Component frame without fit inside a parent
  When the parent width changes
  Then the frame's box fills that width with a zero minimum width
  And descendants can query its named inline-size container

Scenario: Fit the content's width
  Given a Component frame with fit around content narrower than the parent
  When it renders
  Then the frame is as wide as the content's margin box
  And the frame is narrower than its parent
  And the frame is not a size container

Scenario: Compose from either authoring format
  Given Svelte children and MDX nested content
  When each is placed in a Component frame
  Then the frame renders that content inside the dashed line
```
