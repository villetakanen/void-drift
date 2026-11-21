---

title: "Spec: Lab"
status: draft
generated:
  by: "codex/gpt-6"
  at: "2026-11-21T18:27:12+00:00"
verified:
- { by: "codex/gpt-6", at: "2026-11-19T16:50:31+02:00" }
- { by: "codex/gpt-6", at: "2026-11-19T16:49:19+02:00" }

---

# Lab

## Blueprint

### Context

The Lab owns game developer tools for Void Drift. These include inspection,
testing, configuration explorers, authoring utilities and other tooling needed
to develop the game. These are examples, not a closed set of tool categories.
The Lab can host game things; hosting them does not transfer their ownership.

The three development tools are peers: Lab at `/lab`,
[Studies](../studies/spec.md) at `/lab/studies`, and the
[Design system](../factory/design-system/spec.md) at `/lab/ds`. URL nesting is a
routing convention. Studies and the Design system are independent of the Lab.

### Architecture

Lab tools live under `apps/web/src/pages/lab/`. The shared
[page registry](../../../apps/web/src/data/lab-pages.ts) and navigation can
connect all three development tools without establishing ownership between them.

LabLayout uses the shared [page header](../factory/design-system/page-header/spec.md)
in its content column to the right of the navigation tray. The tray, its logo
and the inspector retain their arrangement.

Game contracts and implementations own the simulation, ships, worlds, effects,
camera transforms and rendering that the Lab hosts. The Design system owns
shared visual and interaction definitions. A Lab tool consumes these
owners; it does not define a second version of their behaviour or appearance.
Tools showing the game area use the game-owned
[shared game field](../game/render/game-field/spec.md).

The Lab owns its tools and their workflows, interfaces and local state. A tool
may own test setup and execution, configuration exploration, authoring controls,
measurements, camera selection or playback, according to its purpose. It owns the
lifetime of resources it instantiates, while the hosted systems retain their
behavioural contracts. It can run the production simulation without mounting
the player-facing flight shell, Hangar or title screen.

A tool can expose parameter variations or declared substitutions through its
supported inputs. A rendering fixture can isolate layers and supply synthetic
marks. Those conditions belong to the configured tool; they do not
redefine the hosted game feature. Studies may embed Lab instruments, while
Studies owns the investigation and its record.

Changes to a hosted feature belong in its owning contract and shared
implementation, with verification in affected game and tool consumers.
Changes to developer-tool behaviour and workflows belong in the tool contract.

Tool contracts: [workbench](workbench/spec.md),
[motion](motion-instrument/spec.md),
[Flight scene](flight-scene-instrument/spec.md),
[Planet Inspector](planet-inspector/spec.md),
[System instrument](system-instrument/spec.md),
[sky](sky-instrument/spec.md),
[gravity tuning](gravity-tuning/spec.md),
[Render model](render-model/spec.md),
[Render performance](render-performance/spec.md),
[Gauntlet](gauntlet-bench/spec.md) and
[Targeting](targeting-bench/spec.md).

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
