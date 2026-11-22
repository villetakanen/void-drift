---
generated:
  by: "openai/gpt-6.1-terra"
  at: "2026-11-22T17:33:32+02:00"
verified:
  - by: "human:ville-takanen"
    at: "2026-11-22"
---

# Game over

## Blueprint

### Context

The game-over screen presents the results and statistics of a completed run. In ranked modes, it also provides a place to save a new personal best. From here, the player can retry with the same setup and a new random seed, or return to the title menu or Hangar according to where the run began.

### Architecture

The screen accepts a completed run's outcome and statistics from its caller; it does not determine which results a game mode supplies. It provides a slot for an optional result-related action. Ranked score saving supplies its own interface there, including its inputs and buttons, and owns submission and persistence through the [Scores contract](../scores/spec.md). The screen does not own score validation or Firestore access.

The caller supplies the retry and return actions. The [game contract](../spec.md) and [landing page](../landing-page/spec.md) govern launch and return. `apps/web/src/components/FlightDeck.svelte` currently presents the dialog; the boundaries and retry behaviour described here are intended changes, not a claim that the current implementation already provides them.

### Constraints

- The screen presents supplied results without branching on game mode.
- The optional action slot is independent of Retry and Return.
- Retry starts a fresh run with the same setup and a new random seed.
- Return goes to the run's launch source, rather than offering multiple return destinations.

## Contract

### Definition of Done

- The player can read the supplied outcome and statistics and choose Retry or Return.
- An eligible ranked result can provide a save-score interface without the screen owning its behaviour.

### Regression guardrails

- The game-over dialog retains keyboard focus behaviour as specified by the [game screen](../game-screen/spec.md).
- Score validation, availability and persistence follow the [Scores contract](../scores/spec.md).

### Scenarios

```gherkin
Scenario: Present a completed run
  Given a completed run supplies an outcome and statistics
  When the game-over screen opens
  Then it presents the supplied outcome and statistics

Scenario: Present an optional result action
  Given the caller supplies a result-related action
  When the game-over screen opens
  Then the action is available alongside Retry and Return

Scenario: No result action is supplied
  Given the caller supplies no result-related action
  When the game-over screen opens
  Then Retry and Return remain available

Scenario: Retry a run
  Given a run has ended
  When the player chooses Retry
  Then a fresh run starts with the same setup and a new random seed

Scenario: Return from game over
  Given a run was launched from the title screen or Hangar
  When the player chooses Return
  Then the player returns to that launch source
```
