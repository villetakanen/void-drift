---

title: "Spec: Options"
status: draft
generated:
  by: "openai-codex/gpt-6.1-sol"
  at: "2026-11-20T10:31:54Z"
verified: [{ by: "codex/gpt-6", at: "2026-11-19T19:21:23+02:00" }]

---

# Options

## Blueprint

### Context

Options is where the player sets how the game behaves for them on this device.
A choice applies without saving and is still there on the next visit. Options
holds Invert controls, which swaps which side's input fires which engine, and
the [Speed camera](../camera/speed-camera/spec.md) preference. Combat HUD controls the [flight contact cues](../render/flight-contacts/spec.md).

### Architecture

- `SettingsSchema` in `packages/mode-a/src/lib/schemas/settings.ts` validates
  settings and gives their defaults. A new setting is added there before any
  consumer reads it.
- `apps/web/src/lib/stores/settings.ts` is the one store. It keeps the settings
  in this browser and parses them through the schema on load.
- `apps/web/src/pages/settings.astro` mounts
  `apps/web/src/components/Settings.svelte` at `/settings`. The Options menu
  uses the shared [game field backdrop](../../factory/design-system/game-field-backdrop/spec.md).
  The design-system component owns the generated field and scrim; Options owns
  its content and ordinary keyboard navigation without a modal focus trap.
- [Controls](../controls/spec.md) applies Invert controls in flight. The
  [active ship](../active-ship/spec.md) owns which ship is flown, and
  [Playground](../experimental/spec.md) owns its setting; neither is kept here.

### Constraints

- Changing a setting takes effect without a save action and without restarting a run.
- Settings persist in this browser across visits.
- Missing or invalid stored values use the default. Without browser storage the
  game starts with defaults and remains playable; changes remain usable in
  memory even when they cannot persist for another visit.
- The title screen and Pause open ordinary `/settings`, whose footer reads
  Return to title screen and targets `/`. Hangar opens `/settings?from=hangar`,
  whose footer reads Return to Hangar and targets `/hangar`. Only the explicit
  `from=hangar` context selects this return; missing or unknown context returns
  to title. Return destinations are fixed, not arbitrary URLs or browser history.
  The linked logo always targets `/`, including in Hangar context.
- This roundtrip preserves the active ship, fitting and saved preferences.
  Selected slot and Plan/View restoration are outside this navigation contract.
- Every setting can be changed by pointer, keyboard and touch. Each control has
  its setting name as its accessible name and its supporting copy as its
  accessible description.
- The shared binary Switch selects Speed camera framing, Off by default, in the Camera section. Options is its only control
  location. The in-flight ZOOM readout is passive. The Pause dialog contains
  no settings controls; its Settings action navigates to Options. Speed camera
  is independent of Playground and scoring.
- The Display section has a shared Combat HUD switch, On by default. It controls contact cues across all playable flight modes. Hull, power, score, flight controls and camera framing stay available independently. Older settings retain their existing choices.
- Options uses the same game field backdrop as the Title Screen, Top Scores and
  Credits.

## Contract

### Definition of Done

- O1: `/settings` shows Options with Invert controls, Speed camera and Combat HUD.
  Its footer returns to `/hangar` only for `from=hangar`; ordinary and unknown
  contexts return to `/`. The logo always returns home.
- O2: Changing Invert controls swaps the engine inputs in the next flight input, with no save action or restart.
- O3: A changed setting persists across a page reload.
- O4: A missing or invalid stored value reads as the default, and unavailable storage leaves the game playable.
- O5: `SettingsSchema` holds no ship choice.
- O6: Speed camera uses the shared Switch, defaults to Off, persists across reloads and is presented only in Options. Legacy settings retain a valid Invert controls choice when the Speed camera field is missing.
- O7: Options renders the same game field backdrop as the Title Screen, Top Scores and Credits.

### Regression guardrails

- One schema and one store hold the settings; consumers read no browser storage directly.
- A bad stored value leaves the game playable.
- Settings leave run replay unchanged: the same inputs reach the simulation whatever the preference.

### Scenarios

```gherkin
Feature: Options

  Scenario: Return to the explicit Hangar destination
    Given I open /settings?from=hangar from the Hangar
    When I change a preference and reload Options
    Then the preference is kept and Return to Hangar still targets /hangar
    When I activate Return to Hangar
    Then the Hangar shows the active ship and fitting I left

  Scenario: Ordinary and unknown contexts return home
    Given I open /settings from the title screen or Pause, or with an unknown from context
    Then the footer reads Return to title screen and targets /
    And a supplied return URL or browser history cannot change that destination

  Scenario: The logo always returns home
    Given I open /settings?from=hangar
    When I activate the Void Drift logo
    Then the title screen opens

  Scenario: Invert controls applies at once
    Given I open Options
    When I change Invert controls
    And start a flight
    Then my left and right inputs fire the swapped engines

  Scenario: Combat HUD persists
    Given I open Options with settings saved before Combat HUD was added
    Then Combat HUD is On and my other choices are preserved
    When I turn Combat HUD Off and reload Options
    Then the switch is Off
    And my next flight shows the ordinary deck without contact cues

  Scenario: The choice is kept
    Given I changed Invert controls
    When I reload the game
    Then Invert controls is as I left it

  Scenario: A corrupted setting falls back
    Given the stored settings are not valid
    When I load the game
    Then the settings are the defaults
    And I can play

  Scenario: Options uses the shared backdrop
    Given I open Options
    When the page renders
    Then it shows the same game field backdrop as the Title Screen, Top Scores and Credits
```
