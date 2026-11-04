# Lab instrument

Status: v1 implemented locally, 2026-11-01; iPad readability reviewed by the owner, 2026-11-01.
Design record: study `lab-instrument-2026-11-01` (`/lab/studies/lab-instrument-2026-11-01`).
Designer-facing name: Ship tuning. It compares ships with no gravity; gravity is
tuned on its own bench, [Gravity tuning](gravity-tuning.md).

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
				"chassis": "balanced",
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

### Regression Guardrails

- Studies hand the instrument documents; they never define inputs, axes or units.
- The game's part and ion definitions are never changed by a document.
- The instrument's scales come from the data and the fixed rules above, never from
  a study.
- Elements keep the 4px vertical rhythm; inline widths follow content.

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
```
