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
  - **Launch and ships:** [title screen](landing-page/spec.md), [Hangar](hangar/spec.md), [active ship](active-ship/spec.md), [Experimental mode](experimental/spec.md), [ships](ships/spec.md), [parts](parts/spec.md)
  - **World:** [star](world/star/spec.md), [gravity](world/gravity-field/spec.md), [derelict](world/derelict/spec.md)
  - **Options:** [options](options/spec.md)
  - **Effects:** [FX](../factory/effects/spec.md)

### Rules

- **Modes:** the game has four modes: Survival, Practice, Derelicts and Gauntlet. Survival is the full game and the only scored mode. Each of the others is a mode of its own with its own purpose, stated in its own contract; none is a variant or a setting of another, and they are not merged. Gauntlet is planned and cannot be started yet. Flight settings name a mode: Survival, Practice or Derelicts. A missing mode means Survival, and a legacy `testFlight: true` with no mode means Practice.
- **Launch and return:** a run starts from the title screen or the Hangar, independently of its mode. Abort and game over return to the place it started from.
- **PRESS START:** it launches a Survival run with the [active ship](active-ship/spec.md) in a fresh seeded G-class system. Every other launch flies the active ship too. The Hangar owns ship choice.
- **Ranked runs:** a Survival run under the current `CHALLENGE`, started from the title screen or the Hangar while [Experimental mode](experimental/spec.md) is Off, is scored and ranked. A Survival run while Experimental is On is not scored: it shows its time and the experimental notice in place of the score. Practice and Derelicts have no score. Every run while Experimental is On, and every Practice and Derelicts run, is unranked and cannot submit.
- **Scores:** a score is a casual, client-reported [Survival score](survival/spec.md) with the run's whole seconds, labelled as such. Firestore rules check ownership, shape, challenge and bounds, but cannot prove an honest run.
  - A saved score carries the player's three-letter initials, the ship and the cause of the run's end, as `HighScoreSubmissionSchema` in `packages/mode-a/src/schemas/highscore.ts` validates them. Players are anonymous: no sign-up is asked.
  - A row carries `score` (integer, at least the seconds and at most `MAX_SCORE`, 100000) and `seconds` (integer, 1–3600). `MAX_SCORE` bounds 3600 s, 720 derelict groups (first at 3 s, then at least 5 s apart) of at most 91 scoring hits each (43 on the wreck and 6 on each of eight pieces at the weakest 2-point band) and one 20-point cell each: 83 520, rounded up.
  - Each anonymous player keeps one best per ship; a run whose score is not higher keeps the existing best.
  - Top Scores lists the 30 highest scores, sorted by score; a control re-sorts the same rows by time in the client.
- **Replay:** identical validated settings and inputs reproduce the same world state, step for step.
- **Offline:** without Firebase the game stays fully playable, and score features explain why they are unavailable.
- **Version labels:** the title screen and the leaderboard show the web package version, which is separate from the challenge identifier.
- **Run complete:** a ranked Survival run shows its score and the time survived; with Experimental On it shows the experimental notice in place of the score, and the time. The dialog shows one vertical action group. On a ranked run, Save Score is primary when submission is available, and the dialog says why when it is not; unranked runs show no Save Score. Returning to where the run started is secondary, and so is Top Scores after a Survival run. Practice has no run complete.

## Contract

### Definition of Done

- [x] `FlightSettingsSchema` resolves a missing mode to Survival and a
  `testFlight: true` with no mode to Practice, accepts only Survival, Practice
  and Derelicts, and lets an explicit mode take precedence over `testFlight`.
- [x] A run launched from the title screen or the Hangar returns there on Abort
  and on game over, without a page reload.
- [ ] PRESS START launches Survival with the active ship, a fresh random seed,
  the arrival entry and a G-class star.
- [x] Practice, Derelicts and Fiddler runs show no Save Score and never call
  score submission; the submission schema rejects Fiddler.
- [ ] A Survival run launched from the Hangar with Experimental Off is ranked
  like a title-screen run; with Experimental On, no run shows a score or Save
  Score, and a Survival run shows its time and the experimental notice.
- [x] Firestore rules reject unauthenticated, other-owner, malformed,
  mismatched-document, wrong-challenge, out-of-bounds, decreasing-score,
  extra-field and deletion writes, and reject unbounded or unauthenticated
  list queries.
- [x] Submission writes `artifacts/void-drift/scores/{CHALLENGE}_{uid}_{shipId}`;
  an equal or lower score leaves the stored best unchanged.
- [x] Firestore rules require `score`, reject a missing, non-integer, below-seconds or
  above-`MAX_SCORE` value, and accept an update only when `score` grows.
- [x] Top Scores queries the current `CHALLENGE` ordered by score, limited to 30
  rows, shows score and time, and labels them as casual and client-reported.
- [x] A By score and By time control re-sorts the loaded rows in the client, score
  being the default.
- [x] Two anonymous players can each save a run and see both on the shared
  board.
- [x] Two simulations given the same validated settings and replay inputs end
  with identical ship and world state; invalid replay input is rejected.
- [x] With Firebase unconfigured, title and Hangar runs start, finish and return
  normally, and the leaderboard explains that shared scores are unavailable and
  offers Retry.
- [ ] With Firebase unconfigured, run complete explains why Save Score is
  unavailable.
- [x] The title screen and the leaderboard show the version from
  `apps/web/package.json`, independently of `CHALLENGE`.
- [x] A ranked run complete shows one vertical action group: Save Score filled
  and first, then return to the launch source and Top Scores as ghost actions.
- [x] Every run complete offers return to the launch source, and a Survival run
  complete also offers Top Scores.

### Regression guardrails

- Ranking is decided by the client from mode and the Experimental setting; Firestore rules
  bound the data but are never treated as proof of an honest run.
- A new `CHALLENGE` value has a matching document-id rule in `firestore.rules`
  and starts a separate board; Top Scores lists only the current challenge.
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
  Given Experimental is Off
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
  Given Experimental is On
  And a Survival run launched from the Hangar
  When the run ends
  Then run complete shows the time and the experimental notice
  And it shows no score and no Save Score
  And no score is submitted

Scenario: Equal run keeps the best
  Given a player holds a best score of 42 with Wasp
  When the player saves another Wasp run scoring 42
  Then the stored best stays unchanged

Scenario Outline: Rules reject an invalid write
  Given an anonymous player session
  When the player writes a score that is <invalid>
  Then Firestore rejects the write

  Examples:
    | invalid                                    |
    | sent without authentication                |
    | owned by another player                    |
    | missing a field or of the wrong type       |
    | stored under a mismatched document id      |
    | for an unknown challenge                   |
    | outside the time, score or initials bounds |
    | lower than the stored best score           |
    | carrying an extra field                    |
    | a deletion                                 |

Scenario: Separate anonymous players compete
  Given valid Firebase configuration
  When two anonymous players each save a ranked run
  Then Top Scores shows both scores and times on one board

Scenario: Firebase absent
  Given Firebase is not configured
  When the player starts and finishes a run
  Then the run plays and returns normally
  When the player opens Top Scores
  Then it explains that shared scores are unavailable
```
