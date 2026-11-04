# Lab instrument

Status: v1 implemented locally, 2026-11-01; iPad readability reviewed by the owner, 2026-11-01.
Design record: study `lab-instrument-2026-11-01` (`/lab/studies/lab-instrument-2026-11-01`).
Designer-facing name: Ship tuning. It compares ships with no gravity; gravity has
its own bench, [Gravity tuning](gravity-tuning.md) (owner decision, 2026-11-04).

## Context

Studies that compare motion, engines or hulls used to build their own charts, each
with its own axes, units and inputs, so no two could be read together. The Lab
instrument is the one shared tool for those comparisons. An agent writes a
configuration document; the instrument calculates and draws it; the designer
adjusts the values under investigation in its pane and copies the document back
as the decided values.

Use the instrument for any comparison of vehicle motion, engine or hull values.
Do not build new motion charts in a study; if the instrument cannot show what a
study needs, record that as an amendment to this specification.

## Architecture

### Inputs and outputs

- Input: a configuration document, parsed by `InstrumentConfig` in
  `apps/web/src/lib/instrument/config.ts`. Anything else is rejected with its
  issues listed in place of the view.
- Output: the same document, edited in the pane, as JSON (Copy JSON), with empty
  change groups left out (`serialize` in the same file).

### Configuration document

```json
{
	"version": 1,
	"burn": "course",
	"vehicles": [
		{
			"label": "Plasma aft, more thrust",
			"loadout": {
				"version": 2,
				"chassis": "fighter",
				"side": "ion",
				"stabilizers": true,
				"hull": [null, null],
				"aft": ["plasma", "plasma"]
			},
			"changes": { "plasma": { "thrust": 46000 } }
		}
	]
}
```

- `vehicles`: one to six. Each is a game loadout (`LoadoutSchema` in
  `packages/mode-a`) plus optional `changes`, keyed by engine family, naming only
  values that differ from the game. A document without changes describes ships as
  they fly today.
- `changes.ion`: any of `acceleration`, `maxSpeed`, `bonus`, `falloff`, `maxTurn`
  (shared by light and heavy ions and the stabilisers; the turn cap applies to
  every ship). `changes.fusion` and `changes.plasma`: any of `thrust`, `limit`,
  `chargeSeconds`, `pulsePeriod`, `pulseOn`. Values outside the schemas' ranges
  are rejected.
- `burn`: one of the instrument's fixed programs; studies never write inputs.

### Burns (`apps/web/src/lib/instrument/burns.ts`)

All are 14 s at 60 Hz.

| Id       | Label | Program                                                          |
| -------- | ----- | ---------------------------------------------------------------- |
| `course` | B1    | One input per second: LR LR – L – LR – R – R – LR LR LR          |
| `turn`   | B2    | 6 s LR, 2 s L, 1 s coast, 5 s LR                                 |
| `weave`  | B3    | LR, L, R repeating; each round's steps 0.3 s longer; cut at 14 s |

### Calculation (`apps/web/src/lib/instrument/calculate.ts`)

Each vehicle runs on the burn through the production `applyBuildEngines`
function, with its own part and ion values, from rest at the origin. Speed,
acceleration (differenced over 6 ticks) and turn acceleration derive from the
samples. Not included: gravity, power limits, and changes to part mass or chassis
values. A difference shown by the instrument may therefore not appear in flight.
**[DEPRECATED 2026-11-04]** ~~Documents with a `field` are calculated in flight
conditions instead; see "Gravity field mode".~~ Ship tuning has no gravity.

### Views

One 1440 × 900 logical screen, scaled to fit its container, on the console
(elevation 1). Two 672px columns in a 32px margin, 32px apart; no header or footer.

- Left: the path pane (672 × 672) and, 24px below, the burn row (44px).
- Right: the time graph three times (speed, acceleration, turn acceleration;
  672 × 208, 24px apart) and, 24px below, the time slider (44px), whose knob runs
  along the graphs' time axis.
- Below both, 24px down: the legend, naming every vehicle in its colour.
- The pane overlay, unscaled on the container: menu button in the top-right
  corner, elevation 3, 45% of the container wide, over an 11% backdrop. Default
  content: each vehicle's values and the document's Copy JSON and Load.

Every graph scales its value axis to its data: a nice tick step for about five
ticks, the top one step above the peak, symmetric about zero for turn
acceleration. Values are compared by reading the axes. Diagrams are displays
(elevation 2) on the console with every label outside the data; a vehicle keeps
one colour in every diagram; inline gaps are grid-sized. The path pane switches
between fitting all paths and a default scale (0.2 px/u) that pans by dragging.

### Components

