# Options

## Blueprint

### Context

Options is where the player sets how the game behaves for them on this device.
A choice applies at once and is still there on the next visit. It holds one
setting: Invert controls, which swaps which side's input fires which engine.

### Architecture and boundaries

- **Contract.** `SettingsSchema` in
  `packages/mode-a/src/lib/schemas/settings.ts` validates the settings and
  gives their defaults. A new setting is added there before anything reads it.
- **Store.** `apps/web/src/lib/stores/settings.ts` is the one store. It keeps
  the settings in this browser and parses them through the schema on load.
- **Page.** `apps/web/src/pages/settings.astro` mounts
  `apps/web/src/components/Settings.svelte` at `/settings`.
- **Neighbours.** [Controls](../controls/spec.md) applies Invert controls in
  flight. The [active ship](../active-ship/spec.md) owns which ship is flown,
  and [Experimental mode](../experimental/spec.md) owns its own setting; neither
  is kept here.

### Rules

- **Applies at once.** Changing a setting takes effect without a save action
  and without restarting a run.
- **Kept on this device.** Settings are kept in this browser across visits.
- **Safe fallback.** A stored value that is missing or fails the schema reads
  as the default. Without browser storage the game runs on the defaults.
- **Reachable and leavable.** The title screen leads to Options, and Options
  leads back to the title screen.
- **Input.** Every setting can be changed by pointer, keyboard and touch.

## Contract

### Definition of Done

- [ ] O1: `/settings` shows Options with Invert controls, and returns to the
  title screen.
- [ ] O2: Changing Invert controls swaps the engine inputs in the next flight
  input, with no save action and no restart.
- [ ] O3: The choice survives a page reload.
- [ ] O4: A missing or invalid stored value reads as the default, and
  unavailable storage leaves the game playable.
- [ ] O5: `SettingsSchema` holds no ship choice.

### Regression guardrails

- One schema and one store hold the settings; nothing reads browser storage
  for them directly.
- A bad stored value never blocks starting, playing or finishing a run.
- Settings never change a run's replay: the same inputs reach the simulation
  whatever the preference.

### Scenarios

```gherkin
Feature: Options

  Scenario: Invert controls applies at once
    Given I open Options
    When I change Invert controls
    And start a flight
    Then my left and right inputs fire the swapped engines

  Scenario: The choice is kept
    Given I changed Invert controls
    When I reload the game
    Then Invert controls is as I left it

  Scenario: A corrupted setting falls back
    Given the stored settings are not valid
    When I load the game
    Then the settings are the defaults
    And I can play
```
