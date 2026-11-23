---
generated:
  by: "claude-code/claude-fable-5-2"
  at: "2026-11-23T08:28:20+02:00"
verified: []
---

# Initials

## Blueprint

### Context

Initials is an arcade-style entry for a player's tag: up to three letters,
A–Z, typed or picked with the arrow keys. It is made for the run-complete
dialog, where the tag is shown next to a score on Top Scores. This contract
covers the component and its design-system page; a screen that adopts it
records that in its own contract.

### Architecture

- `apps/web/src/components/inputs/Initials.svelte` owns the component, its
  key handling and its styles. `apps/web/src/pages/lab/ds/initials.mdx` owns
  the canonical page at `/lab/ds/initials`, and the Design system registry
  names both the source and this contract.
- The component is one native text field inside one `label` element. Three
  decorative slots drawn under the field show the letters and are hidden from
  assistive technology. The field paints no text, caret, selection or outline
  of its own.
- Inputs: `label` (default `"Initials"`), shown below the slots and the
  field's accessible name; `value`, bindable; `host` (`0`, `1` or `2`,
  default `0`), the elevation of the surface the component sits on;
  `disabled` (default false), a placeholder state.
- `focus()` focuses the field with the first empty slot selected, or the third
  slot when all three hold letters.
- The value is one string of zero to three uppercase letters A–Z, filled from
  the left with no gaps. The host owns any further rule, such as requiring
  three letters before a score is submitted.
- A slot is selectable when it holds a letter or is the first empty slot. The
  last selectable slot is the first empty slot, or the third slot when all
  three hold letters.
- Presentation uses shared tokens from
  `packages/core/src/lib/styles/tokens.css`. The slot's bracket is drawn as
  the focused call to action in [Actions](../actions/spec.md) draws its own.

### Constraints

Selection

- While the field has focus, exactly one selectable slot is selected. Without
  focus no slot is selected.
- Tab into the field selects the first slot; Shift+Tab into it selects the
  last selectable slot. A click selects the clicked slot, or the last
  selectable slot when the click lands beyond it.

Keys

- Up and Down change the selected slot's letter to the next or previous one,
  wrapping between Z and A. On an empty slot either key enters A. The same
  slot stays selected.
- Left and Right select the previous or next selectable slot and stop at the
  first and last. Home and End select the first and the last selectable slot.
- A typed letter is entered in uppercase in the selected slot, replacing a
  letter already there, and the next selectable slot becomes selected. Any
  other typed character leaves the value and selection unchanged.
- Backspace removes the last letter when the selected slot is that letter or
  the empty slot after it; on an earlier letter it selects the previous slot.
  Delete removes the last letter when that letter is selected. Only the last
  letter is ever removed.
- Paste enters the pasted letters A–Z in uppercase from the selected slot, at
  most three, and drops every other character. Letters that would not fit
  from the selected slot start further left.
- Tab and Shift+Tab select the next or previous selectable slot. From the last
  selectable slot Tab leaves the field, and from the first slot Shift+Tab
  leaves it. Tab never changes the value.
- Keys pressed with Control, Alt or Meta keep their browser behaviour.

Appearance

- An empty slot has the `--color-void` ground and shows the letter A in
  `--color-placeholder`.
- A slot that holds a letter and is not selected has a ground one elevation
  step above its host: `--color-elev-1`, `--color-elev-2` or `--color-elev-3`
  for host `0`, `1` or `2`. Its letter uses `--color-text`.
- The selected slot has the `--color-void` ground, whether or not it holds a
  letter.
- Every slot has cut corners of `--cut-size-md` and a bracket around each end:
  a line `--bracket-width` wide, `--bracket-inset` inside the slot's edge,
  following the corner cut and open across the middle of the top and bottom.
  Bracket position, width and shape are the same in every state.
- Brackets use `--color-bracket` at rest and `--color-selected` on the
  selected slot. Selection adds nothing and moves nothing.
- Letters use `--font-family-ui` at `--font-size-display`; slots are
  `--spacing-gap` apart.

Disabled

- A disabled component keeps its size and layout and shows its value as
  slots at `--state-disabled-opacity`. The field takes no focus, input or
  selection, and its native text field is disabled.

Accessibility

- Assistive technology finds one textbox, named by the label and described by
  a hint that Up and Down change the letter.
- A polite live region announces the letter after each Up or Down, and is
  cleared when the field loses focus.
