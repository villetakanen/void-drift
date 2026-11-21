---
title: "Spec: Practice"
status: draft
generated:
  by: "openai/gpt-6.1-sol"
  at: "2026-11-20T06:37:04+02:00"
verified:
  - by: "openai/gpt-6.1-sol"
    at: "2026-11-20T06:33:14+02:00"
  - by: "openai/gpt-6.1-sol"
    at: "2026-11-20T06:37:04+02:00"
  - by: "human:ville-takanen"
    at: "2026-11-20T06:37:49+02:00"
---

# Practice

## Blueprint

### Context

Practice lets the player try the active ship and its fitting in a repeatable
system, feel its handling and return knowing what to keep or change. It is a
mode of its own, alongside those named in the [game spec](../spec.md).
The ship keeps real handling and physical contact, but full hull and energy
let the player fly until they choose to leave.

### Architecture

- [FlightSettingsSchema](../../../../packages/mode-a/src/lib/schemas/flight.ts)
  names the mode and reads legacy `testFlight: true` as Practice when no mode
  is supplied. [Simulation](../../../../packages/mode-a/src/lib/simulation.ts)
  owns its fixed system and flight rules.
- [tuning.json](../../../../packages/mode-a/src/lib/tuning.json) owns numeric
  configuration: `practice` holds fixed star radius, orbital phase seed,
  planet radii, orbits, travel speeds and Venus/Cradle surface parameters;
  `gravity` holds masses and family profiles; `atmosphere` holds air settings.
  [PracticeSystemSchema](../../../../packages/mode-a/src/lib/schemas/practice-system.ts)
  validates the fixed-system section before consumers read it through
  [tuning.ts](../../../../packages/mode-a/src/lib/tuning.ts).
- The fixed roster is the Sun, Mercury, Venus and The Cradle. Shared family
  physics and materials belong to [planets](../world/planets/spec.md) and
  [star](../world/star/spec.md), rather than being duplicated here.
- [FlightDeck.svelte](../../../../apps/web/src/components/FlightDeck.svelte)
  provides flight and return to the launch source. Mode-independent pause
  behaviour belongs to the [game-screen](../game-screen/spec.md) and
  [dialogs](../dialogs/spec.md) specs.
  [Hangar](../hangar/spec.md) owns fitting and its launch action;
  [active ship](../active-ship/spec.md) owns what is flown;
  [ships](../ships/spec.md) owns handling and energy.

### Constraints

- Entry flies the active ship in its fitting, with its real mass, thrust and
  handling. Launch source is independent of mode; Abort returns to that source.
- Every entry starts immediately in the same fixed system and conditions,
  independently of the supplied run seed. The Sun has the G7 reference profile
  and World HUD identity `G7 Sun`. Planet phase uses the configured fixed seed.
- The [distant flight sky](../render/flight-sky/spec.md) supplies the same Sol
  Milky Way for every fitting. The stage shows void while it loads without
  delaying flight. Camera travel moves the image across the whole stage;
  world zoom preserves its apparent size.
- Controls, movement, gravity, star and planet contact, and The Cradle's air
  retain normal flight behaviour. Contact preserves physical motion rather
  than teleporting the ship. Air slows the ship and shows the normal heat cue.
- Energy stays at capacity and permits sustained engine and system use.
  Hull stays full through every contact and exposure.
- The player alone ends a session. Practice has no failure or game over,
  derelicts or other encounters, score, result or submission.
- Session state is discarded on exit; the ship and its saved fitting remain
  unchanged. A later entry starts fresh rather than resuming the session.
- Practice uses shared flight pause behaviour. The session offers no reset action.

## Contract

### Definition of Done

- Practice launches the active ship with its fitted handling in a repeatable system.
- Fixed-system configuration is validated from the named code-owned file;
  tuning values have one configuration home rather than copies in this spec.
- Sustained engine and system use leaves energy full and available.
- Star and planet contact preserves normal motion, full hull and the session.
- The Cradle's air slows the ship and shows heat while hull stays full.
- Aborting Practice returns to the launch source with the ship and fitting unchanged.
- Practice shows no score or result, submits nothing and persists no session.

### Regression guardrails

- Practice remains a distinct mode with a fixed system.
- The same build retains the handling it has in other modes.
- Only the player can end the session; Practice never reaches a leaderboard.
- Returning from Practice preserves the active ship and its fitting.

### Scenarios

```gherkin
Scenario: Try a fitting without resource limits
  Given I changed the active ship's fitting in the Hangar
  When I start Practice and sustain engines and systems
  Then I fly that build with its real handling
  And hull and energy stay full and systems remain available

Scenario: Repeat the fixed system
  Given I aborted a Practice session
  When I enter Practice again with a different run seed
  Then the system and starting conditions match the previous entry
  And the same camera pose reveals the same Sol bank and dust lanes
  And flight starts immediately even while the sky loads

Scenario: Contact cannot end Practice
  Given a Practice session
  When I contact the star or a planet
  Then normal contact motion applies without teleporting my ship
  And hull and energy stay full and the session continues

Scenario: Skim The Cradle's air
  Given a Practice session
  When I fly through The Cradle's air
  Then my ship slows and shows the heat cue
  And my hull stays full

Scenario Outline: Leave Practice
  Given a Practice session launched from <source>
  When I abort through the shared pause dialog
  Then I return to <source> with my ship and fitting unchanged
  And the session is discarded

  Examples:
    | source       |
    | title screen |
    | Hangar       |

Scenario: Unscored flight without encounters
  Given a Practice session
  When I keep flying and then abort
  Then no derelicts or other encounters appear
  And no score, result or submission is offered
  And no session state is saved or carried into the next entry
```
