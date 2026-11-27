---
title: "Spec: Motion instrument"
status: draft
generated:
  by: "openai-codex/gpt-6.2-astra"
  at: "2026-11-27T06:36:37Z"
verified:
  - by: "human:ville-takanen"
    at: "2026-11-27T06:38:42Z"
---

# Motion instrument

## Context

The Motion instrument lets a designer compare what ships do under the same thruster commands. The paths show *where* the ships diverge; measurements on a common timeline show *when* their speed or turning begins to differ. By holding the burn and starting conditions fixed, the designer can investigate a fitting or adjust one shared engine property without having to reproduce a manoeuvre by hand.

## Blueprint

Each experiment states its comparison conditions and exposes only the variables the designer can change. A [Lab](../spec.md) room provides an ongoing tuning bench; a study can embed independent experiments with different controls.

### Architecture

| Question | Owner |
| --- | --- |
| What can the agent configure and the designer export? | [`InstrumentConfig` and `serialize`](../../../../apps/web/src/lib/instrument/config.ts) define Ship tuning's validated document and JSON export. Each labelled vehicle uses the game's [`LoadoutSchema`](../../../../packages/mode-a/src/lib/schemas/loadout.ts). The [starting document](../../../../apps/web/src/lib/instrument/starter.ts) belongs to the Lab use at `/lab/instrument`. |
| What commands do the ships receive? | [Burn programs](../../../../apps/web/src/lib/instrument/burns.ts) own the repeatable input sequences and their timing. Experiments select a program rather than scripting inputs. |
| What moves the ships? | [Trajectory calculation](../../../../apps/web/src/lib/instrument/calculate.ts) samples the game's [`applyBuildEngines`](../../../../packages/mode-a/src/lib/build-flight.ts) with shared experiment values and the fitted ship's cruise ceiling. [Gravity tuning](../gravity-tuning/spec.md) supplies its own starting conditions, well, contact response and measurements. |
| How does a study use the screen? | [`InstrumentEmbed`](../../../../apps/web/src/components/lab/instrument/InstrumentEmbed.astro) hosts Ship tuning in a full-window band. A configured use can supply its own pane to [`ShipTuning`](../../../../apps/web/src/components/lab/instrument/ShipTuning.svelte) inside the shared [`InstrumentBand`](../../../../apps/web/src/components/lab/instrument/InstrumentBand.astro). |

#### Comparing and reading paths

Hull, equipment and motion-rule definitions apply experiment-wide. Vehicles differ through their hull and mounted equipment, not private overrides. Without tuning overrides they use current game values. Identical fittings under identical conditions give identical results. In a gravity comparison a shadow repeats its source's fitting, settings, burn and starting state with only gravity omitted.

Ordinary Ship tuning starts at rest at the origin, without gravity or power limits. It compares speed, acceleration and turn acceleration without changing part mass or chassis values. Its paths answer a question about those conditions, not necessarily about resource-limited flight.

The [shared screen](../../../../apps/web/src/components/lab/instrument/MotionInstrumentScreen.svelte) fits the path and burn beside stacked time graphs and their cursor. A labelled track keeps one colour across all views. Each graph derives its scale from the data, with a symmetric axis for signed measures; studies do not set competing scales. Moving the cursor, fitting all paths or dragging the fixed-scale path view changes only the reading, not the samples. The [parameter side sheet](../../factory/design-system/side-sheet/spec.md) holds adjustments and Copy JSON without permanently reducing the plot area; `/lab/ds/instrument-parts` presents the instrument components.

#### Energy comparisons

| Comparison | What the designer reads | Relationship to motion |
| --- | --- | --- |
| Optional energy analysis in Ship or Gravity tuning | Collection, consumption, signed net power and cumulative battery change along each track. Battery change starts at zero and integrates net power without clamping; it is not state of charge. | The budget describes the path, not the reverse. Editing it changes neither propulsion, gravity nor contact. Capacity and starvation are excluded. |
| Opt-in paid ignition trace | Successful ignition dots on the speed, turn and battery timeline for ion and Fission fittings, including side, single aft and paired aft arrangements. | This no-gravity comparison uses [game-owned Fission impulse, recovery and per-nozzle payment](../../game/fission-engine/spec.md), not pulse-duration or duty-cycle tuning. A full starting battery and steady 3 E/s supply are stated experimental conditions, not flight solar charging. |

The [energy schema and calculation](../../../../apps/web/src/lib/instrument/energy.ts) use production collection fields and falloff. Overlapping fields add according to each ship's inherent and fitted collectors. Field boundaries appear independently of gravity boundaries. The [energy pane](../../../../apps/web/src/components/lab/instrument/EnergyPanel.svelte) supports adding, editing and removing fields and adjusting shared life-support and light-ion draw without changing other engine costs. Valid edits are part of the exported document; invalid edits report issues and keep the last valid document. Switching analysis off removes its configuration and restores the three motion graphs.

The [Suns charging comparison](../../../../apps/web/src/components/studies/suns/ChargingStudy.svelte) uses the same path, burn, graphs and cursor with its own [candidate profiles and budget](../../../../apps/web/src/components/studies/suns/charging.ts). It identifies the reference fitting, start, sampling, contact termination and omitted feedback. Its overlay groups the budget adjustments, reset and break-even reading; closing it preserves the settings. Changing ion draw affects main engines and stabilizers together without changing their propulsion. Changing the burn, unlike editing the budget, changes the flight being measured.

### Constraints

- The agent supplies the initial document. The designer adjusts exposed controls and copies the current JSON for discussion; there is no designer-facing import. Export omits empty override groups and neither approves settings nor applies them to the game.
- Live instances follow current production laws under the configured conditions. Written findings and captures preserve historical observations; embedded experiments do not pin old simulation versions.
- The screen follows the Lab viewport minimum of 1280px and the shared [choice controls](../../factory/design-system/choices/spec.md) for analysis, burn and scale.

## Scenarios

```gherkin
Feature: Motion instrument

  Scenario: Reject an invalid starting experiment
    Given a supplied loadout has the wrong number of aft slots
    When the designer opens the experiment
    Then schema issues appear instead of a plotted comparison

  Scenario: Change the burn in one of two embedded experiments
    Given a study has two independently configured experiments
    When the designer selects another burn in the first
    Then its input lanes, paths, measurements and exported burn reflect that program
    And its fixed conditions and the second experiment remain unchanged

  Scenario: Inspect a point without changing the experiment
    Given the designer has adjusted a shared engine setting
    When they close the pane with Escape and move the time cursor
    Then focus returns to the menu button on dismissal
    And the cursor reads the existing paths with the adjusted setting intact

  Scenario: Inspect an energy deficit without enabling paid ignition
    Given a ship crosses a region where consumption exceeds collection
    When the designer enables ordinary energy analysis
    Then cumulative battery change falls through that region
    And the ship follows the same path as before

  Scenario: A linked fitting cannot pay for both nozzles
    Given the designer selects the paid ignition comparison
    And the linked pair can afford only one nozzle when commanded together
    When the designer inspects that command on the timeline
    Then neither nozzle has an ignition dot or an ignition debit
```
