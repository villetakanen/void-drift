# Camera

## Blueprint

### Context

The camera decides which part of the arena the player sees during flight. It
keeps the ship and the star it orbits readable together, inside the part of the
screen that controls and instruments leave free, and changes zoom in a few
deliberate steps so the view stays calm. What the camera shows never changes the
run.

### Architecture and boundaries

- `packages/core/src/lib/physics/Camera.ts` owns framing, zoom levels, smoothing
  and the world-to-screen transform.
- `apps/web/src/components/FlightDeck.svelte` frames the camera every simulation
  step from the ship and the star and hands it the active area.
- `packages/core/src/lib/entities/Renderer.ts` draws the world through the
  camera transform, including the background starfield.
- `packages/mode-a/src/lib/schemas/flight.ts` (`FlightSettingsSchema.camera`)
  validates the tunable zoom step count, padding and smoothing.
- [Game screen](../game-screen/spec.md) owns the stage and the active area;
  this contract consumes the active area in logical units. The deck is a DOM
  layer outside the camera transform.
- Framing reads simulation state and writes none. Replays, scoring and physics
  are independent of the camera.

### Framing

- The camera fits the ship and the star, with padding on every side, inside the
  active area. Rendering still covers the whole stage; world objects continue
  behind the gutters.
- The view centres on the midpoint between ship and star. The active area is
  centred on the stage, so the camera centre and the stage centre coincide.
- Panning toward a new centre is smooth and frame-rate independent.
- When the ship wraps across the arena edge, framing resets immediately instead
  of panning across the arena.
- A wider active area, as on ultra-wide screens, shows more of the arena across
  at the same zoom; this is accepted for every mode, scored runs included.

### Zoom levels

- Zoom uses a fixed set of levels, geometrically spaced from the whole-system
  view to a 1.6× close view. The whole-system view fits the 1200-unit-radius
  arena, plus padding, across the shorter side of the active area.
- The level count is an integer from 4 to 11, five by default; settings saved
  without it use the default.
- Automatic framing selects the closest level at which ship and star fit with
  padding. Changing level snaps immediately in both directions and recentres;
  zooming in needs 8% spare room, so the view does not flicker at a threshold.
- Changing zoom keeps world-space trails and effects in place and does not
  restart or age them.

### Background starfield

- Background stars are world-anchored, as today: they pan and zoom with the
  world.
- Stars cover the whole stage at every zoom level and every stage width, with no
  empty bands at the sides or edges. The pattern is the same on every run and
  every frame.

## Contract

### Definition of Done

- [ ] Ship and star, with padding, fit inside the active area at 4:3, 16:9 and
  ultra-wide stages whenever they fit at the closest permitted level; the
  rendered view still covers the whole stage.
- [ ] The camera centre stays at the stage centre's world position for the
  ship–star midpoint at every stage width.
- [ ] The whole-system view contains the full arena, with padding, inside the
  active area.
- [ ] Zoom uses only the configured levels, snaps in both directions, holds the
  wider level within the 8% threshold band and resets framing on a wrap.
- [ ] Background stars cover the whole stage at every zoom level and stage
  width, world-anchored and identical across runs and frames.
- [x] Coordinates round-trip between world and screen at every level.

### Regression guardrails

- Framing reads simulation state only; replays, seeds, physics and scores are
  identical with any stage size or zoom.
- The deck stays outside the camera transform.
- Trails and world effects keep their positions and age across zoom changes.
- `FlightSettingsSchema` rejects fractional or out-of-range level counts.

### Scenarios

```gherkin
Scenario: Subjects stay clear of the gutters
  Given a 16:9 stage with its side and top/bottom gutters
  When the ship flies far from the star at the arena edge
  Then ship and star, with padding, appear inside the active area
  And stars and world objects still render behind the gutters

Scenario: Ultra-wide shows more across
  Given the same run on a 16:9 and an ultra-wide stage of equal height
  When the camera frames ship and star at the same level
  Then the ultra-wide view shows more of the arena across
  And background stars fill the whole ultra-wide stage

Scenario: Whole system at the widest level
  Given a 4:3 stage
  When the widest level is selected
  Then the full arena with padding fits inside the active area
  And background stars reach every edge of the stage

Scenario: Wrap resets framing
  Given the ship crosses the arena edge
  When the simulation wraps it to the opposite side
  Then the camera reframes immediately instead of panning across the arena
```
