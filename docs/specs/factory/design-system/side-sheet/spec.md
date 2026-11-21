---
generated:
  by: "codex/gpt-6.2"
  at: "2026-11-21T19:26:34+00:00"
verified:
  - by: "human:ville-takanen"
    at: "2026-11-21T19:28:33+00:00"
---

# Side sheet

## Blueprint

### Context

Lab designers need to inspect and adjust an instrument without permanently
reserving preview space for its controls. The shared parameter side sheet holds
parameters, controls and readouts over the instrument; closing it reveals the
full preview. `/lab/ds/instrument-parts` demonstrates the shared component.

### Architecture

[SideSheet.svelte](../../../../../apps/web/src/components/lab/instrument/SideSheet.svelte)
owns its open state, trigger, backdrop, named pane, scrolling and focus return.
Hosts supply the visible title, accessible label and child controls, and own
parameter values, validation and effects on the instrument. Each host provides a
positioned container with a defined height and places the sheet outside any
scaled drawing.

The [surface contract](../surfaces/spec.md) owns elevation, backdrop and layer
tokens. The sheet composes its elevation-3 fill, Lab backdrop and raised layer;
it owns their placement over the host. Each contained control's contract owns
that control's interaction.

### Constraints

- The sheet starts closed, with its menu button at the host's upper-right corner.
- The open sheet overlays the host's right edge at full height. Its width,
  including padding, is the smaller golden-ratio share (`1 / φ² ≈ 38.1966%`).
- The backdrop covers the host behind the sheet. Overflow scrolls inside the pane.
- Opening focuses the close button. Closing returns focus to the menu button.
- Escape closes an open sheet when focus is inside it; the host retains keyboard
  handling when focus is elsewhere.
- Closing hides the pane while retaining its child controls and their input state.

## Contract

### Definition of Done

- Lab and study hosts compose the shared sheet with their own controls and values.
- The canonical example demonstrates opening, dismissal, sizing and scrolling.
- The pane and its open and close buttons have names supplied by the host's title
  and accessible label.

### Regression guardrails

- Scaling an instrument drawing leaves the sheet and its controls unscaled.
- Opening, closing and host resizing preserve child input state.

### Scenarios

```gherkin
Scenario: Open and close the parameter pane
  Given an instrument with its parameter sheet closed
  When I activate its upper-right menu button
  Then the named pane overlays the host and its close button receives focus
  And the menu reports the sheet as expanded
  When I activate the close button
  Then the pane and backdrop are hidden and focus returns to the menu
  And the menu reports the sheet as collapsed

Scenario: Dismiss from inside the sheet
  Given an open sheet with focus on one of its controls
  When I press Escape
  Then the sheet closes and focus returns to the menu

Scenario: Retain host keyboard handling
  Given an open sheet with focus outside it
  When I press Escape
  Then the sheet remains open

Scenario: Follow the host and reach overflowing controls
  Given a sheet beside a scaled instrument drawing with overflowing controls
  When I resize its positioned host
  Then the unscaled sheet follows the host's full height and 38.1966% width
  And I can scroll within the pane to reach its last control

Scenario: Preserve an unfinished edit
  Given an open sheet containing an edited, unsubmitted input
  When I close the sheet and open it again
  Then that input retains its edited value
```
