# Playground

## Blueprint

### Context

Playground lets the player play around with ships and parts outside the rules
for the core scored game. A ship or part is sanctioned for ranked play or it is unsanctioned. That is
a boundary of the rules, not a stage of development. An unsanctioned
ship or part can be complete and intentionally available for play, and may
remain outside those rules indefinitely. No eventual promotion is promised.

In the current game, Playground makes every catalog ship and compatible part
available. It keeps the selected flight mode and its simulation rules.

The player makes one choice: Playground **Off** or **On**.

- **Off:** only sanctioned ships and parts can be flown, and every Survival run
  that starts is scored and ranked.
- **On:** every ship and part can be flown, and no run is scored. The run shows
  its time, and a scoring-off notice where the score would be.

Playground is not a game mode of its own: it is the same Survival, Practice
and Derelicts. What is fitted never changes scoring on its own: with
Playground On, a ship carrying only sanctioned parts still flies an unscored run.

### Architecture and boundaries

- **Sanctioned and unsanctioned.** Every chassis in `CHASSIS` and every part in
  `PARTS` (`packages/mode-a/src/lib/schemas/loadout.ts`) is either sanctioned
  for ranked play or unsanctioned. The words describe the rules of ranked play
  and no development lifecycle. The catalog holds this as `releaseClass`, where
  `scored` is sanctioned and `preview` is unsanctioned; its Zod schema validates
  it, and it is the only source the game reads. Changing it for an item is a
  data change, not a spec change. Stabilizers are a ship option and follow
  their ship. Sanctioned says nothing about whether a player has a part:
  availability to the player is a separate matter this contract does not
  define.
- **Setting.** `ExperimentalSettingSchema` in
  `packages/mode-a/src/lib/schemas/settings.ts` defines the per-device setting.
  `apps/web/src/lib/stores/ship-setup.ts` owns it alongside the active ship,
  stores it at `void-drift:experimental`, parses it on load, and reads a missing
  or invalid value as Off.
- **Control.** The Playground control lives in the [Hangar](../hangar/spec.md)
  opening. Nothing else changes the setting, and it cannot change during a run.
- **Eligibility.** The [game contract](../spec.md) owns which runs are ranked;
  this contract supplies the Playground condition it reads. Firestore rules
  bound submitted data and cannot see the setting; the leaderboard stays casual
  and client-reported.
