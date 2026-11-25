---
generated:
  by: "openai/gpt-6.1-terra"
  at: "2026-11-24T14:37:17+02:00"
verified:
  - by: "human:ville-takanen"
    at: "2026-11-23"
---

# Distant flight sky

## Blueprint

### Context

The distant Milky Way gives a pilot a landmark during a coast. Dark dust cuts interrupt a straight reach of cooler light and a warmer bank. Local bodies and the ship stay legible across the bright bank. This contract covers the player-facing field in flight and behind the landing menus. Lab views that depict the game field follow the same composition.

### Architecture

The system selects the sightline. Core prepares a periodic image containing diffuse light, dust and distant stars. The stage places that image over the void, inside the isolated blend group beneath World. World clears to transparency over the prepared sky. FX, LFX and the Deck compose above it. A field consumer supplies the system and camera pose through the
[shared game field](../game-field/spec.md), which owns resource lifetime and
coordinates browser presentation with the frame background policy. A Lab experiment that studies the sky itself may substitute its declared sky material. [Render](../spec.md) · [Camera](../../camera/spec.md) · [Seeded systems](../../world/systems/spec.md)

The shape coordinate runs continuously from 0 (Narrows) through 0.5 (Practice) to 1 (Broad reach). Interpolate breadth, internal contrast and exposure between these anchor triples: (0.76, 1.35, 1), (1, 1, 1) and (1.42, 0.83, 0.82). A separate dust seed determines crest and lane details. Use a stream gain of 45% with independently drawn star marks during preparation. The closed study supplies the sightline references. [Three forms and the Practice departure](../../../../../apps/web/src/pages/lab/studies/milky-way-sky-2026-11-19.mdx)

Practice ships a 1536² tile at a 3072-logical-pixel period. The browser decodes it at entry. To regenerate the asset from the canonical material and Sol descriptor, run `pnpm dev:ensure` and `node scripts/prepare-sol-sky.mjs`. The image carries the stars and dust together. [Sol tile](../../../../../apps/web/public/skies/sol.png) · [Preparation script](../../../../../scripts/prepare-sol-sky.mjs)

The shared [game field backdrop](../../../factory/design-system/game-field-backdrop/spec.md)
uses the sky selected for its separate generated system and a stationary camera
pose on the Title Screen, Settings and Top Scores. Survival, Derelicts
and Gauntlet take the final arrival seed and prepare one tile off the main
thread. Flight can start over the void. A completed decode supplies only its
own active run. Leaving or replacing that run releases its pending work and
temporary image URL. [Shared preparation worker](../../../../../apps/web/src/lib/assets/flight-sky/prepare.worker.ts)

[Sightline selection](../../../../../packages/mode-a/src/lib/flight-sky.ts) · [Material schema](../../../../../packages/core/src/lib/schemas/flight-sky.ts) · [Tile preparation](../../../../../packages/core/src/lib/assets/flight-sky.ts)

### Constraints

- Practice pins the middle shape, dust seed 191126, 10° heading, 100% scale and the Sol bank-crossing placement.
- The generated modes share one deterministic seed mapping for shape, dust, heading over a full turn, scale of 80–120% and opening placement with a visible reach.
- Stage preparation builds the image once per sightline. Camera movement changes the presentation transform. Each 100 world units travelled moves the sky 65 logical stage pixels in the opposite direction.
- Pattern scale stays fixed through world zoom. The image covers the full stage including gutters at every supported aspect ratio.
- Sky preparation and failure are presentation-only. The void covers the stage while the image is unavailable.

## Contract

### Definition of Done

- Adjacent values produce intermediate reach forms. Narrow reaches concentrate light and deepen cuts. Wide reaches spread softer, dimmer light.
- Practice returns to its reference bank. Generated systems reproduce their sightline across modes.
- Camera movement, resizing and replay reuse the prepared pixels.

### Regression guardrails

- Heading and scale apply to dust and stars together.
- Each stage owns its current image. Superseded preparation cannot replace it.
- Ranked scoring, run seeds, simulation state and controls are independent of sky preparation.

### Scenarios

```gherkin
Scenario: Landing menu field
  Given any consumer of the shared game field backdrop
  When a planet advances along its orbit
  Then the same prepared sky remains at the stationary camera pose
  And active flight selects sky from its own generated system

Scenario: Fixed view from Sol
  Given two Practice departures with different run seeds
  When both cameras reach the same pose
  Then the warm bank and dust cuts have the same placement

Scenario: System identity
  Given Survival, Derelicts and Gauntlet with the same system seed
  When their cameras reach the same pose
  Then the same reach, dust detail, heading, scale and placement recur

Scenario: Independent shape and dust
  Given a fixed dust seed and placement
  When the shape moves from Narrows through Practice to Broad reach
  Then the shoulder widens and its contrast softens through intermediate forms
  And varying only the dust seed changes local landmarks at the selected breadth

Scenario: Camera presentation
  Given a prepared sightline
  When the camera travels 100 world units and changes zoom
  Then its landmarks move 65 stage pixels against that travel at their original scale
  And a snap, seek or resize shows the absolute pose with full stage coverage

Scenario: Interrupted preparation
  Given an image being prepared for one run
  When another run starts or preparation fails
  Then the current flight advances over the void or its own prepared image
  And the previous result cannot appear in the current run
```
