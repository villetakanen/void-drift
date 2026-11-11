# Gravity tuning

## Context

Gravity tuning is the Lab bench for deciding how a gravity well works, metrics
first: one well with given values, flown by real ships, read against each ship's
thrust. The game's sun and planets use the same mass law
([gravity-field.md](../../game/world/gravity-field/spec.md)); the reasoning behind it is in
[gravity-model.md](../../../gravity-model.md).

It is one of two benches with one subject each. Ship tuning (the Motion instrument’s no-gravity screen,
[motion-instrument.md](../motion-instrument/spec.md)) compares ships with no gravity; Gravity
tuning studies one well with ships that cannot be changed. These restrictions
belong to these configured Lab uses, rather than every Motion instrument instance.

## Architecture

### The well

One static well in empty space: no sun, no planets, no orbit. The well is a body
with a surface.

The configured inputs are the well's mass (`strength`), production falloff
selection (`falloff`), cut-off pull (`cutoff`), body radius (`radius`) and centre
(`x`, `y`). Their units, accepted ranges and defaults are listed under Settings.

[Gravity field](../../game/world/gravity-field/spec.md) owns the gravity equations, reach and cut-off
behavior, integration rules and planet contact response. The bench uses the
production functions `massWellAcceleration`, `massWellPull`, `massWellReach` and
`bounceOffSurface` from `packages/core/src/lib/physics/Physics.ts`. It supplies
configured values to those functions and displays their results; it defines no
separate gravity or collision law.

### The ships

Four fixed ships, flown as the game builds them; the bench offers no ship,
loadout, part or engine option. Hulls are empty (the burns run on supplied power,
as in the instrument).

| Label              | Chassis  | Side      | Aft                         | Stabilizers | Linked engines |
| ------------------ | -------- | --------- | --------------------------- | ----------- | -------------- |
| Wasp               | wasp     | light ion | none                        | built in    | no             |
| Fighter            | fighter  | light ion | none                        | yes         | no             |
| Fighter, aft ions  | fighter  | light ion | light ion, light ion        | yes         | no             |
| Corvette, aft ions | corvette | light ion | light ion, light ion, empty | yes         | no             |

Each loadout is a `LoadoutSchema` value (`packages/mode-a/src/lib/schemas/loadout.ts`).

### The flight

The instrument's three burns, unchanged: B1 Course, B2 Turn, B3 Weave
(`apps/web/src/lib/instrument/burns.ts`, 840 ticks at 60 Hz). The bench never adds,
removes or edits a burn.

Every ship starts at the origin with heading 0 (+x) and velocity `startSpeed`
along it, with supplied power. The bench calls the instrument's `calculate` with
its `Flight` options (`startSpeed`, `pull`, `contact`;
`apps/web/src/lib/instrument/calculate.ts`). The well and contact callbacks use
the production physics functions above. `flyBench`
(`apps/web/src/lib/gravity-tuning/flight.ts`) samples each ship's path, pull,
distance to the well's centre and contact events.

Each ship also runs without the well as its shadow reference. The shadow uses the
same hull, equipment in the same mounts, hull and equipment properties, motion
settings, burn, starting position, heading and velocity. Gravity is the only
difference in simulation conditions. Its path is displayed beside the configured-well
result, following the shared Motion instrument contract.

Each ship's thrust is its peak engine acceleration on the unaffected path (the
instrument's acceleration measure), the reference for how strong the well is
against that ship.

### Settings

These, and nothing else:

| Setting        | Meaning                          | Range                       | Default          |
| -------------- | -------------------------------- | --------------------------- | ---------------- |
| Starting speed | `startSpeed`, u/s along +x       | 0–1000                      | 0                |
| Well strength  | `well.strength`, the well's mass | > 0, up to 100000           | 2400             |
| Cut-off pull   | `well.cutoff`, u/s²              | > 0, up to 10000            | 50               |
| Falloff        | `well.falloff`                   | `inverse-square`, `inverse` | `inverse-square` |
| Body radius    | `well.radius`, u                 | > 0, less than the reach    | 40               |
| Well position  | `well.x`, `well.y`, u            | each within ±10000          | (1000, 150)      |

The selected burn is part of the experiment configuration. Choosing B1, B2 or B3
recalculates every ship and its no-well reference using that input program.

### Document

An agent-supplied configuration document, parsed by `GravityTuningConfig`
(`apps/web/src/lib/gravity-tuning/config.ts`), so an agent can hand the bench a
starting point and the designer can export exact current values for the
conversation. The page supplies the configuration; there is no designer-facing
configuration import workflow:

