# Motion instrument

Design record: study `lab-instrument-2026-11-01` (`/lab/studies/lab-instrument-2026-11-01`).
The shared instrument is used in Lab simulation pages and design studies.
Ship tuning and [Gravity tuning](gravity-tuning.md) are configured uses of it.

## Context

The Motion instrument makes the consequences of motion rules and settings visible
through simulated paths and measurements. It supports investigations of the rules
and small adjustments to their values under controlled conditions.

An agent configures each experiment, including its fixed conditions and the
variables available for the game designer to adjust. A Lab room can provide an
ongoing tuning environment; a design study can contain several independently
configured experiments addressing different comparisons.

Interactive instances support investigation. Written findings and captured images
record observed results; an instance is retained when continued interaction serves
the study. Study evidence practices belong to the design-study skill.

## Architecture

### Shared instrument and configured uses

The shared instrument owns experiment configuration, the distinction between fixed
and adjustable variables, simulation, and the presentation of paths and measurements.
Each configured use selects its ships, motion rules, environment, burn program,
measurements and exposed controls from the supported capabilities. Its restrictions
apply to that use rather than defining every Motion instrument instance.

Simulations use the current production laws, math and libraries with the
experiment's configured values. Production changes also affect embedded instances;
historical examples may change or become incompatible. Written findings and captured
images preserve historical results. The instrument does not maintain old simulation
versions to keep previous examples working.

### Shared properties and comparison conditions

Hull and equipment properties and motion-rule settings belong to the experiment,
not individual ships. Every ship uses the same definitions for the same hull and
equipment. Configured tuning values apply consistently to all ships that use them;
vehicles differ through their hull and mounted equipment, not per-vehicle property
overrides.

Experimental conditions may differ explicitly between comparison runs. A no-gravity
shadow uses the same hull, mounted equipment, properties, motion settings, burn and
starting state as its source ship, with gravity omitted. This difference in conditions
does not give the shadow different hull or equipment properties.

### Export and acceptance

An exported configuration captures the experiment's exact current values for
sharing in the conversation with the agent. Exporting does not approve those
settings or apply them to the game. Acceptance is recorded separately in the
study or an explicit designer decision.

The agent supplies the starting configuration through the Lab page or study.
The designer adjusts the exposed controls and exports values for discussion;
there is no designer-facing configuration import workflow.

### Ship tuning configuration

The following document, burns and calculation describe Ship tuning. Gravity tuning's
configuration and measurements are defined in [its spec](gravity-tuning.md).

#### Inputs and outputs

- Input: an agent-supplied configuration document, parsed by `InstrumentConfig` in
  `apps/web/src/lib/instrument/config.ts`. Anything else is rejected with its
  issues listed in place of the view.
- Output: the same document, edited in the pane, as JSON (Copy JSON), with empty
  change groups left out (`serialize` in the same file).

#### Configuration document

```json
{
	"version": 1,
	"burn": "course",
	"properties": { "plasma": { "thrust": 46000 } },
	"vehicles": [
		{
			"label": "Plasma aft",
			"loadout": {
				"version": 2,
				"chassis": "balanced",
				"side": "ion",
				"stabilizers": true,
				"hull": [null, null],
				"aft": ["plasma", "plasma"]
			}
		}
	]
}
```

- `vehicles`: one to six. Each is a game loadout (`LoadoutSchema` in
  `packages/mode-a`) with a label. `properties` is a sparse, experiment-wide
  override object; per-vehicle changes are rejected. A document without overrides uses the current
  production ship and engine values. Its paths reflect the configured experimental
  conditions, including starting state, burn inputs, gravity and power supply.
- Shared engine tuning values in `properties`: ion exposes `acceleration` and
  `maxTurn`; internal `fusion` (displayed as Fission) and plasma expose `thrust`,
  `speedContribution`, `chargeSeconds`, `pulsePeriod` and `pulseOn`. Hull bases
  and engine contributions come from shared production definitions. Per-vehicle
  overrides and obsolete `maxSpeed`, `bonus`, `falloff` and `limit` ceilings are
  rejected by the strict schema.
- `burn`: one of the instrument's fixed programs; studies never write inputs.

#### Burns (`apps/web/src/lib/instrument/burns.ts`)

All are 14 s at 60 Hz.