| Component                          | Path                                      | Reference page            |
| ---------------------------------- | ----------------------------------------- | ------------------------- |
| `LabInstrument`                    | `apps/web/src/components/lab/instrument/` | `/lab/instrument`         |
| `InstrumentEmbed` (study pages)    | same folder                               | used in the design record |
| `PathPane`, `TimeGraph`            | same folder                               | `/lab/graphs`             |
| `BurnRow`, `Legend`, `OverlayPane` | same folder                               | `/lab/instrument-parts`   |
| `Toggle`, `RingSlider`             | `apps/web/src/components/inputs/`         | `/lab/inputs`             |
| Elevation and display tokens       | `packages/core/src/lib/styles/tokens.css` | `/lab/surfaces`           |

### Using it

- In a study page: `<InstrumentEmbed config={document} />` from
  `components/lab/instrument/InstrumentEmbed.astro`. It takes the full window and
  snaps into place.
- In the Lab: `/lab/instrument` opens with the starting document
  (`apps/web/src/lib/instrument/starter.ts`); paste another under Load a document.
- Custom pane content: pass a `pane` snippet to `LabInstrument`; it receives the
  parsed document.

### [DEPRECATED 2026-11-04] Gravity field mode

> Ship tuning and gravity tuning are separate benches (owner decision,
> 2026-11-04): ships are tuned without gravity, and gravity is tuned with given
> ships in [gravity-tuning.md](gravity-tuning.md). This mode mixed the two and is
> being removed: it is still in the code until plan step R1 removes it, after
> which version 1 is the instrument's only document. Kept as the record of what
> was built.

Document, calculation, views, field editing and Copy proposal implemented,
2026-11-04. Pull shading is a target, not yet implemented. Plan: [2026-11-04-gravity-field-lab.md](../plans/2026-11-04-gravity-field-lab.md).
Gravity rules: [gravity-field.md](gravity-field.md).

A version 2 document may carry a `field`. Version 1 documents and version 2
documents without a field behave exactly as above.

```json
{
	"version": 2,
	"burn": "coast",
	"field": {
		"system": "game",
		"orbits": "frozen",
		"wells": [
			{
				"label": "W1",
				"x": 1400,
				"y": 300,
				"reach": 260,
				"strength": 900,
				"curve": "inverse-square"
			}
		],
		"changes": { "planetStrength": 450 }
	},
	"vehicles": [
		{
			"label": "Close pass",
			"loadout": {
				"version": 2,
				"chassis": "balanced",
				"side": "ion",
				"stabilizers": true,
				"hull": [null, null],
				"aft": ["plasma", "plasma"]
			},
			"start": { "x": 460, "y": 540, "heading": -90, "speed": 300 }
		}
	]
}
```

