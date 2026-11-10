# Plan: clearing game modes and stale tools out of the Lab

Started as a handoff brief on 10 November 2026 (0.6.0 spec session, commit
`c7c22e7`). Rewritten the same day after an audit of the code and the running
Lab on `feat/0-5-0`.

**Decided 10 November 2026:** the five deletions below are agreed and done in
the working tree. `/lab/ship-propulsion` stays: prose and tables that explain a
rule at a higher level than its spec, so it is easier to discuss, are Lab
material. Planets and Resources stay until someone decides otherwise.

## Why

- The [Lab spec](../specs/lab/spec.md) says the Lab has no game modes and
  nothing in it submits a score. Its two Definition of Done items are unchecked
  and are this work's acceptance.
- `FlightDeck.svelte` shows Save Score only for
  `mode === "survival" && !loadout && chosen !== "fiddler"`. Deliverable 3 of
  the [0.6.0 plan](2026-11-08-ion-storm-0-6-0.md) makes ranking follow the
  [Experimental](../specs/game/experimental/spec.md) toggle instead. After that
  nothing keeps a Lab page that mounts `FlightDeck` away from Save Score.

## The rule for each page

Default is **delete**. A page survives only if a game developer sees or
measures something on it that they cannot get elsewhere, and it does so without
mounting a game mode (`FlightDeck`, `ShipBuilder`, the title screen). Running
`Simulation` on scripted input to show or measure something is an instrument
and is allowed by the Lab spec.

## What the audit found

- **Only two Lab pages mount the flight shell**, traced through imports:
  `/lab/builder` (`ShipBuilder` → `FlightDeck`) and `/lab/landing`
  (`FlightDeck`). The original brief listed eight studies; those only mention
  `FlightDeck` or `ShipBuilder` in their text or link to `/lab/builder`. No
  study and no component under `components/lab/` or `components/studies/`
  imports either.
- The benches the brief wanted judged (`IonCannonEncounter`,
  `PointDefenceEncounter`, `SunFlightBench`, `LabDerelictDamage`, `FxBench`,
  `GravityFoldFlight`, `derelict-three/*`, `engines/*`, `MovementBench`,
  `PointDefenceTurning`) run `Simulation` or their own rAF loop on scripted
  input with a Reset button. None has a launch flow, an ending or a score.
  `WaspFlightDemo` (in the `lhi-wasp` study) also takes keyboard input, but
  still has no run or score. All are instruments or study records.
- Not checked: the 38 study pages were not opened one by one, and the pages
  marked keep were judged from code, specs and page text, not a full visual
  review.

## Verdicts

Dev server: `pnpm --filter web exec astro dev --port 4330`.

### Deleted

| Page                                    | What it is                                                                                                                                    | Why delete                                                                                                        | Rescue considered                                                                                                                    |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| <http://localhost:4330/lab/builder>     | The whole Hangar with `lab` set: Test flight, Start survival, Derelicts. Reads and writes the player's saved builds (`void-drift-builds-v3`). | A game mode. Identical to `/hangar` apart from a header label.                                                    | None needed. Fitted chassis are on `/lab/entities/ship`, mounts on `/lab/mount-planner`, flight on `/hangar`.                        |
| <http://localhost:4330/lab/landing>     | `FlightDeck` with no props: the title screen with Press Start.                                                                                | A game mode. Identical to `/`.                                                                                    | None needed. `tests/review/landing.spec.ts` captures `/` instead.                                                                    |
| <http://localhost:4330/lab/flight>      | A 302 to `/builder`, which redirects to `/hangar`.                                                                                            | A retired route kept alive by a test.                                                                             | None.                                                                                                                                |
| <http://localhost:4330/lab/ion-engines> | Light and Heavy ion plumes side by side, built from two study components (registry source: `sketch`), plus a frozen reference.                | A study comparison promoted to a page. `/lab/fx` shows ion on the shared surface, and the study keeps the record. | If the firing/turning/released/faded stepping is wanted, it already lives in the `ion-engines-2026-10-31` study; keep it there only. |
| <http://localhost:4330/lab/buttons>     | An unlisted alias that renders the buttons block above `/lab/inputs`.                                                                         | Exists for one test and old links.                                                                                | Fold `LabButtons` into `/lab/inputs` and point `buttons.spec.ts` there.                                                              |

