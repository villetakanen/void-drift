# Experimental mode

## Blueprint

### Context

Void Drift grows new ships and equipment in the open. Some of them are
finished enough for fair competition; others are still being worked out and
may change in ways that would make old scores meaningless. Experimental mode
lets the player fly everything, while keeping the leaderboard to the content
whose scores should stay valid.

The player makes one choice: Experimental **Off** or **On**.

- **Off:** only stable ships and parts can be flown, and every Survival run
  that starts is ranked.
- **On:** every ship and part can be flown, and no run is ranked. The run still
  shows its score; only leaderboard submission is withheld.

What is fitted never changes eligibility on its own: with Experimental On, a
ship carrying only stable parts still flies an unranked run.

### Architecture and boundaries

- **Release class.** Every chassis in `CHASSIS` and every part in `PARTS`
  (`packages/mode-a/src/lib/schemas/loadout.ts`) carries exactly one release
  class: stable or experimental. The class lives in that catalog data, is
  validated by its Zod schema, and is the only source the game reads. Promoting
  or demoting an item is a data change, not a spec change. Stabilizers are a
  ship option and follow their ship.
- **Setting.** Experimental is a per-device player setting, defined by a Zod
  schema in `packages/mode-a/src/lib/schemas/` before any consumer reads it. It
  is stored in the browser, parsed on load, and a missing or invalid value
  reads as Off.
- **Control.** The Experimental control lives in the [Hangar](../hangar/spec.md)
  opening. Nothing else changes the setting, and it cannot change during a run.
- **Eligibility.** The [game contract](../spec.md) owns which runs are ranked;
  this contract supplies the Experimental condition it reads. Firestore rules
  bound submitted data and cannot see the setting; the leaderboard stays casual
  and client-reported.
- **Wording.** No term in this contract is decided: "stable", "experimental",
  "active ship" and "fitting" are placeholders, not names for the game, its
  copy or its code. The player-facing names for the two classes and the text of
  the experimental marker are chosen in a design study with a live prototype on
  the real screens.

### Rules

- **Off, catalog.** Experimental ships and parts are visible in the Hangar,
  carry the experimental marker and are disabled: they cannot be selected or
  fitted.
- **Off, existing setup.** Turning Experimental Off removes nothing. An active
  ship that is experimental, or a fitted part that is experimental, stays in the
  setup, shown disabled with the experimental marker.
- **Off, launch.** While the active ship contains an experimental ship or
  part, every flight launch is unavailable, from the title screen and from the
  Hangar. The title screen says why and leads to the Hangar. Launch becomes
  available as soon as the player picks a stable ship whose fitted parts
  are all stable, or removes the experimental parts.
- **On, catalog.** Every ship and part is selectable and fittable. Experimental
  items keep their marker so the player can tell them apart.
- **On, runs.** Every run is unranked: run complete shows the score and states
  that it is not ranked, offers no Save Score, and never calls submission.
- **Marker.** While Experimental is On, an experimental marker sits in a corner
  of the title screen beside the start action and in the Hangar opening, and
  run complete states that the run is not ranked. The marker is short, readable
  at a glance, and has an accessible name stating that runs are not ranked.
- **Persistence.** The Experimental setting is kept on this device across
  visits; a fresh device starts Off. The [active ship](../active-ship/spec.md)
  owns how the ship and its fitting are kept.
- **Leaderboard.** Submission accepts only stable ships; an experimental
  chassis is rejected by `HighScoreSubmissionSchema`
  (`packages/mode-a/src/schemas/highscore.ts`).

## Contract

### Definition of Done

- [ ] E1: Every `CHASSIS` and `PARTS` entry has exactly one release class, the
  catalog schema rejects an entry without one, and no consumer keeps its own
  list of stable or experimental items.
- [ ] E2: The Experimental setting is defined by a Zod schema, survives a page
  reload, and reads as Off when the stored value is missing or invalid.
- [ ] E3: With Experimental Off, experimental ships and parts appear in the
  Hangar with the experimental marker and cannot be selected or fitted by
  pointer or keyboard.
- [ ] E4: Turning Experimental Off with experimental content in the active
  setup leaves that content in place, marked and disabled, and makes every
  flight launch unavailable from the title screen and the Hangar.
- [ ] E5: In that state the title screen explains why launch is unavailable and
  offers the Hangar; choosing a stable ship with only stable parts, or
  removing the experimental parts, makes launch available again.
- [ ] E6: With Experimental On, every ship and part is selectable and fittable,
  and experimental items keep their marker.
- [ ] E7: With Experimental On, a Survival run complete shows the score, states
  that the run is not ranked, shows no Save Score, and never calls score
  submission, even when every fitted item is stable.
- [ ] E8: With Experimental On, the experimental marker is visible on the title
  screen beside the start action and in the Hangar opening, with an accessible
  name stating that runs are not ranked; with Off it is absent.
- [ ] E9: Only the Hangar's Experimental control changes the setting; choosing
  ships, fitting parts and flying runs leave it unchanged.
- [ ] E10: `HighScoreSubmissionSchema` rejects every experimental chassis.
- [ ] E11: The class names and marker text are chosen in a design study with a
  live prototype on the title screen, Hangar and run complete.

### Regression guardrails

- The release class in the catalog data is the only source of stable versus
  experimental; screens, launch gates and submission all read it.
- With Experimental Off, no run that starts carries an experimental ship or
  part.
- With Experimental On, no run reaches score submission.
- Turning Experimental Off never deletes, replaces or refits anything the
  player fitted.
- Score feedback is never removed: unranked runs still show their score.
- The setting never changes during a run, and changing it never alters a run
  already in progress or the simulation's replay.
- Practice and Derelicts runs stay unranked whatever the setting.

### Scenarios

```gherkin
Feature: Experimental mode

  Scenario: Stable play is ranked
    Given Experimental is Off
    And the active ship and all its fitted parts are stable
    When I start a Survival run and complete it
    Then I can see my score
    And I can save it to the leaderboard

  Scenario: Experimental content is locked while Off
    Given Experimental is Off
    When I open the Hangar
    Then experimental ships and parts show the experimental marker
    And I cannot select or fit them

  Scenario: Turning Off blocks launch until the setup is stable
    Given Experimental is On
    And the active ship has an experimental part fitted
    When I turn Experimental Off
    Then the part stays fitted, marked and disabled
    And I cannot start a flight from the Hangar
    When I return to the title screen
    Then the start action is unavailable
    And the title screen tells me why and offers the Hangar
    When I remove the experimental part in the Hangar
    Then I can start a flight again

  Scenario: On means unranked, whatever is fitted
    Given Experimental is On
    And the active ship and all its fitted parts are stable
    When I complete a Survival run
    Then I can see my score
    And the run says it is not ranked
    And no Save Score is offered

  Scenario: The marker shows before flight
    Given Experimental is On
    When I view the title screen
    Then the experimental marker is visible beside the start action

  Scenario: A corrupted setting falls back to Off
    Given the stored Experimental setting is not valid
    When I load the game
    Then Experimental is Off

  Scenario: Choices survive a visit
    Given I turned Experimental On, chose the Scout and refitted it
    When I reload the game
    Then Experimental is On
    And the title screen shows the Scout with that fitting
```

### Open decisions

- **Wording:** the class names and the marker text, chosen in the design study
  that E11 names.
