---
generated:
  by: "openai/gpt-6.1-terra"
  at: "2026-11-24T11:16:56+02:00"
verified:
  - by: "human:ville-takanen"
    at: "2026-11-24"

---

# Lab

## Blueprint

### Context

The Lab is a place to inspect, exercise, configure and author Void Drift's game
systems during development. It provides tools for working with the game outside
normal play.

The Lab hosts game features; those features remain owned by the game.
[Studies](../studies/spec.md) and the
[Design system](../factory/design-system/spec.md) are separate development spaces.

### Architecture

Lab tools live under `apps/web/src/pages/lab/` and compose shared game systems
directly. A tool can run a game simulation without the player-facing game shell.

The game owns the behaviour of the systems a tool hosts. The Lab owns the tool's
workflow, interface and local state. Shared interface components come from the
[Design system](../factory/design-system/spec.md).

### Constraints

- Lab interaction serves game development, including testing, inspection,
  configuration exploration and authoring. Encounters
  and simulated flights remain tools, separate from player-facing game modes.
- Scores and measurements in tools remain local; leaderboard submission belongs
  to play.
- The Lab targets viewports at least 1280 CSS pixels wide.

## Contract

### Definition of Done

- Production examples use the shared implementation of the behaviour they show.
- Experimental conditions and substitutions are identified with their example.
- Each developer tool owns its workflow, controls, outputs and local state in
  its tool contract.
- Shared changes are governed by their feature contracts and checked in affected
  production and Lab consumers.

### Regression guardrails

- Lab pages compose shared systems directly. The import check in
  `scripts/check-contracts.mjs` guards the boundary with player-facing shells
  and score submission.
- Local experiment settings remain local to their configured instance.
- Game features retain their game owners when hosted by a Lab tool.
- Shared routes, navigation and components preserve the three tools’ peer ownership.

### Scenarios

```gherkin
Scenario: Inspect production behaviour
  Given a Lab tool presenting a production scene
  When its inputs match play
  Then the shared implementation determines the behaviour it presents
  And its tool controls and measurements follow the tool's contract

Scenario: Isolate a design question
  Given an experiment with declared conditions and a substituted part
  When the designer changes an experimental value
  Then that instance shows the experimental result using the surrounding shared machinery
  And other instances and production defaults retain their settings

Scenario: Improve a shared part
  Given a change governed by a shared component's contract
  When that component changes
  Then play and Lab consumers receive the same shared change
  And verification covers the affected consumers

Scenario: Navigate between development tools
  Given Lab, Studies and Design system share navigation under /lab routes
  When a reader opens Studies or Design system
  Then the destination follows its own contract
  And its route does not make it a Lab-owned feature

Scenario: Navigate Lab tools
  Given a Lab page at a viewport of at least 1280px
  When I inspect the navigation beneath the full-width header
  Then the shared Tray shows Index, the Lab's registry groups in order, and Back to Game
  And only the deepest listed destination covering the current path is marked current, with Index current only at /lab
  And the tray scrolls independently of the main stage

Scenario: Change a hosted game feature
  Given a Lab inspector hosts a game effect
  When the effect's production appearance needs to change
  Then its game-owned contract and shared implementation govern the change
  And the Lab owns the developer tool and its workflow

Scenario: Explore configuration or run a test
  Given a Lab tool for configuring or testing a game system
  When a developer explores settings or runs a test case
  Then the tool contract governs the workflow and reported results
  And the game system retains ownership of configuration meaning and behaviour

Scenario: Exercise an encounter in a tool
  Given a Lab encounter using the production simulation
  When it completes and displays measurements
  Then the results remain in the tool
  And it submits no leaderboard score
```