```json
{
  "version": 1,
  "burn": "course",
  "startSpeed": 0,
  "well": {
    "x": 1000,
    "y": 150,
    "strength": 2400,
    "cutoff": 50,
    "falloff": "inverse-square",
    "radius": 40
  }
}
```

Anything else is rejected with its issues listed in place of the view.

### Views

The instrument's screen, `MotionInstrumentScreen`
(`apps/web/src/components/lab/instrument/`, shared with Ship tuning), with its
parts (`PathPane`, `BurnRow`, `TimeGraph`, `Legend`, `OverlayPane`), for
viewports 1280px wide and up. The bench is `GravityTuning` with its pane
`GravityPanel` (`apps/web/src/components/lab/gravity-tuning/`):

- Path pane: the four paths, each with its unaffected path dotted in the same
  colour; the well as its surface, centre and reach ring; a mark at each contact.
  The well can be dragged to set its position.
- Graphs: speed, gravity (the well's pull on each ship, u/s², with each ship's
  thrust as a dashed line in its colour) and distance to the well's centre.
- Legend: the four ships in their fixed colours.
- Pane: the settings, with the defaults shown when changed; the derived reach,
  surface pull (the pull at the body's radius) and that pull as a multiple of
  each ship's thrust; then Copy JSON for exporting the current settings.

Page: `/lab/gravity-tuning`, named "Gravity tuning" in the Lab.

### Handoff

The copied document records the experiment settings, not their acceptance.
Acceptance is recorded separately in the study or an explicit designer decision;
the bench changes no game value. An accepted falloff, cut-off or mass reaches the
game through the tuning workflow owned by [Gravity field](../../game/world/gravity-field/spec.md).

## Contract

### Definition of Done

- The pane offers export of current settings without a configuration-import
  control; agent-supplied configurations remain schema-validated.
- Switching from B1 to B2 recalculates every ship and its no-well reference
  using B2, records the selection and preserves all other experiment settings.
- Changing well strength from 10000 to 10001 uses 10001 in the simulation
  and exported configuration, with all other experiment settings unchanged.
- The document schema accepts the default document and rejects an unknown
  key, a negative starting speed, a zero strength, a zero cut-off, an
  unknown falloff, a body radius at or beyond the reach and a burn outside B1–B3
  (`gravity-tuning.test.ts`).
- The configured well values reach the production gravity and contact
  functions through the shared calculation; paths, gravity measurements and
  contact markers display the resulting samples and events.
- Each no-well shadow retains the same build, hull and equipment properties,
  motion settings, burn and starting state as its configured-well run; gravity is
  the only condition difference.
- Each ship's thrust is the peak of its unaffected path's acceleration (`gravity-tuning.test.ts`).
- `/lab/gravity-tuning` draws four paths and four dotted unaffected paths,
  the well's surface and reach, three graphs with four thrust lines on the
  gravity graph; an edited setting redraws them and reaches the document, an
  impossible one is refused with its reason; dragging the well moves it (`tests/browser/gravity-tuning.spec.ts`).

### Regression Guardrails

- The bench exposes the settings listed above and selection among the shared
  burn programs. Its ships and the burn programs themselves remain fixed.
- The ships and burns are the game's and the instrument's own definitions,
  imported, never copied.
- Gravity, derived well measurements and contact response use production physics;
  their laws belong to [Gravity field](../../game/world/gravity-field/spec.md).
- The bench changes no game value.

### Scenarios

```gherkin
Scenario: Change the experiment's burn
  Given a gravity experiment using B1
  When the designer selects B2
  Then every ship and its no-well reference are recalculated using B2
  And the configuration records B2
  And all other experiment settings remain unchanged

Scenario: Make a small gravity adjustment
  Given the well strength is 10000
  When the designer changes it to 10001
  Then the simulation uses a well strength of 10001
  And the exported configuration contains 10001
  And all other experiment settings remain unchanged

Scenario: Apply configured gravity settings
  Given an experiment with a configured well
  When the designer changes a valid well setting
  Then the shared simulation receives the updated configuration
  And the paths and measurements display the production simulation's results

Scenario: Display a no-well reference
  Given an experiment with a configured well
  When the instrument displays a ship's paths
  Then its reference path uses the same ship, burn and starting conditions
  And the reference simulation omits the well

Scenario: Moving the well
  Given the default document
  When the designer drags the well to a new point
  Then the document's well.x and well.y are that point and the paths redraw

Scenario: Display a production contact event
  Given the production simulation reports a ship contacting the body
  When the instrument displays the resulting path
  Then a contact marker appears at the reported contact
  And the path displays the subsequent simulation samples

Scenario: An impossible setting
  Given the default document
  When the designer sets the cut-off pull to 0
  Then the value is refused, the previous value stays and the reason is shown
```
