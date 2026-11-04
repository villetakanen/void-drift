# Gravity tuning

## Context

Gravity tuning is the Lab bench for deciding how a gravity well works, metrics
first. Today the game's wells follow mixed rules (the sun's reach is a multiple of
its radius, a planet's comes from its mass, strengths are set apart from either;
see [gravity-field.md](gravity-field.md)). The bench defines one rule, reach from
mass, and shows what a well with given values does to real ships. The game adopts
the rule later, planets first and suns last.

It is one of two benches with one subject each. Ship tuning (the Lab instrument,
[lab-instrument.md](lab-instrument.md)) compares ships with no gravity; Gravity
tuning studies one well with ships that cannot be changed. Neither has the
other's options.

## Architecture

### The well

One static well in empty space: no sun, no planets, no orbit, no surface.

- `strength`: the well's mass.
- The pull is semi-physical: `G × mass / distance²`, with `G = 1000` (the
  constant of the no-well planet formula; a fixed game constant, not a setting). Mass alone sets
  how hard the well pulls.
- `sizeMultiplier`: reach in units per unit of mass, so
  `reach = sizeMultiplier × mass`. The reach is only a cut-off, artificially
  smaller than physics (where the pull never ends) to keep game physics sane:
  inside it the pull is exactly `G × mass / distance²`, at and beyond it zero, a
  hard cut. Changing the size moves where the pull ends, never how strong it is
  inside. The bench exists to find this multiplier.
- `x`, `y`: the well's centre in the bench's frame.

The law is one production function, `massWellAcceleration` with the constant
`MASS_WELL_G` (`packages/core/src/lib/physics/Physics.ts`), used by the bench now
and by planets, then suns, when the game adopts it (gravity-field.md, "Reach from
mass"). The game's current curve, `wellAcceleration`, is unchanged
until then.

The well has no surface and ends no run. Like a planet's, its pull is not applied
within a ship's own radius of its centre; nothing else limits it, so the gravity
graph shows how strong a pass near the centre is.

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
along it, then flies the chosen burn through the instrument's calculation (the
production `applyBuildEngines` per substep, four substeps a tick, supplied power)
with the well's pull added to its velocity each substep before its position moves,
as the game integrates gravity. The bench calls the instrument's own `calculate`
with its `Flight` option (`startSpeed`, `pull`; `apps/web/src/lib/instrument/calculate.ts`);
`flyBench` (`apps/web/src/lib/gravity-tuning/flight.ts`) flies the four ships and
samples each one's pull and distance to the well. With the well beyond reach of
every path, a ship's path equals the instrument's path for the same burn.

### Settings

Exactly four, and nothing else:

| Setting        | Meaning                               | Range              | Default     |
| -------------- | ------------------------------------- | ------------------ | ----------- |
| Starting speed | `startSpeed`, u/s along +x            | 0–1000             | 0           |
| Well strength  | `well.strength`, the well's mass      | > 0, up to 10000   | 600         |
| Well size      | `well.sizeMultiplier`, reach per mass | > 0, up to 5       | 0.5         |
| Well position  | `well.x`, `well.y`, u                 | each within ±10000 | (1200, 300) |

The burn switcher (B1–B3) chooses which program is drawn, as in the instrument;
it is not a setting of the flight.

### Document

A configuration document, parsed by `GravityTuningConfig`
(`apps/web/src/lib/gravity-tuning/config.ts`), so an agent can hand the bench a
starting point and the designer can copy the decided values back:

```json
{
	"version": 1,
	"burn": "course",
	"startSpeed": 0,
	"well": { "x": 1200, "y": 300, "strength": 600, "sizeMultiplier": 0.5 }
}
```

Anything else is rejected with its issues listed in place of the view.

### Views

The instrument's layout and parts (`PathPane`, `BurnRow`, `TimeGraph`, `Legend`,
`OverlayPane`, from `apps/web/src/components/lab/instrument/`), on one screen for
viewports 1280px wide and up:

- Path pane: the four paths and the well, drawn as its centre and reach ring. The
  well can be dragged to set its position.
- Graphs: speed, gravity (the well's pull on each ship, u/s²) and distance to the
  well's centre.
- Legend: the four ships in their fixed colours.
- Pane: the four settings, with the defaults shown when changed, then the document
  (Copy JSON, Load).

Page: `/lab/gravity-tuning`, named "Gravity tuning" in the Lab.

### Handoff

The copied document is the record of a decision. How the game adopts reach from
mass (planets first, then suns) is a separate, later change specified in
gravity-field.md; until then the bench changes no game value.

## Contract

### Definition of Done

- [x] The document schema accepts the default document and rejects an unknown
  key, a negative starting speed, a zero strength, a size multiplier above 5 and
  a burn outside B1–B3 (`gravity-tuning.test.ts`).
- [x] With the well out of reach of every path, each ship's path equals the
  instrument's calculation of the same loadout on the same burn, for all three
  burns; a path that enters the reach differs (`gravity-tuning.test.ts`).
- [x] Inside reach the pull is `MASS_WELL_G × mass / distance²`; at and beyond
  reach, and within the ship's radius, it is zero (`MassWell.test.ts`,
  `gravity-tuning.test.ts`).
- [x] Doubling the size multiplier doubles the reach and leaves the pull inside
  the old reach unchanged; doubling the mass doubles the pull at every distance
  inside reach (`MassWell.test.ts`).
- [ ] `/lab/gravity-tuning` draws four paths, the well and three graphs; an
  edited setting redraws them and reaches the document; dragging the well moves
  it (browser tests).
- [ ] Large-screen (1280px wide or more) readability reviewed by the owner and
  recorded.

### Regression Guardrails

- The bench has exactly four settings; ships and burns are not settings.
- The ships and burns are the game's and the instrument's own definitions,
  imported, never copied.
- The well's pull comes from the production `massWellAcceleration`; the reach
  never changes the pull inside it.
- The bench changes no game value.

### Scenarios

```gherkin
Scenario: A well out of reach changes nothing
  Given the well at (1200, 30000) with strength 600 and size multiplier 0.5
  When the bench flies B1
  Then every path equals the instrument's path for that ship on B1

Scenario: A larger well bends the paths sooner
  Given the default document
  When the designer doubles the size multiplier
  Then the reach ring doubles and every path that enters it bends toward the well earlier

Scenario: Moving the well
  Given the default document
  When the designer drags the well to a new point
  Then the document's well.x and well.y are that point and the paths redraw

Scenario: An impossible setting
  Given the default document
  When the designer sets the size multiplier to 0
  Then the value is refused, the previous value stays and the reason is shown
```

## Open questions

- How the bench's strength maps to a planet's mass when the game adopts the rule,
  and whether the sun keeps a separate multiplier until suns are fixed. (Owner.)
