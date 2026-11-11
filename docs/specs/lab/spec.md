# Lab

## Blueprint

### Context

The Lab is game-designer tooling, not part of the game. It is where ships,
parts, effects, worlds and interfaces are studied, tuned and shown before and
after they reach the game.

### Architecture and boundaries

- Lab pages live under `apps/web/src/pages/lab/` and are served under `/lab`.
- The Lab reuses the game's systems, components and contracts where it needs
  them: simulation, camera, ship definitions, procedural assets and shared
  interface components. It shows them; it does not fork them.
- Game specs describe the game only. They place no rule on the Lab, and the Lab
  changes nothing they describe.
- Children: [workbench](workbench/spec.md),
  [design studies](design-studies/spec.md),
  [motion instrument](motion-instrument/spec.md),
  [flight scene instrument](flight-scene-instrument/spec.md),
  [gravity tuning](gravity-tuning/spec.md),
  [render model](render-model/spec.md),
  [render performance](render-performance/spec.md).

### Constraints

- The Lab has no game modes. What runs in it is a demo, a presentation, an
  example or an instrument, never a playable game mode.
- Nothing in the Lab submits a score to the shared leaderboard.

## Contract

### Definition of Done

- [x] No Lab page offers a game mode or a run that ends in a score to save.
- [x] No Lab page imports or calls score submission.

### Regression guardrails

- No Lab file imports the flight shell, the Hangar, the title screen or score
  submission; `scripts/check-contracts.mjs` fails the gate if one does.
- Adding a Lab page never changes game behaviour.
