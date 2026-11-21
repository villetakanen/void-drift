---

title: "Spec: Input presentation"
status: draft
generated:
  by: "openai-codex/gpt-6.1-sol"
  at: "2026-11-19T12:32:56+02:00"
verified:
- by: "openai-codex/gpt-6.1-sol"
  at: "2026-11-19T12:33:38+02:00"

---

# Spec: Input presentation

## Blueprint

### Context

Tabs, bounded numeric inputs and flight thrust pads share input foundations while retaining their distinct tasks.

### Architecture

**Source of truth:** `packages/core/src/lib/styles/tokens.css`,
`apps/web/src/components/inputs/SegmentedControl.svelte`, `apps/web/src/components/inputs/RingSlider.svelte`,
`apps/web/src/components/inputs/Switch.svelte`.
**References:** `/lab/surfaces`, `/lab/ds/choices`, `/lab/ds/slider`.

| Token               | Value                                              | Use                       |
| ------------------- | -------------------------------------------------- | ------------------------- |
| `--color-elev-1`    | `lch(5.5% 10 290)`                                 | Console                   |
| `--color-elev-2`    | `lch(11% 15 290)`                                  | Display                   |
| `--color-elev-3`    | `lch(16.5% 20 290)`                                | Overlay pane              |
| `--surface-display` | elevation 2 with 4px scanlines and a darkened edge | Display background        |
| `--shadow-display`  | 1px dark bezel; 0 8px 24px black at 70%            | Display edge              |
| `--color-backdrop`  | black at 11%                                       | Behind a Lab overlay pane |
- Each elevation step keeps the background's hue, 290, and raises lightness by 5.5
  and chroma by 5.
- The elevation steps are the surface roles and `--color-backdrop` is the scrim role;
  see [Colour](../colour/spec.md).
#### Ring slider

**Reference:** `/lab/ds/slider`.

- `RingSlider` wraps a native range input (keys, touch and forms unchanged) at a
  44px touch height; `compact` hides its label line where the host shows it. Its
  value is announced through the input, not a live region.
- The ring slider is a faint 2px track, lime to the value, and a lime ring knob;
  label and value stay neutral, and the unfilled track takes the same tint on hover.
- Lime marks the selection and the knob; hover borrows it at low strength. Data and
  values stay neutral.

#### Tabs

**Source of truth:** `apps/web/src/components/inputs/Tabs.svelte`.
**Reference:** `/lab/ds/tabs`. Behaviour follows the WAI-ARIA Authoring
Practices tabs pattern.

The [choice-control contract](../choices/spec.md) distinguishes values and on/off settings from panels:

| Control            | Use for                                          | Owns content        | Semantics                    |
| ------------------ | ------------------------------------------------ | ------------------- | ---------------------------- |
| `Tabs`             | Sibling views of one area, one visible at a time | Yes: one panel each | `tablist`, `tab`, `tabpanel` |
| `SegmentedControl` | One value from a small set                       | No                  | Native radio group           |
| `Switch`           | Enabling or disabling one setting                | No                  | Native checkbox              |
- Tabs are not for form values, commands or page navigation. A control that
  swaps the whole area beneath it is tabs, however few options it has; a control
  whose value the host merely reads is a segmented control. Tabs share the segmented control's look
  and differ in what they do; tab roles are never put on a radio group.
- `Tabs` takes `tabs` (each an `id`, a `label`, optional `facts` and
  `unavailable`), a bindable `value` holding the selected id, a `label` naming
  the row, `activation`, `stretch` and a `panel` snippet that receives the
  selected tab. The component renders the panel element and links tab and panel
  to each other; the host supplies the panel's content.
- The row is the segmented control's shape: one cut button split into parts, straight
  splits inside. The selected part is filled with the selected colour; the
  others sit on `--color-elev-2`, the switch track's surface, and take a faint
  action tint under a pointer. Focus is the shared inset ring. The component
  draws no surface around the panel.
