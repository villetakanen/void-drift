# Game

## Blueprint

### Context

Void Drift is a procedural space survival game played in the browser. A pilot flies a two-engine ship around a star, managing hull and power, and tries to survive as long as possible. Keyboard play on a laptop or desktop is the primary experience; iPad landscape touch plays the same game. Everything works without credentials, and shared scores are an optional, casual competition.

### Architecture and boundaries

- `packages/mode-a/src/lib/simulation.ts` owns a fixed 60 Hz simulation. `schemas/flight.ts` validates flight settings and replay inputs. Rendering reads simulation state and writes none.
- The game and the Lab share the simulation, camera, configuration and drawing code.
- The Lab is not part of the game. It holds game-designer tools that reuse game systems where they need them. Game specs describe the game only: they place no rule on the Lab, and nothing in them is changed by what the Lab does. The [Lab spec](../lab/spec.md) owns its own constraints.
- This contract owns the game as a whole: its modes, launch and return, replay, ranking eligibility and the scoring boundary. Child contracts own the parts:
  - **Flight screen:** [game screen](game-screen/spec.md), [render](render/spec.md), [camera](camera/spec.md), [controls](controls/spec.md), [dialogs](dialogs/spec.md)
  - **Modes:** [Survival](survival/spec.md), [Practice](test-flight/spec.md), [Derelicts](derelicts/spec.md)
  - **Launch and ships:** [title screen](landing-page/spec.md), [Hangar](hangar/spec.md), [active ship](active-ship/spec.md), [Playground](experimental/spec.md), [ships](ships/spec.md), [parts](parts/spec.md)
  - **World:** [star](world/star/spec.md), [gravity](world/gravity-field/spec.md), [derelict](world/derelict/spec.md)
  - **Scores and options:** [scores](scores/spec.md), [options](options/spec.md)
  - **Effects:** [FX](../factory/effects/spec.md)

### Rules

- **Modes:** the game has four modes: Survival, Practice, Derelicts and Gauntlet. Survival is the full game and the only scored mode. Each of the others is a mode of its own with its own purpose, stated in its own contract; none is a variant or a setting of another, and they are not merged. Gauntlet is planned and cannot be started yet. Flight settings name a mode: Survival, Practice or Derelicts. A missing mode means Survival, and a legacy `testFlight: true` with no mode means Practice.
- **Launch and return:** a run starts from the title screen or the Hangar, independently of its mode. Abort and game over return to the place it started from.
- **PRESS START:** it launches a Survival run with the [active ship](active-ship/spec.md) in a fresh seeded G-class system. Every other launch flies the active ship too. The Hangar owns ship choice.
- **Ranked runs:** a Survival run under the current `CHALLENGE`, started from the title screen or the Hangar while [Playground](experimental/spec.md) is Off, is scored and ranked. A Survival run while Playground is On is not scored: it shows its time and the scoring-off notice in place of the score. Practice and Derelicts have no score. Every run while Playground is On, and every Practice and Derelicts run, is unranked and cannot submit.
- **Scores:** a ranked run can be saved to the shared board. The [scores contract](scores/spec.md) owns what is saved, the board and its rules.
- **Replay:** identical validated settings and inputs reproduce the same world state, step for step.
- **Offline:** without Firebase the game stays fully playable, and score features explain why they are unavailable.
- **Version labels:** the title screen and the leaderboard show the web package version, which is separate from the challenge identifier.
- **Run complete:** a ranked Survival run shows its score and the time survived; with Playground On it shows the scoring-off notice in place of the score, and the time. The dialog shows one vertical action group. On a ranked run, Save Score is primary when submission is available, and the dialog says why when it is not; unranked runs show no Save Score. Returning to where the run started is secondary, and so is Top Scores after a Survival run. Practice has no run complete.

## Contract

### Definition of Done

- [x] `FlightSettingsSchema` resolves a missing mode to Survival and a
  `testFlight: true` with no mode to Practice, accepts only Survival, Practice
  and Derelicts, and lets an explicit mode take precedence over `testFlight`.
- [x] A run launched from the title screen or the Hangar returns there on Abort
  and on game over, without a page reload.
- [x] PRESS START launches Survival with the active ship, a fresh random seed,
  the arrival entry and a G-class star.
- [x] Practice and Derelicts runs show no Save Score and never call score
  submission.
- [x] A Survival run launched from the Hangar with Playground Off is ranked
  like a title-screen run; with Playground On, no run shows a score or Save
  Score, and a Survival run shows its time and the scoring-off notice.
- [x] Two simulations given the same validated settings and replay inputs end
  with identical ship and world state; invalid replay input is rejected.
- [x] With Firebase unconfigured, title and Hangar runs start, finish and return
  normally, and the leaderboard explains that shared scores are unavailable and
  offers Retry.
- [x] With Firebase unconfigured, run complete explains why Save Score is
  unavailable.
- [x] The title screen and the leaderboard show the version from
  `apps/web/package.json`, independently of `CHALLENGE`.
- [x] A ranked run complete shows one vertical action group: Save Score filled
  and first, then return to the launch source and Top Scores as ghost actions.
- [x] Every run complete offers return to the launch source, and a Survival run
  complete also offers Top Scores.

### Regression guardrails

- Ranking is decided by the client from mode and the Playground setting.
- Launch source is independent of mode, ship and ranking; PRESS START and the
  Hangar launch the same active ship.
- Only Survival has a score; Practice and Derelicts show none, submit nothing
  and never alter Survival scoring.
- Rendering and effects read simulation state without changing it, so replay
  stays deterministic whatever is drawn.
- No score feature blocks starting, playing or finishing a run.

### Scenarios

```gherkin
Scenario: Fixed-step replay
  Given a fitted ship and validated flight settings
  When both engines fire for 120 fixed steps
  Then the ship has moved and its power has decreased
  When a fresh simulation replays the same settings and inputs
  Then its ship and world state equal the first run

Scenario: Legacy practice settings
  Given flight settings with testFlight true and no mode
  When they are validated
  Then the mode is Practice

Scenario: Missing mode
  Given flight settings with neither mode nor testFlight
  When they are validated
  Then the mode is Survival

Scenario: PRESS START
  Given Playground is Off
  And the player chose a ship in the Hangar and returned to the title screen
  When the player activates PRESS START
  Then a Survival run starts with that ship in its Hangar fitting
  And the star is G-class and the seed is fresh
  And the run is ranked

Scenario Outline: Return to the launch source
  Given a run launched from <source>
  When the player uses <action>
  Then the player returns to <source>

  Examples:
    | source       | action           |
    | title screen | pause Abort      |
    | Hangar       | pause Abort      |
    | title screen | game-over Return |
    | Hangar       | game-over Return |

Scenario: Experimental run is unscored
  Given Playground is On
  And a Survival run launched from the Hangar
  When the run ends
  Then run complete shows the time and the scoring-off notice
  And it shows no score and no Save Score
  And no score is submitted

Scenario: Firebase absent
  Given Firebase is not configured
  When the player starts and finishes a run
  Then the run plays and returns normally
  When the player opens Top Scores
  Then it explains that shared scores are unavailable
```
