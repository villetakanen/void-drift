# Gravity field in the Lab instrument

Status: approved 2026-11-04; spec work S1–S5 done; steps 1–2 implemented.

## Acceptance contract

- The owner can open the Lab, place the game's sun and planets plus one or two
  added wells, launch up to six flight paths through them, and see where each
  path bends, escapes, is captured or dies.
- Every path is calculated by the production simulation step, not a Lab copy.
- The owner can change the gravity values under investigation in the pane and
  copy one block that an agent applies to the game without interpretation.
- Applying a copied proposal is the owner's explicit approval to change the
  gravity values it names (the gravity/friction approval rule in `AGENTS.md`). Nothing
  else in this plan changes gravity values.
- Gravity's intent and behaviour are captured in one living spec, not in dated
  release sections.

## Current state (checked 2026-11-04)

- Well curve: `wellAcceleration` in `packages/core/src/lib/physics/Physics.ts`
  (bounded inverse-square or linear, zero at reach). Reach: `getPlanetInfluenceRadius`
  (explicit `well.reach`, else `clamp(sqrt(mass)·10, 2r, 8r)`); star reach is
  radius × 9 in `createStar` (`packages/mode-a/src/lib/game-loop.ts`).
- Tuning: `GRAVITY_FLIGHT` in `packages/mode-a/src/lib/simulation.ts`
  (`sunMultiplier` 4, `planetStrength` 600, `engineSpeedScale` 600), parsed by
  `GravityFlightSchema`. `Simulation`'s constructor applies it to a fixed G star at
  (960, 540) and `initializePlanets`; bodies and tuning cannot be injected.
- Integration: semi-implicit Euler in `updateShip`, 4 substeps per 1/60 s tick, no
  drag and no speed cap in play. Loadout ships get thrust from `applyBuildEngines`.
- Lab instrument (`docs/specs/lab-instrument.md`, `apps/web/src/lib/instrument/`):
  document in, Copy JSON out, six vehicles, fixed 14 s burns, from rest at the
  origin. It explicitly excludes gravity, and its spec says new motion comparisons
  extend the instrument rather than adding charts to studies.
- Study-only path code (`components/studies/gravity/`, `GravityFoldFlight.svelte`)
  predates the instrument and is not a shared tool.
- Gravity behaviour is described in five places that disagree:
  `playable-alpha.md` (dated "Gravity well integration — 29 October" section,
  closest to the code), `planet-mechanics.md` (legacy mass formula),
  `star_mechanics.md` (names `applyGravity`, G = 0.1, 350 px reach),
  `multi-planet-system.md` and `development.md`.
- To verify during S1: `updateShip` receives both `engineSpeedScale` and
  `ENGINE_CUTOFF` (750, `packages/core/src/lib/effects/engine-plume.ts`); the
  cutoff branch is checked first, so the spec's 1/(1 + (v/600)²) taper may not be
  what flies.

## Design

### The tool: a gravity field in the instrument