- A tab holds its name and up to two short facts. The name leads the part and
  the facts close it: caption text, stacked, muted when unselected and on-brand
  when selected. Facts are the default; a row may omit them. The row is exactly
  one button tall with or without facts, and text never wraps. Anything richer
  belongs in the panel. The label is the tab's accessible name; the facts are
  its description.
- An unavailable tab stays in the row as an empty frame: no fill, an
  `--color-elev-2` edge and muted text at full strength. It takes no hover
  treatment, keeps keyboard focus so its facts can be read, and is never
  selected by pointer or key. A selected tab that becomes unavailable stays
  selected; the component never changes `value` on its own.
- The row is one tab stop, entered at the selected tab. Left and Right move
  between tabs and wrap; Home and End reach the ends. With `automatic`
  activation, the default, focusing a tab selects it; with `manual`, Enter or
  Space selects. Use `manual` when showing a panel is slow or consequential.
  The panel is the next tab stop.
- Tabs size to their content and never shrink. A row wider than its host
  scrolls sideways inside itself and brings the focused tab into view; neither
  the host nor the page widens. `stretch` shares the host width between tabs.
  A row that scrolls at its normal host width has too many tabs or too much in
  them.

#### Thrust pads

The flight thrust pads are translucent glass over the live stage. Their
arrangement, actions and lighting rules belong to the
[controls contract](../../../game/controls/spec.md); this section owns their look.

| Token                  | Value                     | Use              |
| ---------------------- | ------------------------- | ---------------- |
| `--color-pad-turn`     | `--color-elev-3` at 22%   | Turn pad at rest |
| `--color-pad-burn`     | `--color-elev-3` at 36%   | Burn pad at rest |
| `--color-pad-turn-lit` | `--color-selected` at 9%  | Lit turn pad     |
| `--color-pad-burn-lit` | `--color-selected` at 16% | Lit burn pad     |
- Pads are borderless and uncut: two disjoint panes per gutter, so tints never
  stack, and stars stay visible through them at rest and lit.
- Markings are `--color-text` in the UI type family; Android green stays
  reserved for the world HUD, the arrival countdown and title-screen
  information.
- `apps/web/src/components/controls/ThrustPads.svelte` draws one gutter's
  assembly: its `side`, the pads to light, and pointer presses reported per pad.
  Drawing and hit-testing share one geometry, so what lights is what was
  touched.
- `/lab/controls` demonstrates both sides in every lit state (none, `L`, `R`,
  `LR`, `LF`, `RF`) over a starfield, and lets a pointer press them.

### Constraints

- Tabs owns sibling panels and keeps tab semantics.
- RingSlider wraps a native range input.
- Flight thrust-pad interaction follows the game controls contract.
- Value choices and independent on/off settings follow the [choice-control contract](../choices/spec.md).

## Contract

### Definition of Done

- Tabs demonstrates facts, unavailable tabs, automatic/manual activation, overflow and stretching.
- Tabs preserves selected values when availability changes.
- RingSlider preserves native range, keyboard and touch behavior at its 44px touch height.
- ThrustPads draws and hit-tests the same production geometry.

### Regression guardrails

- Panels remain linked to their tabs and keyboard-reachable.
- A tab row overflows inside itself rather than widening the page.
- Reduced-motion and focus treatments follow shared foundations.

### Scenarios

```gherkin
Scenario: Choose a workspace with manual activation
  Given a manually activated tab row with the first tab selected
  When I press Right
  Then focus moves without changing the selected panel
  When I press Enter
  Then the focused tab and its associated panel become selected

Scenario: Preserve an unavailable selection
  Given the selected tab becomes unavailable
  When the row redraws
  Then its selected value stays unchanged
  And an unavailable tab cannot be newly activated

Scenario: Inspect overflowing tabs
  Given a tab row wider than its host
  When keyboard focus reaches an offscreen tab
  Then the row scrolls that tab into view without widening the host
```