| Id       | Label | Program                                                          |
| -------- | ----- | ---------------------------------------------------------------- |
| `course` | B1    | One input per second: LR LR – L – LR – R – R – LR LR LR          |
| `turn`   | B2    | 6 s LR, 2 s L, 1 s coast, 5 s LR                                 |
| `weave`  | B3    | LR, L, R repeating; each round's steps 0.3 s longer; cut at 14 s |

#### Calculation (`apps/web/src/lib/instrument/calculate.ts`)

Each vehicle runs on the burn through the production `applyBuildEngines`
function, using the experiment’s shared part and ion values, from rest at the
origin. Speed,
acceleration (differenced over 6 ticks) and turn acceleration derive from the
samples. Not included: gravity, power limits, and changes to part mass or chassis
values. A difference shown by the instrument may therefore not appear in flight.
Every assembled impulse uses `buildStats`' ship-wide powered cruise ceiling.
Gravity tuning uses this same production model with its own gravity configuration.

### Shared screen and Ship tuning views

The layout is shared; the measurements and default controls below are Ship tuning’s.
Gravity tuning supplies its own measurements and controls.

One 1440 × 900 logical screen, scaled to fit its container, on the console
(elevation 1). Two 672px columns in a 32px margin, 32px apart; no header or footer.

- Left: the path pane (672 × 672) and, 24px below, the burn row (44px).
- Right: the time graph three times (speed, acceleration, turn acceleration;
  672 × 208, 24px apart) and, 24px below, the time slider (44px), whose knob runs
  along the graphs' time axis.
- Below both, 24px down: the legend, naming every vehicle in its colour.
- The pane overlay, unscaled on the container: menu button in the top-right
  corner, elevation 3, 45% of the container wide, over an 11% backdrop. Default
  content: the experiment’s shared tuning values and Copy JSON for exporting the
  current settings.

Every graph scales its value axis to its data: a nice tick step for about five
ticks, the top one step above the peak, symmetric about zero for turn
acceleration. Values are compared by reading the axes. Diagrams are displays
(elevation 2) on the console with every label outside the data; a vehicle keeps
one colour in every diagram; inline gaps are grid-sized. The path pane switches
between fitting all paths and a default scale (0.2 px/u) that pans by dragging.

Reading controls—such as the time cursor, path scale and panning—change the
presentation only. They preserve the experiment's settings and calculated paths
and measurements. The time cursor selects a point in the existing results.

### Components

| Component                                | Path                                      | Reference page            |
| ---------------------------------------- | ----------------------------------------- | ------------------------- |
| `ShipTuning`                             | `apps/web/src/components/lab/instrument/` | `/lab/instrument`         |
| `InstrumentEmbed` (study pages)          | same folder                               | used in the design record |
| `MotionInstrumentScreen` (shared screen) | same folder                               | `/lab/instrument`         |
| `PathPane`, `TimeGraph`                  | same folder                               | `/lab/graphs`             |
| `BurnRow`, `Legend`, `OverlayPane`       | same folder                               | `/lab/instrument-parts`   |
| `Toggle`, `RingSlider`                   | `apps/web/src/components/inputs/`         | `/lab/inputs`             |
| Elevation and display tokens             | `packages/core/src/lib/styles/tokens.css` | `/lab/surfaces`           |

### Using it

- In a study page: `<InstrumentEmbed config={document} />` from
  `components/lab/instrument/InstrumentEmbed.astro`. It takes the full window and
  snaps into place.
- In the Lab: `/lab/instrument` opens with the starting document
  (`apps/web/src/lib/instrument/starter.ts`), supplied by the page.
- Custom pane content: pass a `pane` snippet to `ShipTuning`; it receives the
  parsed document.

## Contract

### Definition of Done

- [ ] The designer can export current values; the pane has no configuration-import
  control. Agent-supplied configurations remain schema-validated.
- [ ] Moving the time cursor or changing the path view updates the presentation
  while preserving experiment settings and calculated paths and measurements.
- [ ] Export contains the experiment's current configured values and leaves game
  values unchanged.
- [x] Every Ship tuning burn is exactly 840 ticks (unit test).
- [ ] The configuration schema and controls express tuning values at experiment
  scope rather than as per-vehicle property overrides. Update validation and export
  together; reject invalid loadouts, unknown tuning fields and unknown burns.
