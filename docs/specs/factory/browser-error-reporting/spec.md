---
generated:
  by: "openai-codex/gpt-6.2-sol"
  at: "2026-11-25T13:29:36Z"
verified: []
---

# Browser error reporting

## Blueprint

### Context

Developers use Sentry to diagnose failures in deployed Void Drift clients that
are hard to reproduce locally.

### Architecture

- [Astro build configuration](../../../../apps/web/astro.config.mjs) enables a
  single browser SDK on explicitly configured builds and stamps hidden source
  maps with matching debug IDs. [Release preparation](../../../development.md)
  uploads the maps privately and removes them from the hosting artifact.
- [The browser SDK configuration](../../../../apps/web/sentry.client.config.ts)
  sends uncaught exceptions, unhandled rejections and unexpected errors caught
  by the shared-score client. The SDK attaches the build's version, release and
  environment and, when available, browser family and major version, OS family,
  and source frames from the build's JavaScript assets.
- [The flight reporting code](../../../../apps/web/src/lib/flight-reporting.ts)
  uses the existing flight mode, ship and ranked challenge identifiers. Each
  error can carry up to twelve recent flight breadcrumbs covering launch,
  pause, resume, completion, score submission attempt, retry and departure.

### Constraints

- Reporting is opt-in per deployed build and runs only in the browser.
- The opt-in covers error events only. Event fields and breadcrumbs come from
  explicit allowlists. Exception text uses fixed descriptions and known error
  codes. Published asset URLs contain their origin and path only.
- The client keeps player initials and names, Firebase UIDs, request and DOM
  content, raw URLs and game state out of error reports.
- Caught shared-score errors preserve the existing player-facing result.
  Local unavailability, offline conditions, SDK service unavailability and
  ordinary timeouts are expected shared-score results.

## Contract

### Definition of Done

- An opted-in build reports a known browser error under its own version,
  release and environment with the matching private source map.
- The event contains only the allowed diagnostic data, and normal play proceeds
  when reporting is disabled or its transport fails.

### Regression guardrails

- Development, ordinary builds and test runs without deployment configuration
  leave reporting off.
- A reporting call runs on flight lifecycle events. Rendering and simulation
  steps carry no reporting work.
- Score reads and writes retain their existing failed, unconfirmed, unavailable
  and successful outcomes. See [Scores](../../game/scores/spec.md).

### Scenarios

```gherkin
Scenario: A deployed build reports a browser error
  Given an explicitly configured deployed build with its private maps uploaded
  When the browser throws an uncaught exception or rejects a promise without a handler
  Then Sentry receives an error under that version, release and environment
  And bundled stack frames resolve through that build's debug IDs

Scenario: A local session runs with reporting disabled
  Given a development or ordinary test session
  When a browser error occurs
  Then the browser sends no Sentry envelope

Scenario: An error includes flight context and safe breadcrumbs
  Given a player launches, pauses, resumes and completes a flight
  When a browser error occurs on the run result
  Then the error includes the mode, ship and ranked challenge
  And it includes at most twelve allowed flight breadcrumbs
  And it excludes player input, identity, Firebase identifiers and game state

Scenario: The score client catches a permission failure
  Given a reporting-enabled client with shared scores configured
  When a score write fails with a permission error
  Then the score client returns its normal failed outcome
  And Sentry receives the operation and known error code

Scenario: The score client encounters an ordinary connectivity problem
  Given a reporting-enabled client
  When an unavailable or offline score operation fails or times out
  Then the score client keeps its normal outcome without submitting an error event

Scenario: The reporting service cannot receive events
  Given a reporting-enabled client whose Sentry request fails
  When the client tries to report an error
  Then gameplay and the existing score outcomes are unaffected by the reporting failure
```