### Kept, open to a later call (old, not game modes)

| Page                                        | What it shows                                               | Note                                                                                                                                                                                                                      |
| ------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <http://localhost:4330/lab/entities/planet> | The five planet types drawn by production `drawPlanet`.     | From January 2026. Its orbit and gravity sliders preview only and predate the gravity field; gravity is tuned at `/lab/gravity-tuning`. Keep as the only place planet art is visible; delete if that is not worth a page. |
| <http://localhost:4330/lab/resources>       | Production HUD drawings: resource bars, death icons, timer. | From December 2025. Still the drawings `FlightDeck` uses, and the only place to see them outside a run.                                                                                                                   |

### Keep

- `/lab/ship-propulsion`: the powered cruise ceiling explained in prose, with
  tables computed from `CHASSIS` and `PARTS`. A presentation of a rule for
  discussion; the rule itself belongs in its spec as well.
- Instruments with their own specs or gates: `/lab/instrument`,
  `/lab/gravity-tuning`, `/lab/mount-planner`, `/lab/fx` (release smoke and
  `scripts/profile-fx.mjs` use it), `/lab/entities/derelict`.
- `/lab/entities/star` with `SunFlightBench`: a scripted Wasp near the Sun with
  collection and damage readouts.
- `/lab/entities/ship`, `/lab/utility-artwork`, `/lab/graphs`,
  `/lab/instrument-parts`, `/lab/inputs`, `/lab/surfaces`, `/lab/tokens`,
  `/lab/typography`, `/lab/logomark`.
- Every study, review and archive page, and the benches listed above. Studies
  are records and none mounts a game mode.

## What changed with the deletions

Done as listed, with two differences: `IonSizesAccepted024` had no other user
and was deleted, and study links to `/lab/flight`, `/lab/buttons` and
`/lab/ion-engines` were repointed too (`/hangar`, `/lab/inputs`, `/lab/fx`).
Still open: the workbench spec is only corrected for `/lab/buttons`, not
brought up to date.

- **Registry:** remove the entries from `apps/web/src/data/lab-pages.ts`; drop
  `retiredRedirects` from `lab-pages.test.ts`.
- **Components:** remove the `lab` prop from `ShipBuilder.svelte`. Delete
  `IonSizeComparison` and `IonSizesAccepted024` only if the ion study stops
  using them (it does use them today, so they stay).
- **Links into deleted pages:** `LabShipInspector.svelte` ("Hangar Lab") and
  `utility-artwork` point at `/hangar`. Studies that link to `/lab/builder`
  (`heavy-cruiser-slots`, `scout-firefly`, `engine-identities`,
  `base-movement-ion`, `ship-silhouettes`) get the href changed to `/hangar`
  and nothing else; their text is history and stays.
- **Tests:** `builder.spec.ts:132`, `hangar-opening.spec.ts` "shared Lab
  opening" and `scout.spec.ts:29` lose their `/lab/builder` cases (the same
  behaviour is already asserted on `/hangar`); `alpha.spec.ts` "retired Flight
  Lab redirects" goes; `tests/review/landing.spec.ts` targets `/`;
  `ion-effects.spec.ts` and the `captures.spec.ts` ion capture move to the
  study page or go; `buttons.spec.ts` targets `/lab/inputs`.
- **Game specs that name the Lab:** [Hangar](../specs/game/hangar/spec.md)
  (four `/lab/builder` mentions), [landing page](../specs/game/landing-page/spec.md)
  (`/lab/landing`). Remove the mentions.
- **Lab specs:** [workbench](../specs/lab/workbench/spec.md) is from the
  December 2025 Lab and lists `/lab/buttons`; bring it to the current page set
  or fold it into the Lab spec.

## Checking the Lab spec's two criteria

Added to `scripts/check-contracts.mjs`: no file under `apps/web/src/pages/lab/`,
`components/lab/` or `components/studies/` imports `FlightDeck`, `ShipBuilder`,
`TitleScreen`, `GameWrapper` or `submitHighScore`. The check passes and both
Definition of Done boxes are ticked.

## Constraints carried from the brief

- Lab viewport is 1280px and up. Tests assert relations, not design values.
- Local commits only within the agreed scope; every session shares this
  checkout. Files in `docs/plans/` stay.