- [ ] A ship and its no-gravity shadow use identical hull and equipment properties,
  motion settings, burn and starting state; gravity is their only condition difference.
- [ ] Ships with the same hull and equipment in the same mounts produce identical
  paths and measurements under identical starting conditions, burn inputs,
  environment and motion settings.
- [ ] Simulation uses the current production functions with the experiment’s
  configured values; verify this independently of historical study calculations.
- [ ] Multiple instances in one study have independent configurations and results;
  editing an exposed variable preserves fixed conditions and other instances.
- [x] `/lab/instrument` renders the starting document with three vehicles in the
  legend and three graphs (browser test).
- [x] Switching the burn redraws every view and changes the document (browser test).
- [x] The pane opens from the menu button, moves focus to its close button, and
  closes on Escape with focus returned (browser test).
- [x] An edited value updates the graphs and the document (browser test).
- [x] Each reference page renders its components (browser test).

### Regression Guardrails

- Configured uses supply experiment conditions and exposed controls through the
  shared instrument’s supported capabilities; simulation uses production code.
- Configured hull and equipment properties apply consistently across the experiment;
  comparison conditions cannot introduce per-vehicle property overrides.
- The game's part and ion definitions are never changed by a document.
- The instrument's scales come from the data and the fixed rules above, never from
  a study.
- Elements keep the 4px vertical rhythm; inline widths follow content.

### Scenarios

```gherkin
Scenario: Compare a ship with its no-gravity shadow
  Given a ship and a shadow with the same hull and mounted equipment
  And both use the same production properties, motion settings and burn inputs
  And both start from the same position, heading and velocity
  When the instrument simulates the ship with gravity
  And simulates its shadow without gravity
  Then both retain identical hull and equipment properties
  And gravity is the only difference in their simulation conditions

Scenario: Inspect results without changing the experiment
  Given a calculated motion experiment
  When the designer moves the time cursor or changes the path view
  Then the presentation updates
  And the experiment settings remain unchanged
  And the calculated paths and measurements remain unchanged

Scenario: Export an experiment's settings
  Given the designer has adjusted an experiment
  When they export its configuration
  Then the export contains the current configured values
  And exporting does not apply those values to the game

Scenario: Independent experiments within one design study
  Given a study contains two Motion instrument instances
  And each has its own configured conditions and adjustable variables
  When the designer changes an exposed variable in the first instance
  Then its paths and measurements are recalculated
  And its fixed conditions remain unchanged
  And the second instance's configuration and results remain unchanged

Scenario: Simulate using production behavior
  Given an experiment with configured ships, inputs and environment
  When the Motion instrument calculates paths and measurements
  Then it uses the current production simulation functions
  And applies the experiment's configured values

Scenario: Identical ships produce identical paths
  Given two ships with the same hull and equipment in the same mounts
  And identical starting conditions, burn inputs, environment and motion settings
  When the Motion instrument simulates them
  Then their paths and measurements are identical

Scenario: Switching the burn
  Given the instrument shows B1
  When the designer selects B2
  Then the lanes show 6 s both, 2 s left, 1 s coast, 5 s both
  And every path and graph is recalculated on that burn

Scenario: An invalid agent-supplied configuration
  Given an agent-supplied configuration whose loadout has the wrong number of aft slots
  When the instrument receives it
  Then it lists the schema's issues instead of drawing
```

### Investigation note: directional propulsion

Ship motion exploration 02.3 uses real Corvette and Scout geometry and compares
each stabilizer fit with its stabilizers-off reference on B1. Current paths,
speed and turn-acceleration views expose the resulting translation and rotation,
but the instrument does not record which mount delivered thrust on each tick or
show a per-direction build-speed projection. For a later decision about sideways
thrust and overspeed, consider a configured directional projection rule and
per-mount delivered-force trace. This note records an evidence need, not an
approved instrument feature.

Exploration 02.4 can be compared with existing per-vehicle ion acceleration
and speed-ceiling changes. The acceleration setting simultaneously scales
main-engine linear thrust, their torque, and stabilizer acceleration/torque, so
it cannot isolate steering authority from acceleration. A later controlled trial
may need separate candidate controls for main linear force, main-engine torque,
and stabilizer force/braking response, while retaining production values as the
baseline. Add only the controls needed for that experiment; this is an identified
capability gap, not an approved instrument feature.
