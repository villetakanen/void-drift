---
generated:
  by: "openai-codex/gpt-6.2"
  at: "2026-11-23T08:40:39+02:00"
verified:
  - by: "human:ville-takanen"
    at: "2026-11-22"
---

# Game over

## Blueprint

### Context

The game-over screen presents the results and statistics of a completed run. An eligible ranked Survival result can also be submitted to Top Scores. From here, the player can retry with the same setup and a new random seed, or return to the title menu or Hangar according to where the run began.

### Architecture

The screen accepts a completed run's outcome and statistics from its caller; it does not determine which results a game mode supplies. It provides a slot for an optional result-related action. The [ranked result action](ranked-result/spec.md) supplies the ranked Survival score interface and handles its personal-best check and submission through the [Scores contract](../scores/spec.md). The screen does not own score validation or Firestore access.

`FlightDeck.svelte` also supplies Retry and the launch-source action. It retains the mode, full validated loadout, Playground setting and launch source captured for the completed run. The [game contract](../spec.md) and [landing page](../landing-page/spec.md) govern launch and return.

### Constraints

- The screen presents supplied results without branching on game mode.
- The optional action slot is independent of Retry and the launch-source action. Top Scores opens from Run complete only after a successful save.
- Retry starts a fresh run with the captured setup and a random seed distinct from the completed run's. It uses the mode's normal arrival, countdown, pause and focus-loss rules, with fresh resources, time, score and input state. It does not replay a held key or touch from the previous run. New presses during the countdown work as on a normal launch.
- Invert controls, Speed camera and Combat HUD follow the current [Options](../options/spec.md); they are not captured.
- The launch-source action is labeled `Return` for a title launch and `Hangar` for a Hangar launch. It and Pause → Abort go to the original launch source, including after Retry.
- A pending score save does not block Retry. Its submission may finish, but its completion only affects the UI while that result is current.

## Contract

### Definition of Done

- The player can read the supplied outcome and statistics and choose Retry or the launch-source action.
- An eligible ranked result can provide a save-score interface without the screen owning its behaviour.

### Regression guardrails

- The game-over dialog retains keyboard focus behaviour as specified by the [game screen](../game-screen/spec.md). Retry hands focus to flight rather than restoring a control from the completed run.
- The [ranked result action](ranked-result/spec.md) governs its check, entry and submission; the [Scores contract](../scores/spec.md) governs score persistence.

### Scenarios

```gherkin
Scenario: Present a completed run
  Given a completed run supplies an outcome and statistics
  When the game-over screen opens
  Then it presents the supplied outcome and statistics

Scenario: Present an optional result action
  Given the caller supplies a result-related action
  When the game-over screen opens
  Then the action is available alongside Retry and the launch-source action

Scenario: No result action is supplied
  Given the caller supplies no result-related action
  When the game-over screen opens
  Then Retry and the launch-source action remain available

Scenario: No standalone Top Scores action
  Given any completed run
  When the game-over screen opens
  Then it offers no Top Scores button or link

Scenario: Retry a run
  Given a run has ended
  When the player chooses Retry
  Then a fresh run starts in the same mode, with the full loadout and Playground setting that were flown
  And its random seed differs from the completed run's
  And it follows the mode's normal arrival and pause rules with fresh resources, score and time
  And flight receives focus and needs new key or pad presses

Scenario: Options stay live on Retry
  Given Options have changed since the run was launched
  When the player chooses Retry
  Then Invert controls, Speed camera and Combat HUD use the current preferences

Scenario: Retry while saving a score
  Given a score save is pending on the result
  When the player chooses Retry and the save completes
  Then it neither changes the new run or its result nor redirects the player

Scenario: Stay on the result while saving a score
  Given the player saves a score and stays on that result
  When the save completes
  Then a successful write opens Top Scores and failure reports the error on that result

Scenario Outline: Return to the original source after Retry
  Given a run was launched from <source> and the player chose Retry
  When the player uses <action> on the retried run
  Then the player returns to <source>

  Examples:
    | source       | action           |
    | title screen | Pause Abort      |
    | Hangar       | Pause Abort      |
    | title screen | game-over Return |
    | Hangar       | game-over Hangar |
```