Extend the instrument instead of building a second path tool. A document gains an
optional `field`; with it, the instrument runs in the game's world frame through
the real `Simulation`.

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
		"changes": { "planetStrength": 450, "sunMultiplier": 5 }
	},
	"vehicles": [
		{
			"label": "Close pass",
			"loadout": { "...": "game loadout" },
			"start": { "x": 460, "y": 540, "heading": -90, "speed": 300 }
		}
	]
}
```

- `field.system`: `game` (the game's sun and planets at the document's seed) or
  `empty` (added wells only).
- `field.orbits`: `moving` (as in play) or `frozen` (bodies held at their start
  positions, so a path can be read against fixed wells).
- `field.wells`: zero to four added wells. They are experiment probes: they exist
  only in the Lab and are never applied to the game.
- `field.changes`: gravity tuning values that differ from the game, using the same
  names and ranges as the production gravity schema. This is the only part of a
  document that can become game configuration.
- `vehicles[].start`: position, heading and speed; absent means the game's spawn.
- New burn `coast` (no input) alongside B1–B3, so a pure gravity path is visible.

Views in field mode (the instrument layout and rules otherwise unchanged):

- Path pane: world frame; each body's surface and reach ring; added wells marked
  apart from game bodies; each path ends in its outcome marker (star burn, planet
  impact, escaped all reaches, still bound at 14 s), using the game's own death
  checks. Optional field shading of pull magnitude.
- Graphs: speed, gravity acceleration, distance to the nearest body's surface.
- Pane: edit `field.changes`, add, move and remove wells, edit vehicle starts.

### The handoff: copy for agent

The pane gets a second copy action, **Copy proposal**, which produces one
self-describing block:

```text
Gravity tuning proposal (instrument document v2, from /lab/instrument)
Baseline: sunMultiplier 4; planetStrength 600
Apply: planetStrength 600 → 450; sunMultiplier 4 → 5
Not applied (Lab probes): W1
<the full document JSON>
```

The owner pastes it to an agent with "apply". The agent runs:

```bash
pnpm tuning:apply gravity proposal.txt
```

The script parses the document with the instrument schema, extracts
`field.changes`, validates them with the production gravity schema, writes the
`gravity` section of the shared tuning file, and prints the baseline-to-proposal diff. It refuses a
document with no changes, values out of range, or a baseline that no longer
matches the game. The agent then completes the steps in "Applying a proposal"
below. No other judgement is needed.

## Spec work (ASDLC living specs)

Specs state the current intended system by feature domain, in Blueprint (Context,
Architecture, Constraints) and Contract (Definition of Done, Regression
Guardrails, Gherkin Scenarios). Release history stays in plans and
`development.md`; superseded spec sections are marked `[DEPRECATED yyyy-mm-dd]`
with a pointer, not deleted. Each code slice below updates its spec in the same
commit.

### S1. Create `docs/specs/gravity-field.md` (spec skill, reverse mode)

- Context: what gravity is for in play (the `gravity-wells` study's accepted
  intent: a close pass is a temptation, going deeper is readable danger).
- Architecture: the well curve, reach rules, star and planet bodies, tuning schema
  and its versioned tuning file, the integration step (substeps, no drag, no cap),
  rules version and score separation, file paths for each.
- Constraints: gravity is independent of engine taper; one gravity function is
  used by play, replay and the Lab; tuning values come only from the tuning file.
- Contract: deterministic replay under one rules version; the rules version
  changes once per release when rules or tuning changed; scenarios for a close sun pass escaping under
  power, a planet capture, and a pass outside reach being unaffected.
- Resolve the `ENGINE_CUTOFF` / `engineSpeedScale` question against the code and
  record what actually flies; mark the provisional values as targets for review,
  separately from implemented behaviour.

### S2. Deprecate the scattered gravity sections

- `star_mechanics.md`, `planet-mechanics.md`, `multi-planet-system.md`: mark their
  gravity sections deprecated, pointing to `gravity-field.md`.
- `playable-alpha.md`: replace the dated gravity section body with a pointer; keep
  its scoring and replay commitments where they belong.

### S3. Amend `docs/specs/lab-instrument.md`

- Architecture: document v2 (`field`, `start`, `coast`), v1 documents still
  accepted unchanged; field-mode calculation through `Simulation`; field-mode
  views; Copy proposal format.
- Guardrails: added wells never reach the game; a document never changes game
  values except through `tuning:apply`; field mode reuses the production step.
- Scenarios: a coast path bending round a frozen well; a vehicle captured by an
  added well; a changed planet strength redrawing the paths and appearing in the
  copied proposal; a document with an out-of-range strength listing its issues.
- Remove "gravity" from the "Not included" list only for field documents.

### S4. Tuning handoff contract (in `gravity-field.md`)

- The proposal block format, the `tuning:apply` behaviour and refusals, and the
  owner-approval rule as a positive constraint: "Gravity values change only by
  applying an owner-supplied proposal."

### S5. Review the specs before code

Run an independent review of S1–S4 (fresh agent, given only the specs and the
code paths). Every scenario must be verifiable as written. Owner reads S3 and S4.

## Implementation steps

Each step is a local commit with its spec update and passing `pnpm verify`.

1. **Gravity tuning as configuration.** Add `GravityTuningSchema` in
   `packages/mode-a/src/lib/schemas/gravity.ts` (sun multiplier, planet strength,
   star reach factor, planet reach rule, curve, each with its current range) and
   one versioned tuning file with a section per area; this step creates it with
   the `gravity` section holding today's values. The Lab usability plan adds its
   per-ship sections to the same file. `GRAVITY_FLIGHT` reads it. No value changes.
2. **Injectable field in `Simulation`.** Constructor accepts an optional parsed
   field: gravity tuning, body set (`game` or `empty`), added wells, frozen
   orbits, ship start. The options object also accepts an optional per-chassis
   tuning patch (shape owned by the Lab usability plan), so a field and a patch
   can be given together. Defaults reproduce play. Test: a default `Simulation` replay equals one
   built with the default field explicitly.
3. **Instrument document v2.** Extend `InstrumentConfig` (`config.ts`) with
   `field`, `start` and the `coast` burn (`burns.ts`); v1 still parses. Field
   documents calculate through `Simulation` in `calculate.ts`, passing each
   vehicle's `changes` through so per-ship A/B can build on it, recording samples,
   pull, nearest-surface distance and the first outcome event. Unit tests per the
   spec's Definition of Done.
4. **Field views.** `PathPane` world frame, bodies, reach rings, added-well marks,
   outcome markers, optional shading; the three field-mode graphs. Reference pages
   updated (`/lab/graphs`, `/lab/instrument-parts`).
5. **Field editing in the pane.** Edit `field.changes` with `RingSlider`; add,
   drag and remove wells on the path pane; edit vehicle starts. Out-of-range values
   refused as today.
6. **Copy proposal and `tuning:apply`.** The pane action, and
   `scripts/tuning-apply.mjs` wired as `pnpm tuning:apply <area> <file>`, one
   subcommand per tuning-file section (`gravity` here; `ship` added by the Lab
   usability plan), with tests for each refusal.
7. **Starter field documents.** `/lab/instrument` offers the gravity starters:
   close sun pass, planet slingshot, two added wells. Linked from the
   `gravity-wells` study as a new section; its earlier sections stay as they are.
8. **Verification.** `pnpm verify` including browser tests for the new scenarios;
   owner large-screen (≥1280px) readability review recorded in the spec. Feel is reviewed separately
   in flight, not inferred from the instrument.

### Applying a proposal (the agent's steps, also recorded in `gravity-field.md`)

1. `pnpm tuning:apply gravity <file>`; stop on any refusal and report it.
2. Update the tuning values in `gravity-field.md`.
3. Re-run `pnpm verify`; update visual baselines for the trajectory change
   without changing tolerances.
4. Commit locally with the proposal block in the message body. Do not push.

Applying a proposal never changes the rules version `CHALLENGE` (currently
`ion-1`). The release does that once, when rules or tuning differ from the
previous release (owner decision, 2026-11-04; release procedure in
`docs/development.md`).

## Open decisions for the owner

- Extend the instrument (recommended, and what its spec requires) or build a
  separate `/lab/gravity` page.
- Which values are tunable in step 1: today's parameters only (recommended), or
  new ones such as a softened core or a different falloff, which would be a
  physics change rather than tuning.