- Accepted loss of accessibility, decided 2026-11-23: the field draws no focus
  ring. The only focus cue is the colour of the selected slot's brackets and
  that slot's void ground. This is less than WCAG 2.2 Focus Appearance
  (2.4.13) and the shared focus ring provide.
- Accepted loss of accessibility, decided 2026-11-23: Tab moves inside a
  single text field. This departs from standard text-field behaviour and from
  the practice of one tab stop per composite control. Focus is never trapped
  (WCAG 2.1.2 holds).

## Contract

### Definition of Done

- The component renders one labelled native text field over three decorative
  slots and keeps its value to zero to three uppercase letters A–Z.
- The canonical page shows the component on each host elevation and documents
  its inputs, keys, accessibility, both accepted losses and consumed tokens.
- The Design system registry entry for `/lab/ds/initials` names the component
  file and this contract.

### Regression guardrails

- The value never holds a gap, a lowercase letter, a character outside A–Z or
  more than three letters after any key, paste or autofill.
- Tab and Shift+Tab always leave the field within three presses.
- Bracket geometry is identical on empty, filled and selected slots.

### Scenarios

```gherkin
Scenario: Expose one labelled text field
  Given an Initials component with the default label
  When assistive technology reads it
  Then it finds one textbox named "Initials"
  And the three slots are hidden from it

Scenario: Select a slot only while focused
  Given an Initials component holding "VT" without focus
  Then no slot uses the selected bracket colour
  When I Tab into the field
  Then the first slot alone is selected
  When I leave and Shift+Tab back into the field
  Then the third slot, the first empty one, alone is selected

Scenario: Pick letters with Up and Down
  Given a focused empty Initials component
  When I press Up
  Then the value is "A" and the first slot stays selected
  And the live region announces "A"
  When I press Down
  Then the value is "Z"
  When I press Up
  Then the value is "A"

Scenario: Type, replace and advance
  Given a focused empty Initials component
  When I type "v", "t" and "x"
  Then the value is "VTX" and the third slot is selected
  When I press Home and type "a"
  Then the value is "ATX" and the second slot is selected
  When I type "7"
  Then the value is "ATX" and the second slot is selected

Scenario: Move between selectable slots
  Given a focused Initials component holding "V" with the first slot selected
  When I press Right twice
  Then the second slot, the first empty one, is selected
  When I press Left
  Then the first slot is selected
  When I press End
  Then the second slot is selected

Scenario: Remove only the last letter
  Given a focused Initials component holding "VTX" with the third slot selected
  When I press Delete
  Then the value is "VT" and the third slot is selected
  When I press Backspace
  Then the value is "V" and the second slot is selected
  When I type "t", press Home and then press Delete and Backspace
  Then the value is "VT" and the first slot is selected

Scenario: Paste letters
  Given a focused empty Initials component
  When I paste "a1b-cd"
  Then the value is "ABC"

Scenario: Walk the slots with Tab and leave
  Given an Initials component holding "VT" between two other focusable controls
  When I Tab into it and press Tab twice
  Then the second and then the third slot are selected and the value is "VT"
  When I press Tab again
  Then focus moves to the following control
  When I Shift+Tab back and press Shift+Tab three times
  Then focus moves to the preceding control and the value is "VT"

Scenario: Select by click
  Given an Initials component holding "V"
  When I click the first slot
  Then the first slot is selected
  When I click the third slot
  Then the second slot, the first empty one, is selected

Scenario: Show state by ground and bracket colour
  Given an Initials component holding "VT" on host 1
  When it renders without focus
  Then the first two slots have the elevation 2 ground and the third has the void ground with a placeholder A
  And every bracket uses the resting bracket colour
  When the first slot is selected
  Then its ground is the void and its brackets use the selected colour
  And its brackets keep their position, width and shape
  And no focus ring is drawn

Scenario: Hold a place while disabled
  Given an enabled and a disabled Initials component holding "VT"
  Then both have the same size
  And the disabled one's native text field is disabled and cannot be focused or typed in
  And its slots show "VT" dimmed

Scenario: Focus the first empty slot
  Given an Initials component holding "V"
  When the host calls focus()
  Then the field has focus and the second slot is selected

Scenario: Inspect the canonical page
  Given the page at /lab/ds/initials
  When I read it
  Then it shows the component on the void, on elevation 1 and on elevation 2, and disabled
  And it documents the inputs, the keys, both accepted losses of accessibility and the consumed tokens
```
