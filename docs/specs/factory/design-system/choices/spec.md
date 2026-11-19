---

title: "Spec: Choice controls"
status: draft
generated:
  by: "openai-codex/gpt-6.1-sol"
  at: "2026-11-19T12:32:56+02:00"
verified:
- by: "openai-codex/gpt-6.1-sol"
  at: "2026-11-19T12:33:38+02:00"

---

# Spec: Choice controls

## Blueprint

### Context

Choice controls let players and Lab users select a value or enable a setting.
Their names describe their task, even when they share a cut-corner appearance.
The canonical examples are `/lab/ds/choices`; the comparison with content-owning
Tabs is `/lab/ds/tabs`.

### Architecture

- [SegmentedControl](../../../../../apps/web/src/components/inputs/SegmentedControl.svelte)
  renders native radios in a named group. It takes `options`, bindable string
  `value`, group `label`, optional `stretch`, `details`, `disabledOptions` and
  an `optionSuffix` snippet receiving the option label.
- [Switch](../../../../../apps/web/src/components/inputs/Switch.svelte) wraps a
  native checkbox. It takes bindable boolean `checked`, optional `id`,
  `disabled` and `aria-describedby`. A containing or associated label names it.
- [Tabs](../../../../../apps/web/src/components/inputs/Tabs.svelte) owns panels
  under the [Tabs contract](../inputs/spec.md#tabs).
- Styling uses the shared [tokens](../../../../../packages/core/src/lib/styles/tokens.css).
  Consumers own layout and setting side effects, including fitting changes and
  configuration creation. Functional bindings preserve those side effects.

### Constraints

- Independent enable/disable settings use `Switch` in production and current Lab surfaces.
- Named alternatives use `SegmentedControl`, including two-option choices backed by booleans.
- Sibling workspaces use `Tabs`; drawing parameters in one preview remain value choices.
- Commands use buttons; selection/engagement buttons retain their appropriate pressed state.
- Checkboxes represent item inclusion or form selection when that is the actual task.
- “Toggle” describes a state-changing action or an explicit toggle button, rather than a radio primitive.
- Shared-component consumers in studies use the current API; study-local experiments and historical terminology remain study-owned.
- Switch exposes native checkbox semantics, Space behavior and boolean checked state.
- Inspection choices preserve game definitions, saved values and authored data unless the user deliberately edits them.

## Contract

### Definition of Done

- Every shared segmented choice imports `SegmentedControl`; the registry names its real source file.
- A segmented control has one cut-button outline split into equal parts, with 8px inline padding per option. `stretch` fills its host with equal segments.
- The selected segment uses selected lime; other segments use elevation 2 and an action tint on hover.
- Native radios provide arrow selection; disabled options stay visible and are skipped by keyboard selection.
- Disabling the selected option preserves its value until a deliberate supported choice.
- Details wrap with the option and are accessible descriptions; suffix content preserves the option's accessible name.
- Switch has an 88×44px hit area, an 80×30px track and a cut marker displaying OFF or ON.
- Switch names stay stable as state changes; optional supporting copy is a description.
- Focus, hover, disabled and reduced-motion treatments use shared foundations.
- The canonical Lab shows segmented variants, unavailable choices, suffixes and described/off/on/disabled switches.

### Regression guardrails

- Renaming a component preserves its prop contract, bindings, appearance and input semantics.
- Changing a setting invokes its existing side effects, rather than only changing its visual state.
- Run/Pause, Reset and Burst remain commands; held thrust and fitted-part selection remain their own interactions.
- Switch role and settings persistence remain compatible with existing checkbox-based consumers.
- Consumer layouts accommodate the full shared control hit area at supported widths.

### Scenarios

```gherkin
Scenario: Choose a named value rather than toggling a setting
  Given Plan and View are alternatives for one ship preview
  When I choose View in SegmentedControl
  Then View is the selected radio value
  And the fitting and selected mount remain unchanged

Scenario: Operate an independent setting
  Given Speed camera is off and its label names a Switch
  When I focus it and press Space
  Then its native checkbox is checked and its marker reads ON
  And its accessible name remains Speed camera

Scenario: Retain an unavailable selected value
  Given a segmented option is selected
  When it becomes disabled
  Then it remains selected without changing the bound value
  And arrow selection skips that unavailable option

Scenario: Read supporting facts
  Given an option has details and a suffix
  When I inspect its accessible information
  Then its name is the option label and its description includes the details

Scenario: Preserve enabling side effects
  Given energy analysis is disabled in a Motion instrument
  When I enable its Switch
  Then its validated analysis configuration is created
  And disabling it removes that configuration without changing motion settings

Scenario: Open a workspace rather than changing a value
  Given the Hangar offers sibling ship workspaces
  When I activate another ship tab
  Then Tabs exposes its associated workbench panel
  And the row retains tab semantics rather than radio or checkbox semantics
```