- **Wording.** The setting is named **Playground** and uses the shared binary
  Switch. “Scoring off” communicates the enabled run's consequence without a
  confirmation dialog. The two classes are named sanctioned and unsanctioned
  ([terms](../spec.md#terms)), and an unsanctioned part's marker reads
  “UNSANCTIONED”. How the marker looks is open.

### Rules

- **Off, catalog.** Unsanctioned ships and parts remain visible in the Hangar
  and cannot be selected or fitted. Ship tabs use the shared unavailable state
  without a catalog badge; parts retain their catalog marker.
- **Off, existing build.** Turning Playground Off removes nothing. An active
  ship that is unsanctioned, or a fitted part that is unsanctioned, stays in the
  build. Its ship tab stays selected and unavailable; fitted parts retain their
  catalog marker and disabled state.
- **Off, launch.** While the active ship contains an unsanctioned ship or
  part, every flight launch is unavailable, from the title screen and from the
  Hangar. The title screen says why and leads to the Hangar. Launch becomes
  available as soon as the player picks a sanctioned ship whose fitted parts
  are all sanctioned, or removes the unsanctioned parts.
- **On, catalog.** Every ship and part is selectable and fittable. Ship tabs
  use the ordinary available state without a catalog badge; unsanctioned parts
  retain their marker.
- **On, runs.** No run is scored. In a Survival run the flight screen shows the
  time and, where the running score would be, the scoring-off notice. Run
  complete shows the time survived and the same notice in place of the score,
  offers no Save Score, and never calls submission.
- **Run status.** The title screen uses the red status slot below the menu
  panel, above the decorative ship. With Playground On it reads “PLAYGROUND
  ACTIVE” and “UNRANKED PLAY” on separate lines. With Playground Off and an
  unsanctioned active build, it reads “UNSANCTIONED BUILD” and “PLAYGROUND
  REQUIRED” on separate lines. The blocked warning does not replace the title
  hints; their normal rotation behavior continues. These indications are absent
  with Off and a sanctioned build. In the Hangar, the status appears beside the launch actions without
  changing the header. Individual catalog-item markers are a separate concern.
- **Persistence.** The Playground setting is kept on this device across
  visits; a fresh device starts Off. The [active ship](../active-ship/spec.md)
  owns how the ship and its fitting are kept.
- **Leaderboard.** The setting alone keeps unsanctioned content off the board:
  with it Off only sanctioned ships and parts fly, and with it On nothing is
  submitted. The [scores contract](../scores/spec.md) accepts any ship and
  keeps no list of sanctioned ones.

## Contract

### Definition of Done

- E1: Every `CHASSIS` and `PARTS` entry is either sanctioned or unsanctioned, the
  catalog schema rejects an entry without one, and no consumer keeps its own
  list of sanctioned or unsanctioned items.
- E2: The Playground setting is defined by a Zod schema, survives a page
  reload, and reads as Off when the stored value is missing or invalid.
- E3: With Playground Off, unsanctioned ships and parts appear in the
  Hangar with unavailable ship tabs and marked parts, and cannot be selected or fitted by
  pointer or keyboard.
- E4: Turning Playground Off with unsanctioned content in the active
  build leaves that content in place, marked and disabled, and makes every
  flight launch unavailable from the title screen and the Hangar.
- E5: In that state the title screen explains why launch is unavailable and
  offers the Hangar; choosing a sanctioned ship with only sanctioned parts, or
  removing the unsanctioned parts, makes launch available again.
- E6: With Playground On, every ship and part is selectable and fittable,
  with ordinary ship tabs and marked unsanctioned parts.
- E7: With Playground On, a Survival run shows the time and the
  scoring-off notice in place of the score, in flight and on run complete,
  shows no Save Score, and never calls score submission, even when every fitted
  item is sanctioned.
- E8: Before starting a new game, the title status slot shows “PLAYGROUND
  ACTIVE” and “UNRANKED PLAY” when Playground is On, or “UNSANCTIONED BUILD”
  and “PLAYGROUND REQUIRED” when Playground is Off and the active build is
  unsanctioned. It is separate from the PRESS START control group. The blocked
  warning does not replace or interrupt the title hints' normal rotation. In
  the Hangar, the status appears beside the launch actions without changing
  the header.
- E9: Only the Hangar's Playground control changes the setting; choosing
  ships, fitting parts and flying runs leave it unchanged.
- E10: No saved score carries an unsanctioned ship or part, and neither
  the score schema nor `firestore.rules` keeps a list of sanctioned ships.
- E11: Item-marker presentation is settled on a live
  prototype. Playground is the setting name, and title run status distinguishes
  Playground play from ranked play.

### Regression guardrails

- The catalog data is the only source of sanctioned versus
  unsanctioned; screens, launch gates and submission all read it.
- With Playground Off, no run that starts carries an unsanctioned ship or
  part.
- With Playground On, no run shows a score or reaches score submission.
- Turning Playground Off never deletes, replaces or refits anything the
  player fitted.
- Every Survival run shows its time, whatever the setting.
- The setting never changes during a run, and changing it never alters a run
  already in progress or the simulation's replay.
- Practice and Derelicts runs stay unranked whatever the setting.

### Scenarios

```gherkin
Feature: Playground

  Scenario: Sanctioned play is ranked
    Given Playground is Off
    And the active ship and all its fitted parts are sanctioned
    When I start a Survival run and complete it
    Then I can see my score
    And I can save it to the leaderboard

  Scenario: Unsanctioned content is locked while Off
    Given Playground is Off
    When I open the Hangar
    Then unsanctioned ship tabs are unavailable and unsanctioned parts show the catalog marker
    And I cannot select or fit them

  Scenario: Turning Off blocks launch until the build is sanctioned
    Given Playground is On
    And the active ship has an unsanctioned part fitted
    When I turn Playground Off
    Then the part stays fitted, marked and disabled
    And I cannot start a flight from the Hangar
    When I return to the title screen
    Then the start action is unavailable
    And the title screen tells me why and offers the Hangar
    When I remove the unsanctioned part in the Hangar
    Then I can start a flight again

  Scenario: On means unscored, whatever is fitted
    Given Playground is On
    And the active ship and all its fitted parts are sanctioned
    When I fly a Survival run
    Then the flight screen shows my time and the scoring-off notice, and no score
    When the run ends
    Then run complete shows my time and the scoring-off notice, and no score
    And no Save Score is offered

  Scenario: Playground status is visible before flight
    Given Playground is On
    When I view the title screen
    Then I can readily recognize that Playground is active and the run will be unranked
    And the status is separate from the Start control group

  Scenario: A blocked build warning leaves title hints rotating
    Given Playground is Off
    And the active build includes an unsanctioned ship or part
    And reduced motion is not requested
    And the viewport supports rotating title hints
    When I view the title screen
    Then the red status reads “UNSANCTIONED BUILD” and “PLAYGROUND REQUIRED”
    And PRESS START is unavailable
    And the rotating title hints continue to change

  Scenario: A corrupted setting falls back to Off
    Given the stored Playground setting is not valid
    When I load the game
    Then Playground is Off

  Scenario: Choices survive a visit
    Given I turned Playground On, chose another ship and refitted it
    When I reload the game
    Then Playground is On
    And the title screen shows that ship with that fitting
```

### Open decisions

- **Marker:** how an unsanctioned part is marked in the Hangar, explored in
  the [part-rows study](../../../../apps/web/src/pages/lab/studies/part-rows-2026-11-11.astro).