- `field.system`: `game` (the sun and planets in play, at the game's seed) or
  `empty` (added wells only).
- `field.orbits`: `moving`, as in play, or `frozen`, bodies held at their start
  positions.
- `field.wells`: zero to four Lab wells, each with a label, position, reach,
  strength and curve within the gravity schema's ranges, centred inside the arena
  (within 1200 of (960, 540)). A Lab well is a point well with no surface: it
  pulls but cannot be touched. Lab wells exist only in the document. The
  six-vehicle limit is unchanged.
- `field.changes`: gravity values that differ from the game, named and ranged by
  `GravityTuningSchema`. The only part of a document that can become game
  configuration, through `pnpm tuning:apply` (see gravity-field.md).
- `vehicles[].start`: world position, heading in degrees (0 = +x, −90 = up, the
  game's rotation −π/2) and speed along it; without it the vehicle starts at the
  game's spawn, at rest, facing up. A start on or inside a body's surface, or
  outside the arena, is rejected. `start` is allowed only with a `field`;
  documents without one still run from rest at the origin.
- Burn `coast` (label B0): no input for 840 ticks. Version 2 documents
  (`V2_BURN_IDS`, `burns.ts`) may use it with or without a field; version 1 keeps
  B1–B3 (`BURN_IDS`). Field documents accept all four burns,
  so a path can combine gravity with thrust.

Schema: `InstrumentConfig` (`config.ts`) is a union on `version`; version 2 takes
the field through `GravityFieldSchema` without its `start`, and each vehicle's
start through `ShipStartSchema` (both `packages/mode-a/src/lib/schemas/gravity.ts`).
It also rejects a start without a field, part changes in a field vehicle, and a
start the vehicle's `Simulation` refuses (inside the sun or a planet).

Calculation: `calculateField` (`apps/web/src/lib/instrument/field.ts`) flies each
vehicle in its own `Simulation` built from the field and the vehicle's start
(`fieldSimulation`), with the production step, its power budget and its death
checks, on the chosen burn. Ion changes reach it through the flight settings'
`ion`. Part changes (`changes.fusion`, `changes.plasma`) need the per-chassis
tuning patch the Lab usability plan (`docs/plans/2026-11-04-lab-usability.md`)
defines; until it exists a field document refuses them. Each sample adds the
gravity acceleration (`gx`, `gy`, from `Simulation.gravityAt`) and `surface`, the
distance to the nearest game body's surface (Lab wells count by centre distance).
Events are recorded per tick: each planet contact (the ship bounces and the run
continues) and each arena wrap. The path ends at:

- `star`, `hull` or `power`: the run ended with that death cause; sampling stops
  at that tick;
- `free`: 840 ticks flown and the ship outside every reach;
- `bound`: 840 ticks flown and the ship inside some reach.

Views in field mode, otherwise as above. `documentTracks` (`field.ts`) calculates
either kind of document; a track carries its `run` in field mode, and the views
take the bodies of the longest run, so moving planets cover the whole burn.

- Path pane in the world frame (`PathPane` with `bodies`): game bodies as their
  surface in the body's own colour with a dashed muted reach ring; Lab wells as a
  cross and dashed reach ring in caution yellow, since they have no surface.
  Bodies sit under the paths. A diamond marks each planet contact; a jump of
  more than 1000 u between samples (a wrap) breaks the path line. Each path ends
  in its outcome: a cross for `star`, `hull` or `power`, a square for `bound`, an
  arrowhead along the velocity for `free`. Fit all includes every reach ring;
  the default scale opens on the arena centre (960, 540).
- Graphs (`FIELD_MEASURES`): speed, gravity (`|g|`, u/s²) and nearest surface
  (u). Missing values (no body at all) are gaps; a run that ended holds its last
  value under the cursor.
- Legend: each name is followed, muted, by its outcome: free, bound, hit the
  sun, hull lost or power lost.
- Burn row: version 2 documents offer B0 Coast beside B1–B3 (`BurnRow` `ids`).
- Reference: `/lab/graphs` "Field mode" draws `FIELD_DOCUMENT`
  (`apps/web/src/lib/instrument/starter.ts`); `/lab/instrument-parts` shows the
  field legend.
- Target: optional shading of pull strength on the path pane.
- Pane, "Gravity field" section (`DocumentPanel`), between the values and the
  document:
  - Without a field: "Add a gravity field" turns the document into version 2
    with the empty field (refused, with the reason, while a vehicle has part
    changes).
  - System and Orbits toggles.
  - Gravity values (`GRAVITY_PARAMETERS`, `config.ts`) as number rows like the
    vehicle values, showing the game's value when changed, with a reset; and the
    well curve as a toggle. Setting a value back to the game's removes it from
    `field.changes`.
  - Each Lab well's x, y, reach, strength and curve, with Remove; Add Lab well
    up to four.
  - Each vehicle's start (x, y, heading, speed), or "Set a start" from the
    game's spawn and "Use the game's spawn" to clear it.
  - Every edit goes through `editDocument` (`config.ts`): an edit the schema
    refuses is not applied, the input shows its previous value, and the reason
    appears under the section.
- Path pane: with `onmovewell`, a Lab well's cross can be dragged; the well
  follows the pointer and the paths recalculate on release. A drop the schema
  refuses (outside the arena) leaves the well where it was.
- Copy proposal sits beside Copy JSON in field documents and copies the block
  defined in gravity-field.md ("Changing gravity values"); it is disabled while
  no gravity value differs from the game's.

## Study chassis proposal and Fiddler integration

Originally proposed by [Fiddler 02.11–02.12](../../apps/web/src/pages/lab/studies/lhi-fiddler-2026-11-03.astro)
on 2026-11-03, while its mass, eight-equipment sketch and stabilizer layout were
still provisional. That stage could not model Fiddler with the existing chassis.

The designer subsequently accepted the fixed Fiddler hull, 187 mass, four main
engines, four built-in stabilizers and five equipment/weapon slots, and authorized
game integration in 03–04. Fiddler is now a validated production loadout and can
use the existing instrument document and real force calculation. The study embeds
linked-off and linked-on Fiddler examples using the same starting fit. The ordinary
instrument limits still apply: supplied power, no planetary gravity, no survival
endurance claim. Actual energy and collision behavior is tested in flight.

The broader proposal to author arbitrary provisional chassis, stabilizer geometry
and independent force tuning inside instrument documents remains unimplemented.
It is no longer a prerequisite for comparing this accepted Fiddler configuration.

## Contract

### Definition of Done

- [x] Every burn is exactly 840 ticks (unit test).
- [x] The schema accepts the design record's document and rejects a loadout that
  does not fit its chassis, an unknown change and an unknown burn (unit tests).
- [x] The calculation is deterministic and equals the design record's calculation
  for every vehicle and burn (unit tests).
- [x] `/lab/instrument` renders the starting document with three vehicles in the
  legend and three graphs (browser test).
- [x] Switching the burn redraws every view and changes the document (browser test).
- [x] The pane opens from the menu button, moves focus to its close button, and
  closes on Escape with focus returned (browser test).
- [x] An edited value updates the graphs and the document (browser test).
- [x] Each reference page renders its components (browser test).
- [x] Readability on the iPad is reviewed by a person and recorded (owner, 2026-11-01).
#### [DEPRECATED 2026-11-04] Field mode (removed by plan step R1)

- [x] Version 1 documents parse and calculate unchanged, and a version 2
  document without a field calculates as version 1; coast is refused in
  version 1 (`lab-instrument.test.ts`).
- [x] A field vehicle's samples equal a `Simulation` built from the same field
  and start, fed the same burn (`lab-instrument.test.ts`).
- [x] The schema rejects a fifth Lab well, an out-of-range strength, an unknown
  gravity change, a Lab well outside the arena, a start inside a body or outside
  the arena, a `start` without a `field`, and part changes in a field
  (`lab-instrument.test.ts`).
- [x] With two overlapping Lab wells, the gravity acceleration is the vector sum
  of each well's pull alone (`labWellPull`, which `Simulation.gravityAt` uses;
  `field.test.ts`).
- [x] Field runs end in `star` on a coast into the sun, `bound` inside a reach
  and `free` outside every reach, and record planet contacts and wraps
  (`lab-instrument.test.ts`).
- [x] A field document loaded in the instrument shows the field graphs, every
  Lab well's reach ring, body surfaces, an outcome per vehicle and B0 Coast
  (browser test, `lab-instrument.spec.ts`).
- [x] In the pane, a document gains a field, a Lab well is added, an edited
  gravity value reaches the document, and an impossible well strength is
  refused with its reason (browser test, `lab-instrument.spec.ts`).
- [x] A refused edit leaves the document unchanged and gives one plain reason;
  a gravity value set back to the game's leaves `field.changes` (unit tests).
- [x] An edited gravity value appears in the copied proposal's Apply line
  (browser test, `lab-instrument.spec.ts`).
- [ ] Target: field mode readability on a large screen (1280px wide or more)
  reviewed by the owner and recorded.

### Regression Guardrails

- Studies hand the instrument documents; they never define inputs, axes or units.
- The game's part and ion definitions are never changed by a document.
- The instrument's scales come from the data and the fixed rules above, never from
  a study.
- Elements keep the 4px vertical rhythm; inline widths follow content.
- [DEPRECATED 2026-11-04, field mode] Field mode calculates through the production `Simulation`; the instrument has
  no gravity code of its own.
- [DEPRECATED 2026-11-04, field mode] Lab wells and vehicle starts never reach the game; only `field.changes` can,
  and only through `pnpm tuning:apply`.

### Scenarios

```gherkin
Scenario: Comparing a changed engine with stock
  Given a document with "Plasma aft" and "Plasma aft, more thrust"
  When the designer opens the pane and sets Plasma aft's thrust to 52000
  Then the graphs redraw and the copied document contains "thrust": 52000

Scenario: Switching the burn
  Given the instrument shows B1
  When the designer selects B2
  Then the lanes show 6 s both, 2 s left, 1 s coast, 5 s both
  And every path and graph is recalculated on that burn

Scenario: A broken document
  Given a document whose loadout has the wrong number of aft slots
  When the instrument receives it
  Then it lists the schema's issues instead of drawing

# [DEPRECATED 2026-11-04] Field mode scenarios below; see gravity-tuning.md.

Scenario: Target: a coast path bends round a frozen Lab well
  Given a field document with system "empty", orbits "frozen" and one Lab well
  And a vehicle starting outside the well's reach, heading past it, on coast
  When the instrument calculates it
  Then the path is straight until it enters the reach ring and curves toward the well inside it

Scenario: Target: a vehicle captured by the sun
  Given a field document with system "game" and a vehicle aimed at the sun on coast
  When the instrument calculates it
  Then its path ends in the "star" outcome mark at the sun's surface

Scenario: Target: tuning a planet well
  Given a field document with system "game" and no changes
  When the designer sets planetStrength to 450 in the pane
  Then every path redraws
  And Copy proposal copies a block containing "planetStrength 600 → 450"

Scenario: An out-of-range Lab well
  Given a field document whose Lab well has a negative strength
  When the instrument receives it
  Then it lists the schema's issues instead of drawing

Scenario: A start inside the sun
  Given a field document with system "game" and a vehicle starting at the sun's centre
  When the instrument receives it
  Then it lists the issue instead of drawing

Scenario: Target: a path that wraps
  Given a field document whose vehicle coasts out of the arena
  When the instrument calculates it
  Then a wrap event is recorded at that tick
  And the path pane breaks the line there and continues from the opposite side
```
